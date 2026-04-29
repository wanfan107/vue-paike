<template>
  <div class="page-container">
    <header class="page-header">
      <h1>接口文档</h1>
      <hr />
    </header>

    <main class="page-content">
      <div class="content-wrapper">
        <!-- 始终渲染iframe，通过v-show控制显示 -->
        <iframe
          id="child"
          src="https://s.apifox.cn/729a5437-e2e0-423a-b359-c2c52127d873?pwd=univepay"
          style="width: 100%; height:100vh; border: none;"
          frameborder="0"
          allowtransparency="true"
          @load="handleIframeLoad"
          @error="handleIframeError"
          v-show="isIframeLoaded"
        ></iframe>
        
        <!-- 加载中显示 -->
        <div class="loading-container" v-if="isLoading">
          <el-skeleton :rows="10" animated />
        </div>
        
        <!-- 备用内容 -->
        <div class="fallback-content" v-if="!isLoading && !isIframeLoaded">
          <el-card class="fallback-card">
            <div class="fallback-header">
              <el-icon class="fallback-icon"><Document /></el-icon>
              <h2>接口文档加载失败</h2>
            </div>
            <div class="fallback-body">
              <p>当前接口文档暂时无法访问，请尝试以下操作：</p>
              <ul class="fallback-list">
                <li>检查网络连接</li>
                <li>刷新页面重试</li>
                <li>联系管理员获取帮助</li>
              </ul>
              <div class="fallback-actions">
                <el-button type="primary" @click="reloadIframe">重新加载</el-button>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Document } from '@element-plus/icons-vue';

// 加载状态
const isLoading = ref(true);
const isIframeLoaded = ref(false);

// 处理iframe加载完成
const handleIframeLoad = () => {
  isLoading.value = false;
  isIframeLoaded.value = true;
};

// 处理iframe加载错误
const handleIframeError = () => {
  isLoading.value = false;
  isIframeLoaded.value = false;
};

// 重新加载iframe
const reloadIframe = () => {
  isLoading.value = true;
  isIframeLoaded.value = false;
  // 重新加载iframe
  const iframe = document.getElementById('child');
  if (iframe) {
    iframe.src = iframe.src;
  }
};

// 组件挂载后开始检测
onMounted(() => {
  // 10秒后如果iframe仍未加载成功，显示备用内容
  setTimeout(() => {
    if (isLoading.value) {
      isLoading.value = false;
      isIframeLoaded.value = false;
    }
  }, 10000);
});
</script>
<style scoped lang="scss">
@use "../../styles/variables.scss" as *;

.page-container {
  background-color: #fff;
  border-radius: 24px;
  margin: $spacing-lg;
}

.page-header {
  padding: $spacing-lg;
  h1 {
    margin: 0;
    font-size: $font-size-xl;
    color: $text-color;
  }
  hr {
    text-size-adjust: 100%;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizelegibility;
    color-scheme: light;
    font-feature-settings: "kern";
    font-family: "Geist Sans", sans-serif;
    line-height: 1.5;
    overflow-wrap: break-word;
    margin: 0px;
    box-sizing: content-box;
    height: 0px;
    overflow: visible;
    opacity: 0.2;
    border-width: 0px 0px 1px;
    border-image: initial;
    border-color: inherit;
    border-style: solid;
    width: 100%;
  }
}

.page-content {
  padding: $spacing-lg;
}

.content-wrapper {
  background-color: white;
  border-radius: $border-radius-md;
  min-height: 600px;
  overflow: hidden;
}

/* 加载中样式 */
.loading-container {
  padding: $spacing-xl;
}

/* 备用内容样式 */
.fallback-content {
  padding: $spacing-xl;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 500px;
}

.fallback-card {
  width: 100%;
  max-width: 600px;
  border-radius: $border-radius-md;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.fallback-header {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  margin-bottom: $spacing-lg;
  padding-bottom: $spacing-md;
  border-bottom: 1px solid #ebeef5;
}

.fallback-icon {
  font-size: 48px;
  color: $primary-color;
}

.fallback-header h2 {
  margin: 0;
  font-size: $font-size-xl;
  color: $text-color;
}

.fallback-body {
  text-align: center;
  color: $text-color-secondary;
}

.fallback-body p {
  margin-bottom: $spacing-lg;
  font-size: $font-size-base;
}

.fallback-list {
  text-align: left;
  margin-bottom: $spacing-xl;
  padding-left: $spacing-xl;
  font-size: $font-size-base;
}

.fallback-list li {
  margin-bottom: $spacing-sm;
  line-height: 1.6;
}

.fallback-actions {
  display: flex;
  justify-content: center;
  gap: $spacing-md;
}

/* 其他样式 */
.balance-info {
  font-weight: 500;
  color: $primary-color;
}

.notification-icon {
  font-size: $font-size-large;
  cursor: pointer;
  position: relative;
}

.search-container {
  display: flex; 
  align-items: center; 
  justify-content: center; 
  gap: 12px;
  margin-bottom: $spacing-lg;
  input{
    border-radius: 24px !important;
  }
}
</style>
