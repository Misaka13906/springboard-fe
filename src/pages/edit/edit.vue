<template>
  <view class="edit-page">
    <scrollList />
    <editorCanvas />
    <view class="edit-page__actions" v-if="!isElementSelected">
      <view class="edit-page__btn edit-page__btn--add" @tap="onAddImage">
        <image src="/static/icons/add.svg" style="width:96rpx;height:96rpx;" mode="aspectFit" />
      </view>
      <view class="edit-page__btn edit-page__btn--export" @tap="showExportPanel = true">
        <image src="/static/icons/export.svg" style="width:96rpx;height:96rpx;" mode="aspectFit" />
      </view>
    </view>
    <exportPanel v-if="showExportPanel" @close="showExportPanel = false" @save="onSavePortfolio" />
  </view>
</template>
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getTemplateDetails } from '@/api/template';
import { uploadWorkFile } from '@/api/oss';
import { usePortfolioStore } from '@/store/portfolio';
import scrollList from './components/scrollList.vue';
import editorCanvas from './components/editorCanvas.vue';
import exportPanel from './components/exportPanel.vue';

const showExportPanel = ref(false);

const portfolioStore = usePortfolioStore();
const isElementSelected = computed(() => !!portfolioStore.selectedElementUid);

onLoad(async (options) => {
  let groups: { name: string, order: number }[] = [];
  if (options && options.groups) {
    try {
      groups = JSON.parse(decodeURIComponent(options.groups));
    } catch (e) {
      groups = [];
    }
  } else {
    groups = [];
  }
  if (options && options.templateId) {
    try {
      const portfolio_uid = `portfolio_${(new Date()).toISOString()}_${Math.random().toString(36).slice(2,8)}`
      await portfolioStore.initEditStateByTemplateId(options.templateId, groups, portfolio_uid);
    } catch (e) {
      uni.showToast({ title: '模板信息获取失败', icon: 'none' });
    }
  }
});

const emptyProject: statusType.Project = {
  id: undefined,
  uid: '',
  portfolio_uid: '',
  name: '',
  order: 0,
  works: [],
  texts: [],
  CreatedAt: undefined,
  UpdatedAt: undefined,
  readonly: false,
  hidden: false,
  pages: [],
  is_content_project: true
};

const currentProject = computed(() => portfolioStore.portfolio?.projects[portfolioStore.currentProjectIndex] || emptyProject);
const currentPages = computed(() => currentProject?.value.pages || []);
const currentPage = computed(() => currentPages.value[portfolioStore.currentPageNum] || null);

function onAddImage() {
  portfolioStore.addImage();
}

function onSavePortfolio() {
  portfolioStore.savePortfolio(); // Call the store's save action
}

watch(portfolioStore.portfolio as statusType.Portfolio, (newPortfolio: statusType.Portfolio) => {
  if (newPortfolio) {
    console.log('Portfolio updated:', newPortfolio);
  }
}, { deep: true });

</script>
<style scoped>
.edit-page { display: flex; flex-direction: column; height: 100vh; background: #f5f5f5; }
.edit-page__actions {
  position: fixed;
  right: 40rpx;
  bottom: 80rpx;
  display: flex;
  flex-direction: column;
  gap: 30rpx;
  z-index: 10;
  max-width: 120rpx;
  max-height: 300rpx;
  height: fit-content;
}
.edit-page__btn {
  border: none;
  background: none;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: none;
}
.edit-page__btn img {
  width: 48rpx;
  height: 48rpx;
  display: block;
  margin: 0;
  border: none;
  box-shadow: none;
  background: none;
}
</style>
