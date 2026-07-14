<template>
  <div class="page-container">
    <header class="page-header">
      <h1>{{ title }}</h1>
      <hr />
    </header>

    <main class="page-content">
      <div class="content-wrapper">
        <div class="search-container">
          <el-input
            v-model="input"
            placeholder="请输入系统单、客户订单号查询、银行单号查询"
            clearable
            @keyup.enter="handleSearch"
          />
          <el-button 
            type="primary" 
            :icon="Search" 
            round 
            @click="handleSearch"
          >
            搜索
          </el-button>
        </div>
        <div class="empty-state" v-if="datalist.length==0">
          <div class="empty-icon">📋</div>
          <h2>{{ title }}</h2>
          <p>请输入搜索条件</p>
        </div>
        <div class="empty-state" v-else>
          <!-- 这里显示搜索结果 -->
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { Search } from "@element-plus/icons-vue";
import { ref } from 'vue';

// 银行页面
const props = defineProps({
  title: {
    type: String,
    default: "交易搜索",
  },
});

let datalist = [];
const input = ref('');

const handleSearch = () => {
  if (!input.value.trim()) {
    ElMessage.warning('请输入搜索条件');
    return;
  }
  // 实现搜索逻辑
  // fetchSearchResults();
};
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

.balance-info {
  font-weight: 500;
  color: $primary-color;
}

.notification-icon {
  font-size: $font-size-large;
  cursor: pointer;
  position: relative;
}

.page-content {
  padding: $spacing-lg;
}

.content-wrapper {
  background-color: white;
  padding: $spacing-xl;
  border-radius: $border-radius-md;
  // box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.empty-state {
  text-align: center;
  padding: $spacing-xl;
  color: #666;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: $spacing-lg;
  opacity: 0.5;
}

.empty-state h2 {
  margin: 0 0 $spacing-sm 0;
  font-size: $font-size-xl;
  color: $text-color;
}

.empty-state p {
  margin: 0;
  font-size: $font-size-base;
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
