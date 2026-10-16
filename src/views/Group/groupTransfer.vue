<template>
  <div class="page-container">
    <header class="page-header">
      <h1>{{ t('menu.groupTransfer') }}</h1>
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
                <span class="balance-value">{{ groupBalance }}</span>
              </el-descriptions-item>
              <!-- <el-descriptions-item label="集团待结算余额" :span="1">
                <span class="balance-value">-</span>
              </el-descriptions-item> -->
              <!-- <el-descriptions-item label="集团授信余额" :span="1">
                <span class="balance-value">-</span>
              </el-descriptions-item>
              <el-descriptions-item label="MFA2余额" :span="1">
                <span class="balance-value">-</span>
              </el-descriptions-item> -->
              <el-descriptions-item label="互转手续费" :span="1">
                <span class="balance-value">0</span>
              </el-descriptions-item>
              <el-descriptions-item label="最小转账金额" :span="2">
                <span class="balance-value">1</span>
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
                      disabled
                      @change="handleFromMerchantChange"
                    >
                      <el-option
                        v-for="merchant in merchantOptions"
                        :key="merchant.code"
                        :value="merchant.code"
                      >
                        <div class="option-content">
                          <span class="option-code">{{ merchant.code }} {{ merchant.qq ? ` - ${merchant.qq}` : "" }}</span>
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
                <el-form-item label="转入商户" prop="toMerchant" >
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
                          <span class="option-code">{{ merchant.code }} {{ merchant.qq ? ` - ${merchant.qq}` : "" }}</span>
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
                    :min="0"
                    :step="1"
                    style="width: 100%"
                  ></el-input-number>
                </el-form-item>
                
                <!-- 支付密码 -->
                <el-form-item label="支付密码" prop="password">
                  <el-input
                    v-model="ruleForm.password"
                    type="password"
                    placeholder="请输入转出账户支付密码"
                  ></el-input>
                </el-form-item>
                
    <!-- MFA2验证码 -->
<el-form-item label="MFA2验证码" >
  <el-input
    v-model="ruleForm.code"
    placeholder="'请输入MFA2验证码'"
  ></el-input>
  <div style="font-size:12px;color:var(--brand-primary, #67c23a);margin-top:4px">输入正确后10分钟内无需输入</div>
</el-form-item>
                
                <!-- 备注 -->
                <!-- <el-form-item label="备注" prop="remark">
                  <el-input
                    v-model="ruleForm.remark"
                    type="textarea"
                    placeholder="选填，转账备注（最多50字）"
                  ></el-input>
                </el-form-item>
                 -->
                <!-- 操作按钮 -->
                <el-form-item>
                  <div class="form-actions">
                    <el-button @click="reset">重置</el-button>
                    <el-button type="primary" @click="submit" :loading="loading">
                      确认转账
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
              <h3 style="color: var(--text-primary, #000000);">转账记录</h3>
            <div class="history-header">
            
            <el-form :inline="true">
              <el-form-item label="状态">
                <el-select
                  v-model="searchForm.status"
                  placeholder="全部"
                  style="width: 100px"
                  size="small"
                >
                  <el-option label="全部" :value="null" />
                  <el-option label="待处理" :value="0" />
                  <el-option label="处理中" :value="1" />
                  <el-option label="成功" :value="2" />
                  <el-option label="失败" :value="3" />
                  <el-option label="取消" :value="4" />
                </el-select>
              </el-form-item>
              <el-form-item label="订单号">
                <el-input
                  v-model="searchForm.bizNo"
                  placeholder="转账单号"
                  style="width: 180px"
                  clearable
                  size="small"
                />
              </el-form-item>

              <el-form-item label="转入方">
                <el-select
                  v-model="searchForm.counterparty"
                  placeholder="请选择转入商户"
                  style="width: 200px"
                  clearable
                  size="small"
                >
                  <el-option
                    v-for="merchant in merchantOptions.filter(m => m.code !== ruleForm.fromMerchant)"
                    :key="merchant.code"
                    :value="merchant.code"
                  >
                    {{ merchant.code }} {{ merchant.qq ? ` - ${merchant.qq}` : "" }}
                  </el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="时间范围">
                <el-date-picker
                  v-model="historyTimeRange"
                  type="datetimerange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  size="small"
                />
              </el-form-item>
            <el-form-item>
              <el-button type="primary" size="small" @click="getTransferHistory">
                查询
              </el-button>
              <el-button size="small" @click="resetSearch">重置</el-button>
            </el-form-item>


            </el-form>

            </div>
            
            <el-table
              v-loading="historyLoading"
              :data="transferHistory"
              style="width: 100%"
              max-height="250"
              stripe
            >
              <el-table-column label="转账单号" width="220" align="center">
                <template #default="{ row }">
                  <CopyText 
                    :text="row.orderNo" 
                    :id="'orderno-' + row.orderNo"
                    title="点击复制转账单号"
                  />
                </template>
              </el-table-column>
              <el-table-column prop="type" label="类型" width="100" align="center">
                <template #default="scope">
                  <!-- 0=空，1=转入，2=转出，3内部互转 -->
                  <el-tag :type="scope.row.type === 3 ? 'primary' : scope.row.type === 1 ? 'success' : scope.row.type === 2 ? 'danger' : 'default' ">
                    {{ scope.row.type === 3 ? '内部互转' : scope.row.type === 1 ? '转入' : scope.row.type === 2 ? '转出' : '' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="fromAccount" label="转出商户号" width="150" align="center" />
              <el-table-column prop="toAccount" label="转入商户号" width="150" align="center" />
              <el-table-column prop="amount" label="转账金额" width="140" align="center">
                <template #default="scope">
                  {{ formatCurrency(scope.row.amount, scope.row.currency || currency.value) }}
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100" align="center">
                <template #default="scope">
                  <el-tag :type="{ '待处理': 'warning', '处理中': 'info', '成功': 'success', '失败': 'danger', '取消': 'default' }[scope.row.status] || 'default'">
                    {{ scope.row.status }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="createTime" label="转账时间" width="180" align="center" />
              <el-table-column prop="ErrorMsg" label="备注" align="center"  />            
            </el-table>
            
            <div class="history-pagination" v-if="!historyLoading && transferHistory.length > 0" style="display: flex; justify-content: center; margin-top: 10px;">
              <el-pagination
                v-model:current-page="historyPagination.currentPage"
                v-model:page-size="historyPagination.pageSize"
                :page-sizes="[10, 20, 50, 100]"
                :total="historyPagination.total"
                layout="total, sizes, prev, pager, next, jumper"
                @current-change="handleHistoryCurrentChange"
                @size-change="handleHistorySizeChange"
              />
            </div>
            
          </div>
        

        <!-- </el-card> -->
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { http } from "@/api";
import useUserStore from "@/stores/user";
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import CopyText from '@/components/CopyText.vue';
import { formatCurrency } from '@/utils/currency';

const userStore = useUserStore();
const currency = computed(() => userStore.merchantInfo?.currency);

// 页面标题


// 响应式数据
const loading = ref(false);
const formRef = ref(null);

// 商户选项（模拟数据，实际应从接口获取）
const merchantOptions = ref([]);

const groupBalance = computed(() => {
  const total = merchantOptions.value.reduce((sum, m) => sum + (Number(m.balance) || 0), 0);
  return formatCurrency(total, currency.value);
});

const ruleForm = reactive({
  fromMerchant: userStore.currentMerchantCode || "",
  toMerchant: "",
  amount: 0,
  currency: "BRL",
  password: "",
  code: "",
  // remark: ""
});

// ===== MFA grace：验一次后 10 分钟内、限 N 次免重复输入验证码 =====
// mfaGraceUntil: 免验失效时刻（毫秒时间戳，来自后端 MfaGraceUntil UTC ISO）
const mfaGraceUntil = ref(0);
// nowTick: 每秒刷新，驱动倒计时与 mfaInGrace 重算
const nowTick = ref(Date.now());
const mfaInGrace = computed(() => mfaGraceUntil.value > 0 && nowTick.value < mfaGraceUntil.value);
const mfaRemainingText = computed(() => {
  if (!mfaInGrace.value || !mfaGraceUntil.value) return '';
  const sec = Math.max(0, Math.floor((mfaGraceUntil.value - nowTick.value) / 1000));
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `MFA 免验 ${m}:${s}`;
});

// 表单验证规则（code 在 grace 内不强制）
const rules = computed(() => ({
  fromMerchant: [
    { required: true, message: '请选择转出商户', trigger: 'change' }
  ],
  toMerchant: [
    { required: true, message: '请选择转入商户', trigger: 'change' }
  ],
  amount: [
    { required: true, message: '请输入转账金额', trigger: 'blur' },
    { type: 'number', min: 1, message: '转账金额不能小于1', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入支付密码', trigger: 'blur' }
  ],
  code: mfaInGrace.value
    ? []
    : [
        { required: true, message: '请输入MFA2验证码', trigger: 'blur' },
        { pattern: /^\d{6}$/, message: '请输入6位数字验证码', trigger: 'blur' }
      ]
}));


// 获取商户列表
const getMerchantList = () => {
  http
    .getGroupMerchants()
    .then((res) => {
      if (res.code === 200 && res.data) {
        merchantOptions.value = res.data.filter(m => !m.code?.startsWith('G')).map(m => ({ code: m.code, balance: m.balance , qq: m.qq }));
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
          .groupTransferApproval({
            fromMerchantCode: ruleForm.fromMerchant,
            toMerchantCode: ruleForm.toMerchant,
            amount: ruleForm.amount,
            currency: ruleForm.currency,
            // grace 内不发送验证码（后端跳过 TOTP）
            code: mfaInGrace.value ? "" : ruleForm.code,
            applicantCode: ""
          })
          .then((res) => {
            loading.value = false;
            if (res.Success) {
              ElMessage.success(res.Data?.Message || '余额互转申请已提交');
              // 记录 MFA grace 失效时刻，10 分钟内、限 N 次免再输入验证码
              if (res.Data?.MfaGraceUntil) {
                mfaGraceUntil.value = new Date(res.Data.MfaGraceUntil).getTime();
              }
              reset();
            } else {
              ElMessage.error(res.ErrorMessage || '转账失败');
            }
          })
          .catch((error) => {
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
    // fromMerchant: "",
    toMerchant: "",
    amount: 0,
    currency: "BRL",
    password: "",
    code: "",
    // remark: ""
  });
};

// 转账记录相关
const historyTimeRange = ref([]);
const historyLoading = ref(false);
const transferHistory = ref([]);

const searchForm = reactive({
  status: null,
  bizNo: '',
  groupCode: '',
  merchantCode: '',
  counterparty: ''
});

const historyPagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// 初始化时间范围（默认最近7天全天，本地东八区时间，无UTC偏移）
const initTimeRange = () => {
  const now = new Date();

  // 起始：7天前 00:00:00
  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  // 结束：当天 23:59:59
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  // 补零工具
  const pad = (num) => String(num).padStart(2, '0');
  // 格式化本地时间 yyyy-MM-dd HH:mm:ss
  const formatLocal = (date) => {
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const h = pad(date.getHours());
    const mi = pad(date.getMinutes());
    const s = pad(date.getSeconds());
    return `${y}-${m}-${d} ${h}:${mi}:${s}`;
  };

  historyTimeRange.value = [formatLocal(start), formatLocal(end)];
};

// 获取转账记录
const getTransferHistory = async () => {
  historyLoading.value = true;
  try {
    const res = await http.groupTransferQuery({
      status: searchForm.status,
      bizNo: searchForm.bizNo || '',
      groupCode: searchForm.groupCode || '',
      merchantCode: userStore.merchantId || '',
      counterparty: searchForm.counterparty || '',
      startTime: historyTimeRange.value[0],
      endTime: historyTimeRange.value[1],
      pageNo: historyPagination.currentPage,
      pageSize: historyPagination.pageSize
    });
    
    if (res.Data && res.Data.Items) {
      historyPagination.total = res.Data.Total;
      transferHistory.value = res.Data.Items.map(item => ({
        orderNo: item.BizNo || '-',
        fromAccount: item.Merchant || '-',
        toAccount: item.Counterparty || '-',
        amount: item.Amount || 0,
        currency: item.Currency || 'BRL',
        status: ['待处理', '处理中', '成功', '失败', '取消'][item.Status] || '-',
        type: item.Direction,
        createTime: item.CreatedOn ? item.CreatedOn.replace('T', ' ').slice(0, 19) : '-',
        ErrorMsg: item.ErrorMsg || '-'
      }));
    }
  } catch (error) {
    ElMessage.error('获取转账记录失败');
  } finally {
    historyLoading.value = false;
  }
};

const resetSearch = () => {
  searchForm.status = null;
  searchForm.bizNo = '';
  searchForm.groupCode = '';
  searchForm.merchantCode = '';
  searchForm.counterparty = '';
  historyTimeRange.value = [];
  historyPagination.currentPage = 1;
  initTimeRange();
  getTransferHistory();
};

const handleHistoryCurrentChange = (val) => {
  historyPagination.currentPage = val;
  getTransferHistory();
};

const handleHistorySizeChange = (val) => {
  historyPagination.pageSize = val;
  historyPagination.currentPage = 1;
  getTransferHistory();
};

let refreshTimer = null;
let mfaTickTimer = null;
// 页面挂载时初始化
onMounted(() => {
  // 获取商户列表
  getMerchantList();
   // 每10秒刷新一次
  refreshTimer = setInterval(getMerchantList, 10000);
  // 每秒刷新 nowTick，驱动 MFA grace 倒计时与 mfaInGrace 重算
  mfaTickTimer = setInterval(() => { nowTick.value = Date.now(); }, 1000);
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
  if (mfaTickTimer) {
    clearInterval(mfaTickTimer);
    mfaTickTimer = null;
  }
});
</script>
<style scoped lang="scss">
@use "../../styles/variables.scss" as *;

.page-container {
  background-color: var(--color-surface, #ffffff);
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
  background-color: var(--color-surface, white);
  border-radius: $border-radius-md;
}

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
  box-shadow: var(--shadow-md, 0 2px 8px rgba(0, 0, 0, 0.08));
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
  border-bottom: 1px solid var(--color-border-soft, #ebeef5);
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
  border-bottom: 1px solid var(--color-border-soft, #ebeef5);
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
  color: var(--text-primary, #333);
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
  color: var(--text-primary, #333);
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
  color: var(--color-danger, #f56c6c);
}

.dialog-message {
  font-size: 16px;
  color: var(--text-primary, #333);
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
  // color: #67c23a;
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
    // color: #67c23a;
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
  -webkit-text-fill-color: var(--text-primary, #000);
  background-color: var(--color-surface, #fff) !important;
  background-clip: text;
  transition: background-color 5000s ease-in-out 0s;
}

/* 横线分隔符 */
.divider {
  height: 1px;
  background-color: var(--color-divider, #e0e0e0);
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
      color: var(--text-primary, #333);
    }


  }

  .el-table {
    border-radius: 10px;
    overflow: hidden;
    box-shadow: var(--shadow-md, 0 2px 8px rgba(0, 0, 0, 0.05));

    .el-table__header-wrapper th {
      background-color: var(--color-hover, #f8f9fa);
      font-weight: 600;
      color: var(--text-primary, #495057);
    }

    .el-table__row {
      transition: background-color 0.3s ease;

      &:hover {
        background-color: var(--color-hover, #f8f9fa);
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
