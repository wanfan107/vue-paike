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
            <span>通过Telegram申请提U已经上线，欢迎使用。</span>
          </div>
        </el-card> -->

        <!-- 账户信息和表单卡片 -->
        <!-- <el-card class="form-card" shadow="never"> -->
          <!-- 账户信息描述 -->
          <div class="account-info">
            <h3 class="section-title">账户信息</h3>
            <el-descriptions border>
              <!-- <el-descriptions-item label="可用余额" :span="1">
                <span class="balance-value">({{ detail.balance }})</span>
              </el-descriptions-item>
              <el-descriptions-item label="待结算余额" :span="1">
                <span class="balance-value">({{ detail.unsettledBalance }})</span>
              </el-descriptions-item> -->
              <el-descriptions-item label="方式" :span="4">
                商户确认/人工审核
              </el-descriptions-item>
              <el-descriptions-item label="周期" :span="4">
                {{ detail.type }}
              </el-descriptions-item>
              <el-descriptions-item label="汇率" :span="4">
                {{ detail.rate }}
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 表单区域 -->
          <div class="form-section">
            <div class="section-header">
              <h3 class="section-title">开始申请</h3>
              <el-button type="primary"  @click="showWalletDialog = true">新增钱包地址</el-button>
            </div>
            <div class="form-container">
              <el-form
                ref="submitFormRef"
                class="submit-form"
                :model="ruleForm"
                :label-width="'120px'"
                :label-position="'right'"
                @keyup.enter.native="onSave"
              >
                <el-row :gutter="10">
                                   <el-col :span="24">
                    <el-form-item label="商户号" prop="merchantCode">
                      <div class="merchant-select-container">
                        <el-select
                          v-model="ruleForm.merchantCode"
                          placeholder="请选择商户号"
                          style="width: 100%"
                          filterable
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
                        <span v-if="ruleForm.merchantCode" class="balance-label">
                          余额: {{ getMerchantBalance(ruleForm.merchantCode) }}
                        </span>
                      </div>
                    </el-form-item>
                  </el-col>
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
                        :placeholder="'请输入钱包地址，如果输入错误，产生的交易不可逆转，当前仅支持TRC2.0地址提现'"
                        :options="walletAddressOptions"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="24">
                    <el-form-item label="支付密码" prop="password">
                      <el-input
                        v-model="ruleForm.password"
                        type="password"
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
          
        <!-- 横线分隔 -->
          <div class="divider"></div>
          
          <!-- 钱包地址管理 -->
          <div class="transfer-history">
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
              <el-table-column prop="merchantCode" label="商户号" width="120" />
              <el-table-column prop="address" label="钱包地址" min-width="300" />
              <el-table-column prop="type" label="类型" width="120">
                <template #default="scope">
                  <el-tag type="info">TRC2.0</el-tag>
                </template>
              </el-table-column>
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
            
          </div>
        
        <!-- </el-card> -->
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

    <!-- 新增钱包地址弹窗 -->
    <el-dialog
      v-model="showWalletDialog"
      title="新增钱包地址"
      width="500px"
    >
      <div class="wallet-form">
        <el-form :model="walletForm" :rules="walletRules" ref="walletFormRef" label-width="120px">
          <el-form-item label="商户号" prop="merchantCode">
            <div class="merchant-select-container">
              <el-select
                v-model="walletForm.merchantCode"
                placeholder="请选择商户号"
                style="width: 100%"
                filterable
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
              <span v-if="walletForm.merchantCode" class="balance-label">
                余额: {{ getMerchantBalance(walletForm.merchantCode) }}
              </span>
            </div>
          </el-form-item>
          <el-form-item label="USDT地址" prop="usdtAddress">
            <el-input v-model="walletForm.usdtAddress"  placeholder="请输入USDT地址"></el-input>
          </el-form-item>
          <el-form-item label="谷歌验证码" prop="googleCode">
            <el-input v-model="walletForm.googleCode" placeholder="请输入谷歌验证码" ></el-input>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showWalletDialog = false">取消</el-button>
          <el-button type="primary" @click="saveWalletAddress">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { http } from "@/api";
import useUserStore from "@/stores/user";
import { Warning } from "@element-plus/icons-vue";
import EditableSelect from '@/components/EditableSelect.vue';
// 页面标题
const title = '集团下发申请';

// 初始化store和router
const userStore = useUserStore();
const router = useRouter();

// 响应式数据
const loading = ref(false);
const submitFormRef = ref(null);
const detail = reactive({});
const ruleForm = reactive({
  amount: "",
  uAmount: "",
  fee: 0,
  walletAddress: userStore.merchantInfo.usdtAddress || "",
  password: "",
  code: "",
  merchantCode: "",
});

const merchantOptions = ref([

]);

// 所有商户的钱包地址映射 { merchantCode: [walletAddresses] }
const allWalletAddresses = ref({});

// 当前商户的钱包地址列表（根据选中的商户动态过滤）
const walletAddressOptions = computed(() => {
  if (!ruleForm.merchantCode) return [];
  
  const addresses = allWalletAddresses.value[ruleForm.merchantCode] || [];
  return addresses.map(address => ({
    name: address,
    original: address,
    value: address,
  }));
});

// 获取所有商户的钱包地址
const fetchAllWalletAddresses = async () => {
  try {
    const res = await http.groupWalletQuery({});
    if (res.Success && res.Data && res.Data.merchants) {
      const walletMap = {};
      res.Data.merchants.forEach(merchant => {
        if (merchant.merchantCode && merchant.walletAddresses) {
          walletMap[merchant.merchantCode] = merchant.walletAddresses;
        }
      });
      allWalletAddresses.value = walletMap;
    }
  } catch (error) {
    console.error('获取钱包地址失败:', error);
    allWalletAddresses.value = {};
  }
};

// 监听商户号变化
watch(() => ruleForm.merchantCode, () => {
  // 商户号变化时清空钱包地址选择
  ruleForm.walletAddress = '';
});

// 新增钱包地址弹窗
const showWalletDialog = ref(false);
const walletFormRef = ref(null);
const walletForm = reactive({
  merchantCode: '',
  usdtAddress: '',
  googleCode: ''
});
const walletRules = {
  merchantCode: [
    { required: true, message: '请选择商户号', trigger: 'change' }
  ],
  usdtAddress: [
    { required: true, message: '请输入USDT地址', trigger: 'blur' }
  ],
  googleCode: [
    { required: true, message: '请输入谷歌验证码', trigger: 'blur' }
  ]
};

// 弹窗状态
const showPrepayDialog = ref(false);

// 计算属性 - 表单列表


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

// 加载商户列表
const loadMerchants = async () => {
  try {
    const res = await http.getGroupMerchants();
    if (res.code === 200) {
      merchantOptions.value = res.data
        .filter(m => !m.code?.startsWith('G'))
        .map(m => ({
          code: m.code,
          balance: m.balance || 0
        }));
    }
  } catch (error) {
    console.error('加载商户列表失败:', error);
  }
};

// 根据商户号获取余额
const getMerchantBalance = (code) => {
  const merchant = merchantOptions.value.find(m => m.code === code);
  return merchant ? merchant.balance || 0 : 0;
};

// 生命周期 - 组件挂载
onMounted(() => {
  // 初始化表单默认值
  ruleForm.walletAddress = userStore.merchantInfo.usdtAddress || "";
  
  // 获取汇率信息
  getExchangeRate();
  
  // 检查授信款状态
  // checkPrepayStatus();

  // 获取集团钱包地址列表
  getWalletAddresses();

  // 初始化钱包地址数据
  // initWalletAddresses();
  
  // 获取所有商户的钱包地址（用于下拉选择）
  fetchAllWalletAddresses();

  // 加载商户列表
  loadMerchants();
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

// 提交表单
const submit = () => {
  loading.value = true;
  http
    .groupUsdtTransfer({
          "merchantCode": ruleForm.merchantCode,
    "amount": ruleForm.amount,
    "walletAddress": ruleForm.walletAddress,
    "walletType": "TRC20",
    "applicantCode":'',
    code: ruleForm.code,
    payPassword: ruleForm.password,
    })
    .then((res) => {
      loading.value = false;
      if (res.Success) {
        ElMessage.success(res.Message || '提现成功');
        // 页面跳转到 withdraw/withdrawManagement
        router.push({ name: "withdrawManagement" });
      } else {
        ElMessage.error(res.ErrorMessage || '提现失败');
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
    fee: 0,
    walletAddress: userStore.merchantInfo.usdtAddress || "",
    password: "",
    code: "",
    merchantCode: "",
  });
};

// 钱包地址相关
const historyLoading = ref(false);
const walletAddresses = ref([]);

// 初始化钱包地址数据
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
const getWalletAddresses = () => {
  http
    .groupWalletQuery()
    .then((res) => {
      if (res.Success && res.Data && res.Data.merchants) {
        // 转换数据格式，展示所有商户的钱包地址
        const allAddresses = [];
        res.Data.merchants.forEach((merchant, merchantIndex) => {
          if (merchant.walletAddresses && merchant.walletAddresses.length > 0) {
            merchant.walletAddresses.forEach((address, addressIndex) => {
              allAddresses.push({
                id: merchantIndex * 1000 + addressIndex + 1,
                merchantCode: merchant.merchantCode,
                address: address,
                type: 'TRC2.0',
              });
            });
          }
        });
        walletAddresses.value = allAddresses;
      } else {
        walletAddresses.value = [];
        ElMessage.error(res.ErrorMessage || '获取钱包地址失败');
      }
    })
    .catch(() => {
      ElMessage.error('获取钱包地址失败');
    });
};

// 删除钱包地址的谷歌验证码

// 处理删除钱包地址
const handleDeleteWallet = async (wallet) => {
  try {
    await ElMessageBox.prompt(
      `请输入谷歌验证码以删除钱包地址 ${wallet.address}`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /^\d{6}$/,
        inputErrorMessage: '请输入6位谷歌验证码',
        inputValue: ''
      }
    ).then(async (googleCode) => {
      try {
        const res = await http.deleteWalletAddress({
          merchantCode: wallet.merchantCode,
          walletAddress: wallet.address,
          code: googleCode.value
        });
        
        if (res.Success) {
          ElMessage.success(res.Data?.Message || '删除申请已提交');
          // 刷新钱包地址列表
          getWalletAddresses();
        } else {
          ElMessage.error(res.ErrorMessage || '删除失败');
        }
      } catch (error) {
        ElMessage.error('删除失败');
      }
    }).catch(() => {});
  } catch (error) {
    // 用户取消输入
  }
};

// 保存钱包地址
const saveWalletAddress = async () => {
  if (!walletFormRef.value) return;
  
  try {
    const valid = await walletFormRef.value.validate();
    if (!valid) return;
    
    let res = await http.addWalletAddress({
      merchantCode: walletForm.merchantCode,
      walletAddress: walletForm.usdtAddress,
      walletType: "TRC20",
      oldWalletAddresses: [],
      applicantCode: "",
      code: walletForm.googleCode
    });
    if(res.Success == true){
      ElMessage.success("钱包地址添加成功");
          showWalletDialog.value = false;
    walletFormRef.value.resetFields();
    // initWalletAddresses();
    getWalletAddresses();
    }else{
      ElMessage.error(res.ErrorMessage || "钱包地址添加失败");
    }
    

  } catch (error) {
    console.error("保存钱包地址失败:", error);
    ElMessage.error(error.ErrorMessage || "保存失败，请稍后重试");
  }
};

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
