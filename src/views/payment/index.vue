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
                range-separator="To"
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

            <el-form-item label="账户">
              <el-input
                v-model="searchForm.account"
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
                <el-table-column prop="orderAmount" label="订单金额" align="center" />
                <el-table-column prop="expectAmount" label="到账金额" align="center" />
                <!-- <el-table-column prop="actualAmount" label="实际支付" align="center" /> -->
                <el-table-column prop="fee" label="手续费" align="center" />

                <el-table-column prop="status" label="状态" align="center">
                  <template #default="{ row }">
                    <el-tag :type="row.status === 'PENDING' ? 'warning' : row.status === 'SUCCESS' ? 'success' : 'danger'">
                      {{  row.status }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="applyTime" label="申请时间" align="center" />
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
          <el-descriptions-item label="银行单号">{{ currentRow.bankArea || '-' }}</el-descriptions-item>
          <el-descriptions-item label="币种">{{ currentRow.currency || '-' }}</el-descriptions-item>
          <el-descriptions-item label="订单金额">{{ currentRow.orderAmount || '-' }}</el-descriptions-item>
          <el-descriptions-item label="到账金额">{{ currentRow.expectAmount || '-' }}</el-descriptions-item>
          <!-- <el-descriptions-item label="实际支付">{{ currentRow.actualAmount || '-' }}</el-descriptions-item> -->
          <el-descriptions-item label="手续费">{{ currentRow.fee || '-' }}</el-descriptions-item>
          <!-- <el-descriptions-item label="支付类型">{{ currentRow.bank || '-' }}</el-descriptions-item> -->
          <el-descriptions-item label="创建IP">{{ currentRow.createdIp || '-' }}</el-descriptions-item>
          <el-descriptions-item label="客户姓名">{{ currentRow.customerName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="客户账户">{{ currentRow.customerAccount || '-' }}</el-descriptions-item>
          <!-- <el-descriptions-item label="客户电话">{{ currentRow.customerPhone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="客户邮箱">{{ currentRow.customerEmail || '-' }}</el-descriptions-item> -->
          <el-descriptions-item label="申请时间">{{ currentRow.applyTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="风控类型">{{ currentRow.riskype || '-' }}</el-descriptions-item>
          <!-- <el-descriptions-item label="处理时间">{{ currentRow.handleTime || '-' }}</el-descriptions-item> -->
          <el-descriptions-item label="状态">
            <el-tag :type="currentRow.status === 'PENDING' ? 'warning' : currentRow.status === 'SUCCESS' ? 'success' : 'danger'" v-if="currentRow.status">
              {{ currentRow.status }}
            </el-tag>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="通知地址">
            <span class="wrap-text">{{ currentRow.merchantNotifyUrl || '-' }}</span>
          </el-descriptions-item>
          <!-- <el-descriptions-item label="回调">{{ currentRow.callback || '-' }}</el-descriptions-item> -->
           <!-- 可能是备注字段 -->
          <!-- <el-descriptions-item label="银行流水号">{{ currentRow.info || '-' }}</el-descriptions-item> -->
          <el-descriptions-item label="凭证" v-if="currentRow.currency === 'BRL'">
            <el-button type="primary" size="small" @click.stop="handleViewVoucher">
              查看凭证
            </el-button>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-drawer>

    <!-- 凭证弹窗 -->
    <el-dialog
      v-model="showVoucherDialog"
      width="600px"
      append-to-body
    >
      <div class="voucher-container" id="voucher">
        <div class="logo"><img src="@/assets/image/logo.png" alt="logo"></div>
        <div class="title"></div>

        <div class="form-group first-form">
          <div class="divider"></div>
          <div class="form-group-title">comprovante de transacçäo</div>
          <div class="form-row">
            <label class="form-group-title-left">Valor</label>
            <span>{{ formatBRL(voucherInfo.amount) }}</span>
          </div>
          <div class="form-row">
            <label class="form-group-title-left">Tempo de transaccǎo</label>
            <span>{{ formattedTime }}</span>
          </div>
          <div class="form-row">
            <label class="form-group-title-left">ID da transacçao</label>
            <span>{{ voucherInfo.end2endId || '-' }}</span>
          </div>
          <div class="form-row">
            <label class="form-group-title-left">Tipo de transferência</label>
            <span>PIX</span>
          </div>
          <div class="divider"></div>
          <div class="form-group-title">Informagóes do depositante</div>
          <div class="form-row">
            <label class="form-group-title-left">Nome</label>
            <span>{{ voucherInfo.fromName || '-' }}</span>
          </div>
          <div class="form-row">
            <label class="form-group-title-left">CNPJ</label>
            <span>{{ voucherInfo.fromCNPJ || '-' }}</span>
          </div>
          <div class="form-row">
            <label class="form-group-title-left">Banco/Instituição</label>
            <span>{{ voucherInfo.fromBankName || '-' }}</span>
          </div>
          <div class="divider"></div>
        </div>

        <div class="form-group">
          <div class="form-group-title">Informagóes do destino</div>
          <div class="form-row">
            <label class="form-group-title-left">Nome</label>
            <span>{{ voucherInfo.accountName || '-' }}</span>
          </div>
          <div class="form-row">
            <label class="form-group-title-left">CPF/CNPJ</label>
            <span>{{ voucherInfo.taxId || '-' }}</span>
          </div>
          <div class="form-row">
            <label class="form-group-title-left">AGÊNCIA</label>
            <span>{{ voucherInfo.toIspb || '-' }}</span>
          </div>
          <div class="form-row">
            <label class="form-group-title-left">ISPB Nome</label>
            <span>{{ voucherInfo.bankName || '-' }}</span>
          </div>
          <div class="form-row">
            <label class="form-group-title-left">Chave</label>
            <span>{{ voucherInfo.account || '-' }}</span>
          </div>
          <div class="form-row">
            <label class="form-group-title-left">Tipo de Conta</label>
            <span>{{ voucherInfo.accountType || '-' }}</span>
          </div>
          <div class="divider"></div>
        </div>
      </div>
      <div style="text-align: center;">
              <el-button type="primary" block @click="downloadVoucher" style="margin-top:10px">
          <el-icon><Download /></el-icon>
          Descarregar comprovante
        </el-button>
      </div>
   
    </el-dialog>
  </div>
</template>

<script setup>
import { Search, Refresh, Download } from "@element-plus/icons-vue";
import { ref, reactive, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox  } from "element-plus";
import TimeRangeSelector from "@/components/TimeRangeSelector.vue";
import useUserStore from "@/stores/user";
import { http } from "@/api";
import html2canvas from 'html2canvas';  // 下载图片

// 格式化BRL货币
const formatBRL = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  const num = Number(value);
  if (isNaN(num)) return '-';
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
};

// 付款订单
const props = defineProps({
  title: {
    type: String,
    default: "付款订单",
  },
});

const mapping = {
  ALL: -1,
  PENDING: 0,
  SUCCESS: 1,
  FAILED: 2,
};

const options = [
  {
    label: "ALL",
    value: -1,
  },
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
    // 账单时间
        orderTime: [],
        // 处理时间
        // handleTime: [],
        status: -1,
        notify: -1,
        notifyStatus: 0,
        account: "",
        merchantOrderNo: "",
        platformOrderNo: "",
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
const showVoucherDialog = ref(false);   // 控制弹窗开关
const formattedTime = ref('');    // 凭证时间格式化后
const voucherInfo = ref('');   // 凭证信息
const selectedRows = ref([]);
const tableRef = ref(null);



// 路由实例
const router = useRouter();

// 时间范围选择器回调
const onTimeRangeChange = (data) => {
  console.log(data);
  currentTimeRange.value = data.range;
  searchForm.orderTime = [data.timeRange[0], data.timeRange[1]];
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

// 刷新方法
const clearSearch = () => {
  // searchForm.orderTime = [];
  // searchForm.handleTime = [];
  searchForm.merchantOrderNo = "";
  searchForm.platformOrderNo = "";
  searchForm.status = -1;
  searchForm.account = '';
  searchForm.notifyStatus =-1;
  pagination.currentPage = 1;
  pagination.pageSize = 10;
  handleSearch();
};
// 搜索方法
const handleSearch = async () => {
  loading.value = true;
  try {
    // 模拟API调用 - 实际项目中替换为真实API调用
    const res = await http.payOrderPage({

    "pageNo": pagination.currentPage,
    "pageSize": pagination.pageSize,
    "id": userStore.userInfo.id,
    "status": searchForm.status,
    "notifyStatus": searchForm.notifyStatus,
    "account": "",
    "merchantOrderNo": searchForm.merchantOrderNo,
    "platformOrderNo": searchForm.platformOrderNo,
    "orderStartTime": searchForm.orderTime[0],
    "orderEndTime": searchForm.orderTime[1],
    "handleStartTime": '',
    "handleEndTime": '',

    });

    tableData.value = res.data.list;
    pagination.total = res.data.total;
    
    // 调试：查看第一条数据的结构
    if (res.data.list && res.data.list.length > 0) {
      console.log('第一条数据结构:', JSON.stringify(res.data.list[0], null, 2));
    }
  } catch (error) {
    ElMessage.error("搜索失败");
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

// 查看凭证
const handleViewVoucher = () => {
  updateVoucherTime(currentRow.value.time);
  voucherInfo.value = currentRow.value.memo;
  console.log('凭证信息:', voucherInfo.value);
  showVoucherDialog.value = true;
};

// 更新凭证时间
const updateVoucherTime = (orderNo) => {
if (orderNo && orderNo.length === 32 && orderNo.startsWith('E')) {
    const timestampStr = orderNo.substring(9, 21);
    const year = parseInt(timestampStr.substring(0, 4));
    const month = parseInt(timestampStr.substring(4, 6)) - 1;
    const day = parseInt(timestampStr.substring(6, 8));
    const hour = parseInt(timestampStr.substring(8, 10));
    const minute = parseInt(timestampStr.substring(10, 12));

    const utcDate = new Date(Date.UTC(year, month, day, hour, minute));
    utcDate.setUTCHours(utcDate.getUTCHours() - 3);

    formattedTime.value =
      String(utcDate.getUTCDate()).padStart(2, '0') + '/' +
      String(utcDate.getUTCMonth() + 1).padStart(2, '0') + '/' +
      utcDate.getUTCFullYear() + ' ' +
      String(utcDate.getUTCHours()).padStart(2, '0') + ':' +
      String(utcDate.getUTCMinutes()).padStart(2, '0');
  }  else {
    formattedTime.value = 'EndToEndId inválido';
  }
};

// 下载凭证为图片
const downloadVoucher = async () => {
  try {
    const element = document.getElementById('voucher');
    if (!element) {
      ElMessage.error('未找到凭证元素');
      return;
    }
    
    const canvas = await html2canvas(element, {
      useCORS: true,
      scale: 2,
      backgroundColor: '#fff'
    });
    
    const link = document.createElement('a');
    link.download = 'PIX-Comprovante.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (error) {
    console.error('下载凭证失败:', error);
    ElMessage.error('下载凭证失败，请重试');
  }
};





// 批量回调
const handleBatchExport = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要补发回调的数据');
    return;
  }
  
  http
    .reissueCallbackPay({
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
    .reissueCallbackPay({
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
  if (searchForm.orderTime.length === 0) {
    // 设置为昨天的时间范围
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate());
    
    const startOfDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0);
    const endOfDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
    
    // 格式化时间
    const formatDate = (date) => {
      const pad = (num) => String(num).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };
    
    searchForm.orderTime = [formatDate(startOfDay), formatDate(endOfDay)];
  }
  
  handleSearch();
});

// 获取查询参数
const getQueryParams = () => {
  return {
    billEndTime: searchForm.time[1],
    billStartTime: searchForm.time[0],
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
    await http.exportFinance(getQueryParams());

    // 跳转到导出记录页面
    router.push({ name: "exportRecord" });

    ElMessage.success("导出请求已提交，请到导出记录页面查看");
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

.empty-detail {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}
.wrap-text {
  display: inline-block;
  max-width: 250px;
  word-break: break-all;
  white-space: normal;
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

// 凭证弹窗样式
.voucher-container {
  position: relative;
  padding: 30px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.logo img{
  position: absolute;
  left: 20px;
  top: 20px;
  width: 107.7px;
  height: 30px;
  background-size: 100% 100%;
  background-repeat: no-repeat;
}

.form-group {
  margin-top: 20px;
}

.first-form {
  margin-top: 50px;
}

.form-group-title {
  text-align: right;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
}

.form-group-title-left {
  font-weight: bold;
  margin-right: 10px;
  width: 100px;
  display: inline-block;
  white-space: nowrap;
}

.form-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 12px;
}

.divider {
  border-bottom: 1px solid #ccc;
  margin-bottom: 10px;
}
</style>
