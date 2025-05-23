<template>
  <view class="select-template-page">
    <view class="title">选择模板:</view>

    <!-- Tabs for different template categories -->
    <view class="tabs">
      <view
        v-for="(tab, index) in tabs"
        :key="index"
        :class="['tab-item', { active: activeTab === index }]"
        @tap="changeTab(index)"
      >
        {{ tab.name }}
      </view>
    </view>

    <!-- Template Grid -->
    <view class="template-grid">
      <!-- Loading State -->
      <view v-if="loading">加载中...</view>
      <!-- Empty State -->
      <view v-else-if="currentTemplates.length === 0">暂无模板</view>
      <!-- Template Items -->
      <view
        v-else
        v-for="(template) in currentTemplates"
        :key="template.uid"
        :class="['template-item', { selected: selectedTemplateId === template.uid }]"
        @tap="selectTemplate(template.uid)"
      >
        <image class="template-image" :src="template.previewUrl" mode="aspectFill"></image>
        <text class="template-name">{{ template.name }}</text>
        <!-- Selection Indicator -->
        <view v-if="selectedTemplateId === template.uid" class="selection-indicator">✓</view>
      </view>
      <!-- Add placeholders if needed for grid alignment -->
      <view v-if="!loading && currentTemplates.length > 0" v-for="i in (2 - (currentTemplates.length % 2)) % 2" :key="'placeholder-' + i" class="template-item placeholder"></view>
    </view>

    <!-- Confirm Button -->
    <button class="confirm-button" :disabled="!selectedTemplateId || loading" @tap="confirmSelection">
      下一步
    </button>

    <!-- Coming Soon Text -->
    <view class="coming-soon-text">更多模板敬请期待</view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getAllTemplates } from '../../api/template';
import { getSignedPreviewUrl } from '../../api/oss';

// Define an interface that includes the previewUrl, extending the correct base type
interface TemplateWithPreview extends baseType.Template {
  previewUrl?: string;
}

const allTemplates = ref<TemplateWithPreview[]>([]); // Use the updated interface
const loading = ref(true);

const tabs = ref([
  { name: '全部', category: 'all' },
]);

const activeTab = ref(0);
const selectedTemplateId = ref<string | null>(null);

const currentTemplates = computed(() => {
  if (loading.value) return [];
  return allTemplates.value;
});

const changeTab = (index: number) => {
  activeTab.value = index;
};

const selectTemplate = (uid: string) => {
  selectedTemplateId.value = uid;
  console.log('Selected template UID:', uid);
};

const confirmSelection = () => {
  if (!selectedTemplateId.value) {
    uni.showToast({ title: '请选择一个模板', icon: 'none' });
    return;
  }
  console.log('Confirming selection, navigating to preview...');
  uni.navigateTo({
    url: `/pages/select/preview?templateId=${selectedTemplateId.value}`
  });
};

onMounted(async () => {
  loading.value = true;
  try {
    const templatesData = await getAllTemplates();
    console.log('Fetched raw templates:', templatesData);

    const templatesWithUrls = await Promise.all(
      templatesData.map(async (template: baseType.Template): Promise<TemplateWithPreview> => {
        let previewUrl: string = '/static/images/template1.png'; // Default placeholder

        // Use the same logic as index.vue to get the oss_key from the first page
        const ossKey: string | undefined = template.pages?.[0]?.oss_key; // Changed this line

        if (ossKey) {
          try {
        previewUrl = await getSignedPreviewUrl(ossKey);
        console.log(`Generated preview URL for ${template.uid}: ${previewUrl}`);
          } catch (urlError) {
        console.error(`Failed to get preview URL for template ${template.uid} (key: ${ossKey}):`, urlError);
          }
        } else {
          // Updated warning message to reflect the key being checked
          console.warn(`No oss_key found for cover page of template ${template.uid}, using default placeholder.`);
        }
        return { ...template, previewUrl } as TemplateWithPreview;
      })
    );

    allTemplates.value = templatesWithUrls;
    console.log('Processed templates with URLs:', allTemplates.value);

  } catch (error) {
    console.error('Failed to get templates or generate URLs:', error);
    uni.showToast({ title: '加载模板失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.select-template-page {
  padding: 20rpx;
  background-color: #f8f8f8;
  min-height: 100vh;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
  color: #333;
}

.tabs {
  display: flex;
  margin-bottom: 30rpx;
  border-bottom: 1px solid #eee;
}

.tab-item {
  padding: 15rpx 30rpx;
  font-size: 28rpx;
  color: #666;
  cursor: pointer;
  position: relative;
}

.tab-item.active {
  color: #333;
  font-weight: bold;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 4rpx;
  background-color: #333;
  border-radius: 2rpx;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  margin-bottom: 40rpx;
}

.template-item {
  background-color: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  position: relative;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.2s ease;
}

.template-item.selected {
  border-color: #57DD00;
}

.template-item.placeholder {
  background-color: transparent;
  box-shadow: none;
  border: none;
}

.template-image {
  width: 100%;
  height: 300rpx;
  display: block;
  background-color: #eee; /* Add a background color for loading/error state */
}

.template-name {
  display: block;
  padding: 15rpx;
  text-align: center;
  font-size: 24rpx;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.selection-indicator {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
  background-color: #57DD00;
  color: white;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24rpx;
  font-weight: bold;
}

.confirm-button {
  background-color: #333;
  color: #fff;
  border: none;
  border-radius: 40rpx;
  padding: 20rpx 0;
  font-size: 30rpx;
  text-align: center;
  width: 100%;
  margin-top: 20rpx;
}

.confirm-button:disabled {
  background-color: #ccc;
  color: #666;
}

.coming-soon-text {
  text-align: center;
  color: #999;
  font-size: 24rpx;
  margin-top: 40rpx;
  padding-bottom: 40rpx;
}
</style>
