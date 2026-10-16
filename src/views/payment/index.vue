<template>
  <div class="app-page">
    <header class="app-page-header">
      <h1>{{ t('menu.payment') }}</h1>
    </header>

    <main>
        <!-- 搜索和筛选区域 -->
        <div class="search-panel">
          <el-form :inline="false" :model="searchForm" class="search-form">
            <el-form-item :label="t('order.payment.search.timeLabel')">
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
            <el-form-item :label="t('order.payment.search.quickTime')">
              <FilterTabs
                v-model="currentTimeRange"
                :options="timeRangeOptions"
                @update:model-value="onQuickRange"
              />
            </el-form-item>
            <el-form-item :label="t('order.payment.search.merchantOrderNo')">
              <el-input
                v-model="searchForm.merchantOrderNo"
                :placeholder="t('common.enter')"
                clearable
                style="width: 155px"
              />
            </el-form-item>
            <el-form-item :label="t('order.payment.search.platformOrderNo')">
              <el-input
                v-model="searchForm.platformOrderNo"
                :placeholder="t('common.enter')"
                clearable
                style="width: 155px"
              />
            </el-form-item>

            <el-form-item :label="t('order.payment.search.account')">
              <el-input
                v-model="searchForm.account"
                :placeholder="t('common.enter')"
                clearable
                style="width: 155px"
              />
            </el-form-item>
            <el-form-item :label="t('order.payment.search.status')">
              <el-select
                v-model="searchForm.status"
                :placeholder="t('order.payment.search.statusPlaceholder')"
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
            <el-form-item :label="t('order.payment.search.notify')">
              <el-select
                v-model="searchForm.notifyStatus"
                :placeholder="t('common.select')"
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
                  {{ t('order.payment.batchResend') }}
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
                <el-table-column :label="t('order.payment.table.merchantOrderNo')" width="250" align="left">
                  <template #default="{ row }">
                    <CopyText 
                      :text="row.merchantOrderNo" 
                      :title="t('common.copyOrderNo')"
                      :max-width="200"
                    />
                  </template>
                </el-table-column>
                <el-table-column :label="t('order.payment.table.platformOrderNo')" align="left" width="260">
                  <template #default="{ row }">
                    <CopyText 
                      :text="row.platformOrderNo" 
                      :id="'orderno-' + row.platformOrderNo"
                      :title="t('common.copyPlatformNo')"
                      :max-width="200"
                    />
                  </template>
                </el-table-column>
                <el-table-column prop="orderAmount" :label="t('order.payment.table.orderAmount')" align="right" />
                <el-table-column prop="expectAmount" :label="t('order.payment.table.expectAmount')" align="right" />
                <!-- <el-table-column prop="actualAmount" :label="t('order.payment.table.actualAmount')" align="center" /> -->
                <el-table-column prop="fee" :label="t('order.payment.table.fee')" align="right" />

                <el-table-column prop="status" :label="t('order.payment.table.status')" align="center">
                  <template #default="{ row }">
                    <StatusPill :status="row.status" />
                  </template>
                </el-table-column>
                <el-table-column prop="applyTime" :label="t('order.payment.table.applyTime')" width="180" align="center" />
                <el-table-column :label="t('order.payment.table.action')" align="center" width="100">
                  <template #default="{ row }">
                    <el-button type="primary" plain size="small" @click.stop="handleCallback(row)">
                      {{ t('order.payment.table.resend') }}
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
            <h3 class="detail-section__title">{{ t('order.payment.detail.orderInfo') }}</h3>
            <dl class="detail-list">
              <div class="detail-row">
                <dt>{{ t('order.payment.table.merchantOrderNo') }}</dt>
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
                <dt>{{ t('order.payment.table.platformOrderNo') }}</dt>
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
              <div class="detail-row">
                <dt>{{ t('order.payment.detail.bankNo') }}</dt>
                <dd>{{ currentRow.bankArea || '-' }}</dd>
              </div>
              <div class="detail-row">
                <dt>{{ t('order.payment.detail.currency') }}</dt>
                <dd>{{ currentRow.currency || '-' }}</dd>
              </div>
              <div class="detail-row">
                <dt>{{ t('order.payment.table.orderAmount') }}</dt>
                <dd class="is-amount">{{ currentRow.orderAmount || '-' }}</dd>
              </div>
              <div class="detail-row">
                <dt>{{ t('order.payment.table.expectAmount') }}</dt>
                <dd class="is-amount">{{ currentRow.expectAmount || '-' }}</dd>
              </div>
              <div class="detail-row">
                <dt>{{ t('order.payment.table.fee') }}</dt>
                <dd class="is-amount">{{ currentRow.fee || '-' }}</dd>
              </div>
            </dl>
          </section>

          <!-- 客户信息 -->
          <section class="detail-section">
            <h3 class="detail-section__title">{{ t('order.payment.detail.customerInfo') }}</h3>
            <dl class="detail-list">
              <div class="detail-row">
                <dt>{{ t('order.payment.detail.createIp') }}</dt>
                <dd>{{ currentRow.createdIp || '-' }}</dd>
              </div>
              <div class="detail-row">
                <dt>{{ t('order.payment.detail.customerName') }}</dt>
                <dd>{{ currentRow.customerName || '-' }}</dd>
              </div>
              <div class="detail-row">
                <dt>{{ t('order.payment.detail.customerAccount') }}</dt>
                <dd>{{ currentRow.customerAccount || '-' }}</dd>
              </div>
            </dl>
          </section>

          <!-- 状态与通知 -->
          <section class="detail-section">
            <h3 class="detail-section__title">{{ t('order.payment.detail.statusNotify') }}</h3>
            <dl class="detail-list">
              <div class="detail-row">
                <dt>{{ t('order.payment.table.applyTime') }}</dt>
                <dd class="is-amount">{{ currentRow.applyTime || '-' }}</dd>
              </div>
              <div class="detail-row">
                <dt>{{ t('order.payment.detail.riskType') }}</dt>
                <dd>{{ currentRow.riskype || '-' }}</dd>
              </div>
              <div class="detail-row">
                <dt>{{ t('order.payment.table.status') }}</dt>
                <dd>
                  <StatusPill v-if="currentRow.status" :status="currentRow.status" />
                  <span v-else>-</span>
                </dd>
              </div>
              <div class="detail-row">
                <dt>{{ t('order.payment.detail.notifyUrl') }}</dt>
                <dd>{{ currentRow.merchantNotifyUrl || '-' }}</dd>
              </div>
              <div class="detail-row" v-if="currentRow.currency === 'BRL'">
                <dt>{{ t('order.payment.table.credential') }}</dt>
                <dd>
                  <el-button type="primary" size="small" @click.stop="handleViewVoucher">
                    {{ t('order.payment.table.viewCredential') }}
                  </el-button>
                </dd>
              </div>
            </dl>
          </section>
        </template>
      </div>
    </el-drawer>

    <!-- 凭证弹窗 -->
    <el-dialog
      v-model="showVoucherDialog"
      width="600px"
      append-to-body
    >
      <div class="voucher-container" id="voucher">
        <div class="logo"><img src="@/assets/image/pix-payment-logo-lockup.png" alt="logo"></div>
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
import { useI18n } from "vue-i18n";
import { ElMessage, ElMessageBox  } from "element-plus";
import FilterTabs from "@/components/FilterTabs.vue";
import CopyText from "@/components/CopyText.vue";
import StatusPill from "@/components/StatusPill.vue";
import { getNow } from "@/utils/brazilTime";
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
    default: "",
  },
});

// 状态筛选项（值与后端约定一致：-1 全部 / 0 处理中 / 1 成功 / 2 失败）
// 已移至 useI18n 之后定义

// 搜索表单
const searchForm = reactive({
    // 账单时间
        orderTime: [],
        // 处理时间
        // handleTime: [],
        status: -1,
        notify: -1,
        notifyStatus: -1,
        account: "",
        merchantOrderNo: "",
        platformOrderNo: "",
});
const timeRangeOptions = []; // 已移至 useI18n 之后定义

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

// i18n
const { t } = useI18n();

// 状态筛选项
const statusOptions = [
  { label: t('order.payment.status.all'), value: -1 },
  { label: t('order.payment.status.processing'), value: 0 },
  { label: t('order.payment.status.success'), value: 1 },
  { label: t('order.payment.status.failed'), value: 2 },
];

// 通知筛选项
const options = [
  { label: t('order.payment.notify.all'), value: -1 },
  { label: t('order.payment.notify.success'), value: 1 },
  { label: t('order.payment.notify.failed'), value: 2 },
];

// 快捷时间选项
timeRangeOptions.length = 0;
timeRangeOptions.push(
  { label: t('order.timeRange.yesterday'), value: "yesterday" },
  { label: t('order.timeRange.today'), value: "today" },
  { label: t('order.timeRange.threeDays'), value: "3days" },
  { label: t('order.timeRange.sevenDays'), value: "7days" },
);

// 快捷时间药丸回调（昨天 / 今天 / 3天 / 7天，按商户币种时区计算，逻辑与原 TimeRangeSelector 一致）
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
  currentTimeRange.value = 'today';
};

// 刷新方法
const clearSearch = () => {
  setDefaultTime();
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
  if (searchForm.account && (!searchForm.orderTime || !Array.isArray(searchForm.orderTime) || searchForm.orderTime.length < 2)) {
    ElMessage.warning(t('order.payment.msg.accountNeedTime'));
    return;
  }
  loading.value = true;
  try {
    // 模拟API调用 - 实际项目中替换为真实API调用
    const res = await http.payOrderPage({

    "pageNo": pagination.currentPage,
    "pageSize": pagination.pageSize,
    "id": userStore.userInfo.id,
    "status": searchForm.status,
    "notifyStatus": searchForm.notifyStatus,
    "account": searchForm.account,
    "merchantOrderNo": searchForm.merchantOrderNo,
    "platformOrderNo": searchForm.platformOrderNo,
    "orderStartTime": searchForm.orderTime?.[0] || '',
    "orderEndTime": searchForm.orderTime?.[1] || '',
    "handleStartTime": '',
    "handleEndTime": '',

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

// 查看凭证
const handleViewVoucher = () => {
  updateVoucherTime(currentRow.value.time);
  voucherInfo.value = currentRow.value.memo;
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
      ElMessage.error(t('order.payment.msg.voucherNotFound'));
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
    ElMessage.error(t('order.payment.msg.voucherDownloadFailed'));
  }
};





// 批量回调
const handleBatchExport = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning(t('order.payment.msg.batchNeedSelect'));
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
    "status": searchForm.status,
    "notifyStatus": searchForm.notifyStatus,
    "account": searchForm.account,
    "merchantOrderNo": searchForm.merchantOrderNo,
    "platformOrderNo": searchForm.platformOrderNo,
    "orderStartTime": searchForm.orderTime?.[0] || '',
    "orderEndTime": searchForm.orderTime?.[1] || '',
    "handleStartTime": '',
    "handleEndTime": '',
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
    let res = await http.exportPay(getQueryParams());
    if(res.code === 200){
      ElMessage.success(res.msg || t('common.exportSubmitted'));
          // 跳转到导出记录页面
    router.push({ name: "exportRecord" });
    } else {
      ElMessage.error(res.msg || t('common.exportFailed'));
    }
    
  } catch (error) {
    if (error !== "cancel") {
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

// 凭证弹窗样式（html2canvas 截图源：凭证作为导出票证恒为白底，不随主题变化）
.voucher-container {
  position: relative;
  padding: 30px;
  background: var(--color-surface, #ffffff);
  border-radius: 8px;
  border: 1px solid var(--color-border-soft, #e0e0e0);
  box-shadow: var(--shadow-md, 0 2px 10px rgba(0, 0, 0, 0.08));
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
  border-bottom: 1px solid var(--color-divider, #ccc);
  margin-bottom: 10px;
}
</style>
