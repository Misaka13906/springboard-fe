<template>
  <view class="page-thumbnail" :class="{ 'is-hidden': hidden }" :style="thumbnailStyle">
    <img :src="previewUrl" class="page-thumbnail__img" />
    <img
      v-for="work in works"
      :key="work.id"
      :src="work.url || '/static/images/template1.png'"
      class="page-thumbnail__work"
      :style="getWorkStyle(work)"
    />
    <view
      v-for="text in texts"
      :key="text.id"
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
const project = computed(() => portfolioStore.portfolio?.projects[props.projectIndex] || {} as statusType.Project);
const page = computed(() => project.value.pages?.[props.pageIndex] || {});
const works = computed(() => project.value.works?.filter((w: statusType.Work) => w.page_num === page.value.pageNum) || []);
const texts = computed(() => project.value.texts?.filter((t: statusType.Text) => t.page_num === page.value.pageNum) || []);
const hidden = computed(() => project.value.hidden);
// const templatePage = computed(() => project.value.template?.pages?.find((tp: any) => tp.order === page.value.order));
const thumbnailStyle = computed(() => `width:${props.width};height:${props.height};`);
const previewUrl = computed(() => page.value?.bkgUrl || '/static/images/template1.png');
function getWorkStyle(work: any) {
  return `position:absolute;top:${work.marginTop || work.margin_top}px;left:${work.marginLeft || work.margin_left}px;width:60rpx;height:60rpx;object-fit:cover;transform:scale(${work.scale || 1});`;
}
function getTextStyle(text: any) {
  const top = text.marginTop !== undefined ? text.marginTop : text.margin_top || 0;
  const left = text.marginLeft !== undefined ? text.marginLeft : text.margin_left || 0;
  const fontSize = text.fontSize !== undefined ? text.fontSize : text.font_size || 14;
  return `position:absolute;top:${top}px;left:${left}px;font-size:${fontSize}px;max-width:80rpx;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;`;
}
</script>
<style scoped>
.page-thumbnail { border-radius: 8rpx; background: #eee; overflow: hidden; display: flex; align-items: center; justify-content: center; position: relative; }
.page-thumbnail__img { width: 100%; height: 100%; object-fit: cover; position: absolute; left: 0; top: 0; z-index: 0; }
.page-thumbnail__work { z-index: 1; border-radius: 4rpx; filter: drop-shadow(0 2rpx 4rpx rgba(0,0,0,0.08)); }
.page-thumbnail__text { z-index: 2; background: rgba(255,255,255,0.7); padding: 2rpx 8rpx; border-radius: 4rpx; position: absolute; }
.is-hidden { opacity: 0.5; }
</style>
