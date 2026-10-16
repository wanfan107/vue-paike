<template>
  <div class="main-layout">
    <!-- 左侧菜单 -->
    <SideMenu :collapsed="isCollapsed" />
    <!-- 右侧内容区域 -->
    <main class="main-content">
      <AppHeader :collapsed="isCollapsed" @toggle-sidebar="isCollapsed = !isCollapsed" />
      <div class="main-content-inner">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SideMenu from './SideMenu.vue'
import AppHeader from './AppHeader.vue'

const isCollapsed = ref(false)
</script>

<style scoped lang="scss">
@use '../styles/variables.scss' as *;

:deep(html),
:deep(body) {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.main-layout {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background-color: var(--color-bg);
}

.main-content-inner {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -ms-overflow-style: -ms-autohiding-scrollbar;

  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--color-divider, #d1d5db);
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: var(--text-faint, #9ca3af);
  }
}

@media (max-width: 768px) {
  .main-layout {
    flex-direction: column;
  }
}
</style>
