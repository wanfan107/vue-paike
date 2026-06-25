<template>
  <div class="page-container">
    <header class="page-header">
      <h1>{{ title }}</h1>
      <hr />
    </header>

    <main class="page-content">
      <div class="content-wrapper">
        <!-- 搜索和筛选区域 -->
        <div class="search-container">
          <el-form :inline="false" :model="searchForm" class="search-form">
            <el-form-item label="订单时间">
              <el-date-picker
                v-model="searchForm.orderTime"
                type="datetimerange"
                :shortcuts="shortcuts"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD HH:mm:ss"
                @change="onDateRangeChange"
              />
            </el-form-item>
            <el-form-item label="处理时间">
              <el-date-picker
                v-model="searchForm.handleTime"
                type="datetimerange"
                :shortcuts="shortcuts"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </el-form-item>
                        <el-form-item label="商户订单号">
              <el-input
                v-model="searchForm.merchantOrderNo"
                placeholder="请输入"
                clearable
                style="width: 155px"
              />
            </el-form-item>
            <el-form-item label="平台订单号">
              <el-input
                v-model="searchForm.platformOrderNo"
                placeholder="请输入"
                clearable
                style="width: 155px"
              />
            </el-form-item>

            <el-form-item label="状态">
              <el-select
                v-model="searchForm.status"
                placeholder="请选择交易类型"
                clearable
                style="width: 140px"
              >
                <el-option
                  v-for="key in Object.keys(mapping)"
                  :key="key"
                  :label="key"
                  :value="mapping[key]"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="通知">
              <el-select
                v-model="searchForm.notifyStatus"
                placeholder="请选择交易类型"
                clearable
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

            <el-form-item>
              <el-button
                type="primary"
                :icon="Search"
                @click="handleSearch"
                :loading="loading"
              >
                搜索
              </el-button>
              <el-button
                :icon="Refresh"
                @click="clearSearch"
                :loading="loading"
              >
                刷新
              </el-button>
              <el-button
                :icon="Download"
                @click="onExport"
                type="primary"
                :loading="exportLoading"
              >
                导出
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 表格内容区域 -->
        <div class="table-container">
          <!-- 骨架屏 -->
                <TimeRangeSelector
                @change="onTimeRangeChange"
                :timeRangeOptions="timeRangeOptions"
                :defaultValue="currentTimeRange"
              />
              
              <!-- 批量操作栏 -->
              <div  class="batch-operation-bar">
                <span>已选择 {{ selectedRows.length }} 项</span>
                <el-button type="primary" size="small" @click="handleBatchExport">
                  批量补发回调
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
                <el-table-column prop="merchantOrderNo" label="商户单号" align="center" />
                <el-table-column
                  prop="platformOrderNo"
                  label="平台订单号"
                  show-overflow-tooltip
                  width="150"
                  align="center"
                />
                <el-table-column prop="amount" label="订单金额" align="center" />
                <el-table-column prop="merchantProfit" label="商户分账" align="center"/>
                <el-table-column prop="actualAmount" label="实际支付" align="center" />
                <el-table-column prop="fee" label="手续费" align="center" />

                <el-table-column prop="status" label="状态" align="center">
                  <template #default="{ row }">
                    <el-tag :type="row.status === 'PENDING' ? 'warning' : 'success'">
                      {{  row.status }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="createTime" label="申请时间" align="center" />
                <el-table-column label="操作" align="center" width="100">
                  <template #default="{ row }">
                    <el-button type="primary" size="small" @click.stop="handleCallback(row)" >
                      补发回调
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
      </div>
    </main>

    <!-- 详情弹窗 -->
    <el-drawer
      v-model="detailVisible"
      title="订单详情"
      direction="rtl"
      size="30%"
      :before-close="closeDetail"
    >
      <div class="detail-content">
        <div v-if="Object.keys(currentRow).length === 0" class="empty-detail">
          <el-empty description="暂无数据" />
        </div>
        <el-descriptions v-else :column="1" border>
          <el-descriptions-item label="商户单号">{{ currentRow.merchantOrderNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="平台订单号">{{ currentRow.platformOrderNo || '-' }}</el-descriptions-item>
          <!-- 银行单号-巴西是E单号-其他国家叫法不同，改成统一的银行单号 -->
          <el-descriptions-item label="银行单号">{{ currentRow.billingCity || '-' }}</el-descriptions-item>
          <el-descriptions-item label="币种">{{ currentRow.currency || '-' }}</el-descriptions-item>
          <el-descriptions-item label="订单金额">{{ currentRow.amount || '-' }}</el-descriptions-item>
          <el-descriptions-item label="商户分账">{{ currentRow.merchantProfit || '-' }}</el-descriptions-item>
          <el-descriptions-item label="实际支付">{{ currentRow.actualAmount || '-' }}</el-descriptions-item>
          <el-descriptions-item label="手续费">{{ currentRow.fee || '-' }}</el-descriptions-item>
          <!-- <el-descriptions-item label="支付类型">{{ currentRow.bank || '-' }}</el-descriptions-item> -->
          <el-descriptions-item label="创建IP">{{ currentRow.createdIp || '-' }}</el-descriptions-item>
          <el-descriptions-item label="客户姓名">{{ currentRow.name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="客户证件号">{{ currentRow.billingCountry || '-' }}</el-descriptions-item>
          <!-- <el-descriptions-item label="客户电话">{{ currentRow.phone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="客户邮箱">{{ currentRow.email || '-' }}</el-descriptions-item> -->
          <el-descriptions-item label="申请时间">{{ currentRow.createTime || '-' }}</el-descriptions-item>
          <!-- <el-descriptions-item label="处理时间">{{ currentRow.handleTime || '-' }}</el-descriptions-item> -->
          <el-descriptions-item label="状态">
            <el-tag :type="currentRow.status === 'PENDING' ? 'warning' : 'success'" v-if="currentRow.status">
              {{ currentRow.status }}
            </el-tag>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="通知状态">
            <span>{{ currentRow.notifyStatus || '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="通知地址">
            <span class="wrap-text">{{ currentRow.notifyUrl || '-' }}</span>
          </el-descriptions-item>
          <!-- <el-descriptions-item label="回调">{{ currentRow.callback || '-' }}</el-descriptions-item> -->
           <!-- 可能是备注 -->
          <!-- <el-descriptions-item label="银行流水号">{{ currentRow.info || '-' }}</el-descriptions-item> -->
        </el-descriptions>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { Search, Refresh, Download } from "@element-plus/icons-vue";
import { ref, reactive, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import TimeRangeSelector from "@/components/TimeRangeSelector.vue";
import useUserStore from "@/stores/user";
import { http } from "@/api";
// 收款订单
const props = defineProps({
  title: {
    type: String,
    default: "收款订单",
  },
});

const mapping = {
  ALL: 2,
  PENDING: 0,
  SUCCESS: 1,
};

const options = [
  {
    label: "未通知",
    value: 0,
  },
  {
    label: "通知成功",
    value: 1,
  },
  {
    label: "通知失败",
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
        notifyStatus: 0,
});
const timeRangeOptions = [
  { label: "今天", value: "today" },
  { label: "3天", value: "3days" },
  { label: "7天", value: "7days" },
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

// 时间范围选择器回调
const onTimeRangeChange = (data) => {
  console.log(data);
  currentTimeRange.value = data.range;
  searchForm.orderTime = [data.timeRange[0], data.timeRange[1]];
  searchForm.handleTime = [data.timeRange[0], data.timeRange[1]];
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

// 将 shortcuts 也定义为 computed，确保响应式
const shortcuts = computed(() => [
  {
    text: "昨天",
    value: () => {
      const timestamp = Date.now();
      const localDate = new Date(timestamp);
      const timezoneOffset = localDate.getTimezoneOffset() * 60 * 1000;
      const standardTimeOffset = userStore.merchantInfo?.standardtime
        ? +userStore.merchantInfo.standardtime * 60 * 60 * 1000
        : 0;

      // 创建昨天的日期
      const yesterday = new Date(
        timestamp - 24 * 3600 * 1000 + timezoneOffset + standardTimeOffset,
      );

      // 设置开始时间（00:00:00.000）
      const start = new Date(
        yesterday.getFullYear(),
        yesterday.getMonth(),
        yesterday.getDate(),
      );
      start.setHours(0, 0, 0, 0);

      // 设置结束时间（23:59:59.999）
      const end = new Date(
        yesterday.getFullYear(),
        yesterday.getMonth(),
        yesterday.getDate(),
      );
      end.setHours(23, 59, 59, 999);

      return [start, end];
    },
  },
  {
    text: "3天",
    value: () => {
      const timestamp = Date.now();
      const localDate = new Date(timestamp);
      const timezoneOffset = localDate.getTimezoneOffset() * 60 * 1000;
      const standardTimeOffset = userStore.merchantInfo?.standardtime
        ? +userStore.merchantInfo.standardtime * 60 * 60 * 1000
        : 0;

      // 3天前的开始时间
      const startDate = new Date(
        timestamp - 3 * 24 * 3600 * 1000 + timezoneOffset + standardTimeOffset,
      );
      const start = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
      );
      start.setHours(0, 0, 0, 0);

      // 当前日期的结束时间
      const endDate = new Date(timestamp + timezoneOffset + standardTimeOffset);
      const end = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate(),
      );
      end.setHours(0, 0, 0, 0);

      return [start, end];
    },
  },
  {
    text: "7天",
    value: () => {
      const timestamp = Date.now();
      const localDate = new Date(timestamp);
      const timezoneOffset = localDate.getTimezoneOffset() * 60 * 1000;
      const standardTimeOffset = userStore.merchantInfo?.standardtime
        ? +userStore.merchantInfo.standardtime * 60 * 60 * 1000
        : 0;

      // 7天前的开始时间
      const startDate = new Date(
        timestamp - 7 * 24 * 3600 * 1000 + timezoneOffset + standardTimeOffset,
      );
      const start = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
      );
      start.setHours(0, 0, 0, 0);

      // 当前日期的结束时间
      const endDate = new Date(timestamp + timezoneOffset + standardTimeOffset);
      const end = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate(),
      );
      end.setHours(0, 0, 0, 0);

      return [start, end];
    },
  },
]);

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
  searchForm.handleTime = [formatDate(startOfDay), formatDate(endOfDay)];
  currentTimeRange.value = 'today';
};

// 刷新方法
const clearSearch = () => {
  setDefaultTime();
  searchForm.merchantOrderNo = "";
  searchForm.platformOrderNo = "";
  searchForm.status = 2;
  searchForm.notifyStatus = 0;
  pagination.currentPage = 1;
  pagination.pageSize = 10;
  handleSearch();
};
// 搜索方法
const handleSearch = async () => {
  loading.value = true;
  try {
    // 模拟API调用 - 实际项目中替换为真实API调用
    const res = await http.collectOrderPage({
    "pageNo": pagination.currentPage,
    "pageSize": pagination.pageSize,
    "id": userStore.userInfo.id,
    "merchantOrderNo": searchForm.merchantOrderNo,
    "platformOrderNo": searchForm.platformOrderNo,
    "status": searchForm.status,
    "notifyStatus": searchForm.notifyStatus,
    "orderStartTime": searchForm.orderTime[0],
    "orderEndTime": searchForm.orderTime[1],
    "handleStartTime": searchForm.handleTime[0],
    "handleEndTime": searchForm.handleTime[1]

    });

    tableData.value = res.data.list;
    pagination.total = res.data.total;
    
    // 调试：查看第一条数据的结构
    if (res.data.list && res.data.list.length > 0) {
      console.log('第一条数据结构:', JSON.stringify(res.data.list[0], null, 2));
    }
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
  console.log('显示详情弹窗，row数据:', row);
  currentRow.value = row;
  detailVisible.value = true;
  console.log('currentRow已设置:', currentRow.value);
};

// 关闭详情弹窗
const closeDetail = () => {
  detailVisible.value = false;
  currentRow.value = {};
};

// 表格多选处理
const handleSelectionChange = (selection) => {
  selectedRows.value = selection;
  console.log('选中的行:', selectedRows);
};





// 批量回调
const handleBatchExport = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要补发回调的数据');
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
  if (searchForm.orderTime.length === 0 || searchForm.handleTime.length === 0) {
    setDefaultTime();
  }
  
  handleSearch();
});

// 获取查询参数
const getQueryParams = () => {
  return {
    billEndTime: searchForm.orderTime[1],
    billStartTime: searchForm.orderTime[0],
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
    await ElMessageBox.confirm("确定导出数据吗?", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    exportLoading.value = true;

    // 创建导出
  let res = await http.exportFinance(getQueryParams());
    if(res.code === 200){
      ElMessage.success( res.msg||"导出请求已提交，请到导出记录页面查看");
          // 跳转到导出记录页面
    router.push({ name: "exportRecord" });
    } else {
      ElMessage.error( res.msg||"导出失败，请稍后重试");
    }
    
  } catch (error) {
    if (error !== "cancel") {
      // 不是取消操作时才显示错误信息
      console.error("导出失败:", error);
      ElMessage.error("导出失败，请稍后重试");
    }
  } finally {
    exportLoading.value = false;
  }
};
</script>

<style scoped lang="scss"> 
@use "../../styles/variables.scss" as *;

/* 放大表格选择框 */
:deep(.el-table .el-checkbox) {
  transform: scale(1.4);
  margin: 8px;
}

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

.table-container {
  margin-top: $spacing-lg;
}

.amount-income {
  color: #67c23a;
  font-weight: 500;
}

.amount-expense {
  color: #f56c6c;
  font-weight: 500;
}

.pagination-container {
  margin-top: $spacing-lg;
  display: flex;
  justify-content: center;
}

// 表格样式
:deep(.el-table) {
  .el-table__header th {
    background-color: #fafafa;
    color: #606266;
    font-weight: 500;
  }

   .el-table__row {
    transition: background-color 0.3s;
    cursor: pointer;
  }
  
  .el-table__row:hover {
    cursor: pointer;
  }
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
    color: #606266;
    margin-right: 10px;
  }
}

// 详情弹窗样式
.detail-content {
  padding: 20px;
  min-height: 400px;
}

.wrap-text {
  display: inline-block;
  max-width: 250px;
  word-break: break-all;
  white-space: normal;
}

.empty-detail {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

:deep(.el-descriptions) {
  .el-descriptions__label {
    font-weight: 500;
    color: #606266;
  }
  
  .el-descriptions__content {
    color: #303133;
  }
}

:deep(.el-drawer) {
  .el-drawer__header {
    margin-bottom: 0;
    padding: 20px;
    border-bottom: 1px solid #e4e7ed;
  }
  
  .el-drawer__body {
    padding: 0;
  }
}

// 响应式表格
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
}
</style>
