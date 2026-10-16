<template>
  <div class="app-page">
    <header class="app-page-header">
      <h1>{{ title }}</h1>
    </header>

    <main>
      <!-- 搜索和筛选区域 -->
      <div class="search-panel">
          <el-form :inline="false" :model="searchForm" class="search-form">
            <el-form-item :label="t('order.capital.search.timeLabel')">
              <el-date-picker
                v-model="searchForm.time"
                type="datetimerange"
                :range-separator="t('common.to')"
                :start-placeholder="t('common.startDate')"
                :end-placeholder="t('common.endDate')"
                value-format="YYYY-MM-DD HH:mm:ss"
                @change="onDateRangeChange"
              />
            </el-form-item>
            <el-form-item :label="t('order.capital.search.quickTime')">
              <FilterTabs
                v-model="currentTimeRange"
                :options="timeRangeOptions"
                @update:model-value="onQuickRange"
              />
            </el-form-item>
            <el-form-item :label="t('order.capital.search.merchantOrderNo')">
              <el-input
                v-model="searchForm.merchantOrderNo"
                :placeholder="t('common.enter')"
                clearable
                style="width: 155px"
              />
            </el-form-item>
            <el-form-item :label="t('order.capital.search.platformOrderNo')">
              <el-input
                v-model="searchForm.orderNo"
                :placeholder="t('common.enter')"
                clearable
                style="width: 155px"
              />
            </el-form-item>
            <el-form-item :label="t('order.capital.search.orderType')">
              <el-select
                v-model="searchForm.type"
                style="width: 140px"
              >
                <el-option
                  v-for="item in orderTypes"
                  :key="item.code"
                  :label="item.name"
                  :value="item.code"
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
              <el-table :data="tableData" stripe >
                <el-table-column :label="t('order.capital.table.merchantOrderNo')" width="280" align="center">
                  <template #default="{ row }">
                    <CopyText 
                      :text="row.merchantorderno" 
                      :title="t('common.copyOrderNo')"
                    />
                  </template>
                </el-table-column>
                <el-table-column :label="t('order.capital.table.platformOrderNo')" width="280" align="center">
                  <template #default="{ row }">
                    <CopyText 
                      :text="row.orderno" 
                      :id="'orderno-' + row.orderno"
                      :title="t('common.copyPlatformNo')"
                    />
                  </template>
                </el-table-column>
                <el-table-column prop="orderamount" :label="t('order.capital.table.orderAmount')" align="center" />
                <el-table-column prop="realamount" :label="t('order.capital.table.realAmount')" align="center" />
                <el-table-column prop="balance" :label="t('order.capital.table.balance')" align="center">
                </el-table-column>
                <el-table-column prop="createtime" :label="t('order.capital.table.enterTime')" width="180" align="center" />
                <el-table-column prop="type" :label="t('order.capital.table.type')" align="center">
                  <template #default="{ row }">
                    <el-tag :type="getTypeColor(row.type)">
                      {{ getTypeName(row.type) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="memo" :label="t('order.capital.table.typeDesc')" show-overflow-tooltip align="center" />
              </el-table>

   
            </template>
          </el-skeleton>
        </div>

        <!-- 分页 -->
        <div class="pagination-container" >
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
  </div>
</template>

<script setup>
import { Search, Refresh,Download } from "@element-plus/icons-vue";
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from "element-plus";
import FilterTabs from "@/components/FilterTabs.vue";
import CopyText from "@/components/CopyText.vue";
import useUserStore from "@/stores/user";
import { http } from "@/api";
import { getNow } from "@/utils/brazilTime";

const userStore = useUserStore();

const { t } = useI18n();

// 资金流水
const props = defineProps({
  title: {
    type: String,
    default: "资金流水",
  },
});

const orderTypes = ref([]);

const getTypeName = (code) => {
  const type = orderTypes.value.find(item => item.code === code);
  return type ? type.name : code;
};

const tagTypeColor = {
  K00001: "danger",
  K00002: "success",
  K00003: "danger",
  K00004: "danger",
  K00005: "success",
  K00006: "danger",
  K00007: "success",
  K00008: "success",
  K00009: "success",
  K00010: "danger",
  K00011: "danger",
  K00012: "success",
  K00013: "danger",
  K00014: "success",
  K00015: "danger",
  K00016: "danger",
  K00017: "success",
  K00018: "danger",
};

const getTypeColor = (code) => {
  if (!code) return 'info';
  return tagTypeColor[code] || 'info';
};

// 搜索表单
const searchForm = reactive({
  type: "",
  time: [],
  orderNo: "",
  merchantOrderNo: "",
});
const timeRangeOptions = computed(() => [
  { label: t('order.timeRange.yesterday'), value: "yesterday" },
  { label: t('order.timeRange.today'), value: "today" },
  { label: t('order.timeRange.threeDays'), value: "3days" },
  { label: t('order.timeRange.sevenDays'), value: "7days" },
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

// 路由实例
const router = useRouter();

// 快捷时间药丸回调（昨天 / 今天 / 3天 / 7天，按商户币种时区计算）
const onQuickRange = (range) => {
  const currency = userStore.merchantInfo?.currency;
  const now = getNow(currency);
  let startDate;
  let endDate;

  if (range === "yesterday") {
    // 昨天全天：00:00:00 ~ 23:59:59
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

  searchForm.time = [
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
  
  searchForm.time = [formatDate(startOfDay), formatDate(endOfDay)];
  currentTimeRange.value = 'today';
};

// 刷新方法
const clearSearch = () => {
  setDefaultTime();
  searchForm.merchantOrderNo = "";
  searchForm.orderNo = "";
  pagination.currentPage = 1;
  handleSearch();
};
// 搜索方法
const handleSearch = async () => {
  loading.value = true;
  try {
    // 模拟API调用 - 实际项目中替换为真实API调用
    const res = await http.financePage({
      billEndTime: searchForm.time?.[1] || '',
      billStartTime: searchForm.time?.[0] || '',
      id: userStore.userInfo.id,
      merchantOrderNo: searchForm.merchantOrderNo,
      orderNo: searchForm.orderNo,
      pageNo: pagination.currentPage,
      pageSize: pagination.pageSize,
      type: searchForm.type,
    });

    tableData.value = res.data.list;
    pagination.total = res.data.total;
  } finally {
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

const loadOrderTypes = async () => {
  try {
    const res = await http.orderTypesCount({
      pageNo: 1,
      pageSize: 100
    });
    if (res.code === 200 && res.data.list) {
      orderTypes.value = [{ code: '', name: t('order.capital.orderTypeAll') }, ...res.data.list];
    } else {
      orderTypes.value = [{ code: '', name: t('order.capital.orderTypeAll') }];
    }
  } catch (error) {
    console.error('获取订单类型失败:', error);
    orderTypes.value = [{ code: '', name: t('order.capital.orderTypeAll') }];
  } finally {
    if (!searchForm.type) {
      searchForm.type = '';
    }
  }
};

// 初始化数据
onMounted(async () => {
  // 初始化时设置默认时间范围
  if (searchForm.time.length === 0) {
    setDefaultTime();
  }
  
  // 先加载订单类型
  await loadOrderTypes();
  
  // 执行初始搜索
  handleSearch();
});

// 获取查询参数
const getQueryParams = () => {
  return {
    billEndTime: searchForm.time?.[1] || '',
    billStartTime: searchForm.time?.[0] || '',
    id: userStore.userInfo.id,
    merchantOrderNo: searchForm.merchantOrderNo,
    orderNo: searchForm.orderNo,
    type: searchForm.type,
  };
};

// 导出方法
const onExport = async () => {
  try {
    // 确认对话框
    await ElMessageBox.confirm(
      t('common.exportConfirm'), 
      t('common.tip'), 
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: "warning",
      }
    );
    
    exportLoading.value = true;
    
    // 创建导出
    let res = await http.exportFinance(getQueryParams());
    if(res.code === 200){
      ElMessage.success( res.msg||t('common.exportSubmitted'));
          // 跳转到导出记录页面
    router.push({ name: "exportRecord" });
    } else {
      ElMessage.error( res.msg||t('common.exportFailed'));
    }
    
  } catch (error) {
    if (error !== 'cancel') {
      // 不是取消操作时才显示错误信息
      console.error("导出失败:", error);
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
  color: var(--brand-primary, #16a34a);
  font-weight: 600;
}

.amount-expense {
  color: var(--color-danger, #ef4444);
  font-weight: 600;
}

.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

// 响应式表格
@media (max-width: 768px) {
  .table-panel {
    overflow-x: auto;
  }
}
</style>