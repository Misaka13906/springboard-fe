<template>
  <view class="feedback-page">
    <view class="title">问题反馈</view>

    <view class="form-item">
      <view class="form-label">请选择您的反馈类型:</view>
      <picker @change="bindPickerChange" :value="typeIndex" :range="feedbackTypes" range-key="name">
        <view class="picker">
          {{ feedbackTypes[typeIndex].name }}
          <text class="dropdown-arrow">▼</text>
        </view>
      </picker>
    </view>

    <view class="input-area">
      <textarea
        class="feedback-textarea"
        v-model="feedbackContent"
        placeholder="请输入您反馈的问题"
        maxlength="1000"
        auto-height
      />
      <view class="char-count">{{ feedbackContent.length }}/1000</view>
    </view>

    <view class="send-button">
      <image
        src="/static/icons/send.svg"
        class="send-icon"
        mode="aspectFit"
        @tap="submitFeedback"
        :style="{ opacity: loading || !feedbackContent.trim() ? 0.5 : 1 }"
      ></image>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { addFeedback } from '../../api/feedback';

const feedbackContent = ref('');
const loading = ref(false);

// Feedback Type Logic
const feedbackTypes = ref([
  { id: 'bug', name: 'bug反映' },
  { id: 'suggestion', name: '功能建议' },
  { id: 'other', name: '其他问题' },
]);
const typeIndex = ref(0);
const selectedFeedbackType = computed(() => feedbackTypes.value[typeIndex.value].id);

const bindPickerChange = (e: any) => {
  typeIndex.value = e.detail.value;
};

const submitFeedback = async () => {
  if (!feedbackContent.value.trim()) {
    uni.showToast({ title: '请输入反馈内容', icon: 'none' });
    return;
  }
  if (loading.value) return;

  loading.value = true;
  uni.showLoading({ title: '提交中...' });

  try {
    await addFeedback({ content: feedbackContent.value });
    uni.hideLoading();
    uni.showToast({ title: '反馈已提交', icon: 'success' });
    feedbackContent.value = ''; // Clear input after successful submission
    // Optionally navigate back or show a success message
    // uni.navigateBack();
  } catch (error: any) {
    uni.hideLoading();
    console.error('Failed to submit feedback:', error);
    const displayMessage = error?.message || '提交失败，请稍后重试';
    uni.showToast({ title: displayMessage, icon: 'none' });
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.feedback-page {
  padding: 40rpx;
  background-color: #f8f8f8;
  min-height: 100vh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.title {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  text-align: center;
}

.description {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 40rpx;
  text-align: center;
  line-height: 1.6;
}

.form-item {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
  padding: 20rpx;
  border-radius: 16rpx;
  border: 1px solid #eee;
}

.form-label {
  font-size: 28rpx;
  color: #333;
  margin-right: 20rpx;
  white-space: nowrap;
}

.picker {
  flex-grow: 1;
  border: 1px solid #eee;
  padding: 10rpx 20rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #555;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dropdown-arrow {
  font-size: 20rpx;
  color: #999;
  margin-left: 10rpx;
}

.input-area {
  border-radius: 16rpx;
  padding: 20rpx;
  border: 1px solid #eee;
  margin-bottom: 60rpx;
  position: relative;
}

.feedback-textarea {
  width: 100%;
  min-height: 300rpx;
  font-size: 28rpx;
  line-height: 1.6;
  color: #333;
  padding-bottom: 40rpx;
  box-sizing: border-box;
}

.char-count {
  position: absolute;
  bottom: 15rpx;
  right: 25rpx;
  font-size: 24rpx;
  color: #aaa;
}

.send-button {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  width: 100%;
}

.send-icon {
  width: 200rpx;
  height: 72rpx;
  display: flex;
  /* margin-top: 60rpx;  */
  transition: opacity 0.2s;
}

.send-icon:active {
  opacity: 0.7;
}
</style>