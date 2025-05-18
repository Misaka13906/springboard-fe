<template>
  <view class="page-thumbnail" :class="{ 'is-hidden': hidden }" :style="thumbnailStyle">
    <img :src="previewUrl" class="page-thumbnail__img" />
    <img
      v-for="work in works"
      :key="work.uid"
      :src="work.url || '/static/images/template1.png'"
      class="page-thumbnail__work"
      :style="getWorkStyle(work)"
    />
    <view
      v-for="text in texts"
      :key="text.uid"
      class="page-thumbnail__text"
      :style="getTextStyle(text)"
    >
      {{ text.content }}
    </view>
  </view>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { usePortfolioStore } from '@/store/portfolio';
const props = defineProps({
  projectIndex: { type: Number, required: true },
  pageIndex: { type: Number, required: true },
  width: { type: String, default: '160px' },
  height: { type: String, default: '100px' },
});
const portfolioStore = usePortfolioStore();
const project = computed(() => {
  if (portfolioStore.portfolio && 
      props.projectIndex >= 0 && 
      props.projectIndex < portfolioStore.portfolio.projects.length) {
    return portfolioStore.portfolio.projects[props.projectIndex] || {} as statusType.Project;
  }
  return {} as statusType.Project;
});
const page = computed(() => {
  const currentProject = project.value;
  if (currentProject && currentProject.pages && 
      props.pageIndex >= 0 && 
      props.pageIndex < currentProject.pages.length) {
    return currentProject.pages[props.pageIndex] || {} as statusType.PortfolioPage;
  }
  return {} as statusType.PortfolioPage;
});
const works = computed(() => {
  const currentProject: statusType.Project = project.value;
  const currentPage: statusType.PortfolioPage = page.value;
  if (currentProject && currentProject.works && currentPage && currentPage.pageNum !== undefined) {
    return currentProject.works.filter((w: statusType.Work) => w.page_num === currentPage.pageNum) || [];
  }
  return [];
});
const texts = computed(() => {
  const currentProject: statusType.Project = project.value;
  const currentPage: statusType.PortfolioPage = page.value;
  if (currentProject && currentProject.texts && currentPage && currentPage.pageNum !== undefined) {
    return currentProject.texts.filter((t: statusType.Text) => t.page_num === currentPage.pageNum) || [];
  }
  return [];
});
const hidden = computed(() => project.value?.hidden || false); // Provide a default for hidden
const thumbnailStyle = computed(() => `width:${props.width};height:${props.height};`);
const previewUrl = computed(() => page.value?.bkgUrl || '/static/images/template1.png');
function getWorkStyle(work: any) {
  if (!work) return ''; // Handle undefined work object
  const top = work.marginTop !== undefined ? work.marginTop : work.margin_top;
  const left = work.marginLeft !== undefined ? work.marginLeft : work.margin_left;
  const scale = work.scale;
  // Ensure numeric values and provide defaults
  const numTop = parseFloat(top as string) || 0;
  const numLeft = parseFloat(left as string) || 0;
  const numScale = parseFloat(scale as string) || 1;
  return `position:absolute;top:${numTop}px;left:${numLeft}px;width:60rpx;height:60rpx;object-fit:cover;transform:scale(${numScale});`;
}
function getTextStyle(text: any) {
  if (!text) return ''; // Handle undefined text object
  const top = text.marginTop !== undefined ? text.marginTop : text.margin_top;
  const left = text.marginLeft !== undefined ? text.marginLeft : text.margin_left;
  const fontSize = text.fontSize !== undefined ? text.fontSize : text.font_size;
  // Ensure numeric values and provide defaults
  const numTop = parseFloat(top as string) || 0;
  const numLeft = parseFloat(left as string) || 0;
  const numFontSize = parseFloat(fontSize as string) || 14;
  return `position:absolute;top:${numTop}px;left:${numLeft}px;font-size:${numFontSize}px;max-width:80rpx;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;`;
}
</script>
<style scoped>
.page-thumbnail { border-radius: 8rpx; background: #eee; overflow: hidden; display: flex; align-items: center; justify-content: center; position: relative; }
.page-thumbnail__img { width: 100%; height: 100%; object-fit: cover; position: absolute; left: 0; top: 0; z-index: 0; }
.page-thumbnail__work { z-index: 1; border-radius: 4rpx; filter: drop-shadow(0 2rpx 4rpx rgba(0,0,0,0.08)); }
.page-thumbnail__text { z-index: 2; background: rgba(255,255,255,0.7); padding: 2rpx 8rpx; border-radius: 4rpx; position: absolute; }
.is-hidden { opacity: 0.5; }
</style>
