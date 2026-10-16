<template>
  <div class="app-page">
    <header class="app-page-header">
      <h1>{{ title || t('order.receipt.pageTitle') }}</h1>
    </header>

    <main>
        <!-- 搜索和筛选区域 -->
        <div class="search-panel">
          <el-form :inline="false" :model="searchForm" class="search-form">
            <el-form-item :label="t('order.receipt.search.timeLabel')">
              <el-date-picker
                v-model="searchForm.orderTime"
                type="datetimerange"
                :range-separator="t('common.to')"
                :start-placeholder="t('common.startDate')"
                :end-placeholder="t('common.endDate')"
                value-format="YYYY-MM-DD HH:mm:ss"
                @change="onDateRangeChange"
              />
            </el-form-item>
            <el-form-item :label="t('order.receipt.search.quickTime')">
              <FilterTabs
                v-model="currentTimeRange"
                :options="timeRangeOptions"
                @update:model-value="onQuickRange"
              />
            </el-form-item>
            <el-form-item :label="t('order.receipt.search.merchantOrderNo')">
              <el-input
                v-model="searchForm.merchantOrderNo"
                :placeholder="t('common.enter')"
                clearable
                style="width: 155px"
              />
            </el-form-item>
            <el-form-item :label="t('order.receipt.search.platformOrderNo')">
              <el-input
                v-model="searchForm.platformOrderNo"
                :placeholder="t('common.enter')"
                clearable
                style="width: 155px"
              />
            </el-form-item>

            <el-form-item :label="t('order.receipt.search.status')">
              <el-select
                v-model="searchForm.status"
                :placeholder="t('order.receipt.search.statusPlaceholder')"
                style="width: 140px"
              >
                <el-option
                  v-for="item in statusOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item :label="t('order.receipt.search.notify')">
              <el-select
                v-model="searchForm.notifyStatus"
                :placeholder="t('order.receipt.search.statusPlaceholder')"
                style="width: 140px"
              >
                <el-option
                  v-for="item in options"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>

            <el-form-item class="search-actions">
              <el-button
                type="primary"
                :icon="Search"
                @click="handleSearch"
                :loading="loading"
              >
                {{ t('common.search') }}
              </el-button>
              <el-button
                :icon="Refresh"
                @click="clearSearch"
                :loading="loading"
              >
                {{ t('common.refresh') }}
              </el-button>
              <el-button
                :icon="Download"
                @click="onExport"
                :loading="exportLoading"
              >
                {{ t('common.export') }}
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 表格内容区域 -->
        <div class="table-panel">
          <!-- 骨架屏 -->
              <!-- 批量操作栏：选中行后出现 -->
              <div v-if="selectedRows.length" class="batch-operation-bar">
                <span>{{ t('common.selectedCount', { n: selectedRows.length }) }}</span>
                <el-button type="primary" size="small" @click="handleBatchExport">
                  {{ t('order.receipt.batchResend') }}
                </el-button>
              </div>
              
          <el-skeleton :loading="loading" :count="5" animated>
            <template #default>
         
              <!-- 表格 -->
              <el-table 
                ref="tableRef"
                :data="tableData" 
                stripe 
                @selection-change="handleSelectionChange"
                @row-click="showDetail"
              >
                <el-table-column type="selection"  width="55" />
                <el-table-column :label="t('order.receipt.table.merchantOrderNo')" width="230" align="left">
                  <template #default="{ row }">
                    <CopyText 
                      :text="row.merchantOrderNo" 
                      :max-width="200"
                      :title="t('common.copyOrderNo')"
                    />
                  </template>
                </el-table-column>
                <el-table-column :label="t('order.receipt.table.platformOrderNo')" align="left" width="270">
                  <template #default="{ row }">
                    <CopyText 
                      :text="row.platformOrderNo" 
                      :id="'orderno-' + row.platformOrderNo"
                      :max-width="200"
                      :title="t('common.copyPlatformNo')"
                    />
                  </template>
                </el-table-column>
                <el-table-column prop="amount" :label="t('order.receipt.table.orderAmount')" align="right" />
                <el-table-column prop="merchantProfit" :label="t('order.receipt.table.merchantProfit')" align="right"/>
                <el-table-column prop="actualAmount" :label="t('order.receipt.table.actualAmount')" align="right" />
                <el-table-column prop="fee" :label="t('order.receipt.table.fee')" align="right" />

                <el-table-column prop="status" :label="t('order.receipt.table.status')" align="center">
                  <template #default="{ row }">
                    <StatusPill :status="row.status" />
                  </template>
                </el-table-column>
                <el-table-column prop="createTime" :label="t('order.receipt.table.applyTime')" width="180" align="center" />
                <el-table-column :label="t('order.receipt.table.action')" align="center" width="100">
                  <template #default="{ row }">
                    <el-button type="primary" plain size="small" @click.stop="handleCallback(row)">
                      {{ t('order.receipt.table.resend') }}
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </template>
          </el-skeleton>
        </div>

        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="pagination.currentPage"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 30, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
    </main>

    <!-- 详情弹窗 -->
    <el-drawer
      v-model="detailVisible"
      :title="t('common.orderTitle')"
      direction="rtl"
      size="30%"
      :before-close="closeDetail"
    >
      <div class="detail-content">
        <div v-if="Object.keys(currentRow).length === 0" class="empty-detail">
          <el-empty :description="t('common.noData')" />
        </div>
        <template v-else>
          <!-- 订单信息 -->
          <section class="detail-section">
            <h3 class="detail-section__title">{{ t('order.receipt.detail.orderInfo') }}</h3>
            <dl class="detail-list">
              <div class="detail-row">
                <dt>{{ t('order.receipt.table.merchantOrderNo') }}</dt>
                <dd>
                  <CopyText
                    v-if="currentRow.merchantOrderNo"
                    :text="currentRow.merchantOrderNo"
                    max-width="240px"
                    :title="t('common.copyOrderNo')"
                  />
                  <span v-else>-</span>
                </dd>
              </div>
              <div class="detail-row">
                <dt>{{ t('order.receipt.table.platformOrderNo') }}</dt>
                <dd>
                  <CopyText
                    v-if="currentRow.platformOrderNo"
                    :text="currentRow.platformOrderNo"
                    :id="'detail-orderno-' + currentRow.platformOrderNo"
                    max-width="240px"
                    :title="t('common.copyPlatformNo')"
                  />
                  <span v-else>-</span>
                </dd>
              </div>
              <!-- 银行单号-巴西是E单号-其他国家叫法不同，改成统一的银行单号 -->
              <div class="detail-row">
                <dt>{{ t('order.receipt.detail.bankNo') }}</dt>
                <dd>{{ currentRow.billingCity || '-' }}</dd>
              </div>
              <div class="detail-row">
                <dt>{{ t('order.receipt.detail.currency') }}</dt>
                <dd>{{ currentRow.currency || '-' }}</dd>
              </div>
              <div class="detail-row">
                <dt>{{ t('order.receipt.table.orderAmount') }}</dt>
                <dd class="is-amount">{{ currentRow.amount || '-' }}</dd>
              </div>
              <div class="detail-row">
                <dt>{{ t('order.receipt.table.merchantProfit') }}</dt>
                <dd class="is-amount">{{ currentRow.merchantProfit || '-' }}</dd>
              </div>
              <div class="detail-row">
                <dt>{{ t('order.receipt.table.actualAmount') }}</dt>
                <dd class="is-amount">{{ currentRow.actualAmount || '-' }}</dd>
              </div>
              <div class="detail-row">
                <dt>{{ t('order.receipt.table.fee') }}</dt>
                <dd class="is-amount">{{ currentRow.fee || '-' }}</dd>
              </div>
            </dl>
          </section>

          <!-- 客户信息 -->
          <section class="detail-section">
            <h3 class="detail-section__title">{{ t('order.receipt.detail.customerInfo') }}</h3>
            <dl class="detail-list">
              <div class="detail-row">
                <dt>{{ t('order.receipt.detail.createIp') }}</dt>
                <dd>{{ currentRow.createdIp || '-' }}</dd>
              </div>
              <div class="detail-row">
                <dt>{{ t('order.receipt.detail.customerName') }}</dt>
                <dd>{{ currentRow.name || '-' }}</dd>
              </div>
              <div class="detail-row">
                <dt>{{ t('order.receipt.detail.customerId') }}</dt>
                <dd>{{ currentRow.billingCountry || '-' }}</dd>
              </div>
            </dl>
          </section>

          <!-- 状态与通知 -->
          <section class="detail-section">
            <h3 class="detail-section__title">{{ t('order.receipt.detail.statusNotify') }}</h3>
            <dl class="detail-list">
              <div class="detail-row">
                <dt>{{ t('order.receipt.table.applyTime') }}</dt>
                <dd class="is-amount">{{ currentRow.createTime || '-' }}</dd>
              </div>
              <div class="detail-row">
                <dt>{{ t('order.receipt.table.status') }}</dt>
                <dd>
                  <StatusPill v-if="currentRow.status" :status="currentRow.status" />
                  <span v-else>-</span>
                </dd>
              </div>
              <div class="detail-row">
                <dt>{{ t('order.receipt.detail.notifyStatus') }}</dt>
                <dd>{{ currentRow.notifyStatus || '-' }}</dd>
              </div>
              <div class="detail-row">
                <dt>{{ t('order.receipt.detail.notifyUrl') }}</dt>
                <dd>{{ currentRow.notifyUrl || '-' }}</dd>
              </div>
            </dl>
          </section>
        </template>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { Search, Refresh, Download } from "@element-plus/icons-vue";
import { ref, reactive, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { ElMessage, ElMessageBox } from "element-plus";
import FilterTabs from "@/components/FilterTabs.vue";
import CopyText from "@/components/CopyText.vue";
import StatusPill from "@/components/StatusPill.vue";
import { getNow } from "@/utils/brazilTime";
import useUserStore from "@/stores/user";
import { http } from "@/api";

const { t } = useI18n();

// 收款订单
const props = defineProps({
  title: {
    type: String,
    default: "",
  },
});

// 状态筛选项（值与后端约定一致：2 全部 / 0 处理中 / 1 成功）
const statusOptions = [
  { label: t('order.receipt.status.all'), value: 2 },
  { label: t('order.receipt.status.processing'), value: 0 },
  { label: t('order.receipt.status.success'), value: 1 },
];

const options = [
  {
    label: t('order.receipt.notify.all'),
    value: -1,
  },
  {
    label: t('order.receipt.notify.success'),
    value: 1,
  },
  {
    label: t('order.receipt.notify.failed'),
    value: 2,
  },
];



// 搜索表单
const searchForm = reactive({
          orderTime: [],
        handleTime: [],
        merchantOrderNo: "",
        platformOrderNo: "",
        status: 2,
        notifyStatus: -1,
});
const timeRangeOptions = [
  { label: t('order.timeRange.yesterday'), value: "yesterday" },
  { label: t('order.timeRange.today'), value: "today" },
  { label: t('order.timeRange.threeDays'), value: "3days" },
  { label: t('order.timeRange.sevenDays'), value: "7days" },
];

// 当前选中的时间范围
const currentTimeRange = ref('today');

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0,
});

// 页面状态
const loading = ref(false);
const tableData = ref([]);
const exportLoading = ref(false);
const detailVisible = ref(false);
const currentRow = ref({});
const selectedRows = ref([]);
const tableRef = ref(null);

// 路由实例
const router = useRouter();

// 快捷时间药丸回调（昨天 / 今天 / 近3天 / 近7天，按商户所在时区计算，逻辑与原 TimeRangeSelector 一致）
const onQuickRange = (range) => {
  const tz = userStore.merchantInfo?.currency;
  const now = getNow(tz);
  let startDate;
  let endDate;

  if (range === 'yesterday') {
    // 昨天全天：00:00:00 ~ 23:59:59
    const yesterday = getNow(tz).subtract(1, 'day');
    startDate = yesterday.startOf('day');
    endDate = yesterday.endOf('day');
  } else if (range === 'today') {
    startDate = now.startOf('day');
    endDate = now.endOf('day');
  } else if (range === '3days') {
    startDate = getNow(tz).subtract(3, 'day').startOf('day');
    endDate = now.endOf('day');
  } else if (range === '7days') {
    startDate = getNow(tz).subtract(7, 'day').startOf('day');
    endDate = now.endOf('day');
  } else {
    return;
  }

  const timeRange = [
    startDate.format("YYYY-MM-DD HH:mm:ss"),
    endDate.format("YYYY-MM-DD HH:mm:ss"),
  ];
  searchForm.orderTime = timeRange;
  searchForm.handleTime = timeRange;
  handleSearch();
};

// 日期选择器变化回调
const onDateRangeChange = (val) => {
  if (!val || val.length !== 2) {
    currentTimeRange.value = '';
    return;
  }
  
  const getDateStr = (dateStr) => {
    return dateStr.split(' ')[0];
  };
  
  const startDateStr = getDateStr(val[0]);
  const endDateStr = getDateStr(val[1]);
  
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const threeDaysAgoStr = `${threeDaysAgo.getFullYear()}-${String(threeDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(threeDaysAgo.getDate()).padStart(2, '0')}`;
  
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = `${sevenDaysAgo.getFullYear()}-${String(sevenDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(sevenDaysAgo.getDate()).padStart(2, '0')}`;
  
  if (startDateStr === todayStr && endDateStr === todayStr) {
    currentTimeRange.value = 'today';
  } else if (startDateStr === threeDaysAgoStr && endDateStr === todayStr) {
    currentTimeRange.value = '3days';
  } else if (startDateStr === sevenDaysAgoStr && endDateStr === todayStr) {
    currentTimeRange.value = '7days';
  } else {
    currentTimeRange.value = '';
  }
  
  handleSearch();
};

// 使用 Pinia Store
const userStore = useUserStore();
const standardtime = computed(() => {
  return userStore.merchantInfo?.standardtime
    ? +userStore.merchantInfo.standardtime * 60 * 60 * 1000
    : 0;
});

// 设置默认时间范围（今天）
const setDefaultTime = () => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  
  const pad = (num) => String(num).padStart(2, '0');
  const formatDate = (date) => {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };
  
  searchForm.orderTime = [formatDate(startOfDay), formatDate(endOfDay)];
  // searchForm.handleTime = [formatDate(startOfDay), formatDate(endOfDay)];
  currentTimeRange.value = 'today';
};

// 刷新方法
const clearSearch = () => {
  setDefaultTime();
  searchForm.merchantOrderNo = "";
  searchForm.platformOrderNo = "";
  searchForm.status = 2;
  searchForm.notifyStatus = -1;
  pagination.currentPage = 1;
  pagination.pageSize = 10;
  handleSearch();
};
// 搜索方法
const handleSearch = async () => {
  loading.value = true;
  try {
    const orderStartTime = searchForm.orderTime?.[0] || '';
    const orderEndTime = searchForm.orderTime?.[1] || '';
    // 模拟API调用 - 实际项目中替换为真实API调用
    const res = await http.collectOrderPage({
    "pageNo": pagination.currentPage,
    "pageSize": pagination.pageSize,
    "id": userStore.userInfo.id,
    "merchantOrderNo": searchForm.merchantOrderNo,
    "platformOrderNo": searchForm.platformOrderNo,
    "status": searchForm.status,
    "notifyStatus": searchForm.notifyStatus,
    "orderStartTime": orderStartTime,
    "orderEndTime": orderEndTime,
    "handleStartTime": searchForm.handleTime?.[0] || '',  // 处理开始时间 假的
    "handleEndTime": searchForm.handleTime?.[1] || ''  // 处理结束时间 假的

    });

    tableData.value = res.data.list;
    pagination.total = res.data.total;
    
  }  finally {
    loading.value = false;
  }
};

// 分页相关方法
const handleSizeChange = (val) => {
  pagination.pageSize = val; 
  handleSearch(); // 重新搜索
};
const handleCurrentChange = (val) => {
  pagination.currentPage = val;
  handleSearch(); // 重新搜索
};

// 显示详情弹窗
const showDetail = (row) => {
  currentRow.value = row;
  detailVisible.value = true;
};

// 关闭详情弹窗
const closeDetail = () => {
  detailVisible.value = false;
  currentRow.value = {};
};

// 表格多选处理
const handleSelectionChange = (selection) => {
  selectedRows.value = selection;
};






// 批量回调
const handleBatchExport = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning(t('order.receipt.msg.batchNeedSelect'));
    return;
  }
  
  http
    .reissueCallback({
      idList: selectedRows.value.map((item) => item.platformOrderNo),
    })
    .then((res) => {
      if (res.code === 200) {
        ElMessage.success(res.msg);
        handleSearch();
      }else{
        ElMessage.error(res.msg);
      }
    });
};

// 单个回调
const handleCallback = (row) => {
  http
    .reissueCallback({
      idList: [row.platformOrderNo],
    })
    .then((res) => {
      if (res.code === 200) {
        ElMessage.success(res.msg);
        handleSearch();
      }else{
         ElMessage.error(res.msg);
      }
    });
};

// 初始化数据
onMounted(() => {
  // 初始化时设置默认时间范围
  if (searchForm.orderTime.length === 0 ) {
    setDefaultTime();
  }
  
  handleSearch();
});

// 获取查询参数
const getQueryParams = () => {
  return {
   "pageNo": pagination.currentPage,
    "pageSize": pagination.pageSize,
    "id": userStore.userInfo.id,
    "merchantOrderNo": searchForm.merchantOrderNo,
    "platformOrderNo": searchForm.platformOrderNo,
    "status": searchForm.status,
    "notifyStatus": searchForm.notifyStatus,
    "orderStartTime": searchForm.orderTime?.[0] || '',
    "orderEndTime": searchForm.orderTime?.[1] || '',
    "handleStartTime": searchForm.handleTime?.[0] || '',
    "handleEndTime": searchForm.handleTime?.[1] || ''
  };
};

// 导出方法
const onExport = async () => {
  try {
    // 确认对话框
    await ElMessageBox.confirm(t('common.exportConfirm'), t('common.tip'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: "warning",
    });

    exportLoading.value = true;

    // 创建导出
  let res = await http.exportCollect(getQueryParams());
    if(res.code === 200){
      ElMessage.success( res.msg||t('common.exportSubmitted'));
          // 跳转到导出记录页面
    router.push({ name: "exportRecord" });
    } else if(res.code !== 400) {
      ElMessage.error( res.msg||t('common.exportFailed'));
    }
    
  } catch (error) {
    if (error !== "cancel") {
      // 不是取消操作时才显示错误信息
      console.error("Export failed:", error);
      ElMessage.error(t('common.exportFailed'));
    }
  } finally {
    exportLoading.value = false;
  }
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

.amount-income {
  color: var(--brand-primary, #67c23a);
  font-weight: 500;
}

.amount-expense {
  color: var(--color-danger, #f56c6c);
  font-weight: 500;
}

.pagination-container {
  margin-top: $spacing-lg;
  display: flex;
  justify-content: center;
}

// 行点击打开详情：保留手型指针（表头/配色/行高统一走全局 element-plus-overrides）
:deep(.el-table__row) {
  cursor: pointer;
}

// 批量操作栏样式
.batch-operation-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  margin-bottom: 10px;
  border-radius: 4px;
  padding-left: 10px;
  
  span {
    font-size: 14px;
    color: var(--text-secondary, #606266);
    margin-right: 10px;
  }
}

// 详情抽屉：NTX 风格无框分组列表（浅灰标签 + 深色值，无表格网格）
.detail-content {
  padding: 8px 24px 24px;
  min-height: 400px;
}

.detail-section {
  padding: 16px 0;

  & + & {
    border-top: 1px solid var(--color-border-soft);
  }
}

.detail-section__title {
  margin: 0 0 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-faint);
  letter-spacing: 0.02em;
}

.detail-list {
  margin: 0;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 0;

  dt {
    flex: 0 0 84px;
    font-size: 13px;
    line-height: 22px;
    color: var(--text-secondary);
  }

  dd {
    flex: 1;
    min-width: 0;
    margin: 0;
    font-size: 13px;
    line-height: 22px;
    color: var(--text-primary);
    word-break: break-all;
  }

  // 金额/时间等宽数字，便于核对
  .is-amount {
    font-variant-numeric: tabular-nums;
  }

  // CopyText 在详情里贴左对齐，保留 hover 底色
  dd :deep(.copy-cell) {
    padding-left: 0;
  }
}

.empty-detail {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

:deep(.el-drawer) {
  border-top-left-radius: var(--radius-lg);
  border-bottom-left-radius: var(--radius-lg);

  .el-drawer__header {
    margin-bottom: 0;
    padding: 20px 24px;
    border-bottom: 1px solid var(--color-border-soft);
  }

  .el-drawer__body {
    padding: 0;
  }
}

// 响应式表格
@media (max-width: 768px) {
  .table-panel {
    overflow-x: auto;
  }

  .search-panel {
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
}
</style>
