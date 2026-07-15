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
            <el-form-item label="时间范围">
              <el-date-picker
                v-model="searchForm.time"
                type="datetimerange"
                :shortcuts="shortcuts"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD HH:mm:ss"
                @change="onDateRangeChange"
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
                v-model="searchForm.orderNo"
                placeholder="请输入"
                clearable
                style="width: 155px"
              />
            </el-form-item>
            <el-form-item label="交易类型">
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
          <el-skeleton :loading="loading" :count="5" animated>
            <template #default>
              <TimeRangeSelector
                @change="onTimeRangeChange"
                :timeRangeOptions="timeRangeOptions"
                :defaultValue="currentTimeRange"
              />
              <!-- 表格 -->
              <el-table :data="tableData" stripe >
                <el-table-column label="商户单号" width="280" align="center">
                  <template #default="{ row }">
                    <CopyText 
                      :text="row.merchantorderno" 
                      title="点击复制订单号"
                    />
                  </template>
                </el-table-column>
                <el-table-column label="平台订单号" width="280" align="center">
                  <template #default="{ row }">
                    <CopyText 
                      :text="row.orderno" 
                      :id="'orderno-' + row.orderno"
                      title="点击复制平台订单号"
                    />
                  </template>
                </el-table-column>
                <el-table-column prop="orderamount" label="订单金额" align="center" />
                <el-table-column prop="realamount" label="入账金额" align="center" />
                <el-table-column prop="balance" label="变后金额" align="center">
                </el-table-column>
                <el-table-column prop="createtime" label="入账时间" width="180" align="center" />
                <el-table-column prop="type" label="类型" align="center">
                  <template #default="{ row }">
                    <el-tag :type="getTypeColor(row.type)">
                      {{ getTypeName(row.type) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="memo" label="类型说明" show-overflow-tooltip align="center" />
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
      </div>
    </main>
  </div>
</template>

<script setup>
import { Search, Refresh,Download } from "@element-plus/icons-vue";
import { ref, reactive, onMounted, computed } from "vue";
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from "element-plus";
import TimeRangeSelector from "@/components/TimeRangeSelector.vue";
import CopyText from "@/components/CopyText.vue";
import useUserStore from "@/stores/user";
import { http } from "@/api";
import { getYesterday, getDateRange, getNow } from "@/utils/brazilTime";

const userStore = useUserStore();
const currency = computed(() => userStore.merchantInfo?.currency);

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

// 路由实例
const router = useRouter();

// 时间范围选择器回调
const onTimeRangeChange = (data) => {
  console.log(data);
  currentTimeRange.value = data.range;
  searchForm.time = [data.timeRange[0], data.timeRange[1]];
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
// 将 shortcuts 也定义为 computed，确保响应式（根据币种选择时区）
const shortcuts = computed(() => [
  {
    text: "昨天",
    value: () => {
      const yesterday = getYesterday(currency.value);
      const start = new Date(yesterday.format('YYYY-MM-DD'));
      start.setHours(0, 0, 0, 0);
      const end = new Date(yesterday.format('YYYY-MM-DD'));
      end.setHours(23, 59, 59, 999);
      return [start, end];
    },
  },
  {
    text: "3天",
    value: () => {
      const range = getDateRange(3, currency.value);
      const start = new Date(range.start);
      start.setHours(0, 0, 0, 0);
      const now = getNow(currency.value);
      const end = new Date(now.format('YYYY-MM-DD'));
      end.setHours(23, 59, 59, 999);
      return [start, end];
    },
  },
  {
    text: "7天",
    value: () => {
      const range = getDateRange(7, currency.value);
      const start = new Date(range.start);
      start.setHours(0, 0, 0, 0);
      const now = getNow(currency.value);
      const end = new Date(now.format('YYYY-MM-DD'));
      end.setHours(23, 59, 59, 999);
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
    console.log(userStore.userInfo.id);
    
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
      orderTypes.value = [{ code: '', name: '不限' }, ...res.data.list];
    } else {
      orderTypes.value = [{ code: '', name: '不限' }];
    }
  } catch (error) {
    console.error('获取订单类型失败:', error);
    orderTypes.value = [{ code: '', name: '不限' }];
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
      "确定导出数据吗?", 
      "提示", 
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );
    
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
    if (error !== 'cancel') {
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
  padding:0 $spacing-xl ;
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