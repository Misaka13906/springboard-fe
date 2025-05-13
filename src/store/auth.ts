import { defineStore } from 'pinia';
import { ref } from 'vue';
import { loginApp, registerApp } from '../api/auth';

// 用户信息类型，可根据实际接口调整
interface UserInfo {
  username: string;
  // 可扩展更多字段
}

export const useAuthStore = defineStore('auth', () => {
  // 登录状态
  const isLoggedIn = ref(false);
  // 用户信息
  const user = ref<UserInfo | null>(null);

  // 登录方法
  async function login(payload: { username: string; password: string }) {
    const data = await loginApp(payload);
    user.value = { username: payload.username };
    isLoggedIn.value = true;
    // 可扩展：获取更多用户信息
  }

  // 注册方法
  async function register(payload: { username: string; password: string }) {
    await registerApp(payload);
  }

  // 退出登录
  function logout() {
    isLoggedIn.value = false;
    user.value = null;
    uni.removeStorageSync('access_token');
    uni.removeStorageSync('refresh_token');
    uni.removeStorageSync('username');
  }

  // 初始化（如页面刷新后自动恢复登录状态）
  function init() {
    const username = uni.getStorageSync('username');
    const accessToken = uni.getStorageSync('access_token');
    if (username && accessToken) {
      user.value = { username };
      isLoggedIn.value = true;
    }
  }

  return { isLoggedIn, user, login, register, logout, init };
});
