<template>
  <div class="page-container">
    <header class="page-header">
      <h1>{{ t('order.transfer.pageTitle') }}</h1>
      <hr />
    </header>

    <main class="page-content">
      <div class="content-wrapper">
        <!-- 账户信息和表单卡片 -->
          <!-- 账户信息描述 -->
          <div class="account-info">
            <h3 class="section-title">{{ t('order.transfer.account.title') }}</h3>
            <el-descriptions border>
              <el-descriptions-item :label="t('order.transfer.account.available')" :span="1">
                <span class="balance-value">({{ detail.balance }})</span>
              </el-descriptions-item>
              <el-descriptions-item :label="t('order.transfer.account.pending')" :span="1">
                <span class="balance-value">({{ detail.unsettledBalance }})</span>
              </el-descriptions-item>
              <el-descriptions-item :label="t('order.transfer.account.credit')" :span="1">
                <span class="balance-value">({{ detail.creditBalance }})</span>
              </el-descriptions-item>
              <el-descriptions-item :label="t('order.transfer.account.method')" :span="1">
                {{ t('order.transfer.account.methodText') }}
              </el-descriptions-item>
              <el-descriptions-item :label="t('order.transfer.account.cycle')" :span="1">
                {{ detail.type }}
              </el-descriptions-item>
              <el-descriptions-item :label="t('order.transfer.account.rate')" :span="2">
                {{ detail.rate }}
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 表单区域 -->
          <div class="form-section">
            <div class="section-header">
              <h3 class="section-title">{{ t('order.transfer.form.title') }}</h3>
            </div>
            <div class="form-container">
              <el-form  :model="ruleForm" :rules="rules" ref="formRef" label-width="120px">
                <!-- 提现金额 -->
                <el-form-item :label="t('order.transfer.form.amount')" prop="amount">
                  <div class="amount-input-container">
                    <el-input
                      v-model.number="ruleForm.amount"
                      type="number"
                      :placeholder="t('order.transfer.form.amountPlaceholder')"
                      @input="() => { calculateAmounts(); convertAmountToU(); }"
                    ></el-input>
                    <el-button type="primary" size="small">{{ t('order.transfer.form.splitBtn') }}</el-button>
                  </div>
                </el-form-item>
                
                <!-- 到账金额和手续费 -->
                <div class="row-container">
                  <el-form-item :label="t('order.transfer.form.arrivalAmount')" prop="arrivalAmount">
                    <el-input
                      v-model="ruleForm.arrivalAmount"
                    type="number"
                    :placeholder="t('order.transfer.form.arrivalPlaceholder')"
                    @input="convertUToAmount"
                    ></el-input>
                  </el-form-item>
                  <el-form-item :label="t('order.transfer.form.fee')" prop="fee">
                    <el-input
                      v-model="ruleForm.fee"
                      disabled
                    ></el-input>
                  </el-form-item>
                </div>
                
                <!-- 转账账号 -->
                <el-form-item :label="t('order.transfer.form.account')" prop="transferAccount">
                  <el-input
                    v-model="ruleForm.transferAccount"
                    :placeholder="t('order.transfer.form.accountPlaceholder')"
                  ></el-input>
                </el-form-item>
                
                <!-- 银行/类型 -->
                <el-form-item :label="t('order.transfer.form.bankType')" prop="bankType">
                  <el-select
                    v-model="ruleForm.bankType"
                    :placeholder="t('order.transfer.form.bankPlaceholder')"
                    style="width: 100%"
                  >
                    <el-option :label="t('order.transfer.form.banks.boc')" value="BOC" />
                    <el-option :label="t('order.transfer.form.banks.icbc')" value="ICBC" />
                    <el-option :label="t('order.transfer.form.banks.ccb')" value="CCB" />
                    <el-option :label="t('order.transfer.form.banks.abc')" value="ABC" />
                    <el-option :label="t('order.transfer.form.banks.cmb')" value="CMB" />
                  </el-select>
                </el-form-item>
                
                <!-- 收款人 -->
                <el-form-item :label="t('order.transfer.form.recipient')" prop="recipient">
                  <el-input
                    v-model="ruleForm.recipient"
                    :placeholder="t('order.transfer.form.recipientPlaceholder')"
                  ></el-input>
                </el-form-item>
                
                <!-- 证件号 -->
                <el-form-item :label="t('order.transfer.form.taxId')" prop="recipientTaxId">
                  <el-input
                    v-model="ruleForm.recipientTaxId"
                    :placeholder="t('order.transfer.form.taxIdPlaceholder')"
                  ></el-input>
                </el-form-item>
                
                <!-- 支付密码 -->
                <el-form-item :label="t('order.transfer.form.password')" prop="password">
                  <el-input
                    v-model="ruleForm.password"
                    type="password"
                    :placeholder="t('order.transfer.form.passwordPlaceholder')"
                  ></el-input>
                </el-form-item>
                
                <!-- MFA2验证码 -->
                <el-form-item :label="t('order.transfer.form.mfa')" prop="googleCode">
                  <el-input
                    v-model="ruleForm.googleCode"
                    :placeholder="t('order.transfer.form.mfaPlaceholder')"
                  ></el-input>
                </el-form-item>
                
                <!-- 操作按钮 -->
                <el-form-item>
                  <div class="form-actions">
                    <el-button @click="reset">{{ t('order.transfer.form.reset') }}</el-button>
                    <el-button type="primary" @click="submit"  :disabled="true" :title="t('order.transfer.form.submitTitle')" :loading="loading">{{ t('order.transfer.form.submit') }}</el-button>
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
              <h3>{{ t('order.transfer.table.title') }}</h3>
              <div class="history-controls">
                <el-date-picker
                  v-model="historyTimeRange"
                  type="datetimerange"
                  :range-separator="t('common.to')"
                  :start-placeholder="t('order.transfer.table.startDate')"
                  :end-placeholder="t('order.transfer.table.endDate')"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  @change="getTransferHistory"
                />
                <el-button type="primary" size="small" @click="getTransferHistory">
                  {{ t('order.transfer.table.searchBtn') }}
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
              <el-table-column prop="orderNo" :label="t('order.transfer.table.orderNo')" width="180" />
              <el-table-column prop="fromAccount" :label="t('order.transfer.table.fromAccount')" />
              <el-table-column prop="toAccount" :label="t('order.transfer.table.toAccount')" />
              <el-table-column prop="amount" :label="t('order.transfer.table.amount')" width="120">
                <template #default="scope">
                  {{ formatCurrency(scope.row.amount, currency.value) }}
                </template>
              </el-table-column>
              <el-table-column prop="status" :label="t('order.transfer.table.status')" width="100">
                <template #default="scope">
                  <el-tag :type="scope.row.status === 'SUCCESS' ? 'success' : 'danger'">
                    {{ scope.row.status === 'SUCCESS' ? t('order.transfer.table.statusSuccess') : t('order.transfer.table.statusFailed') }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="createTime" :label="t('order.transfer.table.time')" width="180" />
              <el-table-column prop="remark" :label="t('order.transfer.table.remark')" />
            </el-table>
            
            <div class="history-empty" v-if="!historyLoading && transferHistory.length === 0">
              <el-empty :description="t('order.transfer.table.empty')" />
            </div>
          </div>
        

      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { http } from "@/api";
import useUserStore from "@/stores/user";
import { Warning } from "@element-plus/icons-vue";
import { formatCurrency } from '@/utils/currency';
const { t } = useI18n();
// 页面标题


// 初始化store和router
const userStore = useUserStore();
const router = useRouter();
const currency = computed(() => userStore.merchantInfo?.currency);

// 响应式数据
const loading = ref(false);
const detail = reactive({});
const formRef = ref(null);
const ruleForm = reactive({
  amount: "",
  uAmount: "",
  arrivalAmount: "",
  fee: "",
  transferAccount: "",
  bankType: "",
  recipient: "",
  recipientTaxId: "",
  password: "",
  googleCode: ""
});

// 表单验证规则
const rules = {
  amount: [
    { required: true, message: t('order.transfer.rules.amountRequired'), trigger: 'blur' },
    { type: 'number', min: 5, message: t('order.transfer.rules.amountMin'), trigger: 'blur' }
  ],
  transferAccount: [
    { required: true, message: t('order.transfer.rules.accountRequired'), trigger: 'blur' }
  ],
  bankType: [
    { required: true, message: t('order.transfer.rules.bankRequired'), trigger: 'change' }
  ],
  recipient: [
    { required: true, message: t('order.transfer.rules.recipientRequired'), trigger: 'blur' }
  ],
  password: [
    { required: true, message: t('order.transfer.rules.passwordRequired'), trigger: 'blur' }
  ],
  googleCode: [
    { required: true, message: t('order.transfer.rules.mfaRequired'), trigger: 'blur' }
  ]
};

// 计算到账金额和手续费
const calculateAmounts = () => {
  if (ruleForm.amount && !isNaN(ruleForm.amount) && Number(ruleForm.amount) >= 5) {
    // 计算手续费：0.0450固定费用
    const fee = 0.0450;
    ruleForm.fee = fee.toFixed(4);
    // 计算到账金额
    ruleForm.arrivalAmount = (Number(ruleForm.amount) - fee).toFixed(2);
  } else {
    ruleForm.fee = "";
    ruleForm.arrivalAmount = "";
  }
};

// 金额转换为U数
const convertAmountToU = () => {
  if (ruleForm.amount && !isNaN(ruleForm.amount) && Number(ruleForm.amount) >= 5) {
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
  if (ruleForm.arrivalAmount && !isNaN(ruleForm.arrivalAmount) && Number(ruleForm.arrivalAmount) > 0) {
    http
      .exchangeRate({
        id: userStore.merchantInfo.id,
      })
      .then((res) => {
        let rate = res.data.rate;
        let arrivalAmount = Number(ruleForm.arrivalAmount);
        ruleForm.amount = (arrivalAmount * rate).toFixed(2);
        // 同时计算到账金额和手续费
        calculateAmounts();
      });
  } else {
    ruleForm.amount = "";
    ruleForm.fee = "";
    ruleForm.arrivalAmount = "";
  }
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

// 提交表单
const submit = async () => {
  if (formRef.value) {
    await formRef.value.validate(async (valid) => {
      if (valid) {
        loading.value = true;
        http
          .usdttransfer({
            id: userStore.merchantInfo.id,
            amount: ruleForm.amount,
            transferAccount: ruleForm.transferAccount,
            bankType: ruleForm.bankType,
            recipient: ruleForm.recipient,
            recipientTaxId: ruleForm.recipientTaxId,
            password: ruleForm.password,
            googleCode: ruleForm.googleCode
          })
          .then((res) => {
            loading.value = false;
            if (res.code === 200) {
              ElMessage.success(t('order.transfer.msg.success'));
              reset();
            }
          })
          .catch(() => {
            loading.value = false;
            ElMessage.error(t('order.transfer.msg.failed'));
          });
      }
    });
  }
};

// 重置表单
const reset = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  Object.assign(ruleForm, {
    amount: "",
    arrivalAmount: "",
    fee: "",
    transferAccount: "",
    bankType: "",
    recipient: "",
    recipientTaxId: "",
    password: "",
    googleCode: ""
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
    ];
  } catch (error) {
    ElMessage.error(t('order.transfer.msg.historyFailed'));
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

/* 金额输入容器 */
.amount-input-container {
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
  
  .el-input {
    flex: 1;
  }
  
  .el-button {
    white-space: nowrap;
  }
}

/* 行容器 */
.row-container {
  display: flex;
  gap: 20px;
  
  .el-form-item {
    flex: 1;
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
}
:deep(.el-input__inner:-webkit-autofill),
:deep(.el-input__inner:-webkit-autofill:hover),
:deep(.el-input__inner:-webkit-autofill:focus),
:deep(.el-input__inner:-webkit-autofill:active) {
  -webkit-background-clip: text;
  -webkit-text-fill-color: #000;
  background-color: var(--color-surface, #fff) !important;
  background-clip: text;
  transition: background-color 5000s ease-in-out 0s;
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
