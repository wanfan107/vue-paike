<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <div class="login-logo">
          <img
            style="width: 170px"
            src="@/assets/image/logo.png"
            alt="Banco E2 Logo"
          />
          <div class="login-subtitle">Finance</div>
        </div>
      </div>
      <div class="login-form">
        <el-form
          ref="loginFormRef"
          label-position="top"
          :model="loginForm"
          @keyup.enter.native="checkHuman"
          :rules="rules"
        >
          <el-form-item label="Account" prop="username">
            <el-input
              ref="userInput"
              v-model="loginForm.username"
              size="default"
              type="text"
              placeholder="邮箱账户或商户号"
            ></el-input>
          </el-form-item>
          <el-form-item label="PassWord" prop="password">
            <el-input
              v-model="loginForm.password"
              size="default"
              type="password"
              show-password
              placeholder="密码"
            ></el-input>
          </el-form-item>

          <!-- // aws验证码 -->
          <AwsCaptcha />

          <el-form-item style="margin-top: 30px">
            <el-button
              style="width: 100%"
              type="primary"
              size="default"
              :loading="isLoading"
              @click="checkHuman"
              >登录</el-button
            >
          </el-form-item>
        </el-form>
      </div>
      <div class="css-zg4aas">
        <div class="css-1s7xaob">
          <p class="chakra-text css-i8munm">Univepay Finance © 2025</p>
        </div>
      </div>
    </div>

    <el-dialog
      :z-index="1002"
      top="10vh"
      width="600px"
      title="绑定MFA2验证码"
      v-model="dialogValue"
      :close-on-click-modal="false"
      custom-class="account-dialog"
      append-to-body
    >
      <div style="display: flex; flex-direction: column; align-items: center">
        <el-image :src="qrcode" style="width: 200px; height: 200px"></el-image>
        <div style="margin: 20px 0">请扫码绑定后重新登陆</div>
        <div style="text-align: center">
          <el-button type="primary" @click="dialogValue = false">重新登陆</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- MFA2验证码 -->
    <el-dialog
      :z-index="1000"
      top="35vh"
      width="400px"
      height="400px"
      v-model="isVerifyPass"
      :close-on-click-modal="false"
      append-to-body
      custom-class="account-dialog"
      :show-close="false"
      style="padding: 0 20px"
      @opened="handleDialogOpen"
    >
      <div class="dialog-header">
        <div class="logo-container">
          <img
            src="../../assets/image/logo.png"
            alt="Logo"
            class="dialog-logo"
          />
        </div>
        <div class="dialog-title1">请输入MFA2身份验证码</div>
        <div class="dialog-title1">
          <el-form
              label-position="top"
              :model="loginForm"
              :rules="rules"
               @submit.native.prevent
             
            >
              <el-form-item prop="code">
                <el-input
                  ref="codeInput"
                  v-model="loginForm.code"
                  size="default"
                  type="text"
                   @keyup.enter.native="submitForm"
                  placeholder="如未绑定请输入：000000"
                ></el-input>
              </el-form-item>
            </el-form>
        </div>
      </div>
      <div class="dialog-footer" style="text-align: right;padding-bottom: 20px;" >
    
  <el-button @click="(isVerifyPass = false), (loginForm.code = '')"
          >返 回</el-button
        >
        <el-button :loading="loading" type="primary" @click="submitForm"
          >登 录</el-button
        >
        
      </div>
    </el-dialog>

    <!-- 多用户选择 -->
    <el-dialog
      :z-index="1001"
      top="10vh"
      width="500px"
      v-model="dialogValue1"
      :close-on-click-modal="false"
      append-to-body
      custom-class="account-dialog"
      :show-close="false"
    >
      <div class="dialog-close" @click="dialogValue1 = false">×</div>
      <div class="dialog-header">
        <div class="logo-container">
          <img
            src="../../assets/image/logo.png"
            alt="Logo"
            class="dialog-logo"
          />
        </div>
        <div class="dialog-title">Selecione a conta</div>
        <div class="dialog-title">
          <el-select
            v-model="searchKey"
            filterable
            placeholder="请选择"
            clearable
          >
            <el-option
              v-for="item in accounts"
              :key="item.id"
              :label="item.id"
              :value="item.id"
            >
            </el-option>
          </el-select>
        </div>
      </div>
      <div class="account-list">
        <div
          v-for="(account, index) in filteredAccounts"
          :key="index"
          class="account-item"
          @click="confirmBind(account)"
        >
          <div class="left-column">
            <div class="account-id">{{ account.id }}</div>
            <div class="account-type">{{ account.type }}</div>
          </div>
          <div class="right-column">
            <div class="account-company">{{ account.company }}</div>
            <div class="account-number">{{ account.accountNumber }}</div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>
<!-- <script
  src="https://www.recaptcha.net/recaptcha/api.js?hl=zh-CN"
  async
  defer
></script> -->
<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import useUserStore from '@/stores/user';
import Fingerprint from 'fingerprintjs2';
import { http } from '@/api';
import md5 from 'js-md5';
import AwsCaptcha from '@/components/AwsCaptcha.vue';


// 组件注册
// 注意：在<script setup>中，直接导入的组件会自动注册，无需在components选项中声明

// 路由和store
const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

// 表单引用
const loginFormRef = ref(null);
const userInput = ref(null);
const codeInput = ref(null);

// 响应式状态
const searchKey = ref('');
const qrcode = ref('');
const dialogValue = ref(false);
const isVerifyPass = ref(false);
const loading = ref(false);
const isLoading = ref(false);
const dialogValue1 = ref(false);
const isFirstVisit = ref(true);
const wafToken = ref(null);

// 对话框打开时设置焦点
function handleDialogOpen() {
  // 使用nextTick确保对话框内容完全渲染
  nextTick(() => {
    if (codeInput.value && codeInput.value.focus) {
      codeInput.value.focus();
    }
  });
}

// 账户列表
const accounts = ref([
  {
    id: "11743",
    type: "Univepay",
    company: "NOVABET OFICIAL",
    accountNumber: "61.962.430/0001-89",
  },
  {
    id: "11825",
    type: "Univepay",
    company: "APEXBET LTDA",
    accountNumber: "62.087.018/0001-20",
  },
]);

// 登录表单数据
const loginForm = ref({
  username: "",
  password: "",
  code: "",
});

// 表单验证规则
const rules = ref({
  username: [
    {
      required: true,
      message: "请输入您的商户号或邮箱",
      trigger: "blur",
    },
    /* { type: "email", message: "请输入正确的邮箱", trigger: "blur" },*/
  ],
  password: [
    { required: true, message: "请输入您的密码", trigger: "blur" },
    { min: 6, message: "密码长度不能小于6位", trigger: "blur" },
  ],
  code: [
    { required: true, message: "请输入MFA2验证码", trigger: "blur" },
  ],
});

// 计算属性
const filteredAccounts = computed(() => {
  const keyword = searchKey.value.toLowerCase();
  if (!keyword) {
    return accounts.value;
  }
  return accounts.value.filter(
    (account) =>
      account.id.includes(keyword) ||
      account.company.toLowerCase().includes(keyword) ||
      account.accountNumber.includes(keyword)
  );
});

const formReady = computed(() => {
  return wafToken.value;
});

// 生命周期钩子
onMounted(() => {
  nextTick(() => {
    userInput.value.focus(); // 在组件挂载后设置焦点
  });
  
  // 检测是否为首次访问
  const hasVisited = localStorage.getItem("hasVisited");
  isFirstVisit.value = !hasVisited;
  localStorage.setItem("hasVisited", "true");
  
  // 初始化状态
  dialogValue.value = false;
  isVerifyPass.value = false;
  loading.value = false;
  isLoading.value = false;
  dialogValue1.value = false;
});

// 方法
// 验证登录指纹，是否是常用设备
async function compareOnEnter() {
  return new Promise((resolve) => {
    Fingerprint.get((components) => {
      const currentFingerprint = md5(
        components.map((c) => c.value).join("|")
      );
      const previousFingerprint = localStorage.getItem(
        "previousFingerprint"
      );

      // 如果指纹不匹配，提示
      if (
        previousFingerprint &&
        currentFingerprint !== previousFingerprint
      ) {
        ElMessage.warning("检测到设备变更，请注意安全！");
      }

      localStorage.setItem("previousFingerprint", currentFingerprint);
      resolve();
    });
  });
}

async function _login() {
  loading.value = true;
  try {
    // 直接调用userStore中的login方法，传递完整的表单数据
    await userStore.login(loginForm.value).then((res) => {
          // 登录成功后跳转到首页
 router.push({
      path: "/home",
    });
    });

  } catch (error) {
    console.log("-------------", error);
 if (error.code === 401 && error.data && error.data.googledata) {
      const { IsBinding, qrCodeImageUrl } = error.data.googledata;
      if (IsBinding == false) {
        console.log("isBinding", IsBinding);
        console.log("IsBinding", IsBinding);
        qrcode.value = qrCodeImageUrl;
        dialogValue.value = true;
      }
    } 
  } finally {
    loading.value = false;
  }
}

async function submitForm() {
  // 先执行指纹对比（仅非首次访问）
  if (!isFirstVisit.value) {
    await compareOnEnter();
  }

  loginFormRef.value.validate((valid) => {
    if (!valid) {
      return false;
    }
    loading.value = true;
    _login();
  });
}

// 点击按钮触发验证/登录
async function checkHuman() {
  try {
    isLoading.value = true;
    const res = await http.prelogin(loginForm.value);

    console.log(res);
    if (res.code == 200) {
      isVerifyPass.value = true;
      // 焦点设置已通过watch监听isVerifyPass变化实现
    }
  } catch (error) {
    console.log("aws-----aws--------", error);
    // 专门处理用户取消CAPTCHA的情况
    if (error && error.isCaptchaCancel) {
      ElMessage.info("已取消安全验证");
    }
  } finally {
    isLoading.value = false;
  }
}

function confirmBind(account) {
  if (account) {
    // 如果传入了account对象，处理多账户选择
    // 这里可以根据实际需求处理账户选择逻辑
  } else {
    // 处理MFA绑定确认
    dialogValue.value = false;
    loginForm.value.code = "";
  }
}
</script>
<style scoped lang="scss">
  :deep(.el-input__inner) {
      height: 44px;
      border-radius: 4px;
      font-size: 14px;
      padding: 0 15px;
      border-radius: 24px;
    }
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  // padding: 2rem;
  background: #f7fafc;
  font-feature-settings: "kern";
}

.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 480px;
  margin-top: -70px;
}

.login-header {
  margin-bottom: 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: -15px;
}

.login-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.login-subtitle {
  margin-top: 10px;
  font-size: 12px;
  // font-weight: 500;
}

.login-form {
  width: 100%;
  background-color: #ffffff;
  padding: 30px;
  border-radius: 24px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  box-sizing: border-box;

  .el-form-item {
    margin-bottom: 20px;
  }

  .el-input {
    width: 100%;
    border-radius: 50%;

    .el-input__inner {
      height: 44px;
      border-radius: 4px;
      font-size: 14px;
      padding: 0 15px;
      border-radius: 24px;
    }
  }

  .el-button {
    height: 44px;
    font-size: 16px;
    font-weight: 500;
    border-radius: 24px;
  }
}

/* 内容区域 */
.account-dialog {
  border-radius: 16px;
  background-color: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: none;
  padding-bottom: 20px;
}

.dialog-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0;
  margin-bottom: 20px;
}

.logo-container {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.dialog-logo {
  width: 120px;
  // height: 50px;
  border-radius: 8px;
}

.dialog-title {
  font-size: 16px;
  color: #666;
  font-weight: 500;
  text-align: center;
}
.dialog-title1 {
  font-size: 12px;
  color: #303030;
  // font-weight: 700;
  // text-align: center;
  width: 100%;
  input {
    border-radius: 15px;
    // margin-top: 10px;
  }
}

.account-list {
  padding: 0;
  margin: 0;
}

.account-item {
  display: flex;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e8e8e8;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #f9f9f9;
  }
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
}

.account-id {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.account-type {
  font-size: 14px;
  color: #888;
}

.account-company {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.account-number {
  font-size: 14px;
  color: #888;
}

.dialog-close {
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 30px;
  cursor: pointer;
  color: #999;
}
:deep(.el-form-item__label) {
  font-size: 13px !important;
  line-height: 16px !important;
}
:deep(.el-form-item__label::before) {
  content: "" !important;
  color: transparent !important;
  margin-right: 0px;
}

.css-zg4aas {
  position: fixed;
  bottom: 0; /* 添加这一行以定位到页面底部 */
  padding-inline: 24px;
  margin-inline: auto;
  // width: 1044px;
  max-width: 100%;
}

.css-1s7xaob {
  display: flex;
  flex-direction: column;
  -webkit-box-align: center;
  align-items: center;
  -webkit-box-pack: center;
  justify-content: center;
  padding-inline: 30px;
}

.css-i8munm {
  color: #a0aec0;
  text-align: center;
  margin-bottom: 20px;
  text-transform: uppercase;
  font-size: 12px;
}
.el-dialog__body {
  padding: 0 20px;
}
.el-dialog__footer {
  padding: 0;
  padding-right: 40px;
  padding-bottom: 20px;
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
</style>
