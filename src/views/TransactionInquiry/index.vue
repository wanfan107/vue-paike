<template>
  <div class="app-page">
    <header class="app-page-header">
      <h1>{{ title }}</h1>
    </header>

    <main>
        <div class="search-panel">
          <el-form :inline="false" class="search-form">
            <el-form-item>
              <el-input
                v-model="input"
                placeholder="请输入系统单、客户订单号查询、银行单号查询"
                clearable
                style="width: 400px"
                @keyup.enter="handleSearch"
              />
            </el-form-item>
            <el-form-item class="search-actions">
              <el-button type="primary" :icon="Search" @click="handleSearch">
                搜索
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="empty-state" v-if="datalist.length==0">
          <div class="empty-icon">📋</div>
          <h2>{{ title }}</h2>
          <p>请输入搜索条件</p>
        </div>
        <div class="empty-state" v-else>
          <!-- 这里显示搜索结果 -->
        </div>
    </main>
  </div>
</template>

<script setup>
import { Search } from "@element-plus/icons-vue";
import { ref } from 'vue';
import { ElMessage } from 'element-plus';

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

.empty-state {
  text-align: center;
  padding: $spacing-xl;
  color: var(--text-secondary, #666);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: $spacing-lg;
  opacity: 0.5;
}

.empty-state h2 {
  margin: 0 0 $spacing-sm 0;
  font-size: $font-size-xl;
  color: var(--text-primary, #18181b);
}

.empty-state p {
  margin: 0;
  font-size: $font-size-base;
}
</style>
