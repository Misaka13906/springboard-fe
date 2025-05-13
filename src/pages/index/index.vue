<template>
  <view class="content index-page">
    <!-- Add the custom navbar component here -->
    <view class="custom-navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <!-- Content area with fixed height -->
      <view class="navbar-content" :style="{ height: navBarHeight + 'px' }">
        <image class="logo" src="/static/icons/head-logo.png" mode="aspectFit" />
        <view class="navbar-actions">
          <!-- Use image tag for icons in uni-app -->
          <image class="icon" src="/static/icons/tips.svg" mode="aspectFit" @tap="onTipsClick" />
        </view>
      </view>
    </view>

    <!-- Header -->
    <!-- <view class="header">
      <image class="logo" src="/static/icons/head-logo.png" mode="aspectFit"></image>
      <view class="header-actions">
      </view>
    </view> -->

    <!-- Hot Templates Section -->
    <view class="section hot-section">
      <view class="section-header">
        <text class="section-title">热门模板</text>
        <text class="section-subtitle">更多人选择的优秀模板</text>
      </view>
      <scroll-view class="template-scroll" scroll-x="true" show-scrollbar="false">
        <view class="template-list">
          <!-- Loading state for hot templates -->
          <view v-if="loading" class="loading-state">加载中...</view>
          <view
            v-else
            v-for="template in hotTemplates"
            :key="template.uid"
            class="template-item hot-item"
            @tap="navigateToPreview(template.uid)"
          >
            <image class="template-image hot-image" :src="template.previewUrl" mode="aspectFill"></image>
            <!-- Optional: Add template name or other info -->
          </view>
        </view>
      </scroll-view>
      <!-- Optional: Add pagination dots here -->
    </view>

    <!-- Recommended Templates Section -->
    <view class="section recommended-section">
       <view class="section-header">
        <text class="section-title">推荐模板</text>
        <text class="section-subtitle">Springbroad精品模板</text>
      </view>
      <view class="template-grid">
         <!-- Loading state for recommended templates -->
         <view v-if="loading" class="loading-state">加载中...</view>
        <view
          v-else
          v-for="template in recommendedTemplates"
          :key="template.uid"
          class="template-item recommended-item"
          @tap="navigateToPreview(template.uid)"
        >
          <image class="template-image recommended-image" :src="template.previewUrl" mode="aspectFill"></image>
           <!-- Optional: Add template name or other info -->
           <!-- <text class="template-name">{{ template.name }}</text> -->
        </view>
        <!-- Add placeholders for grid alignment -->
        <view v-if="!loading" v-for="i in (2 - (recommendedTemplates.length % 2)) % 2" :key="'placeholder-' + i" class="template-item recommended-item placeholder"></view>
      </view>
       <!-- Empty state -->
       <view v-if="!loading && recommendedTemplates.length === 0" class="empty-state">
         暂无推荐模板
       </view>
    </view>

    <!-- Add the custom tab bar -->
    <tabbar current-page="/pages/index/index" />
  </view>

  <!-- Wrapper for the Popup -->
  <view class="popup-overlay-wrapper" v-if="isPopupVisible">
    <TipsPopup ref="tipsPopupRef" @close="handlePopupClose" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'; // Import watch
import Tabbar from '../../components/tabbar/tabbar.vue';
import TipsPopup from '@/pages/index/components/TipsPopup.vue';
// import type { base } from '../../types';
// Import API functions
import { getHotTemplatesWithPreview, getAllTemplatesWithPreview } from '../../api/template'; // New import
import { loginInWeixin, AUTO_LOGIN_FAILED_FLAG, redirectToLogin, LOGIN_PAGE_URL } from '../../api/auth'; // Import login function & flag
import { ApiErrorCodeTokenExpired, ApiErrorCodeAuthError } from '../../constants/api';
// Import onPullDownRefresh hook
import { onPullDownRefresh } from '@dcloudio/uni-app';

// Get system info to determine heights
const systemInfo = uni.getSystemInfoSync();
const statusBarHeight = ref(systemInfo.statusBarHeight || 0); // Height of status bar
const navBarHeight = ref(44); // Standard height for navbar content (adjust if needed)

// Ref for the TipsPopup component
const tipsPopupRef = ref<InstanceType<typeof TipsPopup> | null>(null);
// Ensure isPopupVisible is initialized to false
const isPopupVisible = ref(false);
console.log('index.vue: isPopupVisible initialized to', isPopupVisible.value);

// Watch for changes in isPopupVisible
watch(isPopupVisible, (newValue, oldValue) => {
  console.log(`index.vue: isPopupVisible changed from ${oldValue} to ${newValue}`);
});

// Function to handle tips icon click
const onTipsClick = () => {
  console.log('index.vue: onTipsClick called');
  isPopupVisible.value = true;
  if (tipsPopupRef.value) {
      tipsPopupRef.value.open();
  }
};

// Method to hide wrapper when popup closes
const handlePopupClose = () => {
  console.log('index.vue: handlePopupClose called');
  isPopupVisible.value = false;
};

// Interface for template data with preview URL
interface TemplateWithPreview extends baseType.Template {
  previewUrl?: string;
}

// Template data refs
const hotTemplates = ref<TemplateWithPreview[]>([]);
const recommendedTemplates = ref<TemplateWithPreview[]>([]);
const loading = ref(true); // Combined loading state

// Refactored function to get all template data
const getTemplateData = async (isPullDown: boolean = false) => {
  loading.value = true; // Start loading
  try {
    // await loginApp(); // Keep commented out or handle login as needed
    // console.log('Login successful or token already valid.');

    // Fetch templates in parallel
    const [hotTemplatesWithUrls, recommendedTemplatesWithUrls] = await Promise.all([
      getHotTemplatesWithPreview(),
      getAllTemplatesWithPreview()
    ]);

    hotTemplates.value = hotTemplatesWithUrls;
    recommendedTemplates.value = recommendedTemplatesWithUrls;

    console.log('Processed hot templates with URLs:', hotTemplates.value);
    console.log('Processed recommended templates with URLs:', recommendedTemplates.value);

  } catch (error: any) {
    console.error('Failed to get templates or preview URLs:', error);
    // Check if the error is due to 401 or a specific business code for auth failure
    const statusCode = error?.response?.statusCode;
    const apiResponse = error?.response?.data as apiType.ApiResponse<any>;

    if (statusCode === 401 || (apiResponse && apiResponse.code !== 200 && (apiResponse.message?.toLowerCase().includes('token') || apiResponse.code === ApiErrorCodeTokenExpired || apiResponse.code === ApiErrorCodeAuthError) )) {
      console.log('[getTemplateData] Authentication error detected. Attempting auto-login for WeChat.');
      // @ts-ignore
      const systemInfo = uni.getSystemInfoSync();
      const platform = systemInfo.uniPlatform;

      if (platform === 'mp-weixin') {
        try {
          let autoLoginFailed = false;
          try {
            autoLoginFailed = uni.getStorageSync(AUTO_LOGIN_FAILED_FLAG);
          } catch (e) {
            console.warn('[getTemplateData] Failed to read autoLoginFailed flag:', e);
          }

          if (autoLoginFailed) {
            console.log('[getTemplateData] Auto-login previously failed this session. Redirecting to login.');
            try {
              uni.removeStorageSync(AUTO_LOGIN_FAILED_FLAG); // Clear flag before redirecting
            } catch (e) {
              console.warn('[getTemplateData] Failed to remove autoLoginFailed flag during redirect:', e);
            }
            redirectToLogin(true);
            return; // Exit early
          }

          console.log('[getTemplateData] Attempting WeChat auto-login...');
          await loginInWeixin();
          console.log('[getTemplateData] WeChat auto-login successful. Retrying data fetch...');
          try {
            uni.removeStorageSync(AUTO_LOGIN_FAILED_FLAG); // Clear the flag as login was successful
          } catch (e) {
            console.warn('[getTemplateData] Failed to remove autoLoginFailed flag after successful login:', e);
          }
          await getTemplateData(isPullDown); // Retry fetching data
        } catch (loginError) {
          console.error('[getTemplateData] WeChat auto-login failed:', loginError);
          try {
            uni.setStorageSync(AUTO_LOGIN_FAILED_FLAG, true); // Set flag on failure
          } catch (e) {
            console.warn('[getTemplateData] Failed to set autoLoginFailed flag after login error:', e);
          }
          redirectToLogin(true); // Redirect to login page if auto-login fails
        }
      } else {
        // For non-WeChat platforms, or if auto-login is not applicable, redirect to login
        console.log('[getTemplateData] Non-WeChat platform or auto-login not applicable. Redirecting to login.');
        redirectToLogin(true);
      }
    } else {
      // Handle other errors (e.g., network issues)
      uni.showToast({ title: '加载模板失败，请稍后重试', icon: 'none' });
    }
  } finally {
      loading.value = false; // End loading
      uni.stopPullDownRefresh(); // Stop pull-down refresh animation
  }
};

onMounted(async () => {
  console.log('index.vue: onMounted hook started');
  await getTemplateData(); // Fetch data on initial mount
  console.log('index.vue: onMounted hook finished');
});

// Handle pull-down refresh
onPullDownRefresh(async () => {
  console.log('Pull down refresh triggered');
  await getTemplateData(true); // Re-get data on refresh, pass true for isPullDown
});

const navigateToPreview = (templateId: string) => {
  console.log('Navigating to preview for template ID:', templateId);
  uni.navigateTo({
    url: `/pages/select/preview?templateId=${templateId}`
  });
};

// Placeholder for potential future actions
const handleMoreActions = () => {
  console.log('More actions clicked');
};

const handleViewModeToggle = () => {
  console.log('View mode toggle clicked');
};

</script>

<style scoped>
.custom-navbar {
  background-color: #fff; /* Or your desired background */
  box-sizing: border-box;
  width: 100%;
  /* The padding-top is set dynamically */
  position: relative; /* Needed for potential z-index context */
  z-index: 99; /* Ensure navbar is above other content but below popup */
}

.navbar-content {
  display: flex;
  align-items: center;
  /* Change justification to start */
  justify-content: flex-start;
  padding: 0 30rpx 0 0; /* Keep right padding for the actions */
  box-sizing: border-box;
  /* The height is set dynamically */
}

.logo {
  height: 36px; /* Keep fixed height */
  width: 200rpx; /* Set an explicit width in rpx */
  flex-shrink: 0; /* Keep this to prevent shrinking */
}

.navbar-actions {
  display: flex;
  align-items: center;
  /* Push actions to the right */
  margin-left: auto;
}

.icon {
  width: 40rpx;
  height: 40rpx;
  /* Add margin if needed */
  margin-left: 20rpx;
}



.index-page {
  background-color: #ffffff; /* White background for the page */
  min-height: 100vh;
  padding: 20rpx 30rpx; /* Add padding */
  /* Ensure content doesn't hide behind tabbar */
  padding-bottom: 50px; /* Match the height of the tabbar */
  padding-bottom: calc(50px + constant(safe-area-inset-bottom)); /* iOS safe area */
  padding-bottom: calc(50px + env(safe-area-inset-bottom)); /* iOS safe area */
  box-sizing: border-box;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40rpx;
  padding-top: 20rpx; /* Add some space at the top */
}

.logo {
  height: 50rpx; /* Adjust logo size */
  width: 250rpx; /* Adjust logo width */
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 30rpx;
}

.icon {
  font-size: 40rpx;
  color: #333;
  /* Basic styling for icons, replace with actual icons/images if needed */
}
.more-icon {
    font-weight: bold;
    letter-spacing: -4rpx; /* Make dots closer */
}
.view-icon {
    font-weight: bold;
    /* Style for the circle icon */
}


.section {
  margin-bottom: 50rpx;
}

.section-header {
    margin-bottom: 20rpx;
}

.section-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  display: block; /* Ensure it takes full width */
}

.section-subtitle {
    font-size: 26rpx;
    color: #999;
    margin-top: 5rpx;
    display: block;
}

/* Hot Templates Scroll */
.template-scroll {
  white-space: nowrap;
}

.template-list {
  display: inline-flex; /* Use inline-flex for horizontal layout */
  gap: 25rpx;
}

.template-item {
  display: inline-block; /* Ensure items stay inline */
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: transform 0.2s ease-in-out;
}
.template-item:active {
    transform: scale(0.98);
}

.hot-item {
  width: 450rpx; /* Adjust width for horizontal scroll items */
}

.template-image {
  display: block;
  width: 100%;
  background-color: #eee; /* Placeholder bg */
}

.hot-image {
  height: 250rpx; /* Adjust height for hot templates */
}

/* Recommended Templates Grid */
.template-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 25rpx;
}

.recommended-image {
  height: 200rpx; /* Adjust height for recommended templates */
}

.recommended-item.placeholder {
  background-color: transparent;
  box-shadow: none;
}

/* Remove default content styles if they conflict */
.content {
  display: block; /* Override flex settings from original code */
  align-items: initial;
  justify-content: initial;
}
.text-area, .title {
    display: none; /* Hide the old title */
}

/* Add styles for loading and empty states if not already present */
.loading-state, .empty-state {
  text-align: center;
  color: #999;
  font-size: 28rpx;
  padding: 40rpx 0;
  width: 100%; /* Ensure it takes full width if needed */
}

/* Ensure loading state inside scroll-view works */
.template-list .loading-state {
    display: inline-block; /* Or flex if needed */
    padding: 20rpx 40rpx;
}

/* Ensure loading/empty state inside grid works */
.template-grid .loading-state, .template-grid .empty-state {
    grid-column: 1 / -1; /* Span across all columns */
}

.popup-overlay-wrapper {
  position: fixed; /* Fixed position */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex; /* Use flex to center the child */
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.4); /* Dimmed background */
  z-index: 999; /* Ensure it's on top */
}
</style>
