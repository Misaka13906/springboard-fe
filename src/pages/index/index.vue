<template>
  <view class="content index-page">
    <!-- Add the custom navbar component here -->
    <custom-navbar />

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
            @click="navigateToPreview(template.uid)"
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
          @click="navigateToPreview(template.uid)"
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
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
// Import the custom tab bar component
import Tabbar from '../../components/tabbar/tabbar.vue'; // Adjust path if necessary
// Import the custom navbar component
import CustomNavbar from '../../components/custom-navbar/custom-navbar.vue'; // Adjust path if necessary
import type { Template } from '../../types/api'; // Import Template type
// Import API functions
import { fetchHotTemplates, fetchAllTemplates } from '../../api/template';
import { loginApp } from '../../api/auth'; // Import login function for testing
// Import OSS function
import { getPreviewUrl } from '../../api/oss';
// Import onPullDownRefresh hook
import { onPullDownRefresh } from '@dcloudio/uni-app';

// Interface for template data with preview URL
interface TemplateWithPreview extends Template {
  previewUrl?: string;
}

// Template data refs
const hotTemplates = ref<TemplateWithPreview[]>([]);
const recommendedTemplates = ref<TemplateWithPreview[]>([]);
const loading = ref(true); // Combined loading state

// Function to fetch preview URLs for templates
const fetchPreviewUrls = async (templates: Template[]): Promise<TemplateWithPreview[]> => {
  const templatesWithUrls = await Promise.all(
    templates.map(async (template) => {
      let previewUrl = '/static/images/template1.png'; // Default placeholder
      const ossKey = template.pages?.[0]?.oss_key;
      if (ossKey) {
        try {
          previewUrl = await getPreviewUrl(ossKey);
        } catch (urlError) {
          console.error(`Failed to get preview URL for template ${template.uid} (key: ${ossKey}):`, urlError);
          // Keep the default placeholder URL on error
        }
      } else {
        console.warn(`No oss_key found for cover page of template ${template.uid}`);
      }
      return { ...template, previewUrl };
    })
  );
  return templatesWithUrls;
};

// Refactored function to fetch all template data
const fetchTemplateData = async () => {
  loading.value = true; // Start loading
  try {
    // await loginApp(); // Keep commented out or handle login as needed
    // console.log('Login successful or token already valid.');

    // Fetch templates in parallel
    const [hotData, allData] = await Promise.all([
      fetchHotTemplates(),
      fetchAllTemplates()
    ]);

    console.log('Fetched raw hot templates:', hotData);
    console.log('Fetched raw recommended (all) templates:', allData);

    // Fetch preview URLs for both sets of templates in parallel
    const [hotTemplatesWithUrls, recommendedTemplatesWithUrls] = await Promise.all([
        fetchPreviewUrls(hotData),
        fetchPreviewUrls(allData) // Use allData for recommended
    ]);

    hotTemplates.value = hotTemplatesWithUrls;
    recommendedTemplates.value = recommendedTemplatesWithUrls;

    console.log('Processed hot templates with URLs:', hotTemplates.value);
    console.log('Processed recommended templates with URLs:', recommendedTemplates.value);

  } catch (error) {
    console.error('Failed to fetch templates or preview URLs:', error);
    uni.showToast({ title: '加载模板失败', icon: 'none' });
  } finally {
      loading.value = false; // End loading
      uni.stopPullDownRefresh(); // Stop pull-down refresh animation
  }
};

onMounted(async () => {
  await fetchTemplateData(); // Fetch data on initial mount
});

// Handle pull-down refresh
onPullDownRefresh(async () => {
  console.log('Pull down refresh triggered');
  await fetchTemplateData(); // Re-fetch data on refresh
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

</style>
