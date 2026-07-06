<template>
  <div class="page-container">
    <header class="page-header">
      <h1>{{ title }}</h1>
      <hr />
    </header>

    <main class="page-content">
      <div class="content-wrapper">
        <!-- 搜索区域 -->
        <!-- <div class="search-container">
          <el-form :inline="false" :model="searchForm" class="search-form">
            <el-form-item label="商户代码">
              <el-input
                v-model="searchForm.code"
                placeholder="请输入商户代码"
                clearable
                style="width: 180px"
              />
            </el-form-item>
            <el-form-item label="状态">
              <el-select
                v-model="searchForm.status"
                placeholder="全部"
                clearable
                style="width: 120px"
              >
                <el-option :value="0" label="未激活" />
                <el-option :value="1" label="基本状态" />
                <el-option :value="2" label="风控冻结" />
                <el-option :value="3" label="财务冻结" />
                <el-option :value="4" label="启用商户" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="search">
                查询
              </el-button>
              <el-button :icon="Refresh" @click="resetSearch">
                刷新
              </el-button>
            </el-form-item>
          </el-form>
        </div> -->

        <!-- 统计信息 -->
        <div class="stats-section">
          <div class="stat-card">
            <div class="stat-value">{{ totalCount }}</div>
            <div class="stat-label">总商户数</div>
          </div>
          <div class="stat-card info">
            <div class="stat-value">{{ totalBalance }}</div>
            <div class="stat-label">总余额</div>
          </div>
          <div class="stat-card success">
            <div class="stat-value">{{ activeCount }}</div>
            <div class="stat-label">启用商户</div>
          </div>
          <div class="stat-card danger">
            <div class="stat-value">{{ frozenCount }}</div>
            <div class="stat-label">冻结商户</div>
          </div>
          <div class="stat-card warning">
            <div class="stat-value">{{ suspendedCount }}</div>
            <div class="stat-label">挂起商户</div>
          </div>
        </div>

        <!-- 商户列表 -->
        <div class="table-container">
          <el-table :data="merchantList" border style="width: 100%" v-loading="loading">
            <el-table-column prop="isGroup" label="类型" width="80">
              <template #default="{ row }">
                <el-tag :type="row.isGroup ? 'warning' : 'danger'" size="small">
                  {{ row.isGroup ? '集团' : '商户' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="code" label="商户号" min-width="100"></el-table-column>
            <el-table-column prop="balance" label="余额" min-width="150" align="left">
              <template #default="{ row }">
                {{ formatMoney(row.balance) }}
              </template>
            </el-table-column>
            <el-table-column prop="checkedBalanceTime" label="余额更新时间（北京）" width="170">
              <template #default="{ row }">
                {{ formatDate(row.checkedBalanceTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="currency" label="币种" width="70"></el-table-column>
            <el-table-column prop="status" label="商户状态" width="100">
              <template #default="{ row }">
                <el-tag :type="statusTagType(row.status)" size="small">
                  {{ statusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="isSuspended" label="挂起" width="70">
              <template #default="{ row }">
                <el-tag :type="row.isSuspended ? 'danger' : 'success'" size="small">
                  {{ row.isSuspended ? '是' : '否' }}
                </el-tag>
              </template>
            </el-table-column>
            <!-- <el-table-column prop="telegram" label="电报群" min-width="260">
              <template #default="{ row }">
                <a :href="row.telegram" target="_blank" v-if="row.telegram">
                  {{ row.telegram }}
                </a>
                <span v-else>-</span>
              </template>
            </el-table-column> -->
            <el-table-column prop="telegram" label="网站" min-width="280">
              <template #default="{ row }">
                <span v-if="row.siteUrl">
                  {{ row.siteUrl }}
                </span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="creditUsed" label="授信已用" width="120" align="right">
              <template #default="{ row }">
                {{ formatMoney(row.creditUsed) }}
              </template>
            </el-table-column>
            <el-table-column prop="creditMax" label="授信上限" width="120" align="right">
              <template #default="{ row }">
                {{ formatMoney(row.creditMax) }}
              </template>
            </el-table-column>
            <el-table-column prop="createdOn" label="商户创建时间（北京）" width="170">
              <template #default="{ row }">
                {{ formatDate(row.createdOn) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { Search, Refresh } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { http } from '@/api';

defineProps({
  title: {
    type: String,
    default: "商户列表",
  },
});

// 搜索表单
const searchForm = reactive({
  code: '',
  status: ''
});

// 状态变量
const loading = ref(false);
const merchantList = ref([]);

const statusMap = {
  0: "未激活",
  1: "基本状态",
  2: "风控冻结",
  3: "财务冻结",
  4: "启用商户"
};

// 统计数据
const totalCount = computed(() => merchantList.value.length);
const totalBalance = computed(() => {
  const total = merchantList.value.reduce((sum, m) => sum + (Number(m.balance) || 0), 0);
  return `R$ ${Number(total).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
});
const activeCount = computed(() => merchantList.value.filter(m => m.status === 4).length);
const frozenCount = computed(() => merchantList.value.filter(m => m.status === 2 || m.status === 3).length);
const suspendedCount = computed(() => merchantList.value.filter(m => m.isSuspended).length);

const statusText = (status) => {
  return statusMap[status] || "未知";
};

const statusTagType = (status) => {
  const map = { 0: "info", 1: "default", 2: "danger", 3: "warning", 4: "success" };
  return map[status];
};

const formatMoney = (val) => {
  if (val == null) return "-";
  return "R$ " + Number(val).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("zh-CN");
  } catch (e) {
    return dateStr;
  }
};

const loadData = async () => {
  loading.value = true;
  try {
    const res = await http.getGroupMerchants();
    if (res.code === 200) {
      merchantList.value = res.data.filter(m => !m.code?.startsWith('G')) || [];
    } else {
      ElMessage.error(res.msg || "加载数据失败");
    }
  } catch (e) {
    ElMessage.error("加载数据失败");
  }
  loading.value = false;
};

// const search = () => {
//   loadData();
// };

// const resetSearch = () => {
//   searchForm.code = '';
//   searchForm.status = '';
//   loadData();
// };

onMounted(() => {
  loadData();
});
</script>

<style scoped lang="scss">
@use "../../styles/variables.scss" as *;

.page-container {
  background-color: #fff;
  border-radius: 24px;
  margin: $spacing-lg;
  min-height: 100%;
}

.page-header {
  padding: $spacing-lg;
  h1 {
    margin: 0;
    font-size: $font-size-xl;
    color: $text-color;
  }
  hr {
    margin: 0px;
    height: 0px;
    opacity: 0.2;
    border-width: 0px 0px 1px;
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
  padding: 0 $spacing-xl;
  border-radius: $border-radius-md;
}

.search-container {
  margin-bottom: $spacing-lg;
  .search-form {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;
    :deep(.el-form-item) {
      margin-bottom: $spacing-sm;
    }
  }
}

.stats-section {
  display: flex;
  gap: $spacing-md;
  margin-bottom: $spacing-lg;
  flex-wrap: wrap;
}

.stat-card {
  flex: 1;
  min-width: 150px;
  padding: $spacing-md;
  background-color: #f8f9fa;
  border-radius: $border-radius-sm;
  text-align: center;
  border-left: 4px solid #909399;

  &.success {
    border-left-color: #67c23a;
    background-color: #f0f9eb;
  }

  &.danger {
    border-left-color: #f56c6c;
    background-color: #fef0f0;
  }

  &.warning {
    border-left-color: #e6a23c;
    background-color: #fdf6ec;
  }

  .stat-value {
    font-size: 28px;
    font-weight: 700;
    color: #303133;
  }

  .stat-label {
    font-size: 13px;
    color: #909399;
    margin-top: 4px;
  }
}

.table-container {
  margin-top: $spacing-lg;
}

:deep(.el-table) {
  .el-table__header th {
    background-color: #fafafa;
    color: #606266;
    font-weight: 500;
  }
  .el-table__row {
    transition: background-color 0.3s;
  }
}

@media (max-width: 768px) {
  .table-container {
    overflow-x: auto;
  }
  .search-container {
    .search-form {
      flex-direction: column;
    }
    .el-form-item__label {
      width: 100%;
    }
    .el-form-item__content {
      width: 100%;
    }
  }
  .stats-section {
    flex-direction: column;
  }
  .stat-card {
    min-width: auto;
  }
}
</style>