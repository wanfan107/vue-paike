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
            <h3 class="section-title">开始申请</h3>
            <div class="form-container">
              <SubmitForm
                @save="submit"
                @blur="blur"
                :loading="loading"
                @close="reset"
                label-position="right"
                label-width="120px"
                :form-list="formList"
                :rule-form="ruleForm"
              ></SubmitForm>
            </div>
          </div>
        <!-- </el-card> -->
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { http } from "@/api";
import useUserStore from "@/stores/user";
import SubmitForm from '@/components/SubmitForm.vue';
// 页面标题
const title = '下发申请';

// 初始化store和router
const userStore = useUserStore();
const router = useRouter();

// 响应式数据
const loading = ref(false);
const detail = reactive({});
const ruleForm = reactive({
  amount: "",
  uAmount: "",
  fee: 0,
  walletAddress: userStore.merchantInfo.usdtAddress || "",
  password: "",
  code: "",
});

// 计算属性 - 表单列表
const formList = computed(() => {
  const { merchantInfo } = userStore;
  let walletAddressOptions = [];
  
  if (merchantInfo.usdtaddresseslist && merchantInfo.usdtaddresseslist.length > 0) {
    walletAddressOptions = merchantInfo.usdtaddresseslist.reduce((prev, curr) => {
      prev.push({
        name: curr,
        original: curr,
        value: curr,
      });
      return prev;
    }, []);
  } else {
    walletAddressOptions.push({
      name: merchantInfo.usdtAddress || "",
      original: merchantInfo.usdtAddress || "",
      value: merchantInfo.usdtAddress || "",
    });
  }

  return [
    // 金额(法币) 、到账U数、手续费、手续费、支付密码、MFA2验证码
    {
      label: "金额(法币)",
      prop: "amount",
      name: "input",
      type: "number",
      placeholder: "手续费：0.00 + 0%",
      rules: [
        { required: true, message: "请输入金额(法币)", trigger: "blur" },
      ],
    },
    {
      colSpan: 12,
      disabled: true,
      label: "到账U数",
      prop: "uAmount",
      name: "input",
      placeholder: "单位：USDT",
      rules: [{ required: false, message: "请输入单位", trigger: "blur" }],
    },
    {
      colSpan: 12,
      disabled: true,
      label: "手续费",
      prop: "fee",
      name: "input",
      placeholder: "单位：₹",
      rules: [
        { required: false, message: "请输入手续费", trigger: "blur" },
      ],
    },
    {
      label: "钱包地址",
      prop: "walletAddress",
      name: "select1",
      placeholder:
        "请输入钱包地址，如果输入错误，产生的交易不可逆转，当前仅支持TRC2.0地址提现",
      rules: [
        { required: true, message: "请输入钱包地址", trigger: "blur" },
      ],
      options: walletAddressOptions,
    },
    {
      label: "支付密码",
      prop: "password",
      name: "input",
      type: "password",
      placeholder: "请输入支付密码",
      rules: [
        { required: true, message: "请输入支付密码", trigger: "blur" },
      ],
    },
    {
      label: "MFA2验证码",
      prop: "code",
      name: "input",
      placeholder: "请输入MFA2验证码",
      rules: [
        { required: true, message: "请输入MFA2验证码", trigger: "blur" },
      ],
    },
  ];
});

// 生命周期 - 组件挂载
onMounted(() => {
  // 初始化表单默认值
  ruleForm.walletAddress = userStore.merchantInfo.usdtAddress || "";
  
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

// 提交表单
const submit = () => {
  loading.value = true;
  http
    .usdttransfer({
      id: userStore.merchantInfo.id,
      amount: ruleForm.amount,
      password: ruleForm.password,
      code: ruleForm.code,
      walletAddress: ruleForm.walletAddress,
    })
    .then((res) => {
      loading.value = false;
      if (res.code === 200) {
        ElMessage.success("提现成功");
        // 页面跳转到 withdraw/withdrawManagement
        router.push({ name: "withdrawManagement" });
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
  });
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

.form-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: $spacing-lg 0;
}

::v-deep .el-form-item {
  margin-bottom: 20px;
}

::v-deep .el-form-item__label {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

::v-deep .el-input__inner,
::v-deep .el-textarea__inner {
  height: 40px;
  border-radius: 6px;
  border: 1px solid #dcdfe6;
  transition: all 0.3s;
  font-size: 14px;
}

::v-deep .el-textarea__inner {
  height: auto;
  min-height: 80px;
}



::v-deep .el-button--primary {
  // background-color: #409eff;
  // border-color: #409eff;
  // border-radius: 6px;
  padding: 10px 20px;
  font-size: 14px;
  transition: all 0.3s;
}

::v-deep .el-button {
  padding: 10px 20px;
  font-size: 14px;
  transition: all 0.3s;
}

/* 针对标题样式的优化 */
::v-deep .el-form-item__label[for=""] {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  display: block;
}

</style>
