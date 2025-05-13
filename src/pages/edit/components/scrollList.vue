<template>
  <view class="scroll-list">
    <!-- 项目列表 -->
    <scroll-view class="scroll-list__projects" scroll-x show-scrollbar="false">
      <view class="scroll-list__list">
        <template v-for="(project, pIdx) in projects" :key="project.uid || pIdx">
          <!-- Conditionally render Add Project button BEFORE the '封底' project -->
          <template v-if="project.readonly && project.order === MAX_ORDER">
            <view class="scroll-list__item scroll-list__add-btn" @tap="onAddProject">
              <view class="scroll-list__thumb scroll-list__add-placeholder">
                <text class="scroll-list__add-icon">+</text>
              </view>
              <text class="scroll-list__name">添加项目</text>
            </view>
          </template>

          <!-- Render the project item -->
          <view
            :ref="el => projectItemRefs[pIdx] = el as any"
            :class="[
              'scroll-list__item',
              { 'scroll-list__item--active': pIdx === activeProjectIndex },
              { 'scroll-list__item--hidden': project.hidden },
              { 'scroll-list__item--dragging': draggingProject === pIdx },
              { 'scroll-list__item--dragover': dragOverProject === pIdx && pIdx !== draggingProject }
            ]"
            @tap="handleProjectInteraction(pIdx)"
            @mousedown="onProjectDragStart(pIdx, $event)"
          >
            <view v-if="preselectProjectIndex === pIdx" class="scroll-list__delete-btn" @tap.stop="onRemoveProject(pIdx)">
              <image src="/static/icons/delete.svg" class="scroll-list__delete-icon" />
            </view>
            <pageThumbnail
              :projectIndex="pIdx"
              :pageIndex="0"
              width="160rpx"
              height="100rpx"
            />
            <view class="scroll-list__name-row">
              <view class="scroll-list__eye-btn" @tap.stop="onToggleProjectHide(pIdx)">
                <image :src="project.hidden ? '/static/icons/eye-close.svg' : '/static/icons/eye.svg'" class="scroll-list__eye-icon" />
              </view>
              <input
                v-if="editProjectIndex === pIdx"
                class="scroll-list__name-edit"
                v-model="editProjectValue"
                @blur="onEditProjectNameBlur(pIdx)"
                @keyup.enter="onEditProjectNameBlur(pIdx)"
                maxlength="10"
                focus
              />
              <text v-else class="scroll-list__name" @tap="onEditProjectName(pIdx)">{{ project.name }}</text>
            </view>
          </view>
        </template>

        <!-- Fallback: If no '封底' project (or projects array is empty), add button goes at the end -->
        <template v-if="!projects.length || !projects.some(p => (p as statusType.Project).readonly && (p as statusType.Project).order === MAX_ORDER)">
          <view class="scroll-list__item scroll-list__add-btn" @tap="onAddProject">
            <view class="scroll-list__thumb scroll-list__add-placeholder">
              <text class="scroll-list__add-icon">+</text>
            </view>
            <text class="scroll-list__name">添加项目</text>
          </view>
        </template>
      </view>
    </scroll-view>
    <!-- 页面列表 -->
    <scroll-view class="scroll-list__pages" scroll-x show-scrollbar="false">
      <view class="scroll-list__list">
        <view
          v-for="(page, pageIdx) in pages"
          :key="page.pageNum || pageIdx"
          :ref="el => pageItemRefs[pageIdx] = el as any"
          :class="[
            'scroll-list__item',
            { 'scroll-list__item--active': pageIdx === activePageIndex },
            { 'scroll-list__item--dragging': draggingPage === pageIdx },
            { 'scroll-list__item--dragover': dragOverPage === pageIdx && pageIdx !== draggingPage }
          ]"
          @tap="handlePageInteraction(pageIdx)"
          @mousedown="onPageDragStart(pageIdx, $event)"
        >
          <view v-if="preselectPageNum === page.pageNum" class="scroll-list__delete-btn" @tap.stop="onRemovePage(pageIdx)">
            <image src="/static/icons/delete.svg" class="scroll-list__delete-icon" />
          </view>
          <pageThumbnail
            :projectIndex="activeProjectIndex"
            :pageIndex="pageIdx"
            width="160rpx"
            height="100rpx"
          />
        </view>
        <view class="scroll-list__item scroll-list__add-btn" @tap="onAddPage">
          <view class="scroll-list__thumb scroll-list__add-placeholder">
            <text class="scroll-list__add-icon">+</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { usePortfolioStore } from '@/store/portfolio';
import pageThumbnail from './pageThumbnail.vue';
const portfolioStore = usePortfolioStore();
const MAX_ORDER = 100; // Define MAX_ORDER for template logic

const projects = computed(() => portfolioStore.portfolio?.projects || []);
const activeProjectIndex = computed(() => portfolioStore.currentProjectIndex);
const pages = computed(() => projects.value[activeProjectIndex.value]?.pages || []);
const activePageIndex = computed(() => portfolioStore.currentPageNum);

// 预选择状态与 store 联动
const preselectProjectIndex = computed({
  get: () => portfolioStore.preselectProjectIndex,
  set: (val) => portfolioStore.setPreselectProjectIndex(val)
});
const preselectPageNum = computed({
  get: () => portfolioStore.preselectPageNum,
  set: (val) => portfolioStore.setPreselectPageNum(val)
});

const editProjectIndex = ref(-1);
const editProjectValue = ref('');

// 新增：用于检测双击的状态变量
const lastProjectTap = { time: 0, index: -1 };
const DOUBLE_CLICK_THRESHOLD = 300; // 双击时间阈值，单位毫秒

// 新增：用于检测页面双击的状态变量
const lastPageTap = { time: 0, index: -1 };

// 替换 onProjectClick 和 onProjectDblClick
function handleProjectInteraction(idx: number) {
  const currentTime = Date.now();
  const isTrueDoubleClick = lastProjectTap.index === idx && currentTime - lastProjectTap.time < DOUBLE_CLICK_THRESHOLD;
  const isClickOnPreselected = preselectProjectIndex.value === idx;

  if (isTrueDoubleClick || isClickOnPreselected) {
    // 检测为双击或点击已预选的项目
    portfolioStore.selectProject(idx);
    preselectProjectIndex.value = null; // 清除预选择状态

    // 重置点击记录，避免影响下一次真正的双击判断
    lastProjectTap.time = 0;
    lastProjectTap.index = -1;
  } else {
    // 检测为单击 (且未点中已预选项目)
    preselectProjectIndex.value = idx; // 设置预选择状态
    preselectPageNum.value = null;    // 清除页面预选择

    // 记录本次单击，用于可能的下一次双击判断
    lastProjectTap.time = currentTime;
    lastProjectTap.index = idx;
  }
}

function onRemoveProject(idx: number) {
  uni.showModal({
    title: '确认删除',
    content: '该操作会删除项目中所有作品，确定要删除该项目吗？',
    success: function (res) {
      if (res.confirm) {
        portfolioStore.removeProject(idx);
        preselectProjectIndex.value = null;
      }
    }
  });
}
function onEditProjectName(idx: number) { editProjectIndex.value = idx; editProjectValue.value = projects.value[idx].name; }
function onEditProjectNameBlur(idx: number) { portfolioStore.editProjectName({ index: idx, name: editProjectValue.value }); editProjectIndex.value = -1; }
function onToggleProjectHide(idx: number) { portfolioStore.toggleProjectHide(idx); }

// 拖动排序相关
const draggingProject = ref(-1);
const dragOverProject = ref(-1);
const potentialDropTargetProjectIndex = ref(-1);
const projectItemRefs = ref<any[]>([]);

watch(() => projects.value.length, () => { projectItemRefs.value = [] });

function onProjectDragStart(idx: number, event: MouseEvent) {
  const project = projects.value[idx];
  if (!project || project.readonly) return;

  draggingProject.value = idx;
  projectItemRefs.value = projectItemRefs.value.filter(Boolean);

  document.addEventListener('mousemove', onProjectDragging);
  document.addEventListener('mouseup', onProjectDragEnd);
  event.preventDefault();
}

function onProjectDragging(event: MouseEvent) {
  if (draggingProject.value === -1) return;

  const currentX = event.clientX;
  let calculatedTargetIndex = -1;

  for (let i = 0; i < projectItemRefs.value.length; i++) {
    if (i === draggingProject.value) continue;
    const targetElement = projectItemRefs.value[i];
    if (!targetElement || !targetElement.getBoundingClientRect) continue;

    const rect = targetElement.getBoundingClientRect();
    const midpoint = rect.left + rect.width / 2;

    if (currentX < midpoint) {
      calculatedTargetIndex = i;
      break;
    } else {
      calculatedTargetIndex = i + 1;
    }
  }

  if (calculatedTargetIndex !== -1) {
    potentialDropTargetProjectIndex.value = calculatedTargetIndex;
    if (calculatedTargetIndex !== draggingProject.value) {
      dragOverProject.value = calculatedTargetIndex;
    } else {
      dragOverProject.value = -1;
    }
  } else {
    potentialDropTargetProjectIndex.value = -1;
    dragOverProject.value = -1;
  }
}

function onProjectDragEnd() {
  if (draggingProject.value !== -1 && potentialDropTargetProjectIndex.value !== -1) {
    const fromIndex = draggingProject.value;
    const toIndex = potentialDropTargetProjectIndex.value;

    if (fromIndex !== toIndex) {
      portfolioStore.moveProject({ from: fromIndex, to: toIndex });
    }
  }
  draggingProject.value = -1;
  dragOverProject.value = -1;
  potentialDropTargetProjectIndex.value = -1;
  document.removeEventListener('mousemove', onProjectDragging);
  document.removeEventListener('mouseup', onProjectDragEnd);
}

function onAddProject() { portfolioStore.addProject(); }

// 页面相关
const draggingPage = ref(-1);
const dragOverPage = ref(-1);
const potentialDropTargetPageIndex = ref(-1);
const pageItemRefs = ref<any[]>([]);

watch(() => pages.value.length, () => { pageItemRefs.value = [] });

function onPageDragStart(idx: number, event: MouseEvent) {
  draggingPage.value = idx;
  pageItemRefs.value = pageItemRefs.value.filter(Boolean);

  document.addEventListener('mousemove', onPageDragging);
  document.addEventListener('mouseup', onPageDragEnd);
  event.preventDefault();
}

function onPageDragging(event: MouseEvent) {
  if (draggingPage.value === -1) return;

  const currentX = event.clientX;
  let calculatedTargetIndex = -1;

  for (let i = 0; i < pageItemRefs.value.length; i++) {
    if (i === draggingPage.value) continue;
    const targetElement = pageItemRefs.value[i];
    if (!targetElement || !targetElement.getBoundingClientRect) continue;

    const rect = targetElement.getBoundingClientRect();
    const midpoint = rect.left + rect.width / 2;

    if (currentX < midpoint) {
      calculatedTargetIndex = i;
      break;
    } else {
      calculatedTargetIndex = i + 1;
    }
  }

  if (calculatedTargetIndex !== -1) {
    potentialDropTargetPageIndex.value = calculatedTargetIndex;
    if (calculatedTargetIndex !== draggingPage.value) {
      dragOverPage.value = calculatedTargetIndex;
    } else {
      dragOverPage.value = -1;
    }
  } else {
    potentialDropTargetPageIndex.value = -1;
    dragOverPage.value = -1;
  }
}

function onPageDragEnd() {
  if (draggingPage.value !== -1 && potentialDropTargetPageIndex.value !== -1) {
    const fromIndex = draggingPage.value;
    const toIndex = potentialDropTargetPageIndex.value;

    if (fromIndex !== toIndex) {
      portfolioStore.movePage({ from: fromIndex, to: toIndex });
    }
  }
  draggingPage.value = -1;
  dragOverPage.value = -1;
  potentialDropTargetPageIndex.value = -1;
  document.removeEventListener('mousemove', onPageDragging);
  document.removeEventListener('mouseup', onPageDragEnd);
}

function handlePageInteraction(idx: number) {
  const currentTime = Date.now();
  const isTrueDoubleClick = lastPageTap.index === idx && currentTime - lastPageTap.time < DOUBLE_CLICK_THRESHOLD;
  const currentPageNum = pages.value[idx]?.pageNum;
  const isClickOnPreselected = preselectPageNum.value === currentPageNum;

  if (isTrueDoubleClick || isClickOnPreselected) {
    portfolioStore.selectPage(idx);
    preselectPageNum.value = null;
    lastPageTap.time = 0;
    lastPageTap.index = -1;
  } else {
    preselectPageNum.value = currentPageNum;
    preselectProjectIndex.value = null;
    lastPageTap.time = currentTime;
    lastPageTap.index = idx;
  }
}

function onRemovePage(idx: number) {
  uni.showModal({
    title: '确认删除',
    content: '该操作会删除页面中所有作品，确定要删除该页面吗？',
    success: function (res) {
      if (res.confirm) {
        portfolioStore.removePage(idx);
        preselectPageNum.value = null;
      }
    }
  });
}
function onAddPage() { portfolioStore.addPage(); }
</script>
<style scoped>
.scroll-list {
  background-color: #fff;
  padding: 15rpx 20rpx;
  white-space: nowrap;
  box-shadow: 0 2rpx 5rpx rgba(0, 0, 0, 0.05);
}
.scroll-list__list {
  display: inline-flex;
  gap: 20rpx;
}
.scroll-list__item {
  position: relative;
  display: inline-block;
  text-align: center;
  padding: 10rpx;
  border-radius: 8rpx;
  border: 3rpx solid transparent;
  background: #fff;
}
.scroll-list__item--hidden {
  opacity: 0.5;
}
.scroll-list__item--active {
  border-color: #57DD00;
  position: relative;
  z-index: 2;
}
.scroll-list__item--dragover {
  border-color: #57DD00;
  opacity: 0.7;
}
.scroll-list__item--dragging {
  opacity: 0.5;
}
.scroll-list__thumb {
  background-color: #e0e0e0;
  border-radius: 8rpx;
  margin-bottom: 8rpx;
  width: 160rpx;
  height: 100rpx;
}
.scroll-list__name-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  min-height: 32rpx;
  /* 保证编辑时高度不变 */
}
.scroll-list__name {
  font-size: 24rpx;
  color: #555;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120rpx;
  min-width: 120rpx;
  height: 32rpx;
  line-height: 32rpx;
  box-sizing: border-box;
}
.scroll-list__item--active .scroll-list__name {
  color: #333;
  font-weight: bold;
}
.scroll-list__delete-btn {
  position: absolute;
  top: 0; right: 0;
  z-index: 2;
  width: 20rpx; height: 20rpx;
  display: flex; align-items: center; justify-content: center;
  /* transform: translate(0, -50%); */
}
.scroll-list__delete-icon {
  width: 20rpx; height: 20rpx;
  filter: none;
  color: #888;
}
.scroll-list__eye-btn {
  position: static;
  width: 28rpx; height: 28rpx;
  display: flex; align-items: center; justify-content: center;
}
.scroll-list__eye-icon {
  width: 28rpx; height: 28rpx;
}
.scroll-list__name-edit {
  font-size: 24rpx;
  color: #333;
  border: 1px solid #57DD00;
  border-radius: 6rpx;
  padding: 2rpx 8rpx;
  width: 120rpx;
  min-width: 120rpx;
  height: 32rpx;
  line-height: 32rpx;
  box-sizing: border-box;
  background: #fff;
}
.scroll-list__add-btn {
  cursor: pointer;
}
.scroll-list__add-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #d0d0d0;
}
.scroll-list__add-icon {
  font-size: 40rpx;
  color: #fff;
  font-weight: bold;
}
</style>
