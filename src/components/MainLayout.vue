<template>
  <div class="main-layout">
    <!-- 左侧菜单 -->
    <SideMenu />
    <!-- 右侧内容区域 -->
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import SideMenu from './SideMenu.vue'
</script>

<style scoped lang="scss">
// 引入全局SCSS变量
@use '../styles/variables.scss' as *;

// 确保html和body占满整个视口
:deep(html),
:deep(body) {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

// 主布局容器
.main-layout {
  // 使用flex布局
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100vh; // 占满整个视口高度
  overflow: hidden; // 防止整体滚动
  
  // 添加阴影效果增强视觉层次感
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
}

// 右侧主内容区域
.main-content {
  // 占据剩余空间
  flex: 1;
  overflow-x: hidden;
  overflow-y: auto; // 只在右侧内容区域内滚动
  height: 100vh; // 固定高度，与视口一致
  
  // 确保滚动条样式统一
  -ms-overflow-style: -ms-autohiding-scrollbar;
  
  // Webkit浏览器滚动条样式
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: $background-color;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #999;
  }
}

// 响应式设计：处理小屏幕设备
@media (max-width: 768px) {
  .main-layout {
    flex-direction: column;
  }
  
  .main-content {
    height: calc(100vh - 60px); // 减去顶部导航高度
  }
}
</style>