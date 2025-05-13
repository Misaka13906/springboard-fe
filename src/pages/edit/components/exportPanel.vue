<template>
  <view class="export-panel">
    <view class="export-panel__header">
      <span>导出设置</span>
      <view class="export-panel__close" @tap="$emit('close')">×</view>
    </view>
    <view class="export-panel__body">
      <view class="export-panel__input-group">
        <view class="export-panel__input-label">文件名</view>
        <input class="export-panel__input" placeholder="请输入文件名" />
      </view>
      <view class="export-panel__input-group">
        <view class="export-panel__input-label">尺寸选择</view>
        <picker class="export-panel__picker" :range="['A4', 'A3', '自定义']">
          <view class="export-panel__picker-value">请选择尺寸</view>
        </picker>
      </view>
      <view class="export-panel__input-group">
        <view class="export-panel__input-label">颜色模式</view>
        <radio-group class="export-panel__radio-group">
          <label class="export-panel__radio"><radio value="color" />彩色</label>
          <label class="export-panel__radio"><radio value="bw" />黑白</label>
        </radio-group>
      </view>
      <view class="export-panel__types">
        <view class="export-panel__type">
          <image src="/static/icons/pdf.png" mode="aspectFit" />
        </view>
        <view class="export-panel__type">
          <image src="/static/icons/ppt.png" mode="aspectFit" />
        </view>
        <view class="export-panel__type">
          <image src="/static/icons/jpg.png" mode="aspectFit" />
        </view>
      </view>
    </view>
    <view class="export-panel__footer">
      <button class="export-panel__export" @tap="$emit('export')">导出</button>
      <button class="export-panel__save" @tap="$emit('save')">保存到云端</button>
    </view>
  </view>
</template>
<script setup lang="ts">
</script>
<style scoped>
.export-panel {
  position: fixed;
  right: 0;
  bottom: 0;
  width: 100%;
  background: #fff;
  box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.10);
  border-radius: 40rpx 40rpx 0 0;
  z-index: 100;
  overflow: hidden;
}
.export-panel__header {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 36rpx 32rpx 0 32rpx;
  font-size: 36rpx;
  color: #222;
  z-index: 2;
}
.export-panel__close {
  background: none;
  border: none;
  font-size: 48rpx;
  color: #222;
  cursor: pointer;
  line-height: 1;
}
.export-panel__body {
  margin-top: 24rpx;
  padding: 48rpx 32rpx 32rpx 32rpx;
}
.export-panel__types {
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 16rpx;
}
.export-panel__type {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx 0 24rpx 0;
  border-radius: 24rpx;
  background: #fff;
  font-size: 28rpx;
  color: #222;
  cursor: pointer;
  transition: border 0.2s;
}
.export-panel__type image {
  width: 64rpx;
  height: 64rpx;
  margin-bottom: 12rpx;
}
.export-panel__type span {
  font-size: 28rpx;
  color: #222;
}
.export-panel__input-group {
  margin-top: 32rpx;
}
.export-panel__input-label {
  font-size: 28rpx;
  color: #222;
  margin-bottom: 12rpx;
}
.export-panel__input {
  width: 100%;
  padding: 20rpx 24rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  background: #f7f8fa;
  margin-bottom: 8rpx;
}
.export-panel__picker {
  width: 100%;
  padding: 20rpx 24rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  background: #f7f8fa;
}
.export-panel__picker-value {
  color: #888;
}
.export-panel__radio-group {
  display: flex;
  flex-direction: row;
  gap: 40rpx;
  margin-top: 8rpx;
}
.export-panel__radio {
  font-size: 28rpx;
  color: #222;
  display: flex;
  align-items: center;
}
.export-panel__footer {
  padding: 32rpx 32rpx 40rpx 32rpx;
  border-top: none;
  flex-direction: row;
}
.export-panel__export {
  padding: 24rpx 0;
  border-radius: 16rpx;
  background: linear-gradient(90deg, #57DD00 0%, #4ACF00 100%);
  color: #fff;
  border: none;
  font-size: 36rpx;
  font-weight: bold;
  box-shadow: 0 4rpx 16rpx rgba(87,221,0,0.10);
}
.export-panel__save {
  padding: 24rpx 0;
  border-radius: 16rpx;
  background: linear-gradient(90deg, #57DD00 0%, #4ACF00 100%);
  color: #fff;
  border: none;
  font-size: 36rpx;
  font-weight: bold;
  box-shadow: 0 4rpx 16rpx rgba(87,221,0,0.10);
}
</style>
