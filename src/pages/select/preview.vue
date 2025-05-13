<template>
  <view class="preview-page">
    <!-- Custom Navigation Bar Placeholder - Actual implementation might vary -->
    <!-- <view class="custom-navbar">
      <view class="back-icon" @tap="goBack">&lt;</view>
      <view class="page-title">内页预览</view>
      <view class="actions">
        <text class="icon">...</text>
        <text class="icon">◎</text>
      </view>
    </view> -->

    <view class="content-area">
      <!-- Loading State -->
      <view v-if="loading">加载预览中...</view>
      <!-- Error State -->
      <view v-else-if="error && !templateDetails">{{ error }}</view> <!-- Show main error only if details failed -->
      <!-- Preview Content -->
      <template v-else-if="templateDetails">
        <!-- Display URL get error if it occurred but details loaded -->
        <view v-if="error && templateDetails" style="color: red; margin-bottom: 20rpx; text-align: center;">{{ error }}</view>
        <view class="page-section">
          <view class="section-title">
            <text class="dot"></text>封面
          </view>
          <!-- Use the signed URL ref -->
          <image class="preview-image" :src="coverImageSignedUrl" mode="widthFix"></image>
        </view>

        <view class="page-section">
          <view class="section-title">
            <text class="dot"></text>目录页
          </view>
          <!-- Use the signed URL ref -->
          <image class="preview-image" :src="tocImageSignedUrl" mode="widthFix"></image>
        </view>

        <view class="page-section">
          <view class="section-title">
            <text class="dot"></text>内容页
          </view>
          <!-- Use the signed URL ref -->
          <image class="preview-image" :src="contentImageSignedUrl" mode="widthFix"></image>
        </view>
      </template>
    </view>

    <!-- Confirm Button -->
    <!-- Allow confirmation even if some image URLs failed, adjust if needed -->
    <button class="confirm-button" @tap="confirmPreview" :disabled="loading || !templateDetails">
      <image src="/static/icons/confirm.svg" class="button-icon" mode="aspectFit"></image> <!-- Updated icon -->
      <!-- 确定 <text class="arrow">&gt;</text> -->
    </button>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'; // Import watch
import { onLoad } from '@dcloudio/uni-app';
// Import the new API function and the interface
import { getTemplateDetailsWithPagePreviews, type TemplateDetailsWithPagePreviews } from '../../api/template'; 

const templateId = ref<string | null>(null);
// Update the type of templateDetails to use the new interface
const templateDetails = ref<TemplateDetailsWithPagePreviews | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

// Computed properties for preview images can now directly access URLs from templateDetails
const coverImageSignedUrl = computed(() => templateDetails.value?.coverPreviewUrl || '/static/images/template1.png');
const tocImageSignedUrl = computed(() => templateDetails.value?.tocPreviewUrl || '/static/images/template2.png');
const contentImageSignedUrl = computed(() => templateDetails.value?.contentPreviewUrl || '/static/images/template1.png');

onLoad(async (options) => {
  if (options && options.templateId) {
    templateId.value = options.templateId;
    console.log('Previewing template ID:', templateId.value);
    loading.value = true;
    error.value = null;
    try {
      // Fetch template details along with pre-signed page preview URLs
      const detailsWithPreviews = await getTemplateDetailsWithPagePreviews(templateId.value as string);
      templateDetails.value = detailsWithPreviews;
      console.log('Fetched template details with page previews:', detailsWithPreviews);

      if (!detailsWithPreviews || !detailsWithPreviews.pages || detailsWithPreviews.pages.length === 0) {
        throw new Error('模板数据不完整');
      }
    } catch (err: any) {
      console.error('Failed to get template details with page previews:', err);
      error.value = `无法加载模板预览: ${err.message || '未知错误'}`;
      uni.showToast({ title: error.value, icon: 'none' });
    } finally {
      loading.value = false;
    }
  } else {
    console.error('Template ID not provided to preview page.');
    error.value = '模板信息错误';
    uni.showToast({ title: error.value, icon: 'none' });
    uni.navigateBack();
  }
});

const goBack = () => {
  uni.navigateBack();
};

const confirmPreview = () => {
  if (!templateId.value || loading.value || error.value) {
    uni.showToast({ title: '无法确认模板', icon: 'none' });
    return;
  }
  console.log('Confirming preview, navigating to group management...');
  // Navigate to the next step: Group Management
  uni.navigateTo({
    // Pass necessary info like templateId
    url: `/pages/edit/group?templateId=${templateId.value}`
  });
};
</script>

<style scoped>
.preview-page {
  background-color: #f8f8f8;
  min-height: 100vh;
  padding-bottom: 140rpx; /* Space for the fixed button */
  box-sizing: border-box;
}

/* Placeholder for custom navbar styling if needed */
/* .custom-navbar { ... } */

.content-area {
  padding: 30rpx;
}

.page-section {
  margin-bottom: 40rpx;
  background-color: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
}

.dot {
  width: 12rpx;
  height: 12rpx;
  background-color: #57DD00; /* Green dot */
  border-radius: 50%;
  margin-right: 15rpx;
}

.preview-image {
  width: 100%;
  display: block;
  border-radius: 8rpx; /* Slightly rounded corners for image inside section */
  /* box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08); */
  background-color: #eee; /* Placeholder bg */
}

.confirm-button {
  position: fixed;
  height: fit-content;
  width: fit-content;
  bottom: 60rpx; /* Adjust as needed */
  right: 60rpx;
  border: none;
  border-radius: 36rpx;
  background-color: transparent;
  padding: 0;
  font-size: 30rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.confirm-button:disabled {
  background-color: #ccc;
  color: #666;
}

.button-icon {
  width: 200rpx; /* Adjusted size */
  height: 72rpx; /* Adjusted size */
}

.arrow {
  margin-left: 10rpx;
  font-weight: bold;
}

</style>
