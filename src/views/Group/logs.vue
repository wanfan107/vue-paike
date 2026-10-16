<template>
  <div class="app-page">
    <header class="app-page-header">
      <h1>{{ t('menu.logs') }}</h1>
    </header>

    <main>
<!-- 搜索区域 -->
<div class="search-panel">
  <div class="search-form">
    <el-form :inline="true" :model="searchForm">
      <el-form-item :label="t('order.groupLogs.search.timeRange')">
        <el-date-picker
          v-model="searchForm.dateRange"
          type="datetimerange"
          :range-separator="t('order.groupLogs.search.rangeSeparator')"
          :start-placeholder="t('order.groupLogs.search.startPlaceholder')"
          :end-placeholder="t('order.groupLogs.search.endPlaceholder')"
          value-format="YYYY-MM-DD HH:mm:ss"
          clearable
        />
      </el-form-item>
      <!-- <el-form-item label="登录结果">
        <el-select
          v-model="searchForm.loginResult"
          placeholder="全部"
          style="width: 100px;"
          clearable
        >
          <el-option value="success" label="成功" />
          <el-option value="failure" label="失败" />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('order.groupLogs.search.isAnomaly')">
        <el-select
          v-model="searchForm.isAnomaly"
          :placeholder="t('order.groupLogs.search.statusAll')"
          style="width: 100px;"
          clearable
        >
          <el-option :value="true" :label="t('order.groupLogs.search.anomaly')" />
          <el-option :value="false" :label="t('order.groupLogs.search.normal')" />
        </el-select>
      </el-form-item> -->
      <el-form-item class="search-actions">
        <el-button type="primary" :icon="Search" @click="search">
          {{ t('order.groupLogs.search.searchBtn') }}
        </el-button>
        <el-button :icon="Refresh" @click="resetSearch">
          {{ t('order.groupLogs.search.refreshBtn') }}
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</div>
        <!-- 统计信息 -->
        <div class="stats-section">
          <div class="stat-card">
            <div class="stat-value">{{ totalCount }}</div>
            <div class="stat-label">{{ t('order.groupLogs.stats.total') }}</div>
          </div>
          <div class="stat-card success">
            <div class="stat-value">{{ successCount }}</div>
            <div class="stat-label">{{ t('order.groupLogs.stats.success') }}</div>
          </div>
          <div class="stat-card danger">
            <div class="stat-value">{{ failureCount }}</div>
            <div class="stat-label">{{ t('order.groupLogs.stats.failed') }}</div>
          </div>
          <!-- <div class="stat-card warning">
            <div class="stat-value">{{ anomalyCount }}</div>
            <div class="stat-label">异常登录</div>
          </div> -->
        </div>

        <!-- 登录记录列表 -->
        <div class="table-panel">
          <el-table :data="loginLogs" border stripe style="width: 100%" v-loading="loading" @row-click="handleRowClick">
            <!-- <el-table-column prop="GroupCode" label="集团代码" width="120" /> -->
            <el-table-column prop="Email" :label="t('order.groupLogs.table.email')" width="200" align="left" />
            <el-table-column prop="LoginTime" :label="t('order.groupLogs.table.loginTime')" width="180" align="center">
              <template #default="{ row }">
                {{ formatDateTime(row.LoginTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="LoginIp" :label="t('order.groupLogs.table.loginIp')" width="150" align="left" />
            <el-table-column prop="LoginResult" :label="t('order.groupLogs.table.loginResult')" width="140" align="center">
              <template #default="{ row }">
                <StatusPill :type="row.LoginResult === 'success' ? 'success' : 'danger'" :text="row.LoginResult === 'success' ? t('order.groupLogs.status.success') : t('order.groupLogs.status.failed')" />
              </template>
            </el-table-column>
            <el-table-column prop="LoginMessage" :label="t('order.groupLogs.table.resultDesc')" min-width="150" align="left" />
            <!-- <el-table-column prop="IsAnomaly" label="是否异常" width="100">
              <template #default="{ row }">
                <el-tag :type="row.IsAnomaly ? 'warning' : 'success'" size="small">
                  {{ row.IsAnomaly ? '异常' : '正常' }}
                </el-tag>
              </template>
            </el-table-column> -->
            <el-table-column prop="AnomalyType" :label="t('order.groupLogs.table.anomalyType')" width="150" align="center">
              <template #default="{ row }">
                <span v-if="row.AnomalyType" class="anomaly-type">
                  {{ getAnomalyTypeLabel(row.AnomalyType) }}
                </span>
                <span v-else class="no-data">-</span>
              </template>
            </el-table-column>

          </el-table>

          <!-- 分页 -->
          <div class="pagination-wrapper">
            <el-pagination :current-page="pagination.pageNo" :page-size="pagination.pageSize" :total="pagination.total"
              :page-sizes="[10, 15, 20, 50]" layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange" @current-change="handleCurrentChange" />
          </div>
        </div>

        <!-- 异常详情对话框 -->
        <el-dialog v-model="showDetailDialog" :title="t('order.groupLogs.dialog.title')" width="500px">
          <div v-if="currentLog" class="detail-info">
            <div class="detail-row">
              <div class="detail-label">{{ t('order.groupLogs.dialog.recordId') }}</div>
              <div class="detail-value">{{ currentLog.AutoId }}</div>
            </div>
            <!-- <div class="detail-row">
              <div class="detail-label">集团代码：</div>
              <div class="detail-value">{{ currentLog.GroupCode }}</div>
            </div> -->
            <div class="detail-row">
              <div class="detail-label">{{ t('order.groupLogs.dialog.email') }}</div>
              <div class="detail-value">{{ currentLog.Email }}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">{{ t('order.groupLogs.dialog.loginTime') }}</div>
              <div class="detail-value">{{ formatDateTime(currentLog.LoginTime) }}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">{{ t('order.groupLogs.dialog.loginIp') }}</div>
              <div class="detail-value">{{ currentLog.LoginIp }}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">{{ t('order.groupLogs.dialog.loginResult') }}</div>
              <div class="detail-value">
                <StatusPill :type="currentLog.LoginResult === 'success' ? 'success' : 'danger'" :text="currentLog.LoginResult === 'success' ? t('order.groupLogs.status.success') : t('order.groupLogs.status.failed')" />
              </div>
            </div>
            <div class="detail-row">
              <div class="detail-label">{{ t('order.groupLogs.dialog.anomalyType') }}</div>
              <div class="detail-value">
                <el-tag type="warning" size="small">
                  {{ getAnomalyTypeLabel(currentLog.AnomalyType) }}
                </el-tag>
              </div>
            </div>
            <div class="detail-row">
              <div class="detail-label">{{ t('order.groupLogs.dialog.anomalyDetails') }}</div>
              <div class="detail-value">
                <pre class="anomaly-details">{{ formatAnomalyDetails(currentLog.AnomalyDetails) }}</pre>
              </div>
            </div>
          </div>
          <template #footer>
            <el-button @click="showDetailDialog = false">{{ t('order.groupLogs.dialog.close') }}</el-button>
          </template>
        </el-dialog>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Search, Refresh, Download } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import StatusPill from '@/components/StatusPill.vue';
import { http } from '@/api';
const { t } = useI18n();

const props = defineProps({
  title: {
    type: String,
    default: "",
  },
});
// 搜索表单
const searchForm = reactive({
  dateRange: [],
  loginResult: '',
  isAnomaly: ''
});
// 分页信息
const pagination = reactive({
  pageNo: 1,
  pageSize: 15,
  total: 0
});
// 状态变量
const loading = ref(false);
const loginLogs = ref([]);
const showDetailDialog = ref(false);
const currentLog = ref({});
// 统计数据
const totalCount = computed(() => pagination.total);
const successCount = computed(() => loginLogs.value.filter(log => log.LoginResult === 'success').length);
const failureCount = computed(() => loginLogs.value.filter(log => log.LoginResult === 'failure').length);
const anomalyCount = computed(() => loginLogs.value.filter(log => log.IsAnomaly).length);
// 获取异常类型标签
const getAnomalyTypeLabel = (type) => {
  const labels = {
    'NewDevice': t('order.groupLogs.anomaly.newDevice'),
    'NewIP': t('order.groupLogs.anomaly.newIP'),
    'NewDevice_NewIP': t('order.groupLogs.anomaly.newDeviceNewIP')
  };
  return labels[type] || type || t('order.groupLogs.anomaly.unknown');
};
// 格式化日期时间
const formatDateTime = (dateStr) => {
  if (!dateStr)
    return '-';
  try {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
  catch (e) {
    return dateStr;
  }
};
// 格式化异常详情
const formatAnomalyDetails = (details) => {
  if (!details)
    return '-';
  try {
    const obj = typeof details === 'string' ? JSON.parse(details) : details;
    return JSON.stringify(obj, null, 2);
  }
  catch (e) {
    return details;
  }
};
// 设置默认时间范围（最近30天）
const setDefaultTimeRange = () => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  searchForm.dateRange = [
    formatDateTime(thirtyDaysAgo),
    formatDateTime(now)
  ];
};
// 查询登录记录
const fetchLoginLogs = async () => {
  loading.value = true;
  try {
    const params = {
      pageNo: pagination.pageNo,
      pageSize: pagination.pageSize,
      startTime: searchForm.dateRange?.[0] || '',
      endTime: searchForm.dateRange?.[1] || ''
    };
    // 只添加非空参数
    if (searchForm.loginResult) {
      params.loginResult = searchForm.loginResult;
    }
    if (searchForm.isAnomaly !== '') {
      params.isAnomaly = searchForm.isAnomaly;
    }
    const res = await http.groupLoginLogs(params);
    if (res.code === 200) {
      const filteredList = (res.data.list || []).filter(item => item.LoginResult === 'success');
      loginLogs.value = filteredList;
      pagination.total = filteredList.length; 
    }
    else {
      ElMessage.error(res.msg || t('order.groupLogs.msg.fetchFailed'));
    }
  }
  catch (error) {
    console.error('获取登录记录失败:', error);
    ElMessage.error(t('order.groupLogs.msg.fetchFailed'));
  }
  finally {
    loading.value = false;
  }
};
// 搜索
const search = () => {
  pagination.pageNo = 1;
  fetchLoginLogs();
};
// 重置搜索
const resetSearch = () => {
  searchForm.dateRange = [];
  searchForm.loginResult = '';
  searchForm.isAnomaly = '';
  pagination.pageNo = 1;
  setDefaultTimeRange();
  fetchLoginLogs();
};
// 导出数据
const exportData = () => {
  ElMessage.info(t('order.groupLogs.msg.exportDev'));
};
// 点击行
const handleRowClick = (row) => {
  if (row.IsAnomaly) {
    viewDetail(row);
  }
};
// 查看详情
const viewDetail = (row) => {
  currentLog.value = row;
  showDetailDialog.value = true;
};
// 分页大小改变
const handleSizeChange = (size) => {
  pagination.pageSize = size;
  pagination.pageNo = 1;
  fetchLoginLogs();
};
// 当前页改变
const handleCurrentChange = (page) => {
  pagination.pageNo = page;
  fetchLoginLogs();
};
// 页面挂载时初始化
onMounted(() => {
  setDefaultTimeRange();
  fetchLoginLogs();
});
</script>

<style scoped lang="scss">
@use "../../styles/variables.scss" as *;

.search-panel {
  margin-bottom: $spacing-md;
}

.stats-section {
  display: flex;
  gap: $spacing-md;
  margin-bottom: $spacing-md;
  flex-wrap: wrap;
}

.stat-card {
  flex: 1;
  min-width: 150px;
  padding: $spacing-md;
  background-color: var(--color-hover);
  border-radius: $border-radius-sm;
  text-align: center;
  border-left: 4px solid var(--text-faint);

  &.success {
    border-left-color: var(--brand-primary);
    background-color: var(--color-receive-bg, #f0f9eb);
  }

  &.danger {
    border-left-color: var(--color-send);
    background-color: var(--color-send-bg, #fef0f0);
  }

  &.warning {
    border-left-color: var(--color-warning, #e6a23c);
    background-color: var(--color-status-warn-bg, #fdf6ec);
  }

  .stat-value {
    font-size: 28px;
    font-weight: 700;
    color: var(--text-primary);
  }

  .stat-label {
    font-size: 13px;
    color: var(--text-faint);
    margin-top: 4px;
  }
}

.table-panel {
  :deep(.el-table__row) {
    cursor: pointer;
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: $spacing-md 0;
}

.anomaly-type {
  color: var(--color-warning, #e6a23c);
  font-size: 12px;
}

.no-data {
  color: var(--text-faint);
  font-size: 12px;
}

.detail-info {
  .detail-row {
    display: flex;
    padding: 12px 0;
    border-bottom: 1px solid var(--color-border-soft);

    &:last-child {
      border-bottom: none;
    }

    .detail-label {
      width: 110px;
      font-weight: 600;
      color: var(--text-secondary, #606266);
    }

    .detail-value {
      flex: 1;
      color: var(--text-primary, #303133);
    }
  }
}

.anomaly-details {
  background-color: var(--color-hover);
  padding: 12px;
  border-radius: 6px;
  font-size: 12px;
  color: var(--text-secondary, #606266);
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
}

@media (max-width: 768px) {
  .stats-section {
    flex-direction: column;
  }

  .stat-card {
    min-width: auto;
  }
}
</style>