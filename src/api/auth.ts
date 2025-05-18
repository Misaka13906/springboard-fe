import { request } from './request';
// Import specific types
// Added App types

export const LOGIN_PAGE_URL = '/pages/profile/login';
export const AUTO_LOGIN_FAILED_FLAG = 'autoLoginFailedInSession'; // Export the flag

/**
 * Redirects the user to the login page.
 * Optionally clears authentication tokens.
 * @param clearTokens - Whether to clear access and refresh tokens from storage. Defaults to true.
 */
export const redirectToLogin = (clearTokens: boolean = true) => {
  console.log(`[Auth] Redirecting to login page: ${LOGIN_PAGE_URL}. Clear tokens: ${clearTokens}`);
  if (clearTokens) {
    try {
      uni.removeStorageSync('access_token');
      uni.removeStorageSync('refresh_token');
      console.log('[Auth] Tokens cleared due to redirection to login.');
    } catch (e) {
      console.error('[Auth] Failed to clear tokens during redirect:', e);
    }
  }
  uni.reLaunch({
    url: LOGIN_PAGE_URL,
    fail: (err) => {
      console.error(`[Auth] Failed to reLaunch to ${LOGIN_PAGE_URL}:`, err);
      uni.showToast({ title: '页面跳转失败，请重试', icon: 'none' });
    }
  });
};

/**
 * Logs in the user using username and password for App.
 * Stores both access_token and refresh_token upon successful login.
 * POST /api/login/app
 * @param payload - Username and password.
 * @returns Promise<LoginResponseData> The login response data.
 */
export const loginApp = (payload: apiType.AppLoginRequest): Promise<apiType.LoginResponseData> => {
  return new Promise((resolve, reject) => {
    request<apiType.LoginResponseData>({ // Expect apiType.LoginResponseData based on AppLoginResponse
      url: '/login/app',
      method: 'POST',
      data: payload,
      // Explicitly remove Authorization header for login request
      header: { 'Authorization': null }
    })
      .then(data => handleLoginResponse(data, resolve, reject, 'app')) // Pass 'app'
      .catch(error => {
        console.error('App登录接口请求失败:', error);
        uni.showToast({ title: 'App登录失败，请稍后重试', icon: 'none', duration: 3000 });
        reject(error);
      });
  });
};

/**
 * Registers a new user for the App.
 * POST /api/register/app
 * @param payload - Username and password.
 * @returns Promise<null> Resolves on success.
 */
export const registerApp = (payload: apiType.AppRegisterRequest): Promise<null> => {
  return request<null>({ // Expecting null data on success based on AppRegisterResponse
    url: '/register/app',
    method: 'POST',
    data: payload,
    // Explicitly remove Authorization header for register request
    header: { 'Authorization': null }
  }).catch(error => {
    console.error('App注册接口请求失败:', error);
    uni.showToast({ title: 'App注册失败，请稍后重试', icon: 'none', duration: 3000 });
    throw error; // Re-throw to be caught by calling function
  });
};


/**
 * Logs in the user. Attempts to use WeChat's code for login first.
 * If wx.login fails or the backend call with the code fails,
 * it falls back to using a mock OpenID.
 * Stores both access_token and refresh_token upon successful login.
 * @returns Promise<LoginResponseData> The login response data.
 */
export const loginInWeixin = (): Promise<apiType.LoginResponseData> => {
  return new Promise((resolve, reject) => {
    // 1. Attempt to get the real WeChat login code
    uni.login({
      provider: 'weixin',
      success: (loginRes) => {
        console.log('uni.login 调用成功, code:', loginRes.code);
        if (!loginRes.code) {
          console.error('uni.login成功，但未返回code');
          uni.showToast({ title: '微信登录凭证获取失败(无code)', icon: 'none', duration: 3000 });
          reject(new Error('微信登录凭证获取失败(无code)'));
          return;
        }
        // 2. Send the code to the backend
        request<apiType.LoginResponseData>({
          url: `/login?code=${loginRes.code}`, // Send code as query parameter
          method: 'POST',
          header: { 'Authorization': null } // Ensure no old token is sent for login
        })
          .then(data => handleLoginResponse(data, resolve, reject, 'weixin')) // Pass 'weixin'
          .catch(error => {
            console.error('后端用code登录接口请求失败:', error);
            uni.showToast({ title: '微信登录请求后端失败，请稍后重试', icon: 'none', duration: 3000 });
            reject(error);
          });
      },
      fail: (err) => {
        console.error('uni.login 调用失败:', err);
        uni.showToast({ title: '获取微信登录凭证失败，请稍后重试', icon: 'none', duration: 3000 });
        reject(err);
      },
    });
  });
};

// Helper function to process login response and store tokens
const handleLoginResponse = (
  data: apiType.LoginResponseData,
  resolve: (value: apiType.LoginResponseData | PromiseLike<apiType.LoginResponseData>) => void,
  reject: (reason?: any) => void,
  loginType?: 'weixin' | 'app' // Added parameter
) => {
  console.log('后端登录响应数据:', data);
  if (data && data.access_token && data.refresh_token) {
    try {
      uni.setStorageSync('access_token', data.access_token);
      uni.setStorageSync('refresh_token', data.refresh_token);
      console.log('访问令牌和刷新令牌已成功存储.');

      if (loginType) {
        uni.setStorageSync('loginType', loginType);
        console.log(`Login type set to ${loginType}.`);
      } else {
        // Clear loginType if not provided to prevent stale state
        uni.removeStorageSync('loginType');
        console.log('Login type cleared as it was not provided.');
      }
      resolve(data);
    } catch (e: any) {
      console.error('存储令牌或登录类型失败:', e);
      uni.showToast({ title: '登录成功，但处理本地存储失败', icon: 'none', duration: 3000 });
      reject(new Error(`存储令牌或登录类型失败: ${e?.errMsg || '本地存储失败'}`));
    }
  } else {
    console.error('登录响应无效或缺少令牌:', data);
    uni.showToast({ title: '登录响应无效，缺少令牌', icon: 'none', duration: 3000 });
    reject(new Error('登录响应无效: 缺少令牌'));
  }
};

/**
 * Attempts to refresh the access token using the stored refresh token.
 * Updates the stored access token on success.
 * @returns Promise<string> The new access token.
 */
export const refreshAccessToken = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    let refreshToken: string | null = null;
    let currentAccessToken: string | null = null; // Needed for the Authorization header

    try {
      refreshToken = uni.getStorageSync('refresh_token');
      currentAccessToken = uni.getStorageSync('access_token'); // Get current token for header
    } catch (e: any) {
      console.error('从存储中检索令牌失败:', e);
      uni.showToast({ title: '刷新令牌准备失败，请稍后重试', icon: 'none', duration: 3000 });
      return reject(new Error(`从存储中检索令牌失败: ${e?.errMsg || '本地读取失败'}`));
    }

    if (!refreshToken) { // currentAccessToken might be expired, but refreshToken is key
      console.warn('缺少刷新令牌，无法刷新.');
      // No toast here as this might be a normal flow if user is not logged in.
      // The caller should handle this (e.g. redirect to login)
      return reject(new Error('缺少刷新令牌'));
    }
    if (!currentAccessToken) {
        console.warn('缺少当前访问令牌，刷新接口可能需要它.');
        // Depending on backend, this might not be an error, but good to log.
    }
    
    console.log('尝试刷新访问令牌...');
    request<apiType.RefreshTokenResponseData>({
      url: '/refresh',
      method: 'POST', 
      data: { 
        refresh_token: refreshToken,
      },
    })
      .then(data => {
        if (data && data.access_token) {
          try {
            uni.setStorageSync('access_token', data.access_token); 
            console.log('访问令牌已成功刷新并存储.');
            resolve(data.access_token);
          } catch (e: any) {
            console.error('存储刷新的访问令牌失败:', e);
            uni.showToast({ title: '刷新令牌成功，但存储失败', icon: 'none', duration: 3000 });
            reject(new Error(`存储刷新的访问令牌失败: ${e?.errMsg || '本地存储失败'}`));
          }
        } else {
          console.error('刷新令牌响应无效或缺少新的访问令牌:', data);
          uni.showToast({ title: '刷新令牌响应无效', icon: 'none', duration: 3000 });
          reject(new Error('刷新令牌响应无效: 缺少新的access_token'));
        }
      })
      .catch(error => {
        console.error('刷新访问令牌接口请求失败:', error);
        uni.showToast({ title: '刷新令牌失败，请稍后重试', icon: 'none', duration: 3000 });
        
        try {
          uni.removeStorageSync('access_token');
          uni.removeStorageSync('refresh_token');
          console.log('因刷新失败，已清除本地令牌.');
        } catch (e: any) {
          console.error('刷新失败后清除本地令牌也失败:', e);
          uni.showToast({ title: '刷新失败，清除本地凭证也失败', icon: 'none', duration: 3000 });
        }
        reject(error); 
      });
  });
};