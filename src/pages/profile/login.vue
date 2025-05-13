<template>
  <view class="login-page">
    <view class="logo-container">
      <image class="logo" src="/static/icons/app-logo.png" mode="aspectFit"></image>
      <text class="app-title">Springboard</text>
    </view>

    <view class="form-container">
      <view class="input-group">
        <input
          class="input-field"
          type="text"
          v-model="username"
          placeholder="用户名"
          placeholder-class="input-placeholder"
        />
      </view>
      <view class="input-group">
        <input
          class="input-field"
          type="password"
          v-model="password"
          placeholder="密码"
          placeholder-class="input-placeholder"
        />
      </view>

      <view class="button-group">
        <button class="btn login-btn" @tap="handleLogin" :loading="loading" :disabled="loading || !username || !password">登录</button>
        <button class="btn register-btn" @tap="handleRegister" :loading="loading" :disabled="loading || !username || !password">注册</button>
      </view>

      <!-- Optional: Add forgot password link -->
      <!-- <view class="forgot-password">
        <text>忘记密码?</text>
      </view> -->
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { loginApp, registerApp } from '../../api/auth'; // Import app login/register functions

const username = ref('');
const password = ref('');
const loading = ref(false);

const validateInput = (): boolean => {
  if (!username.value.trim()) {
    uni.showToast({ title: '请输入用户名', icon: 'none' });
    return false;
  }
  if (!password.value) {
    uni.showToast({ title: '请输入密码', icon: 'none' });
    return false;
  }
  // Add more validation if needed (e.g., password complexity)
  return true;
};

const handleLogin = async () => {
  console.log('开始处理登录操作...');
  if (!validateInput() || loading.value) return;

  loading.value = true;
  uni.showLoading({ title: '登录中...' });

  try {
    const payload = { username: username.value, password: password.value };
    console.log('登录请求参数:', payload);
    const loginData = await loginApp(payload);
    console.log('登录成功，响应数据:', loginData);
    uni.hideLoading();
    uni.showToast({ title: '登录成功', icon: 'success' });

    try {
      uni.setStorageSync('username', username.value);
      console.log('用户名已存储到本地。');
    } catch (e: any) {
      console.error('存储用户名到本地失败:', e);
      uni.showToast({ title: '登录后存储用户名失败', icon: 'none', duration: 2000 });
      // Non-critical error, proceed with navigation
    }

    uni.switchTab({
      url: '/pages/index/index'
    });

  } catch (error: any) {
    loading.value = false;
    uni.hideLoading();
    console.error('登录操作失败:', error);
    const displayMessage = error?.data?.message || '登录失败，请稍后重试';
    uni.showToast({ title: displayMessage, icon: 'none', duration: 3000 });
  } finally {
      loading.value = false; 
  }
};

const handleRegister = async () => {
  console.log('开始处理注册操作...');
  if (!validateInput() || loading.value) return;

  loading.value = true;
  uni.showLoading({ title: '注册中...' });

  try {
    const payload = { username: username.value, password: password.value };
    console.log('注册请求参数:', payload);
    await registerApp(payload);
    console.log('注册成功');
    uni.hideLoading();
    uni.showToast({ title: '注册成功，请登录', icon: 'success' });
    
    try {
      uni.setStorageSync('username', username.value);
      console.log('注册后用户名已存储到本地。');
    } catch (e: any) {
      console.error('注册后存储用户名到本地失败:', e);
      uni.showToast({ title: '注册后存储用户名失败', icon: 'none', duration: 2000 });
       // Non-critical error
    }

  } catch (error: any) {
    loading.value = false;
    uni.hideLoading();
    console.error('注册操作失败:', error);
    const displayMessage = error?.data?.message || '注册失败，请稍后重试';
    uni.showToast({ title: displayMessage, icon: 'none', duration: 3000 });
  } finally {
      loading.value = false; 
  }
};
</script>

<style scoped>
.login-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f8f8f8;
  padding: 40rpx;
  box-sizing: border-box;
}

.logo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 80rpx;
}

.logo {
  width: 150rpx;
  height: 150rpx;
  margin-bottom: 20rpx;
}

.app-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
}

.form-container {
  width: 100%;
  max-width: 600rpx; /* Limit form width on larger screens */
  background-color: #ffffff;
  padding: 50rpx 40rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.input-group {
  margin-bottom: 35rpx;
}

.input-field {
  width: 100%;
  height: 80rpx;
  padding: 0 25rpx;
  border: 1px solid #e0e0e0;
  border-radius: 10rpx;
  font-size: 28rpx;
  color: #333;
  box-sizing: border-box;
  background-color: #fdfdfd;
}

.input-field:focus {
  border-color: #57DD00; /* Highlight focus */
  background-color: #fff;
}

.input-placeholder {
  color: #aaa;
}

.button-group {
  margin-top: 50rpx;
  display: flex;
  flex-direction: column;
  gap: 25rpx;
}

.btn {
  height: 85rpx;
  line-height: 85rpx;
  border-radius: 10rpx;
  font-size: 30rpx;
  font-weight: 500;
  border: none;
  transition: background-color 0.2s, color 0.2s;
}

.login-btn {
  background-color: #57DD00; /* Green */
  color: #ffffff;
}
.login-btn:active {
  background-color: #4cc200;
}
.login-btn[disabled] {
  background-color: #a3e9a4;
  color: #e0ffe0;
}


.register-btn {
  background-color: #f0f0f0; /* Light gray */
  color: #555;
}
.register-btn:active {
  background-color: #e0e0e0;
}
.register-btn[disabled] {
  background-color: #e9e9e9;
  color: #aaa;
}


.forgot-password {
  margin-top: 30rpx;
  text-align: center;
  font-size: 26rpx;
  color: #007aff; /* Link color */
  cursor: pointer;
}
</style>