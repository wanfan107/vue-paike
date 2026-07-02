<template>
  <div class="page-container">
    <header class="page-header">
      <h1>{{ title }}</h1>
      <hr />
    </header>

    <main class="page-content">
      <div class="content-wrapper">
<!-- 搜索区域 -->
<div class="search-section">
  <div class="search-form">
    <el-form :inline="true" :model="searchForm">
      <el-form-item label="时间范围">
        <el-date-picker
          v-model="searchForm.dateRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
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
      <el-form-item label="是否异常">
        <el-select
          v-model="searchForm.isAnomaly"
          placeholder="全部"
          style="width: 100px;"
          clearable
        >
          <el-option :value="true" label="异常" />
          <el-option :value="false" label="正常" />
        </el-select>
      </el-form-item> -->
      <el-form-item>
        <el-button type="primary" :icon="Search" @click="search">
          查询
        </el-button>
        <el-button :icon="Refresh" @click="resetSearch">
          刷新
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</div>
        <!-- 统计信息 -->
        <div class="stats-section">
          <div class="stat-card">
            <div class="stat-value">{{ totalCount }}</div>
            <div class="stat-label">总记录数</div>
          </div>
          <div class="stat-card success">
            <div class="stat-value">{{ successCount }}</div>
            <div class="stat-label">成功登录</div>
          </div>
          <div class="stat-card danger">
            <div class="stat-value">{{ failureCount }}</div>
            <div class="stat-label">登录失败</div>
          </div>
          <!-- <div class="stat-card warning">
            <div class="stat-value">{{ anomalyCount }}</div>
            <div class="stat-label">异常登录</div>
          </div> -->
        </div>

        <!-- 登录记录列表 -->
        <div class="table-section">
          <el-table :data="loginLogs" border stripe style="width: 100%" :loading="loading" @row-click="handleRowClick">
            <el-table-column prop="GroupCode" label="集团代码" width="120" />
            <el-table-column prop="Email" label="用户邮箱" width="200" />
            <el-table-column prop="LoginTime" label="登录时间" width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.LoginTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="LoginIp" label="登录IP" width="150" />
            <el-table-column prop="LoginResult" label="登录结果" width="100">
              <template #default="{ row }">
                <el-tag :type="row.LoginResult === 'success' ? 'success' : 'danger'" size="small">
                  {{ row.LoginResult === 'success' ? '成功' : '失败' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="LoginMessage" label="结果描述" min-width="150" />
            <!-- <el-table-column prop="IsAnomaly" label="是否异常" width="100">
              <template #default="{ row }">
                <el-tag :type="row.IsAnomaly ? 'warning' : 'success'" size="small">
                  {{ row.IsAnomaly ? '异常' : '正常' }}
                </el-tag>
              </template>
            </el-table-column> -->
            <el-table-column prop="AnomalyType" label="异常类型" width="150">
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
        <el-dialog v-model="showDetailDialog" title="异常登录详情" width="500px">
          <div v-if="currentLog" class="detail-info">
            <div class="detail-row">
              <div class="detail-label">记录ID：</div>
              <div class="detail-value">{{ currentLog.AutoId }}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">集团代码：</div>
              <div class="detail-value">{{ currentLog.GroupCode }}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">用户邮箱：</div>
              <div class="detail-value">{{ currentLog.Email }}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">登录时间：</div>
              <div class="detail-value">{{ formatDateTime(currentLog.LoginTime) }}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">登录IP：</div>
              <div class="detail-value">{{ currentLog.LoginIp }}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">登录结果：</div>
              <div class="detail-value">
                <el-tag :type="currentLog.LoginResult === 'success' ? 'success' : 'danger'" size="small">
                  {{ currentLog.LoginResult === 'success' ? '成功' : '失败' }}
                </el-tag>
              </div>
            </div>
            <div class="detail-row">
              <div class="detail-label">异常类型：</div>
              <div class="detail-value">
                <el-tag type="warning" size="small">
                  {{ getAnomalyTypeLabel(currentLog.AnomalyType) }}
                </el-tag>
              </div>
            </div>
            <div class="detail-row">
              <div class="detail-label">异常详情：</div>
              <div class="detail-value">
                <pre class="anomaly-details">{{ formatAnomalyDetails(currentLog.AnomalyDetails) }}</pre>
              </div>
            </div>
          </div>
          <template #footer>
            <el-button @click="showDetailDialog = false">关闭</el-button>
          </template>
        </el-dialog>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { Search, Refresh, Download } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { http } from '@/api';
const props = defineProps({
  title: {
    type: String,
    default: "集团登录记录",
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
    'NewDevice': '新设备',
    'NewIP': '新IP',
    'NewDevice_NewIP': '新设备+新IP'
  };
  return labels[type] || type || '未知';
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
      loginLogs.value = (res.data.list || []).filter(item => item.LoginResult === 'success');
      // pagination.total = res.data.total || 0; 
      pagination.total = res.data.total || 0; 
    }
    else {
      ElMessage.error(res.msg || '获取登录记录失败');
    }
  }
  catch (error) {
    console.error('获取登录记录失败:', error);
    ElMessage.error('获取登录记录失败');
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
  ElMessage.info('导出功能开发中');
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

.page-container {
  background-color: #fff;
  border-radius: 24px;
  margin: $spacing-lg;
  min-height: calc(100vh - 32px);
}

.page-header {
  padding: $spacing-lg;

  h1 {
    margin: 0;
    font-size: $font-size-xl;
    color: $text-color;
  }

  hr {
    margin: 12px 0 0 0;
    opacity: 0.2;
    border: none;
    border-top: 1px solid;
  }
}

.page-content {
  padding: $spacing-lg;
}

.content-wrapper {
  background-color: white;
  border-radius: $border-radius-md;
}

.search-section {
  padding: $spacing-md;
  border-radius: $border-radius-md;
  margin-bottom: $spacing-md;
}

.search-form {
  .form-row {
    display: flex;
    gap: $spacing-lg;
    flex-wrap: wrap;
    margin-bottom: $spacing-md;
  }

  .form-item {
    display: flex;
    flex-direction: column;
    gap: 6px;

    label {
      font-size: 13px;
      color: #606266;
      font-weight: 500;
    }
  }

  .form-actions {
    display: flex;
    gap: $spacing-sm;
    justify-content: flex-end;
  }
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

.table-section {
  :deep(.el-table) {
    border-radius: 8px;
    overflow: hidden;

    .el-table__row {
      cursor: pointer;

      &:hover {
        background-color: #f5f7fa;
      }
    }
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: $spacing-md 0;
}

.anomaly-type {
  color: #e6a23c;
  font-size: 12px;
}

.no-data {
  color: #c0c4cc;
  font-size: 12px;
}

.detail-info {
  .detail-row {
    display: flex;
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }

    .detail-label {
      width: 110px;
      font-weight: 600;
      color: #606266;
    }

    .detail-value {
      flex: 1;
      color: #303133;
    }
  }
}

.anomaly-details {
  background-color: #f5f7fa;
  padding: 12px;
  border-radius: 6px;
  font-size: 12px;
  color: #606266;
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
}

@media (max-width: 768px) {
  .page-container {
    margin: $spacing-md;
  }

  .search-form .form-row {
    flex-direction: column;
  }

  .stats-section {
    flex-direction: column;
  }

  .stat-card {
    min-width: auto;
  }
}
</style>