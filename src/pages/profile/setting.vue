<template>
  <view class="setting-page">
    <!-- 其他设置项... -->
    <button class="logout-btn" @tap="onLogout">退出登录</button>
  </view>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/store/auth';
import { onMounted } from 'vue';

const auth = useAuthStore();

onMounted(() => {
  auth.init(); // 页面加载时初始化登录状态
});

function onLogout() {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        auth.logout();
        uni.showToast({ title: '已退出登录', icon: 'none' });
        // 跳转到登录页或首页
        uni.reLaunch({ url: '/pages/profile/login' });
      }
    }
  });
}
</script>

<style scoped>
.setting-page {
  padding: 40rpx;
}
.logout-btn {
  margin-top: 80rpx;
  width: 100%;
  height: 85rpx;
  background: #ff4d4f;
  color: #fff;
  border-radius: 10rpx;
  font-size: 32rpx;
  font-weight: bold;
}
</style>
