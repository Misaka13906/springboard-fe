<template>
  <!-- Removed uni-popup wrapper -->
  <view class="tips-popup-content">
    <text class="tips-title">{{ currentTipPage.title }}</text>
    <view class="tips-body">
      <view v-for="(paragraph, index) in currentTipPage.paragraphs" :key="index">
        <text>{{ paragraph }}</text>
      </view>
    </view>
    <view class="tips-footer">
      <text class="pagination-arrow" @click="prevPage">{{ '<' }}</text>
      <text class="pagination-text">{{ currentPage }} / {{ totalPages }}</text>
      <text class="pagination-arrow" @click="nextPage">{{ '>' }}</text>
    </view>
  </view>
    <view class="close-button-wrapper">
      <!-- Call the internal closePopup method -->
      <view class="close-button" @click="closePopup">
        <!-- Removed the text element -->
      </view>
    </view>
</template>

<script setup lang="ts">
import { ref, computed, defineEmits } from 'vue'; // Added defineEmits
import { portfolioTips, type TipPage } from '@/constants/tips';

// Define emits
const emit = defineEmits(['close']);

// Removed tipsPopupRef as uni-popup is gone
const currentPage = ref(1);
const totalPages = ref(portfolioTips.length);

const currentTipPage = computed<TipPage>(() => {
  if (portfolioTips.length === 0) return { title: '', paragraphs: [] };
  const index = Math.max(0, Math.min(currentPage.value - 1, portfolioTips.length - 1));
  return portfolioTips[index];
});

// Methods
const open = () => {
  currentPage.value = 1; // Reset to first page when opening
  // This method might still be useful if parent needs to trigger internal state reset
};

const closePopup = () => {
  // Emit close event instead of calling uni-popup's close
  emit('close');
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

// Expose only necessary methods
defineExpose({
  open // Keep open for potential state reset
});
</script>

<style scoped>
/* Restore original styles, potentially adjusting width/height/margins */
.tips-popup-content {
  background-color: #fff;
  padding: 40rpx;
  border-radius: 16rpx;
  width: 600rpx; /* Or use vw/vh or max-width */
  max-width: 90vw;
  box-sizing: border-box;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  /* Fixed height and flex properties */
  /* Change height from vh to rpx */
  height: 640rpx; /* Adjust this value as needed */
  max-height: 800rpx; /* Adjust this value as needed */
  display: flex;
  flex-direction: column;
  /* Removed position/top/left/transform as parent handles centering */
}

.tips-title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  text-align: center;
  margin-bottom: 30rpx;
  color: #333;
  flex-shrink: 0;
}

.tips-body {
  font-size: 28rpx;
  line-height: 1.6;
  color: #555;
  flex: 1; /* Takes remaining space */
  overflow-y: scroll;
  margin-bottom: 20rpx; /* Space before footer */
  min-height: 0; /* Important for flex + overflow */
}

.tips-body text {
  display: block;
  margin-bottom: 1em;
}

.tips-body text:last-child {
  margin-bottom: 0;
}

.tips-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
}

.pagination-arrow {
  font-size: 40rpx;
  color: #999;
  padding: 10rpx 20rpx;
  cursor: pointer;
}

.pagination-text {
  font-size: 28rpx;
  color: #666;
  margin: 0 20rpx;
}

.close-button-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  margin-top: 20rpx; /* Add some space above the button */
}

.close-button {
  width: 60rpx; /* Slightly smaller */
  height: 60rpx;
  border-radius: 50%;
  /* Lighter background */
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  /* Remove border or make it subtle */
  border: none;
  /* Softer shadow */
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: background-color 0.2s ease;
  position: relative; /* Needed for pseudo-elements */
}

.close-button:active {
  background-color: rgba(0, 0, 0, 0.65); /* Darken on press */
}

/* Add pseudo-elements for the cross */
.close-button::before,
.close-button::after {
  content: '';
  position: absolute;
  width: 50%; /* Adjust width of the lines */
  height: 4rpx; /* Adjust thickness of the lines */
  background-color: #fff; /* Color of the lines */
  top: 50%;
  left: 50%;
}

.close-button::before {
  transform: translate(-50%, -50%) rotate(45deg);
}

.close-button::after {
  transform: translate(-50%, -50%) rotate(-45deg);
}
</style>
