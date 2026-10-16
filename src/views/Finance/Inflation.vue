<template>
  <div class="page-container">
    <header class="page-header">
      <h1>{{ t('order.inflation.pageTitle') }}</h1>
      <hr />
    </header>

    <main class="page-content">
      <div class="content-wrapper">
        <!-- 通知卡片 -->
        <el-card class="notification-card">
          <div class="notification-content">
            <i class="el-icon-info-circle notification-icon"></i>
            <span>{{ t('order.inflation.banner') }}</span>
          </div>
        </el-card>

        <!-- 账户信息和表单卡片 -->
        <!-- <el-card class="form-card" shadow="never"> -->
          <!-- 账户信息描述 -->
          <div class="account-info">
            <h3 class="section-title">{{ t('order.inflation.account.title') }}</h3>
            <el-descriptions border>
              <el-descriptions-item :label="t('order.inflation.account.available')" :span="1">
                <span class="balance-value">({{ detail.balance }})</span>
              </el-descriptions-item>
              <el-descriptions-item :label="t('order.inflation.account.pending')" :span="1">
                <span class="balance-value">({{ detail.unsettledBalance }})</span>
              </el-descriptions-item>
              <el-descriptions-item :label="t('order.inflation.account.credit')" :span="1">
                <span class="balance-value">({{ detail.creditBalance }})</span>
              </el-descriptions-item>
              <el-descriptions-item :label="t('order.inflation.account.method')" :span="1">
                {{ t('order.inflation.account.methodText') }}
              </el-descriptions-item>
              <el-descriptions-item :label="t('order.inflation.account.cycle')" :span="1">
                {{ detail.type }}
              </el-descriptions-item>
              <el-descriptions-item :label="t('order.inflation.account.rate')" :span="2">
                {{ detail.rate }}
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 表单区域 -->
          <div class="form-section">
            <div class="section-header">
              <h3 class="section-title">{{ t('order.inflation.form.title') }}</h3>
            </div>
            <div class="form-container">
              <el-form :model="ruleForm" :loading="loading" label-width="120px">
                <!-- 到账金额 -->
                <el-form-item :label="t('order.inflation.form.amount')" prop="amount">
                  <el-input
                    v-model="ruleForm.amount"
                    type="number"
                    :placeholder="t('order.inflation.form.amountPlaceholder')"
                    @input="() => convertAmountToU()"
                  ></el-input>
                </el-form-item>
                
                <!-- 应付U数 -->
                <el-form-item :label="t('order.inflation.form.uAmount')" prop="uAmount">
                  <el-input
                    v-model="ruleForm.uAmount"
                    type="number"
                    :placeholder="t('order.inflation.form.uAmountPlaceholder')"
                    @input="() => convertUToAmount()"
                  ></el-input>
                </el-form-item>
                                <!-- 操作按钮 -->
                <el-form-item>
                  <div class="form-actions">
                    <el-button @click="reset">{{ t('common.reset') }}</el-button>
                    <el-button type="primary" @click="submit"  :disabled="true" :title="t('order.inflation.form.submitDisabled')" :loading="loading">{{ t('order.inflation.form.submit') }}</el-button>
                  </div>
                </el-form-item>
              </el-form>
            </div>
          </div>
          
          <!-- 横线分隔 -->
          <div class="divider"></div>
          
          <!-- 转账记录 -->
          <div class="transfer-history">
            <div class="history-header">
              <h3>{{ t('order.inflation.table.title') }}</h3>
              <div class="history-controls">
                <el-date-picker
                  v-model="historyTimeRange"
                  type="datetimerange"
                  :range-separator="t('common.to')"
                  :start-placeholder="t('order.inflation.table.startDate')"
                  :end-placeholder="t('order.inflation.table.endDate')"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  @change="getTransferHistory"
                />
                <el-button type="primary" size="small" @click="getTransferHistory">
                  {{ t('common.search') }}
                </el-button>
              </div>
            </div>
            
            <el-table
              v-loading="historyLoading"
              :data="transferHistory"
              style="width: 100%"
              max-height="250"
              stripe
            >
              <el-table-column prop="orderNo" :label="t('order.inflation.table.orderNo')" width="180" />
              <el-table-column prop="fromAccount" :label="t('order.inflation.table.fromAccount')" />
              <el-table-column prop="toAccount" :label="t('order.inflation.table.toAccount')" />
              <el-table-column prop="amount" :label="t('order.inflation.table.amount')" width="120">
                <template #default="scope">
                  {{ formatCurrency(scope.row.amount, currency.value) }}
                </template>
              </el-table-column>
              <el-table-column prop="status" :label="t('order.inflation.table.status')" width="100">
                <template #default="scope">
                  <el-tag :type="scope.row.status === 'SUCCESS' ? 'success' : 'danger'">
                    {{ scope.row.status === 'SUCCESS' ? t('common.success') : t('common.failed') }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="createTime" :label="t('order.inflation.table.time')" width="180" />
              <el-table-column prop="remark" :label="t('order.inflation.table.remark')" />
            </el-table>
            
            <div class="history-empty" v-if="!historyLoading && transferHistory.length === 0">
              <el-empty :description="t('order.inflation.table.empty')" />
            </div>
          </div>
        

        <!-- </el-card> -->
      </div>
    </main>

    <!-- 提交成功二维码弹窗 -->
    <el-dialog
      v-model="showQrCodeDialog"
      :title="t('order.inflation.dialog.qrTitle')"
      width="400px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <div class="dialog-content">
        <div class="qr-code-container" v-if="qrCodeUrl">
          <img :src="qrCodeUrl" :alt="t('order.inflation.dialog.qrAlt')" class="qr-code-image" />
          <div class="qr-code-tip">{{ t('order.inflation.dialog.qrTip') }}</div>
        </div>
        <div class="dialog-message" v-else>
          {{ t('order.inflation.dialog.qrLoading') }}
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="handleQrCodeDialogClose">
            {{ t('common.confirm') }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { http } from "@/api";
import useUserStore from "@/stores/user";
const { t } = useI18n();
import { Warning } from "@element-plus/icons-vue";
import { formatCurrency } from '@/utils/currency';
// 页面标题


// 初始化store和router
const userStore = useUserStore();
const router = useRouter();
const currency = computed(() => userStore.merchantInfo?.currency);

// 响应式数据
const loading = ref(false);
const detail = reactive({});
const ruleForm = reactive({
  amount: "",
  uAmount: "",
});

// 弹窗状态
const showQrCodeDialog = ref(false);
const qrCodeUrl = ref('');

// 处理二维码弹窗关闭
const handleQrCodeDialogClose = () => {
  showQrCodeDialog.value = false;
  qrCodeUrl.value = '';
  // 重置表单
  reset();
};

// 生命周期 - 组件挂载
onMounted(() => {
  // 获取汇率信息
  getExchangeRate();
  
});

// 获取汇率信息
const getExchangeRate = () => {
  http
    .exchangeRate({
      id: userStore.merchantInfo.id,
    })
    .then((res) => {
      Object.assign(detail, res.data || {});
    });
};

// 输入框失焦事件
const blur = ({ key, val: value }) => {
  if (key === "amount" && !isNaN(value) && Number(value) > 0) {
    http
      .exchangeRate({
        id: userStore.merchantInfo.id,
      })
      .then((res) => {
        let rate = res.data.rate;
        let amount = Number(value);
        ruleForm.uAmount = (amount / rate).toFixed(4);
      });
  }
};

// 金额转换为U数
const convertAmountToU = () => {
  if (ruleForm.amount && !isNaN(ruleForm.amount) && Number(ruleForm.amount) > 0) {
    http
      .exchangeRate({
        id: userStore.merchantInfo.id,
      })
      .then((res) => {
        let rate = res.data.rate;
        let amount = Number(ruleForm.amount);
        ruleForm.uAmount = (amount / rate).toFixed(4);
      });
  } else {
    ruleForm.uAmount = "";
  }
};

// U数转换为金额
const convertUToAmount = () => {
  if (ruleForm.uAmount && !isNaN(ruleForm.uAmount) && Number(ruleForm.uAmount) > 0) {
    http
      .exchangeRate({
        id: userStore.merchantInfo.id,
      })
      .then((res) => {
        let rate = res.data.rate;
        let uAmount = Number(ruleForm.uAmount);
        ruleForm.amount = (uAmount * rate).toFixed(2);
      });
  } else {
    ruleForm.amount = "";
  }
};

// 提交表单
const submit = () => {
  loading.value = true;
  http
    .usdttransfer({
      id: userStore.merchantInfo.id,
      amount: ruleForm.amount,
    })
    .then((res) => {
      loading.value = false;
      if (res.code === 200) {
        // 获取二维码
        http
          .getQrCode({
            id: userStore.merchantInfo.id,
            orderId: res.data.orderId,
          })
          .then((qrRes) => {
            if (qrRes.code === 200) {
              qrCodeUrl.value = qrRes.data.qrCodeUrl;
              showQrCodeDialog.value = true;
            } else {
              ElMessage.error("获取二维码失败");
              reset();
            }
          })
          .catch(() => {
            ElMessage.error("获取二维码失败");
            reset();
          });
      }
    })
    .catch(() => {
      loading.value = false;
    });
};

// 重置表单
const reset = () => {
  Object.assign(ruleForm, {
    amount: "",
    uAmount: "",
  });
};

// 转账记录相关
const historyTimeRange = ref([]);
const historyLoading = ref(false);
const transferHistory = ref([]);

// 初始化时间范围（默认最近7天）
const initTimeRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);
  
  historyTimeRange.value = [
    start.toISOString().slice(0, 19).replace('T', ' '),
    end.toISOString().slice(0, 19).replace('T', ' ')
  ];
};

// 获取转账记录
const getTransferHistory = async () => {
  historyLoading.value = true;
  try {
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 模拟转账记录数据
    transferHistory.value = [
      // {
      //   orderNo: 'TRF' + (Date.now() - 86400000),
      //   fromAccount: 'C95647',
      //   toAccount: 'E00001',
      //   amount: 5000.00,
      //   status: 'SUCCESS',
      //   createTime: new Date(Date.now() - 86400000).toISOString().slice(0, 19).replace('T', ' '),
      //   remark: '测试转账'
      // },
      // {
      //   orderNo: 'TRF' + (Date.now() - 172800000),
      //   fromAccount: 'C95647',
      //   toAccount: 'E00002',
      //   amount: 3000.00,
      //   status: 'SUCCESS',
      //   createTime: new Date(Date.now() - 172800000).toISOString().slice(0, 19).replace('T', ' '),
      //   remark: '业务转账'
      // }
    ];
  } catch (error) {
    ElMessage.error('获取转账记录失败');
  } finally {
    historyLoading.value = false;
  }
};

// 页面挂载时初始化
onMounted(() => {
  // 获取汇率信息
  getExchangeRate();
  
  // 初始化时间范围和获取转账记录
  initTimeRange();
  getTransferHistory();
});
</script>
<style scoped lang="scss">
@use "../../styles/variables.scss" as *;

.page-container {
  background-color: var(--color-surface, #fff);
  border-radius: 24px;
  margin: $spacing-lg;
}

.page-header {
  padding: $spacing-lg;
  h1 {
    margin: 0;
    font-size: $font-size-xl;
    color: var(--text-primary, #18181b);
  }
  hr {
    text-size-adjust: 100%;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizelegibility;
    color-scheme: light;
    font-feature-settings: "kern";
    font-family: "Geist Sans", sans-serif;
    line-height: 1.5;
    overflow-wrap: break-word;
    margin: 0px;
    box-sizing: content-box;
    height: 0px;
    overflow: visible;
    opacity: 0.2;
    border-width: 0px 0px 1px;
    border-image: initial;
    border-color: inherit;
    border-style: solid;
    width: 100%;
  }
}

.balance-info {
  font-weight: 500;
  color: $primary-color;
}

.notification-icon {
  font-size: $font-size-large;
  cursor: pointer;
  position: relative;
}

.page-content {
  padding: $spacing-lg;
}

.content-wrapper {
  background-color: var(--color-surface, #fff);
  border-radius: $border-radius-md;
}

.empty-state {
  text-align: center;
  padding: $spacing-xl;
  color: var(--text-faint, #666);
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
.search-container {
  display: flex; 
  align-items: center; 
  justify-content: center; 
  gap: 12px;
  margin-bottom: $spacing-lg;
  input{
    border-radius: 24px !important;
  }
}

/* 新增样式 */
.notification-card {
  margin-bottom: $spacing-lg;
  border-left: 4px solid $primary-color;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  font-weight: 500;
  color: var(--text-primary, #18181b);
}

.notification-icon {
  font-size: $font-size-large;
  color: $primary-color;
}

.form-card {
  margin-bottom: $spacing-lg;
  border-radius: $border-radius-md;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.account-info {
  margin-bottom: $spacing-xl;
}

.section-title {
  font-size: $font-size-large;
  font-weight: 600;
  color: var(--text-primary, #18181b);
  margin-bottom: $spacing-lg;
  padding-bottom: $spacing-sm;
  border-bottom: 1px solid #ebeef5;
}

.balance-value {
  color: $primary-color;
  font-weight: 600;
}

.form-section {
  margin-top: $spacing-xl;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-lg;
  padding-bottom: $spacing-sm;
  border-bottom: 1px solid #ebeef5;
}

.section-title {
  font-size: $font-size-large;
  font-weight: 600;
  color: var(--text-primary, #18181b);
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.form-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: $spacing-lg 0;
}

/* 弹窗样式 */
.wallet-form {
  padding: $spacing-sm 0;
}

.code-input-container {
  display: flex;
  gap: $spacing-md;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-md;
}

:v-deep(.el-form-item) {
  margin-bottom: 20px;
}

:v-deep(.el-form-item__label) {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

:v-deep(.el-input__inner),
:v-deep(.el-textarea__inner) {
  height: 40px;
  border-radius: 6px;
  border: 0px;
  transition: all 0.3s;
  font-size: 14px;
}

:v-deep(.el-textarea__inner) {
  height: auto;
  min-height: 80px;
}



:v-deep(.el-button--primary) {
  // background-color: #409eff;
  // border-color: #409eff;
  // border-radius: 6px;
  padding: 10px 20px;
  font-size: 14px;
  transition: all 0.3s;
}

:v-deep(.el-button) {
  padding: 10px 20px;
  font-size: 14px;
  transition: all 0.3s;
}

/* 针对标题样式的优化 */
:v-deep(.el-form-item__label[for=""]) {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  display: block;
}

/* 弹窗样式 */
.dialog-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.dialog-icon {
  margin-bottom: 20px;
  font-size: 48px;
  color: #f56c6c;
}

.dialog-message {
  font-size: 16px;
  color: #333;
  text-align: center;
  line-height: 1.5;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  width: 100%;
}

/* 表单操作按钮 */
.form-actions {
  text-align: center;
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 24px;
}

/* 二维码样式 */
.qr-code-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.qr-code-image {
  width: 200px;
  height: 200px;
  margin-bottom: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 10px;
  background-color: var(--color-surface, #fff);
}

.qr-code-tip {
  font-size: 14px;
  color: var(--text-faint, #666);
  text-align: center;
  line-height: 1.5;
}

/* 横线分隔符 */
.divider {
  height: 1px;
  background-color: #e0e0e0;
  margin: 32px 0;
}

/* 转账记录样式 */
.transfer-history {
  
  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-lg;
    
    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }
    
    .history-controls {
      display: flex;
      gap: $spacing-md;
      align-items: center;
      
      .el-date-picker {
        width: 300px;
      }
      
      .el-button {
        padding: 8px 16px;
        border-radius: 8px;
      }
    }
  }
  
  .el-table {
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    
    .el-table__header-wrapper th {
      background-color: #f8f9fa;
      font-weight: 600;
      color: #495057;
    }
    
    .el-table__row {
      transition: background-color 0.3s ease;
      
      &:hover {
        background-color: #f8f9fa;
      }
    }
  }
  
  .history-empty {
    padding: 32px;
    text-align: center;
  }
}

/* 响应式设计 - 转账记录 */
@media (max-width: 768px) {
  .transfer-history {
    .history-header {
      flex-direction: column;
      align-items: flex-start;
      gap: $spacing-md;
      
      .history-controls {
        width: 100%;
        flex-direction: column;
        align-items: stretch;
        
        .el-date-picker {
          width: 100%;
        }
        
        .el-button {
          width: 100%;
        }
      }
    }
    
    .el-table {
      font-size: 13px;
      
      .el-table__header-wrapper th {
        font-size: 12px;
        padding: 8px;
      }
      
      .el-table__body-wrapper td {
        padding: 10px 8px;
      }
    }
  }
}

</style>
