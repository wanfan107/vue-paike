<template>
  <div class="page-container">
    <header class="page-header">
      <h1>{{ title }}</h1>
      <hr />
    </header>

    <main class="page-content">
      <div class="content-wrapper">
        <!-- 通知卡片 -->
        <el-card class="notification-card">
          <div class="notification-content">
            <i class="el-icon-info-circle notification-icon"></i>
            <span>通过Telegram申请提U已经上线，欢迎使用。</span>
          </div>
        </el-card>

        <!-- 账户信息和表单卡片 -->
        <!-- <el-card class="form-card" shadow="never"> -->
          <!-- 账户信息描述 -->
          <div class="account-info">
            <h3 class="section-title">账户信息</h3>
            <el-descriptions border>
              <el-descriptions-item label="可用余额" :span="1">
                <span class="balance-value">({{ detail.balance }})</span>
              </el-descriptions-item>
              <el-descriptions-item label="待结算余额" :span="1">
                <span class="balance-value">({{ detail.unsettledBalance }})</span>
              </el-descriptions-item>
              <el-descriptions-item label="方式" :span="1">
                商户确认/人工审核
              </el-descriptions-item>
              <el-descriptions-item label="周期" :span="1">
                {{ detail.type }}
              </el-descriptions-item>
              <el-descriptions-item label="汇率" :span="2">
                {{ detail.rate }}
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 表单区域 -->
          <div class="form-section">
            <div class="section-header">
              <h3 class="section-title">开始申请</h3>
              <!-- <el-button type="primary"  @click="showWalletDialog = true">新增钱包地址</el-button> -->
            </div>
            <div class="form-container">
              <el-form
                ref="submitFormRef"
                class="submit-form"
                :model="ruleForm"
                :rules="rules"
                :label-width="'120px'"
                :label-position="'right'"
                @keyup.enter.native="onSave"
              >
                <el-row :gutter="10">
                  <el-col :span="24">
                    <el-form-item label="金额(法币)" prop="amount">
                      <el-input
                        v-model="ruleForm.amount"
                        type="number"
                        placeholder="手续费：0.00 + 0%"
                        @input="() => convertAmountToU()"
                        @blur="() => blur({ key: 'amount', val: ruleForm.amount })"
                      ></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="到账U数" prop="uAmount">
                      <el-input
                        v-model="ruleForm.uAmount"
                        type="number"
                        placeholder="单位：USDT"
                        @input="() => convertUToAmount()"
                      ></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="手续费" prop="fee">
                      <el-input
                        v-model="ruleForm.fee"
                        placeholder="单位：₹"
                        disabled
                      ></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="24">
                    <el-form-item label="钱包地址" prop="walletAddress">
                      <EditableSelect
                        v-model="ruleForm.walletAddress"
                        :placeholder="'请选择钱包地址'"
                        :options="walletAddressOptions"
                        :merchant-id="userStore.merchantInfo.id"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="24">
                    <el-form-item label="支付密码" prop="password">
                      <el-input
                        v-model="ruleForm.password"
                        type="password"
                        show-password
                        autocomplete="new-password"
                        placeholder="请输入支付密码"
                      ></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="24">
                    <el-form-item label="MFA2验证码" prop="code">
                      <el-input
                        v-model="ruleForm.code"
                        placeholder="请输入MFA2验证码"
                      ></el-input>
                    </el-form-item>
                  </el-col>
                </el-row>
                <div style="text-align: center; width: 100%; padding-bottom: 20px; margin-top: 10px;">
                  <el-button @click="reset">重置</el-button>
                  <el-button
                    :loading="loading"
                    :disabled="loading"
                    type="primary"
                    @click="onSave"
                  >提交</el-button>
                </div>
              </el-form>
            </div>
          </div>


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
          
        <!-- 横线分隔 -->
          <!-- <div class="divider"></div> -->
          
          <!-- 钱包地址管理 -->
          <!-- <div class="transfer-history">
            <div class="history-header">
              <h3>钱包地址管理</h3>
            </div>
            
            <el-table
              v-loading="historyLoading"
              :data="walletAddresses"
              style="width: 100%"
              max-height="250"
              stripe
            >
            
              <el-table-column prop="address" label="钱包地址" min-width="300" />
              <el-table-column prop="type" label="类型" width="120">
                <template #default="scope">
                  <el-tag type="info">TRC2.0</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="120">
                <template #default="scope">
                  <el-tag :type="scope.row.status === 'COMPLETED' ? 'success' : 'warning'">
                    {{ scope.row.status === 'COMPLETED' ? '完成' : '进行中' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="createTime" label="添加时间" width="180" />
              <el-table-column label="操作" width="120">
                <template #default="scope">
                  <el-button 
                    type="danger" 
                    size="small" 
                    @click="handleDeleteWallet(scope.row)"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            
            <div class="history-empty" v-if="!historyLoading && walletAddresses.length === 0">
              <el-empty description="暂无钱包地址" />
            </div>
          </div> -->
        
        <!-- </el-card> -->
      </div>
    </main>



    <!-- 新增钱包地址弹窗 -->
    <!-- <el-dialog
      v-model="showWalletDialog"
      title="新增钱包地址"
      width="500px"
    >
      <div class="wallet-form">
        <el-form :model="walletForm" :rules="walletRules" ref="walletFormRef" label-width="120px">
          <el-form-item label="USDT地址" prop="usdtAddress">
            <el-input v-model="walletForm.usdtAddress" placeholder="请输入USDT地址"></el-input>
          </el-form-item>
          <el-form-item label="原邮箱验证码" prop="emailCode">
            <div class="code-input-container">
              <el-input v-model="walletForm.emailCode" placeholder="发送到{{ walletForm.email }}" style="width: 65%;"></el-input>
              <el-button type="primary"  style="width: 30%;">获取验证码</el-button>
            </div>
          </el-form-item>
          <el-form-item label="MFA2验证码" prop="googleCode">
            <el-input v-model="walletForm.googleCode" placeholder="请输入MFA2验证码" ></el-input>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showWalletDialog = false">取消</el-button>
          <el-button type="primary" @click="saveWalletAddress">保存</el-button>
        </span>
      </template>
    </el-dialog> -->
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted,onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { http } from "@/api";
import useUserStore from "@/stores/user";
import { Warning } from "@element-plus/icons-vue";
import EditableSelect from '@/components/EditableSelect.vue';
// 页面标题
const title = '下发申请';

// 初始化store和router
const userStore = useUserStore();
const router = useRouter();

// 响应式数据
const loading = ref(false);
const submitFormRef = ref(null);
const detail = reactive({
  balance: '',
  unsettledBalance: '',
  type: '每日结算',
  rate: ''
});
const ruleForm = reactive({
  amount: "",
  uAmount: "",
  fee: 0,
  walletAddress:  "",
  password: "",
  code: "",
  remark: "",
});

const rules = {
  amount: [
    { required: true, message: '请输入金额', trigger: 'blur' }
  ],
  uAmount: [
    { required: true, message: '请输入到账U数', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        if (value && (!isNaN(value) && Number(value) > 0)) {
          if (Number(value) < 1) {
            callback(new Error('到账U数最低为1000'));
          } else {
            callback();
          }
        } else {
          callback();
        }
      }, 
      trigger: 'blur' 
    }
  ],
  walletAddress: [
    { required: true, message: '请选择钱包地址', trigger: 'change' }
  ],
  password: [
    { required: true, message: '请输入支付密码', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入MFA2验证码', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        if (value && value.length === 6) {
          callback();
        } else {
          callback(new Error('MFA2验证码长度必须为6位'));
        }
      }, 
      trigger: 'blur' 
    }
  ],
};

// 钱包地址选项
const walletAddressOptions = computed(() => {
  const { merchantInfo } = userStore;
  let options = [];
  
  if (merchantInfo.usdtaddresseslist && merchantInfo.usdtaddresseslist.length > 0) {
    options = merchantInfo.usdtaddresseslist.reduce((prev, curr) => {
      prev.push({
        name: curr,
        original: curr,
        value: curr,
      });
      return prev;
    }, []);
  } else {
    options = []
    options.push({
      name:  "暂无钱包地址，请先新增钱包地址",
      original:  "暂无钱包地址，请先新增钱包地址",
      value:  "",
    });
  }
  
  return options;
});

// 新增钱包地址弹窗
// const showWalletDialog = ref(false);
// const walletFormRef = ref(null);
// const walletForm = reactive({
//   usdtAddress: '',
//   googleCode: '',
//   emailCode: '',
//   email: userStore.merchantInfo.email || ''
// });
// const walletRules = {
//   usdtAddress: [
//     { required: true, message: '请输入USDT地址', trigger: 'blur' }
//   ],
//   googleCode: [
//     { required: true, message: '请输入MFA2验证码', trigger: 'blur' }
//   ],
//   emailCode: [
//     { required: true, message: '请输入原邮箱验证码', trigger: 'blur' }
//   ]
// };

// 弹窗状态
const showPrepayDialog = ref(false);

let refreshTimer = null;

// 获取钱包地址
const getWalletAddresses = async () => {
  try {
    const res = await http.merchant({
      id: userStore.merchantInfo.id,
    });
    if (res.code === 200 && res.data) {
      Object.assign(userStore.merchantInfo, res.data || {});
    }
  } catch (error) {
    console.error('获取钱包地址失败:', error);
  }
};



// 检查授信款状态
const checkPrepayStatus = async () => {
  try {
    // 调用检查授信款状态的接口
    const res = await http.merchant({
      id: userStore.merchantInfo.id,
    });
    
    // 根据接口返回结果判断是否需要弹窗
    // 授信已用额度（>0的数就是待还金额，说明有预付未还清。=0已还清，<=0不用理会）
    if (res.data && res.data.CreditUsed > 0) {
      showPrepayDialog.value = true;
    }
  } catch (error) {
    console.error('检查授信款状态失败:', error);
  }
};

// 处理弹窗关闭
const handleDialogClose = () => {
  showPrepayDialog.value = false;
  // 返回上一页
  router.back();
};

// 生命周期 - 组件挂载
onMounted(() => {
  // 获取汇率信息
  getExchangeRate();
  
  // 检查授信款状态
  checkPrepayStatus();

  // 获取钱包地址
  getWalletAddresses();

  // 每10秒刷新一次钱包地址
  refreshTimer = setInterval(getWalletAddresses, 10000);
});

// 生命周期 - 组件卸载
onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
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
  if (!isNaN(value) && Number(value) > 0) {
    http
      .exchangeRate({
        id: userStore.merchantInfo.id,
      })
      .then((res) => {
        let rate = res.data.rate;
        let inputValue = Number(value);
        if (key === "amount") {
          ruleForm.uAmount = (inputValue / rate).toFixed(4);
        } else if (key === "uAmount") {
          ruleForm.amount = (inputValue * rate).toFixed(2);
        }
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

// 表单提交处理
const onSave = () => {
  submitFormRef.value.validate((valid) => {
    if (valid) {
      submit();
    }
  });
};

// 提交表单（§6.1 唯一正路径：WfWithdraw/apply，BizType=MerchantWithdrawUsdt）
const submit = () => {
  loading.value = true;
  http
    .wfWithdrawApply({
      merchantCode: userStore.merchantInfo.id,
      amount: ruleForm.amount,
      walletAddress: ruleForm.walletAddress,
      code: ruleForm.code,
      payPassword: ruleForm.password,
      remark: ruleForm.remark || "",
    })
    .then((res) => {
      loading.value = false;
      // §6.1 成功：{ success:true, data:{ bizNo, processInstanceId, ... } }，不立即扣款
      const ok = res.success === true || (res.code === 200 && res.data) || (res.Success === true);
      const data = res.data || res.Data || {};
      const bizNo = data.bizNo || data.BizNo || '';
      if (ok) {
ElMessageBox.alert(
  `<div style="text-align: center; padding: 8px;">
    <div style="font-size: 18px; font-weight: bold; color: #67C23A; margin-bottom: 10px;">申请已提交</div>
    <div style="font-size: 14px; color: #606266; line-height: 1.8;">
      ${bizNo ? `<div>单号：<span style="font-family: monospace;">${bizNo}</span></div>` : ''}
      <div>请完成 Telegram 商户群双人确认，后续进入 OP / Manager 双审</div>
      <div style="color: #909399; font-size: 12px; margin-top: 6px;">审批通过后才会执行扣款与转U</div>
    </div>
  </div>`,
  '提U审批申请',
  {
    confirmButtonText: '确定',
    type: 'success',
    showClose: false,
    closeOnClickModal: true,
    dangerouslyUseHTMLString: true,
    width: '440px',
    center: true,
    callback: () => {
      reset();
    }
  }
);
      } else {
        ElMessage.error(res.msg || res.message || res.ErrorMessage || '提交失败');
      }
    }) 
    .catch((err) => {
      loading.value = false;
      // 后端已废弃旧接口时返回 410/引导文案
      const msg = err?.response?.data?.msg || err?.message || '提交失败，请稍后重试';
      if (err?.response?.status === 410) {
        ElMessageBox.alert(msg || '旧提U路径已停用，请改用提U审批流程', '流程已变更', { type: 'warning' });
      } 
    });
};

// 重置表单
const reset = () => {
  Object.assign(ruleForm, {
    amount: "",
    uAmount: "",
    fee: 0,
    walletAddress:  "",
    password: "",
    code: "",
    remark: "",
  });
};

// // 钱包地址相关
// const historyLoading = ref(false);
// const walletAddresses = ref([]);

// // 初始化钱包地址数据
// const initWalletAddresses = () => {
//   const { merchantInfo } = userStore;
//   if (merchantInfo.usdtaddresseslist && merchantInfo.usdtaddresseslist.length > 0) {
//     walletAddresses.value = merchantInfo.usdtaddresseslist.map((address, index) => ({
//       id: index + 1,
//       address: address,
//       type: 'TRC2.0',
//     }));
//   } else {
//     // 添加假数据
//     walletAddresses.value = [];
//   }
// };

// 处理删除钱包地址
// const handleDeleteWallet = (wallet) => {
//   ElMessageBox.confirm(
//     `确定要删除钱包地址 ${wallet.address} 吗？`,
//     '提示',
//     {
//       confirmButtonText: '确定',
//       cancelButtonText: '取消',
//       type: 'warning'
//     }
//   ).then(() => {
//     // 模拟删除操作
//     const index = walletAddresses.value.findIndex(item => item.id === wallet.id);
//     if (index !== -1) {
//       walletAddresses.value.splice(index, 1);
//       ElMessage.success('删除成功');
//     }
//   }).catch(() => {});
// };

// // 保存钱包地址
// const saveWalletAddress = async () => {
//   if (walletFormRef.value) {
//     await walletFormRef.value.validate(async (valid) => {
//       if (valid) {
//         // 这里可以添加保存钱包地址的逻辑
//         ElMessage.success('钱包地址添加成功');
//         showWalletDialog.value = false;
//         // 重置表单
//         if (walletFormRef.value) {
//           walletFormRef.value.resetFields();
//         }
//         // 重新初始化钱包地址数据
//         initWalletAddresses();
//       }
//     });
//   }
// };

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
  align-items: center;
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


:deep(.el-input__inner:-webkit-autofill),
:deep(.el-input__inner:-webkit-autofill:hover),
:deep(.el-input__inner:-webkit-autofill:focus),
:deep(.el-input__inner:-webkit-autofill:active) {
  -webkit-background-clip: text;
  background-color: #fff !important;
  background-clip: text;
  transition: background-color 5000s ease-in-out 0s;
}
</style>
