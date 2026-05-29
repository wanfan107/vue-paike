<template>
  <div class="page-container">
    <header class="page-header">
      <h1>{{ title }}</h1>
      <hr />
    </header>

    <main class="page-content">
      <div class="content-wrapper">
        <!-- 通知卡片 -->
        <!-- <el-card class="notification-card">
          <div class="notification-content">
            <i class="el-icon-info-circle notification-icon"></i>
            <span>通过Telegram申请转账已经上线，欢迎使用。</span>
          </div>
        </el-card> -->

        <!-- 账户信息和表单卡片 -->
        <!-- <el-card class="form-card" shadow="never"> -->
          <!-- 账户信息描述 -->
          <div class="account-info">
            <h3 class="section-title">集团账户信息</h3>
            <el-descriptions border>
              <el-descriptions-item label="集团可用余额" :span="1">
                <span class="balance-value">-</span>
              </el-descriptions-item>
              <el-descriptions-item label="集团待结算余额" :span="1">
                <span class="balance-value">-</span>
              </el-descriptions-item>
              <!-- <el-descriptions-item label="集团授信余额" :span="1">
                <span class="balance-value">-</span>
              </el-descriptions-item>
              <el-descriptions-item label="MFA2余额" :span="1">
                <span class="balance-value">-</span>
              </el-descriptions-item> -->
              <el-descriptions-item label="互转手续费" :span="1">
                <span class="balance-value">-</span>
              </el-descriptions-item>
              <el-descriptions-item label="最小转账金额" :span="2">
                <span class="balance-value">-</span>
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 表单区域 -->
          <div class="form-section">
            <div class="section-header">
              <h3 class="section-title">商户互转</h3>
            </div>
            <div class="form-container">
              <el-form  :model="ruleForm" :rules="rules" ref="formRef" label-width="120px">
                <!-- 转出商户 -->
                <el-form-item label="转出商户" prop="fromMerchant">
                  <div class="merchant-select-container">
                    <el-select
                      v-model="ruleForm.fromMerchant"
                      placeholder="请选择转出商户"
                      style="width: 100%"
                      @change="handleFromMerchantChange"
                    >
                      <el-option
                        v-for="merchant in merchantOptions"
                        :key="merchant.code"
                        :value="merchant.code"
                      >
                        <div class="option-content">
                          <span class="option-code">{{ merchant.code }}</span>
                          <span class="option-balance">余额: {{ merchant.balance || 0 }}</span>
                        </div>
                      </el-option>
                    </el-select>
                    <span v-if="ruleForm.fromMerchant" class="balance-label">
                      余额: {{ getMerchantBalance(ruleForm.fromMerchant) }}
                    </span>
                  </div>
                </el-form-item>
                
                <!-- 转入商户 -->
                <el-form-item label="转入商户" prop="toMerchant">
                  <div class="merchant-select-container">
                    <el-select
                      v-model="ruleForm.toMerchant"
                      placeholder="请选择转入商户"
                      style="width: 100%"
                    >
                      <el-option
                        v-for="merchant in merchantOptions.filter(m => m.code !== ruleForm.fromMerchant)"
                        :key="merchant.code"
                        :value="merchant.code"
                      >
                        <div class="option-content">
                          <span class="option-code">{{ merchant.code }}</span>
                          <span class="option-balance">余额: {{ merchant.balance || 0 }}</span>
                        </div>
                      </el-option>
                    </el-select>
                    <span v-if="ruleForm.toMerchant" class="balance-label">
                      余额: {{ getMerchantBalance(ruleForm.toMerchant) }}
                    </span>
                  </div>
                </el-form-item>
                
                <!-- 转账金额 -->
                <el-form-item label="转账金额" prop="amount">
                  <el-input-number
                    v-model="ruleForm.amount"
                    placeholder="请输入转账金额"
                    :min="10"
                    :step="1"
                    style="width: 100%"
                  ></el-input-number>
                </el-form-item>
                
                <!-- 支付密码 -->
                <el-form-item label="支付密码" prop="password">
                  <el-input
                    v-model="ruleForm.password"
                    type="password"
                    placeholder="请输入集团账户支付密码"
                  ></el-input>
                </el-form-item>
                
                <!-- MFA2验证码 -->
                <el-form-item label="MFA2验证码" prop="mfaCode">
                  <el-input
                    v-model="ruleForm.mfaCode"
                    placeholder="请输入集团账户MFA2验证码"
                  ></el-input>
                </el-form-item>
                
                <!-- 备注 -->
                <el-form-item label="备注" prop="remark">
                  <el-input
                    v-model="ruleForm.remark"
                    type="textarea"
                    placeholder="选填，转账备注（最多50字）"
                  ></el-input>
                </el-form-item>
                
                <!-- 操作按钮 -->
                <el-form-item>
                  <div class="form-actions">
                    <el-button @click="reset">重置</el-button>
                    <el-button type="primary" :disabled="true" title="暂未开放">
                      <span>确认</span>
                      <span class="button-tip">（暂未开放）</span>
                    </el-button>
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
                  ¥{{ scope.row.amount.toLocaleString() }}
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
        

        <!-- </el-card> -->
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { http } from "@/api";
// 页面标题
const title = '集团商户互转';

// 响应式数据
const loading = ref(false);
const formRef = ref(null);

// 商户选项（模拟数据，实际应从接口获取）
const merchantOptions = ref([
  { code: 'C95148', balance: 83424.8143 },
  { code: 'C95149', balance: 52239.7514 },
  { code: 'C95150', balance: 0.00 },
  { code: 'C95151', balance: 10000.00 }
]);

const ruleForm = reactive({
  fromMerchant: "",
  toMerchant: "",
  amount: 0,
  password: "",
  mfaCode: "",
  remark: ""
});

// 表单验证规则
const rules = {
  fromMerchant: [
    { required: true, message: '请选择转出商户', trigger: 'change' }
  ],
  toMerchant: [
    { required: true, message: '请选择转入商户', trigger: 'change' }
  ],
  amount: [
    { required: true, message: '请输入转账金额', trigger: 'blur' },
    { type: 'number', min: 10, message: '转账金额不能小于10', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入支付密码', trigger: 'blur' }
  ],
  mfaCode: [
    { required: true, message: '请输入MFA2验证码', trigger: 'blur' }
  ]
};

// 获取商户列表
const getMerchantList = () => {
  http
    .getGroupMerchants()
    .then((res) => {
      if (res.code === 200 && res.data) {
        merchantOptions.value = res.data.map(m => ({ code: m.code, balance: m.balance }));
      }
    })
    .catch(() => {
      ElMessage.error("获取商户列表失败");
    });
};

// 转出商户改变时，如果与转入商户相同则清空转入商户
const handleFromMerchantChange = (value) => {
  if (ruleForm.toMerchant && value === ruleForm.toMerchant) {
    ruleForm.toMerchant = '';
  }
};

// 根据商户号获取余额
const getMerchantBalance = (code) => {
  const merchant = merchantOptions.value.find(m => m.code === code);
  return merchant ? merchant.balance || 0 : 0;
};

// 提交表单
const submit = async () => {
  if (formRef.value) {
    await formRef.value.validate(async (valid) => {
      if (valid) {
        loading.value = true;
        http
          .groupTransfer({
            fromMerchant: ruleForm.fromMerchant,
            toMerchant: ruleForm.toMerchant,
            amount: ruleForm.amount,
            password: ruleForm.password,
            mfaCode: ruleForm.mfaCode,
            remark: ruleForm.remark
          })
          .then((res) => {
            loading.value = false;
            if (res.code === 200) {
              ElMessage.success("转账成功");
              reset();
            }
          })
          .catch(() => {
            loading.value = false;
            ElMessage.error("转账失败，请稍后重试");
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
    fromMerchant: "",
    toMerchant: "",
    amount: 0,
    password: "",
    mfaCode: "",
    remark: ""
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

let refreshTimer = null;
// 页面挂载时初始化
onMounted(() => {
  // 获取商户列表
  getMerchantList();
   // 每2秒刷新一次
  refreshTimer = setInterval(getMerchantList, 2000);
  // 初始化时间范围和获取转账记录
  initTimeRange();
  getTransferHistory();
});
// 在组件卸载时清除定时器
onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
});
</script>
<style scoped lang="scss">
@use "../../styles/variables.scss" as *;

.page-container {
  background-color: #fff;
  border-radius: 24px;
  margin: $spacing-lg;
}

.page-header {
  padding: $spacing-lg;
  h1 {
    margin: 0;
    font-size: $font-size-xl;
    color: $text-color;
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
  background-color: white;
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
  color: $text-color;
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
  color: $text-color;
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
  color: $text-color;
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

::v-deep(.el-form-item) {
  margin-bottom: 20px;
}

::v-deep(.el-form-item__label) {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

::v-deep(.el-input__inner),
::v-deep(.el-textarea__inner) {
  height: 40px;
  border-radius: 6px;
  border: 0px;
  transition: all 0.3s;
  font-size: 14px;
}

::v-deep(.el-textarea__inner) {
  height: auto;
  min-height: 80px;
}



::v-deep(.el-button--primary) {
  // background-color: #409eff;
  // border-color: #409eff;
  // border-radius: 6px;
  padding: 10px 20px;
  font-size: 14px;
  transition: all 0.3s;
}

::v-deep(.el-button) {
  padding: 10px 20px;
  font-size: 14px;
  transition: all 0.3s;
}

/* 针对标题样式的优化 */
::v-deep(.el-form-item__label[for=""]) {
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
  
  .button-tip {
    font-size: 12px;
    margin-left: 4px;
  }
}

/* 商户选择容器 */
.merchant-select-container {
  position: relative;
  width: 100%;
}

.balance-label {
  position: absolute;
  right: 35px;
  top: 50%;
  transform: translateY(-50%);
  color: #67c23a;
  font-weight: 500;
  font-size: 13px;
  pointer-events: none;
}

/* 下拉选项内容 */
:deep(.option-content) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  
  .option-code {
    flex: 1;
  }
  
  .option-balance {
    color: #67c23a;
    font-weight: 500;
    margin-left: 20px;
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
  background-color: #fff !important;
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
