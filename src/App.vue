<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import * as authApi from '@/api/auth'; // Import all exports from auth.ts into authApi namespace

const AUTO_LOGIN_FAILED_FLAG = 'autoLoginFailedInSession';

onLaunch(async () => {
  console.log("App Launch - 应用启动");
  // @ts-ignore
  const systemInfo = uni.getSystemInfoSync();
  const platform = systemInfo.uniPlatform;
  console.log(`[AppLaunch] Platform: ${platform}`);

  try {
    if (platform === 'mp-weixin') {
      const accessToken = uni.getStorageSync('access_token');
      if (!accessToken) {
        let autoLoginFailed = false;
        try {
          autoLoginFailed = uni.getStorageSync(AUTO_LOGIN_FAILED_FLAG);
        } catch (e) {
          console.warn('[AppLaunch-WeChat] Failed to read autoLoginFailed flag:', e);
        }

        if (autoLoginFailed) {
          console.log('[AppLaunch-WeChat] Auto-login previously failed this session, redirecting to login page.');
          try {
            uni.removeStorageSync(AUTO_LOGIN_FAILED_FLAG); // Clear flag, user is now on login page
          } catch (e) {
            console.warn('[AppLaunch-WeChat] Failed to remove autoLoginFailed flag:', e);
          }
          authApi.redirectToLogin(true); // Ensure tokens are cleared, then redirect
        } else {
          console.log('[AppLaunch-WeChat] No access token, attempting auto-login...');
          try {
            await authApi.loginInWeixin();
            // If loginInWeixin succeeds, tokens are stored by it.
            console.log('[AppLaunch-WeChat] Auto-login successful.');
            // Clear flag on success, just in case it was somehow set
            try {
              uni.removeStorageSync(AUTO_LOGIN_FAILED_FLAG);
            } catch (e) { /* ignore */ }
            uni.reLaunch({ url: '/pages/index/index' });
          } catch (loginError) {
            console.error('[AppLaunch-WeChat] authApi.loginInWeixin() failed:', loginError);
            try {
              uni.setStorageSync(AUTO_LOGIN_FAILED_FLAG, true); // Set flag indicating failure
            } catch (e) {
              console.warn('[AppLaunch-WeChat] Failed to set autoLoginFailed flag:', e);
            }
            authApi.redirectToLogin(true); // Redirect to login, tokens will be cleared
          }
        }
      } else { // Access token exists on WeChat
        console.log('[AppLaunch-WeChat] Access token found, proceeding.');
        try {
          uni.removeStorageSync(AUTO_LOGIN_FAILED_FLAG); // Clear flag if token was okay
        } catch (e) { /* ignore */ }
        uni.reLaunch({ url: '/pages/index/index' });
      }
    } else { // Non-WeChat platforms
      try {
        uni.removeStorageSync(AUTO_LOGIN_FAILED_FLAG); // Ensure flag is clear for other platforms
      } catch (e) { /* ignore */ }
      const accessToken = uni.getStorageSync('access_token');
      if (!accessToken) {
        console.log('[AppLaunch-NonWeChat] No access token, redirecting to login.');
        authApi.redirectToLogin(false); // Don't clear tokens if none exist
      } else {
        console.log('[AppLaunch-NonWeChat] Access token found, proceeding.');
        uni.reLaunch({ url: '/pages/index/index' });
      }
    }
  } catch (e) { // Catch-all for unforeseen errors during onLaunch logic
    console.error('[AppLaunch] General error during launch auth check:', e);
    try {
      uni.removeStorageSync(AUTO_LOGIN_FAILED_FLAG); // Clear flag in case of general error
    } catch (eSub) { /* ignore */ }
    authApi.redirectToLogin(true); // Clear any potentially corrupted tokens and redirect
  }
});

onShow(() => {
  console.log("App Show");
});
onHide(() => {
  console.log("App Hide");
});
</script>
<style lang="scss">
/*每个页面公共css */
@import '@/uni.scss';
</style>
