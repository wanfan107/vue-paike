<template>
  <div class="page-container">
    <header class="page-header">
      <h1>{{ t('menu.groupRotation') }}</h1>
      <hr />
    </header>

    <main class="page-content">
      <div class="content-wrapper">
          <div class="account-balance">
            <span class="balance-label">账户余额</span>
            <span class="balance-amount">{{ formatCurrency(currentAccount.balance, currency.value) }}</span>
          </div>
          <div class="form-container">
          <el-form :model="transferForm" :rules="rules" ref="transferFormRef" label-width="120px">
            <el-form-item label="转出账户" prop="fromAccount">
              <el-select v-model="transferForm.fromAccount" disabled>
                <el-option :label="currentAccount.name" :value="currentAccount.id"></el-option>
              </el-select>
            </el-form-item>
            
            <el-form-item label="转入账户" prop="toAccount">
              <el-select v-model="transferForm.toAccount" placeholder="请选择转入账户">
                <el-option 
                  v-for="account in availableAccounts" 
                  :key="account.id" 
                  :label="account.name" 
                  :value="account.id"
                ></el-option>
              </el-select>
            </el-form-item>
            
            <el-form-item label="转账金额" prop="amount">
              <el-input 
                v-model.number="transferForm.amount" 
                placeholder="请输入转账金额" 
                type="number"
                :min="0.01"
                :step="0.01"
                @input="convertAmountToU"
              >
                <template #prefix>{{ getCurrencySymbol(currency.value) }}</template>
              </el-input>
              <div class="amount-tips">
                最小转账金额: {{ getCurrencySymbol(currency.value) }} 0.01
              </div>
            </el-form-item>
            
            <!-- <el-form-item label="转账U数" prop="uAmount">
              <el-input 
                v-model.number="transferForm.uAmount" 
                placeholder="单位：USDT" 
                type="number"
                :min="0.01"
                :step="0.01"
                @input="convertUToAmount"
              >
              </el-input>
            </el-form-item> -->
            
            <el-form-item label="转账备注">
              <el-input 
                v-model="transferForm.remark" 
                placeholder="请输入转账备注（选填）"
                type="textarea"
                :rows="2"
              ></el-input>
            </el-form-item>
            
            <el-form-item>
              <div class="form-actions">
                <el-button @click="resetForm">重置</el-button>
                <el-button type="primary" @click="submitTransfer" :loading="loading">
                  确认转账
                </el-button>
              </div>
            </el-form-item>
          </el-form>
          </div>
          
          <!-- 横线分隔 -->
          <div class="divider"></div>
          
          <!-- 转账记录 -->
          <div class="transfer-history">
            <div class="history-header">
              <h3>转账记录</h3>
              <div class="history-controls">
                <el-date-picker
                  v-model="historyTimeRange"
                  type="datetimerange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  @change="getTransferHistory"
                />
                <el-button type="primary" size="small" @click="getTransferHistory">
                  查询
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
              <el-table-column prop="orderNo" label="转账单号" width="180" />
              <el-table-column prop="fromAccount" label="转出账户" />
              <el-table-column prop="toAccount" label="转入账户" />
              <el-table-column prop="amount" label="转账金额" width="120">
                <template #default="scope">
                  {{ formatCurrency(scope.row.amount, currency.value) }}
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="scope">
                  <el-tag :type="scope.row.status === 'SUCCESS' ? 'success' : 'danger'">
                    {{ scope.row.status === 'SUCCESS' ? '成功' : '失败' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="createTime" label="转账时间" width="180" />
              <el-table-column prop="remark" label="备注" />
            </el-table>
            
            <div class="history-empty" v-if="!historyLoading && transferHistory.length === 0">
              <el-empty description="暂无转账记录" />
            </div>
          </div>
      </div>
    </main>
    
    <!-- 授信款未还清弹窗 -->
    <el-dialog
      v-model="showPrepayDialog"
      title="提示"
      width="400px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <div class="dialog-content">
        <div class="dialog-icon">
          <el-icon><Warning /></el-icon>
        </div>
        <div class="dialog-message">
          授信款未还清，不能提U
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="handleDialogClose">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import {  Warning } from "@element-plus/icons-vue";
import { ref, reactive, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import useUserStore from '@/stores/user';
import { formatCurrency, getCurrencySymbol } from '@/utils/currency';

// 账户互转
const { t } = useI18n();

const props = defineProps({
  title: {
    type: String,
    default: "",
  },
});

// 初始化router
const router = useRouter();
const userStore = useUserStore();
const currency = computed(() => userStore.merchantInfo?.currency);

// 表单引用
const transferFormRef = ref(null);

// 加载状态
const loading = ref(false);

// 弹窗状态
const showPrepayDialog = ref(false);

// 处理弹窗关闭
const handleDialogClose = () => {
  showPrepayDialog.value = false;
  // 返回上一页
  router.back();
};

// 当前账户信息
const currentAccount = reactive({
  id: '11525',
  name: 'C95647',
  balance: 100000.00
});

// 可用的转入账户
const availableAccounts = reactive([
  {
    id: '11743',
    name: 'E00001'
  },
  {
    id: '11825',
    name: 'E00002'
  }
]);

// 转账表单
const transferForm = reactive({
  fromAccount: currentAccount.id,
  toAccount: '',
  amount: '',
  // uAmount: '',
  remark: ''
});

// 表单验证规则
const rules = {
  toAccount: [
    { required: true, message: '请选择转入账户', trigger: 'change' }
  ],
  amount: [
    { required: true, message: '请输入转账金额', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '转账金额不能小于0.01', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value > currentAccount.balance) {
          callback(new Error('转账金额不能超过账户余额'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ],
  // uAmount: [
  //   { required: true, message: '请输入转账U数', trigger: 'blur' },
  //   { type: 'number', min: 0.01, message: '转账U数不能小于0.01', trigger: 'blur' }
  // ]
};

// 金额转换为U数
const convertAmountToU = () => {
  if (transferForm.amount && !isNaN(transferForm.amount) && Number(transferForm.amount) > 0) {
    // 模拟汇率，实际应该从API获取
    const rate = 7.25;
    let amount = Number(transferForm.amount);
    transferForm.uAmount = (amount / rate).toFixed(4);
  } else {
    transferForm.uAmount = '';
  }
};

// U数转换为金额
// const convertUToAmount = () => {
//   if (transferForm.uAmount && !isNaN(transferForm.uAmount) && Number(transferForm.uAmount) > 0) {
//     // 模拟汇率，实际应该从API获取
//     const rate = 7.25;
//     let uAmount = Number(transferForm.uAmount);
//     transferForm.amount = (uAmount * rate).toFixed(2);
//   } else {
//     transferForm.amount = '';
//   }
// };

// 重置表单
const resetForm = () => {
  transferFormRef.value.resetFields();
  // transferForm.uAmount = '';
};

// 提交转账
const submitTransfer = async () => {
  await transferFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        // 模拟转账请求
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // 模拟转账成功
        ElMessage.success('转账成功');
        
        // 重置表单
        resetForm();
        
        // 更新余额（模拟）
        currentAccount.balance -= transferForm.amount;
        
        // 刷新转账记录
        getTransferHistory();
      } catch (error) {
        ElMessage.error('转账失败，请稍后重试');
      } finally {
        loading.value = false;
      }
    }
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
      {
        orderNo: 'TRF' + (Date.now() - 86400000),
        fromAccount: 'C95647',
        toAccount: 'E00001',
        amount: 5000.00,
        status: 'SUCCESS',
        createTime: new Date(Date.now() - 86400000).toISOString().slice(0, 19).replace('T', ' '),
        remark: '测试转账'
      },
      {
        orderNo: 'TRF' + (Date.now() - 172800000),
        fromAccount: 'C95647',
        toAccount: 'E00002',
        amount: 3000.00,
        status: 'SUCCESS',
        createTime: new Date(Date.now() - 172800000).toISOString().slice(0, 19).replace('T', ' '),
        remark: '业务转账'
      },
      {
        orderNo: 'TRF' + (Date.now() - 172800000),
        fromAccount: 'C95647',
        toAccount: 'E00002',
        amount: 3000.00,
        status: 'SUCCESS',
        createTime: new Date(Date.now() - 172800000).toISOString().slice(0, 19).replace('T', ' '),
        remark: '业务转账'
      },
      {
        orderNo: 'TRF' + (Date.now() - 172800000),
        fromAccount: 'C95647',
        toAccount: 'E00002',
        amount: 3000.00,
        status: 'SUCCESS',
        createTime: new Date(Date.now() - 172800000).toISOString().slice(0, 19).replace('T', ' '),
        remark: '业务转账'
      },
      {
        orderNo: 'TRF' + (Date.now() - 172800000),
        fromAccount: 'C95647',
        toAccount: 'E00002',
        amount: 3000.00,
        status: 'SUCCESS',
        createTime: new Date(Date.now() - 172800000).toISOString().slice(0, 19).replace('T', ' '),
        remark: '业务转账'
      },
      {
        orderNo: 'TRF' + (Date.now() - 172800000),
        fromAccount: 'C95647',
        toAccount: 'E00002',
        amount: 3000.00,
        status: 'SUCCESS',
        createTime: new Date(Date.now() - 172800000).toISOString().slice(0, 19).replace('T', ' '),
        remark: '业务转账'
      },
      {
        orderNo: 'TRF' + (Date.now() - 172800000),
        fromAccount: 'C95647',
        toAccount: 'E00002',
        amount: 3000.00,
        status: 'SUCCESS',
        createTime: new Date(Date.now() - 172800000).toISOString().slice(0, 19).replace('T', ' '),
        remark: '业务转账'
      },
      {
        orderNo: 'TRF' + (Date.now() - 172800000),
        fromAccount: 'C95647',
        toAccount: 'E00002',
        amount: 3000.00,
        status: 'SUCCESS',
        createTime: new Date(Date.now() - 172800000).toISOString().slice(0, 19).replace('T', ' '),
        remark: '业务转账'
      }
    ];
  } catch (error) {
    ElMessage.error('获取转账记录失败');
  } finally {
    historyLoading.value = false;
  }
};

// 页面挂载时初始化
import { onMounted } from 'vue';
onMounted(() => {
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
  min-height: 100%;
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

.page-content {
  padding: $spacing-lg;
}

.content-wrapper {
  background-color: var(--color-surface, #fff);
  padding: $spacing-xl;
  border-radius: $border-radius-md;
}

// 转账卡片样式
.transfer-card {
  max-width: 800px;
  margin: 0 auto;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

// 表单容器
.form-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: $spacing-lg 0;
}

// 表单样式
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
  padding: 10px 20px;
  font-size: 14px;
  transition: all 0.3s;
}

:v-deep(.el-button) {
  padding: 10px 20px;
  font-size: 14px;
  transition: all 0.3s;
}

// 账户余额信息
.account-balance {
  margin-bottom: $spacing-xl;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  
  .balance-label {
    font-size: 14px;
    color: #495057;
    font-weight: 600;
  }
  
  .balance-amount {
    font-size: 20px;
    font-weight: 700;
    color: $primary-color;
  }
}

// 金额提示信息
.amount-tips {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}

// 表单操作按钮
.form-actions {
  text-align: center;
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 24px;
}

// 响应式设计
@media (max-width: 768px) {
  .page-container {
    margin: $spacing-sm;
    border-radius: 16px;
  }
  
  .page-header {
    padding: $spacing-md;
  }
  
  .page-content {
    padding: $spacing-md;
  }
  
  .content-wrapper {
    padding: $spacing-md;
  }
  
  .form-container {
    max-width: 100%;
  }
  
  .form-actions {
    flex-direction: column;
    
    .el-button {
      width: 100%;
    }
  }
}

// 横线分隔符
.divider {
  height: 1px;
  background-color: #e0e0e0;
  margin: 32px 0;
}

// 转账记录样式
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

// 响应式设计 - 转账记录
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
</style>
