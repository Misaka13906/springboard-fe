<template>
  <view class="editor">
    <view class="editor__toolbar">
      <view class="editor__icon-btn" @tap="onAddText">
        <img src="/static/icons/text.svg" class="editor__icon" />
      </view>
      <view class="editor__icon-btn" @tap="onAddImage">
        <img src="/static/icons/image.svg" class="editor__icon" />
      </view>
      <view 
        class="editor__toggle-btn" 
        :class="{ 'editor__toggle-btn--active': showBleed }" 
        @tap="onToggleBleed"
      >
        <text class="editor__toggle-text">{{ showBleed ? '出血线开启' : '出血线关闭' }}</text>
      </view>
    </view>
    <view class="editor__canvas" ref="canvasRef"
      :style="{ height: canvasDynamicHeight }"
      @mousemove="handleCanvasMouseMove"
      @mouseup="handleCanvasMouseUp"
      @touchmove="handleCanvasTouchMove"
      @touchend="handleCanvasTouchEnd"
    >
      <view v-if="previewUrl" class="editor__bg" :style="{ backgroundImage: 'url(' + previewUrl + ')' }"></view>
      
      <view 
        v-if="showBleed && templatePage && templatePage.bleed" 
        class="editor__bleed-line" 
        :style="getBleedLineStyle(templatePage.bleed)"
      ></view>
      
      <img
        v-for="work in pageWorks"
        :key="work.id"
        :src="work.url || '/static/images/template1.png'"
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
      <view class="editor__settings-container">
        <view class="editor__settings-title">
          {{ selectedType === 'work' ? '图片设置' : '文本设置' }}
        </view>
        
        <view class="editor__settings-form">
          <template v-if="selectedType === 'work'">
            <view class="editor__top-row">
              <view class="editor__form-group">
                <label class="editor__form-label">上边距</label>
                <view class="editor__input-with-unit">
                  <input 
                    type="number" 
                    class="editor__form-input" 
                    :value="formatNumberInput(selectedElement.margin_top, 1)" 
                    @input="updateSelectedElementMarginTop" 
                    @blur="sanitizeInput('margin_top', 1, -10000, 10000)" 
                  />
                  <text class="editor__input-unit">px</text>
                </view>
              </view>
              
              <view class="editor__form-group">
                <label class="editor__form-label">左边距</label>
                <view class="editor__input-with-unit">
                  <input 
                    type="number" 
                    class="editor__form-input" 
                    :value="formatNumberInput(selectedElement.margin_left, 1)" 
                    @input="updateSelectedElementMarginLeft" 
                    @blur="sanitizeInput('margin_left', 1, -10000, 10000)" 
                  />
                  <text class="editor__input-unit">px</text>
                </view>
              </view>
              
              <view class="editor__form-group">
                <label class="editor__form-label">缩放</label>
                <view class="editor__input-with-unit">
                  <input 
                    type="number" 
                    class="editor__form-input" 
                    :value="formatNumberInput(selectedWorkScale, 2)" 
                    @input="updateSelectedWorkScale" 
                    @blur="sanitizeInput('scale', 2, 0.01, 100)" 
                    step="0.01" 
                  />
                  <text class="editor__input-unit">×</text>
                </view>
              </view>
            </view>
          </template>
          
          <template v-else-if="selectedType === 'text'">
            <view class="editor__top-row">
              <view class="editor__form-group">
                <label class="editor__form-label">上边距</label>
                <view class="editor__input-with-unit">
                  <input 
                    type="number" 
                    class="editor__form-input" 
                    :value="formatNumberInput(selectedElement.margin_top, 1)" 
                    @input="updateSelectedElementMarginTop" 
                    @blur="sanitizeInput('margin_top', 1, -10000, 10000)" 
                  />
                  <text class="editor__input-unit">px</text>
                </view>
              </view>
              
              <view class="editor__form-group">
                <label class="editor__form-label">左边距</label>
                <view class="editor__input-with-unit">
                  <input 
                    type="number" 
                    class="editor__form-input" 
                    :value="formatNumberInput(selectedElement.margin_left, 1)" 
                    @input="updateSelectedElementMarginLeft" 
                    @blur="sanitizeInput('margin_left', 1, -10000, 10000)" 
                  />
                  <text class="editor__input-unit">px</text>
                </view>
              </view>
              
              <view class="editor__form-group">
                <label class="editor__form-label">字体大小</label>
                <view class="editor__input-with-unit">
                  <input 
                    type="number" 
                    class="editor__form-input" 
                    :value="formatNumberInput(selectedTextFontSize, 0)" 
                    @input="updateSelectedTextFontSize" 
                    @blur="sanitizeInput('font_size', 0, 1, 500)" 
                  />
                  <text class="editor__input-unit">px</text>
                </view>
              </view>
            </view>
            
            <view class="editor__form-group editor__content-row">
              <label class="editor__form-label">内容</label>
              <input 
                type="text" 
                class="editor__form-input editor__text-input" 
                v-model="(selectedElement as statusType.Text).content" 
                @blur="sanitizeTextInput" 
              />
            </view>
          </template>
        </view>
        
        <view class="editor__settings-actions">
          <button class="editor__delete-btn" @tap="onDeleteElement">
            <img src="/static/icons/delete.svg" class="editor__delete-icon" />
            <span>删除</span>
          </button>
        </view>
      </view>
    </view>
  </view>
</template>
<script setup lang="ts">
import { ref, computed, watchEffect, watch, onMounted, getCurrentInstance } from 'vue';
import { usePortfolioStore } from '@/store/portfolio';
import { getSignedPreviewUrl } from '../../../api/oss';
import { parseToNumber } from '@/utils/common'; // Import the utility function

const portfolioStore = usePortfolioStore();
const showBleed = computed({
  get: () => portfolioStore.showBleed,
  set: v => (portfolioStore.showBleed = v)
});

const canvasRef = ref();
const canvasDynamicHeight = ref('300px'); // Default height
const instance = getCurrentInstance();

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

// Helper to format numbers for input display
function formatNumberInput(value: any, decimalPlaces: number): string {
  const num = parseToNumber(value, 0, decimalPlaces);
  return num.toFixed(decimalPlaces);
}

// Update methods for inputs
function updateSelectedElementMarginTop(event: Event) {
  if (selectedElement.value) {
    const target = event.target as HTMLInputElement;
    const numValue = parseFloat(target.value);
    // Store as formatted string
    selectedElement.value.margin_top = (isNaN(numValue) ? getDefaultValue('margin_top') : numValue).toFixed(1);
  }
}
function updateSelectedElementMarginLeft(event: Event) {
  if (selectedElement.value) {
    const target = event.target as HTMLInputElement;
    const numValue = parseFloat(target.value);
    // Store as formatted string
    selectedElement.value.margin_left = (isNaN(numValue) ? getDefaultValue('margin_left') : numValue).toFixed(1);
  }
}

const selectedWorkScale = computed({
  get: () => selectedType.value === 'work' && selectedElement.value ? (selectedElement.value as statusType.Work).scale : undefined,
  set: (val) => {
    if (selectedType.value === 'work' && selectedElement.value) {
      const numValue = val;
      // Store as formatted string
      if (selectedElement.value && typeof numValue === 'number' && !isNaN(numValue)) {
        (selectedElement.value as statusType.Work).scale = numValue;
      } else if (selectedElement.value) {
        (selectedElement.value as statusType.Work).scale = getDefaultValue('scale');
      }
    }
  }
});

function updateSelectedWorkScale(event: Event) {
  const target = event.target as HTMLInputElement;
  const numValue = parseFloat(target.value);
  selectedWorkScale.value = isNaN(numValue) ? getDefaultValue('scale') : numValue;
}

const selectedTextFontSize = computed({
  get: () => selectedType.value === 'text' && selectedElement.value ? (selectedElement.value as statusType.Text).font_size : undefined,
  set: (val) => {
    if (selectedType.value === 'text' && selectedElement.value) {
      const numValue = parseFloat(val as string);
      // Store as formatted string
      (selectedElement.value as statusType.Text).font_size = (isNaN(numValue) ? getDefaultValue('font_size') : numValue).toFixed(0);
    }
  }
});

function updateSelectedTextFontSize(event: Event) {
  const target = event.target as HTMLInputElement;
  const numValue = parseFloat(target.value);
  selectedTextFontSize.value = (isNaN(numValue) ? getDefaultValue('font_size') : numValue).toFixed(0);
}

function sanitizeInput(property: 'margin_top' | 'margin_left' | 'scale' | 'font_size', decimalPlaces: number, minVal: number, maxVal: number) {
  if (!selectedElement.value) return;

  let currentValue: any;
  if (property === 'scale') {
    currentValue = (selectedElement.value as statusType.Work).scale;
  } else if (property === 'font_size') {
    currentValue = (selectedElement.value as statusType.Text).font_size;
  } else {
    currentValue = (selectedElement.value as any)[property];
  }
  
  const numericSanitizedValue = parseToNumber(currentValue, getDefaultValue(property), decimalPlaces, minVal, maxVal);
  const stringFormattedValue = numericSanitizedValue.toFixed(decimalPlaces);

  if (property === 'scale') {
    (selectedElement.value as statusType.Work).scale = parseFloat(stringFormattedValue);
  } else if (property === 'font_size') {
    (selectedElement.value as statusType.Text).font_size = stringFormattedValue;
  } else {
    (selectedElement.value as any)[property] = stringFormattedValue;
  }
}

function getDefaultValue(property: 'margin_top' | 'margin_left' | 'scale' | 'font_size'): number {
  switch (property) {
    case 'scale': return 1;
    case 'font_size': return 16;
    default: return 0;
  }
}

function sanitizeTextInput() {
  if (selectedType.value === 'text' && selectedElement.value) {
    const textElement = selectedElement.value as statusType.Text;
    if (!textElement.content || textElement.content.trim() === '') {
      textElement.content = '默认文本'; // Or some other placeholder
      uni.showToast({
        title: '文本内容不能为空，已重置为默认值',
        icon: 'none'
      });
    }
  }
}

const previewUrl = ref('');

function calculateAndSetCanvasHeight() {
  if (!instance || !instance.proxy) {
    return;
  }

  const currentTemplatePage = templatePage.value;

  const query = uni.createSelectorQuery().in(instance.proxy);
  query.select('.editor__canvas').boundingClientRect(data => {
    let canvasRect: UniApp.NodeInfo | null = null;
    if (Array.isArray(data)) {
      canvasRect = data[0];
    } else {
      canvasRect = data;
    }

    if (!canvasRect || typeof canvasRect.width === 'undefined' || canvasRect.width <= 0) {
      return;
    }
    const canvasWidth = canvasRect.width;
    if (typeof canvasWidth === 'undefined') return;

    let aspectRatio;

    if (currentTemplatePage && currentTemplatePage.width && currentTemplatePage.height) {
      const tpWidth = parseFloat(currentTemplatePage.width);
      const tpHeight = parseFloat(currentTemplatePage.height);
      if (tpWidth > 0 && tpHeight > 0) {
        aspectRatio = tpHeight / tpWidth;
        canvasDynamicHeight.value = `${Math.round(canvasWidth * aspectRatio)}px`;
        return;
      }
    }
    
    if (previewUrl.value) {
      uni.getImageInfo({
        src: previewUrl.value,
        success: (imageInfo) => {
          if (imageInfo.width > 0 && imageInfo.height > 0) {
            aspectRatio = imageInfo.height / imageInfo.width;
            canvasDynamicHeight.value = `${Math.round(canvasWidth * aspectRatio)}px`;
          }
        },
        fail: () => {}
      });
    }
  }).exec();
}

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
  const top = parseToNumber(work.margin_top, 0, 1);
  const left = parseToNumber(work.margin_left, 0, 1);
  const scale = parseToNumber(work.scale, 1, 3); // Using 3 decimal places for scale in style for precision
  return `position:absolute;top:${top}px;left:${left}px;transform:scale(${scale});`;
}
function getTextStyle(text: any) {
  const top = parseToNumber(text.margin_top, 0, 1);
  const left = parseToNumber(text.margin_left, 0, 1);
  const fontSize = parseToNumber(text.font_size, 16, 0);
  return `position:absolute;top:${top}px;left:${left}px;font-size:${fontSize}px;`;
}
function getBleedLineStyle(bleed: any) {
  console.log('Bleed data:', bleed); // 输出bleed数据用于调试
  
  if (!bleed) {
    console.log('No bleed data available');
    return '';
  }
  
  let x = 0, y = 0, width = 0, height = 0;
  
  // 检查bleed是否是数组格式 [x, y, width, height]
  if (Array.isArray(bleed) || (bleed[0] !== undefined && bleed[3] !== undefined)) {
    x = parseToNumber(bleed[0], 0);
    y = parseToNumber(bleed[1], 0);
    width = parseToNumber(bleed[2], 0);
    height = parseToNumber(bleed[3], 0);
  } 
  // 对象格式 {x,y,width,height} 或 {left,top,width,height}
  else {
    x = parseToNumber(bleed.x !== undefined ? bleed.x : bleed.left, 0);
    y = parseToNumber(bleed.y !== undefined ? bleed.y : bleed.top, 0);
    width = parseToNumber(bleed.width, 0);
    height = parseToNumber(bleed.height, 0);
  }
  
  console.log(`Bleed line style: left:${x}px; top:${y}px; width:${width}px; height:${height}px;`);
  
  return `left:${x}px;top:${y}px;width:${width}px;height:${height}px;`;
}
function onDeleteElement() {
  if (selectedElement.value) portfolioStore.deleteElement(selectedElement.value.uid);
  selectedElement.value = null;
}
function onToggleBleed() {
  portfolioStore.showBleed = !portfolioStore.showBleed;
  console.log('Toggle bleed line:', portfolioStore.showBleed);
  console.log('Template page:', templatePage.value);
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
  
  const currentOriginTop = parseToNumber(originTop, 0, 1);
  const currentOriginLeft = parseToNumber(originLeft, 0, 1);

  dragTarget.margin_top = parseToNumber(currentOriginTop + dy, 0, 1);
  dragTarget.margin_left = parseToNumber(currentOriginLeft + dx, 0, 1);
}

function onDragEnd() {
  if (dragTarget) {
    // Ensure final values are numbers from parseToNumber, then format to string with toFixed
    dragTarget.margin_top = parseToNumber(dragTarget.margin_top, 0, 1).toFixed(1);
    dragTarget.margin_left = parseToNumber(dragTarget.margin_left, 0, 1).toFixed(1);
    if (dragType === 'work' && dragTarget.scale !== undefined) {
      dragTarget.scale = parseToNumber(dragTarget.scale, 1, 2).toFixed(2);
    } else if (dragType === 'text' && dragTarget.font_size !== undefined) {
      dragTarget.font_size = parseToNumber(dragTarget.font_size, 16, 0).toFixed(0);
    }
  }
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
.editor { flex: 1; display: flex; flex-direction: column; background: #fff; border-radius: 12rpx; margin: 24rpx; box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05); }

.editor__toolbar { 
  display: flex; 
  gap: 16rpx; 
  padding: 16rpx; 
  border-bottom: 1rpx solid #eee; 
  background: #fafafa;
  border-top-left-radius: 12rpx;
  border-top-right-radius: 12rpx;
}

.editor__icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  padding: 10rpx 20rpx;
  border-radius: 6rpx;
  background: #f0f0f0;
  color: #333;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1rpx 3rpx rgba(0,0,0,0.1);
}

.editor__icon-btn:hover {
  background: #e0e0e0;
  transform: translateY(-1rpx);
  box-shadow: 0 2rpx 5rpx rgba(0,0,0,0.15);
}

.editor__icon-btn:active {
  transform: translateY(0);
  box-shadow: 0 1rpx 2rpx rgba(0,0,0,0.1);
}

.editor__icon {
  width: 32rpx;
  height: 32rpx;
  display: inline-block;
}

.editor__toggle-btn {
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10rpx 20rpx;
  border-radius: 6rpx;
  background: #f0f0f0;
  color: #333;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1rpx 3rpx rgba(0,0,0,0.1);
}

.editor__toggle-btn--active {
  background: #57DD00;
  color: #fff;
}

.editor__toggle-btn:hover {
  background: #e0e0e0;
  transform: translateY(-1rpx);
  box-shadow: 0 2rpx 5rpx rgba(0,0,0,0.15);
}

.editor__toggle-btn--active:hover {
  background: #45b800;
}

.editor__toggle-text {
  font-size: 14rpx;
}

.editor__canvas { 
  flex: 1; 
  background: #f8f8f8; 
  border-radius: 8rpx; 
  margin: 16rpx; 
  position: relative; 
  min-height: 600rpx; 
  box-shadow: inset 0 0 5rpx rgba(0,0,0,0.1);
}

.editor__bg {
  display: block;
  position: absolute;
  z-index: 0;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: top left;
  padding: 0;
  margin: 0;
  border: none;
  box-sizing: border-box;
}

.editor__work {
  position: absolute;
  z-index: 2;
  cursor: pointer;
  transition: all 0.2s ease;
  display: block;
  border-radius: 2rpx;
}

.editor__work:hover {
  box-shadow: 0 0 0 2rpx rgba(87, 221, 0, 0.3);
}

.editor__work--active { 
  box-shadow: 0 0 0 4rpx #57DD00; 
}

.editor__text { 
  position: absolute; 
  z-index: 3; 
  background: rgba(255,255,255,0.7); 
  padding: 6rpx 12rpx; 
  border-radius: 4rpx; 
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(2px);
  color: #333;
}

.editor__text:hover {
  box-shadow: 0 0 0 2rpx rgba(87, 221, 0, 0.3);
  background: rgba(255,255,255,0.8);
}

.editor__text--active { 
  box-shadow: 0 0 0 4rpx #57DD00; 
  background: rgba(255,255,255,0.9);
}

.editor__bleed-line {
  position: absolute;
  z-index: 1; /* 在背景上层，在内容下层 */
  border: 2px dashed rgba(100, 100, 100, 0.8); /* 加粗边框并增加不透明度 */
  background-color: rgba(200, 200, 200, 0.2); /* 增加背景不透明度 */
  pointer-events: none; /* 让鼠标事件穿透，不影响拖拽等操作 */
}

.editor__settings { 
  padding: 20rpx; 
  border-top: 1rpx solid #eee; 
  background: #fafafa;
  border-bottom-left-radius: 12rpx;
  border-bottom-right-radius: 12rpx;
}

.editor__settings-container { 
  display: flex; 
  flex-direction: column; 
  gap: 20rpx; 
  max-width: 100%;
}

.editor__settings-title { 
  font-size: 28rpx; 
  font-weight: bold; 
  color: #333;
  padding-bottom: 8rpx;
  border-bottom: 1rpx solid #eee;
}

.editor__settings-form { 
  display: flex; 
  flex-direction: column; 
  gap: 20rpx;
  width: 100%;
}

.editor__top-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20rpx;
  width: 100%;
}

.editor__content-row {
  width: 100%;
  margin-top: 8rpx;
}

.editor__form-group { 
  display: flex; 
  flex-direction: column; 
  gap: 8rpx;
}

.editor__form-label { 
  font-size: 24rpx; 
  color: #666;
  font-weight: 500;
}

.editor__input-with-unit { 
  display: flex; 
  align-items: center; 
  position: relative;
  width: 100%;
}

.editor__form-input { 
  flex: 1; 
  padding: 14rpx 16rpx; 
  border: 1rpx solid #ddd; 
  border-radius: 6rpx;
  font-size: 24rpx;
  transition: all 0.3s ease;
  background: white;
  width: 100%;
  box-shadow: inset 0 1rpx 3rpx rgba(0,0,0,0.05);
}

.editor__form-input:focus {
  border-color: #57DD00;
  box-shadow: 0 0 0 2rpx rgba(87, 221, 0, 0.2);
  outline: none;
}

.editor__input-unit { 
  font-size: 22rpx; 
  color: #999;
  margin-left: -28rpx;
  pointer-events: none;
}

.editor__text-input {
  width: 100%;
  min-width: 240rpx;
}

.editor__settings-actions { 
  display: flex; 
  justify-content: flex-end;
  margin-top: 8rpx;
}

.editor__delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  background: #ff4d4f;
  color: #fff;
  border: none;
  border-radius: 6rpx;
  padding: 12rpx 24rpx;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 24rpx;
  box-shadow: 0 2rpx 5rpx rgba(255,77,79,0.3);
}

.editor__delete-btn:hover {
  background: #ff7875;
  transform: translateY(-1rpx);
  box-shadow: 0 4rpx 8rpx rgba(255,77,79,0.4);
}

.editor__delete-btn:active {
  background: #f5222d;
  transform: translateY(1rpx);
  box-shadow: 0 1rpx 3rpx rgba(255,77,79,0.4);
}

.editor__delete-icon { 
  width: 24rpx; 
  height: 24rpx;
  filter: brightness(5);
}

@media (max-width: 768px) {
  .editor__top-row {
    grid-template-columns: repeat(3, 1fr);
    gap: 12rpx;
  }
}

@media (max-width: 480px) {
  .editor__top-row {
    grid-template-columns: 1fr;
  }
}
</style>
