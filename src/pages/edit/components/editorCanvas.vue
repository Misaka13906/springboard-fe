<template>
  <view class="editor">
    <view class="editor__toolbar">
      <view class="editor__icon-btn" @tap="onAddText">
        <img src="/static/icons/text.svg" class="editor__icon" />
      </view>
      <view class="editor__icon-btn" @tap="onAddImage">
        <img src="/static/icons/image.svg" class="editor__icon" />
      </view>
      <label class="editor__switch">
        <input type="checkbox" v-model="showBleed" @change="onToggleBleed" /> 出血线
      </label>
    </view>
    <view class="editor__canvas" ref="canvasRef"
      @mousemove="handleCanvasMouseMove"
      @mouseup="handleCanvasMouseUp"
      @touchmove="handleCanvasTouchMove"
      @touchend="handleCanvasTouchEnd"
    >
      <img v-if="previewUrl" :src="previewUrl" class="editor__bg" />
      <img
        v-for="work in pageWorks"
        :key="work.id"
        :src="work.url"
        class="editor__work"
        :style="getWorkStyle(work)"
        @mousedown="onDragStart(work, $event, 'work')"
        @touchstart="onDragStart(work, $event, 'work')"
        @tap.stop="onSelectElement(work, 'work')"
        :class="{ 'editor__work--active': isSelected(work, 'work') }"
      />
      <view
        v-for="text in pageTexts"
        :key="text.id"
        class="editor__text"
        :style="getTextStyle(text)"
        @mousedown="onDragStart(text, $event, 'text')"
        @touchstart="onDragStart(text, $event, 'text')"
        @tap.stop="onSelectElement(text, 'text')"
        :class="{ 'editor__text--active': isSelected(text, 'text') }"
      >
        {{ text.content }}
      </view>
    </view>
    <view v-if="selectedElement" class="editor__settings">
      <template v-if="selectedType === 'work'">
        <label>上边距: <input type="number" v-model.number="selectedElement.margin_top" /></label>
        <label>左边距: <input type="number" v-model.number="selectedElement.margin_left" /></label>
        <label>缩放: <input type="number" v-model.number="selectedWorkScale" /></label>
      </template>
      <template v-else-if="selectedType === 'text'">
        <label>上边距: <input type="number" v-model.number="selectedElement.margin_top" /></label>
        <label>左边距: <input type="number" v-model.number="selectedElement.margin_left" /></label>
        <label>字体大小: <input type="number" v-model.number="selectedTextFontSize" /></label>
        <label>内容: <input type="text" v-model="selectedTextContent" /></label>
      </template>
      <button class="editor__delete" @tap="onDeleteElement">删除</button>
    </view>
  </view>
</template>
<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue';
import { usePortfolioStore } from '@/store/portfolio';
import { getSignedPreviewUrl } from '../../../api/oss';

const portfolioStore = usePortfolioStore();
const showBleed = computed({
  get: () => portfolioStore.showBleed,
  set: v => (portfolioStore.showBleed = v)
});

const canvasRef = ref();

const project = computed(() => portfolioStore.portfolio?.projects[portfolioStore.currentProjectIndex] || {} as statusType.Project);
const page = computed(() => project.value.pages?.[portfolioStore.currentPageNum] || {});
const templatePage = computed(() => page.value?.order !== undefined && portfolioStore.portfolio?.template?.pages
  ? portfolioStore.portfolio.template.pages.find((p: statusType.TemplatePage) => p.order === page.value.order)
  : null
);
const selectedType = computed(() => 
  portfolioStore.selectedElementUid?.startsWith('work') ? 'work' : 
  portfolioStore.selectedElementUid?.startsWith('text') ? 'text' : "none",
);
const selectedElement = computed({
  get: () => 
  selectedType.value == 'work' ? 
    portfolioStore.portfolio?.projects[portfolioStore.currentProjectIndex].works?.find((w: statusType.Work) => w.uid === portfolioStore.selectedElementUid) :
  selectedType.value == 'text' ?
    portfolioStore.portfolio?.projects[portfolioStore.currentProjectIndex].texts?.find((t: statusType.Text) => t.uid === portfolioStore.selectedElementUid) :
  null as statusType.Work | statusType.Text | null,
  set: (el: statusType.Work | statusType.Text | null) => {
    if (el) {
      portfolioStore.selectedElementUid = el.uid;
    } else {
      portfolioStore.selectedElementUid = null;
    }
  }
});

const selectedWorkScale = computed({
  get: () => selectedType.value === 'work' && selectedElement.value ? (selectedElement.value as statusType.Work).scale : undefined,
  set: (val) => {
    if (selectedType.value === 'work' && selectedElement.value) {
      (selectedElement.value as statusType.Work).scale = val ?? 1;
    }
  }
});

const selectedTextFontSize = computed({
  get: () => selectedType.value === 'text' && selectedElement.value ? (selectedElement.value as statusType.Text).font_size : undefined,
  set: (val) => {
    if (selectedType.value === 'text' && selectedElement.value) {
      (selectedElement.value as statusType.Text).font_size = val ?? '16px';
    }
  }
});

const selectedTextContent = computed({
  get: () => selectedType.value === 'text' && selectedElement.value ? (selectedElement.value as statusType.Text).content : undefined,
  set: (val) => {
    if (selectedType.value === 'text' && selectedElement.value) {
      (selectedElement.value as statusType.Text).content = val ?? 'none';
    }
  }
});

const previewUrl = ref('');

watchEffect(async () => {
  const currentPortfolioPage = page.value;
  const currentTemplatePageInfo = templatePage.value;

  try {
    if (currentPortfolioPage && currentPortfolioPage.bkgUrl && currentPortfolioPage.bkgUrl.trim() !== '') {
      previewUrl.value = currentPortfolioPage.bkgUrl;
    } else if (currentTemplatePageInfo && currentTemplatePageInfo.preview_oss_key) {
      const url = await getSignedPreviewUrl(currentTemplatePageInfo.preview_oss_key);
      previewUrl.value = url || '/static/images/template1.png';
    } else {
      previewUrl.value = '/static/images/template1.png';
    }
  } catch (error) {
    console.error('Failed to update preview URL:', error);
    if (currentPortfolioPage && currentPortfolioPage.bkgUrl && currentPortfolioPage.bkgUrl.trim() !== '') {
      previewUrl.value = currentPortfolioPage.bkgUrl;
    } else {
      previewUrl.value = '/static/images/template1.png';
    }
  }
});

const pageWorks = computed(() => project.value.works?.filter((w: statusType.Work) => w.page_num === page.value.pageNum) || []);
const pageTexts = computed(() => project.value.texts?.filter((t: statusType.Text) => t.page_num === page.value.pageNum) || []);

function onAddText() { portfolioStore.addText(); }
function onAddImage() { portfolioStore.addImage(); }
function onSelectElement(el: statusType.Work | statusType.Text, type: 'work' | 'text') {
  selectedElement.value = el;
}
function isSelected(el: any, type: 'work' | 'text') {
  return selectedElement.value === el && selectedType.value === type;
}
function getWorkStyle(work: any) {
  return `position:absolute;top:${work.margin_top || 0}px;left:${work.margin_left || 0}px;transform:scale(${work.scale || 1});`;
}
function getTextStyle(text: any) {
  return `position:absolute;top:${text.margin_top || 0}px;left:${text.margin_left || 0}px;font-size:${text.font_size || 16}px;`;
}
function onDeleteElement() {
  if (selectedElement.value) portfolioStore.deleteElement(selectedElement.value.uid);
  selectedElement.value = null;
}
function onToggleBleed() {
  portfolioStore.showBleed = !portfolioStore.showBleed;
}

let dragTarget: any = null;
let dragType: 'work' | 'text' | null = null;
let startX = 0, startY = 0, originTop = 0, originLeft = 0;
function onDragStart(el: any, e: MouseEvent | TouchEvent, type: 'work' | 'text') {
  dragTarget = el;
  dragType = type;
  if ('touches' in e) {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  } else {
    startX = e.clientX;
    startY = e.clientY;
  }
  originTop = el.margin_top || 0;
  originLeft = el.margin_left || 0;
}

function onDragging(e: MouseEvent | TouchEvent) {
  if (!dragTarget) return;
  let clientX = 0, clientY = 0;
  if ('touches' in e && e.touches.length) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else if ('clientX' in e) {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  const dx = clientX - startX;
  const dy = clientY - startY;
  dragTarget.margin_top = originTop + dy;
  dragTarget.margin_left = originLeft + dx;
}

function onDragEnd() {
  dragTarget = null;
  dragType = null;
}

function handleCanvasMouseMove(e: MouseEvent) {
  if (dragTarget && e.buttons === 1) { onDragging(e); }
}

function handleCanvasMouseUp(e: MouseEvent) {
  if (dragTarget) { onDragEnd(); }
}

function handleCanvasTouchMove(e: TouchEvent) {
  if (dragTarget) { onDragging(e); }
}

function handleCanvasTouchEnd(e: TouchEvent) {
  if (dragTarget) { onDragEnd(); }
}
</script>
<style scoped>
.editor { flex: 1; display: flex; flex-direction: column; background: #fff; border-radius: 12rpx; margin: 24rpx; }
.editor__toolbar { display: flex; gap: 16rpx; padding: 16rpx; border-bottom: 1rpx solid #eee; }
.editor__icon-btn {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 8rpx 18rpx;
  border-radius: 6rpx;
  background: #f6f6f6;
  color: #333;
  border: none;
  cursor: pointer;
}
.editor__icon {
  width: 32rpx;
  height: 32rpx;
  display: inline-block;
}
.editor__switch { margin-left: 16rpx; }
.editor__canvas { flex: 1; background: #f8f8f8; border-radius: 8rpx; margin: 16rpx; position: relative; min-height: 600rpx; }
.editor__bg { position: absolute; width: 100%; height: 100%; object-fit: contain; z-index: 0; }
.editor__work { position: absolute; z-index: 1; cursor: pointer; transition: box-shadow 0.2s; }
.editor__work--active { box-shadow: 0 0 0 4rpx #57DD00; }
.editor__text { position: absolute; z-index: 2; background: rgba(255,255,255,0.7); padding: 2rpx 8rpx; border-radius: 4rpx; cursor: pointer; }
.editor__text--active { box-shadow: 0 0 0 4rpx #57DD00; }
.editor__settings { padding: 16rpx; border-top: 1rpx solid #eee; background: #fafafa; display: flex; gap: 16rpx; align-items: center; }
.editor__delete { background: #ff4d4f; color: #fff; border: none; border-radius: 6rpx; padding: 8rpx 16rpx; }
</style>
