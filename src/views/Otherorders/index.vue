<template>
  <div class="app-page">
    <header class="app-page-header">
      <h1>{{ t('menu.otherOrders') }}</h1>
    </header>

    <main>
        <!-- 搜索和筛选区域 -->
        <div class="search-panel">
          <el-form :inline="false" :model="searchForm" class="search-form">
            <el-form-item :label="t('order.other.search.timeLabel')">
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
            <el-form-item :label="t('order.other.search.quickTime')">
              <FilterTabs
                v-model="currentTimeRange"
                :options="timeRangeOptions"
                @update:model-value="onQuickRange"
              />
            </el-form-item>

            <el-form-item :label="t('order.other.search.platformOrderNo')">
              <el-input
                v-model="searchForm.platformOrderNo"
                :placeholder="t('common.enter')"
                clearable
                style="width: 155px"
              />
            </el-form-item>

            <el-form-item :label="t('order.other.search.account')">
              <el-input
                v-model="searchForm.account"
                :placeholder="t('common.enter')"
                clearable
                style="width: 155px"
              />
            </el-form-item>
            <el-form-item :label="t('order.other.search.status')">
              <el-select
                v-model="searchForm.status"
                :placeholder="t('order.other.search.statusPlaceholder')"
                clearable
                style="width: 140px">
                <el-option
                  v-for="key in Object.keys(mapping)"
                  :key="key"
                  :label="key"
                  :value="mapping[key]"
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
                type="primary"
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
          <el-skeleton :loading="loading" :count="5" animated>
            <template #default>
              <!-- 表格 -->
              <el-table :data="tableData" stripe @row-click="showDetail">
                <el-table-column prop="merchantOrderNo" :label="t('order.other.table.merchantOrderNo')" align="center" />
                <el-table-column
                  prop="platformOrderNo"
                  :label="t('order.other.table.platformOrderNo')"
                  show-overflow-tooltip
                  width="150"
                  align="center"
                />
                <el-table-column prop="orderAmount" :label="t('order.other.table.orderAmount')" align="right" />
                <el-table-column prop="expectAmount" :label="t('order.other.table.expectAmount')" align="right" />
                <el-table-column prop="actualPay" :label="t('order.other.table.actualPay')" align="right"/>
                <el-table-column prop="fee" :label="t('order.other.table.fee')" align="right" />
                <el-table-column prop="status" :label="t('order.other.table.status')" align="center">
                  <template #default="{ row }">
                    <StatusPill :status="row.status" />
                  </template>
                </el-table-column>
                <el-table-column prop="applyTime" :label="t('order.other.table.applyTime')" align="center" />
                <el-table-column :label="t('order.other.table.action')" align="center" width="100">
                  <template #default="{ row }">
                    <el-button type="primary" plain size="small" @click.stop="handleCallback(row)">
                      {{ t('order.other.table.callback') }}
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
            <h3 class="detail-section__title">{{ t('order.other.detail.orderInfo') }}</h3>
            <dl class="detail-list">
              <div class="detail-row">
                <dt>{{ t('order.other.table.merchantOrderNo') }}</dt>
                <dd>{{ currentRow.merchantOrderNo || '-' }}</dd>
              </div>
              <div class="detail-row">
                <dt>{{ t('order.other.table.platformOrderNo') }}</dt>
                <dd>{{ currentRow.platformOrderNo || '-' }}</dd>
              </div>
              <div class="detail-row">
                <dt>{{ t('order.other.table.orderAmount') }}</dt>
                <dd class="is-amount">{{ currentRow.orderAmount || '-' }}</dd>
              </div>
              <div class="detail-row">
                <dt>{{ t('order.other.table.expectAmount') }}</dt>
                <dd class="is-amount">{{ currentRow.expectAmount || '-' }}</dd>
              </div>
              <div class="detail-row">
                <dt>{{ t('order.other.table.actualPay') }}</dt>
                <dd class="is-amount">{{ currentRow.actualPay || '-' }}</dd>
              </div>
              <div class="detail-row">
                <dt>{{ t('order.other.table.fee') }}</dt>
                <dd class="is-amount">{{ currentRow.fee || '-' }}</dd>
              </div>
            </dl>
          </section>

          <!-- 客户信息 -->
          <section class="detail-section">
            <h3 class="detail-section__title">{{ t('order.other.detail.customerInfo') }}</h3>
            <dl class="detail-list">
              <div class="detail-row">
                <dt>{{ t('order.other.detail.bankType') }}</dt>
                <dd>{{ currentRow.bank || '-' }}</dd>
              </div>
              <div class="detail-row">
                <dt>{{ t('order.other.detail.customerName') }}</dt>
                <dd>{{ currentRow.customerName || '-' }}</dd>
              </div>
            </dl>
          </section>

          <!-- 状态与信息 -->
          <section class="detail-section">
            <h3 class="detail-section__title">{{ t('order.other.detail.statusInfo') }}</h3>
            <dl class="detail-list">
              <div class="detail-row">
                <dt>{{ t('order.other.table.applyTime') }}</dt>
                <dd class="is-amount">{{ currentRow.applyTime || '-' }}</dd>
              </div>
              <div class="detail-row">
                <dt>{{ t('order.other.table.status') }}</dt>
                <dd>
                  <StatusPill v-if="currentRow.status" :status="currentRow.status" />
                  <span v-else>-</span>
                </dd>
              </div>
              <div class="detail-row">
                <dt>{{ t('order.other.detail.bankSerialNo') }}</dt>
                <dd>{{ currentRow.info || '-' }}</dd>
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
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { ElMessage, ElMessageBox } from "element-plus";
import FilterTabs from "@/components/FilterTabs.vue";
import StatusPill from "@/components/StatusPill.vue";
import useUserStore from "@/stores/user";
import { http } from "@/api";
import { getNow } from "@/utils/brazilTime";

const userStore = useUserStore();
const currency = userStore.merchantInfo?.currency;

const { t } = useI18n();

// 其他查询
const props = defineProps({
  title: {
    type: String,
    default: "",
  },
});

// orderType 映射（key 为翻译后的中文标签，语言切换实时响应）
const mapping = computed(() => ({
  [t("order.other.orderType.withdraw")]:  -1,
  [t("order.other.orderType.transfer")]: 0,
  [t("order.other.orderType.recharge")]: 3,
  [t("order.other.orderType.mutualTransfer")]: 4,
}));

// 搜索表单
const searchForm = reactive({
  platformOrderNo: "",
  account: "",
  status: -1,
  orderTime: [],
});
// 今天 yesterday  3days 7days
const timeRangeOptions = computed(() => [
  { label: t("order.timeRange.yesterday"), value: "yesterday" },
  { label: t("order.timeRange.today"), value: "today" },
  { label: t("order.timeRange.threeDays"), value: "3days" },
  { label: t("order.timeRange.sevenDays"), value: "7days" },
]);

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

// 路由实例
const router = useRouter();

// 快捷时间药丸回调（昨天 / 今天 / 3天 / 7天，按商户币种时区计算）
const onQuickRange = (range) => {
  const now = getNow(currency);
  let startDate;
  let endDate;

  if (range === "yesterday") {
    const yesterday = getNow(currency).subtract(1, "day");
    startDate = yesterday.startOf("day");
    endDate = yesterday.endOf("day");
  } else if (range === "today") {
    startDate = now.startOf("day");
    endDate = now.endOf("day");
  } else if (range === "3days") {
    startDate = getNow(currency).subtract(3, "day").startOf("day");
    endDate = now.endOf("day");
  } else if (range === "7days") {
    startDate = getNow(currency).subtract(7, "day").startOf("day");
    endDate = now.endOf("day");
  } else {
    return;
  }

  searchForm.orderTime = [
    startDate.format("YYYY-MM-DD HH:mm:ss"),
    endDate.format("YYYY-MM-DD HH:mm:ss"),
  ];
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
  currentTimeRange.value = 'today';
};

// 刷新方法
const clearSearch = () => {
  setDefaultTime();
  searchForm.platformOrderNo = "";
  searchForm.account = "";
  searchForm.status = -1;
  pagination.currentPage = 1;
  pagination.pageSize = 10;
  handleSearch();
};
// 搜索方法
const handleSearch = async () => {
  loading.value = true;
  try {
    // 模拟API调用 - 实际项目中替换为真实API调用
    const res = await http.withdrawPage({
    "pageNo": pagination.currentPage,
    "pageSize": pagination.pageSize,
    "id": userStore.userInfo.id,
    "platformOrderNo": searchForm.platformOrderNo,
    "account": searchForm.account,
    "status": searchForm.status,
    "orderStartTime": searchForm.orderTime[0],
    "orderEndTime": searchForm.orderTime[1]
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

// 单个回调
const handleCallback = (row) => {
  ElMessage.success(t("order.other.msg.callbackDone", { no: row.merchantOrderNo || row.platformOrderNo }));
};

// 初始化数据
onMounted(() => {
  // 初始化时设置默认时间范围
  if (searchForm.orderTime.length === 0) {
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
    "platformOrderNo": searchForm.platformOrderNo,
    "account": searchForm.account,
    "status": searchForm.status,
    "orderStartTime": searchForm.orderTime[0],
    "orderEndTime": searchForm.orderTime[1]
  };
};

// 导出方法
const onExport = async () => {
  try {
    // 确认对话框
    await ElMessageBox.confirm(t("common.exportConfirm"), t("common.tip"), {
      confirmButtonText: t("common.confirm"),
      cancelButtonText: t("common.cancel"),
      type: "warning",
    });

    exportLoading.value = true;

    // 创建导出
    await http.exportFinance(getQueryParams());

    // 跳转到导出记录页面
    router.push({ name: "exportRecord" });

    ElMessage.success(t("common.exportSubmitted"));
  } catch (error) {
    if (error !== "cancel") {
      // 不是取消操作时才显示错误信息
      console.error("导出失败:", error);
      ElMessage.error(t("common.exportFailed"));
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

.pagination-container {
  margin-top: $spacing-lg;
  display: flex;
  justify-content: center;
}

// 行点击打开详情：保留手型指针（表头/配色/行高统一走全局 element-plus-overrides）
:deep(.el-table__row) {
  cursor: pointer;
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

// 详情抽屉：NTX 风格无框分组列表
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

  .is-amount {
    font-variant-numeric: tabular-nums;
  }
}

.empty-detail {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

:deep(.el-drawer) {
  .el-drawer__header {
    margin-bottom: 0;
    padding: 20px;
    border-bottom: 1px solid var(--color-border-soft, #e4e7ed);
  }

  .el-drawer__body {
    padding: 0;
  }
}

:deep(.el-input__inner:-webkit-autofill),
:deep(.el-input__inner:-webkit-autofill:hover),
:deep(.el-input__inner:-webkit-autofill:focus),
:deep(.el-input__inner:-webkit-autofill:active) {
  -webkit-background-clip: text;
  -webkit-text-fill-color: var(--text-primary, #000);
  background-color: var(--color-surface, #fff) !important;
  background-clip: text;
  transition: background-color 5000s ease-in-out 0s;
}

</style>
