

<template>
  <div class="app-container">
    <!-- 直接渲染路由出口，布局逻辑由路由配置控制 -->
    <router-view />
  </div>
</template>
<script setup>
// App.vue简化为只负责渲染路由出口
// 所有布局逻辑移至MainLayout组件和路由配置
</script>

<style lang="scss">
// 引入全局样式文件
@use './styles/global.scss';
</style>

<style scoped lang="scss">
// 引入全局SCSS变量
@use './styles/variables.scss' as *;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: $font-family;
  background-color: $background-color;
  color: $text-color;
  margin: 0;
  padding: 0;
  // 确保在IE和旧浏览器中的兼容性
  -webkit-text-size-adjust: 100%;
  -ms-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

.app-container {
  width: 100%;
  min-height: 100vh;
  background-color: $background-color;
  overflow: hidden;
}

</style>
