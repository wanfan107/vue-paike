<template>
  <div class="login-page">
    <a href="/manual/merchant.html" class="manual-link">📖 集团商户后台操作文档</a>
    <div class="login-container">
      <div class="login-header">
        <div class="login-logo">
          <img
            style="width: 170px"
            src="@/assets/image/logo.png"
            alt="Univepay Logo"
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
          @submit.prevent
          :rules="rules"
        >
          <el-form-item label="Account" prop="username">
            <el-input
              ref="userInput"
              v-model="loginForm.username"
              size="default"
              type="text"
              placeholder="邮箱账户或商户号"
              @change="handleUsernameChange"
              clearable
             autocomplete="username/current-password"
             name="login_user_account"
              @input="handleInput('username')"
            ></el-input>
          </el-form-item>
          <el-form-item label="PassWord" prop="password">
            <el-input
              v-model="loginForm.password"
              size="default"
              type="password"
              show-password
              placeholder="密码"
              autocomplete="current-password"
              name="login_user_pwd"
               @input="handleInput('password')"
            ></el-input>
            
                        
          </el-form-item>
          <!-- 验证邮箱是否已验证的密码输入框 -->
          <el-form-item label="Email Verification Code" prop="EmailCode" v-if="EmailVerifyshow">
            <el-input
              v-model="loginForm.EmailCode"
              size="default"
              placeholder="该账户新设备首次登录,请输入邮箱验证码"
              @input="handleInput('EmailCode')"
            >
              <template #append>
                <button
                  class="email-code-btn"
                  :disabled="emailCountdown > 0 || !!loginForm.EmailCode"
                  @click="sendEmailCode"
                  size="default"
                >
                  {{ emailCountdown > 0 ? `${emailCountdown}秒后重发` : '获取验证码' }}
                </button>
              </template>
            </el-input>
          </el-form-item>

          <!-- AWS WAF 验证码弹窗已全局挂载在 App.vue，由拦截器统一驱动 -->

          <!-- <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
            <el-link type="primary" @click="showForgotPasswordDialog = true">忘记密码？</el-link>
          </div> -->
          <el-form-item style="margin-top: 10px">
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
          <p class="chakra-text css-i8munm">Univepay Finance © 2026</p>
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
      :show-close="false"
      @opened="handleDialogOpen"
    >
    <div class="dialog-close"  @click="closeDialog">×</div>
      <div style="display: flex; flex-direction: column; align-items: center">
        <el-image :src="qrcode" style="width: 200px; height: 200px"></el-image>
        <div style="margin: 10px 0">扫码绑定MFA2验证码确保登录</div>
        <div style="text-align: center">
          <!-- MFA2验证码输入框 -->
            <div class="code-inputs">
              <input
                v-for="(item, index) in 6"
                :key="index"
                type="text"
                class="code-input"
                maxlength="1"
                @input="handleCodeInput($event, index)"
                @keydown="handleCodeKeydown($event, index)"
                @paste="handleCodePaste($event)"
              />
            </div>
            <!-- <div class="code-hint">如未绑定请输入：000000</div> -->
          <!-- <el-button type="primary" @click="dialogValue = false,isVerifyPass = true">重新输入验证码</el-button> -->
        </div>
      </div>
    </el-dialog>

    <!-- MFA2验证码 -->
    <el-dialog
      :z-index="1000"
      top="35vh"
      width="400px"
      v-model="isVerifyPass"
      :close-on-click-modal="false"
      append-to-body
      custom-class="account-dialog"
      :show-close="false"
      style="padding: 0 20px"
      @opened="handleDialogOpen"
    >
    <div class="dialog-close"  @click="closeDialog">×</div>
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
          <div class="verification-code-container">
            <div class="code-inputs">
              <input
                v-for="(item, index) in 6"
                :key="index"
                type="text"
                class="code-input"
                maxlength="1"
                @input="handleCodeInput($event, index)"
                @keydown="handleCodeKeydown($event, index)"
                @paste="handleCodePaste($event)"
              />
            </div>
            <!-- <div class="code-hint">如未绑定请输入：000000</div> -->
          </div>
        </div>
      </div>
      <!-- 登录动画 -->
      <div class="login-animation" v-if="loading">
        <div class="loading-spinner"></div>
        <div class="loading-text">正在登录...</div>
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
    <div         v-loading="loading"
        element-loading-text="正在登录..."
        element-loading-spinner="el-icon-loading"
        element-loading-background="rgba(255, 255, 255, 0.9)">
      <div class="dialog-close" @click="closeDialog1">×</div>
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
             <el-tooltip :content="account.type" placement="left">
              <div class="account-type">{{ account.type }}</div>
            </el-tooltip>
          </div>
          <div class="right-column">
<div class="account-company"><span>余额：</span><span class="balance-value">{{ account.balance || ' ' }}</span></div>
            <div class="account-number">创建时间：{{ account.createdOn }}</div>
          </div>
        </div>
      </div>
      </div>
    </el-dialog>

    <!-- 忘记密码对话框 -->
    <!-- <el-dialog
      :z-index="1003"
      top="10vh"
      width="400px"
      title="忘记密码"
      v-model="showForgotPasswordDialog"
      :close-on-click-modal="false"
      append-to-body
      custom-class="account-dialog"
      :show-close="false"
    >
      <div class="dialog-close" @click="showForgotPasswordDialog = false">×</div>
      <el-form
        ref="forgotPasswordFormRef"
        :model="forgotPasswordForm"
        :rules="forgotPasswordRules"
      >
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="forgotPasswordForm.email"
            placeholder="请输入注册邮箱"
            disabled
          ></el-input>
        </el-form-item>
        <el-form-item label="验证码" prop="verificationCode">
          <el-input
            v-model="forgotPasswordForm.verificationCode"
            placeholder="请输入验证码"
            clearable
          >
            <template #append>
              <el-button
                type="primary"
                :disabled="countdown > 0"
                @click="sendVerificationCode"
              >
                {{ countdown > 0 ? `${countdown}秒后重发` : '发送验证码' }}
              </el-button>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showForgotPasswordDialog = false">取消</el-button>
        <el-button
          type="primary"
          :loading="resettingPassword"
          @click="resetPassword"
        >
          重置密码
        </el-button>
      </template>
    </el-dialog> -->
  </div>
</template>
<!-- <script
  src="https://www.recaptcha.net/recaptcha/api.js?hl=zh-CN"
  async
  defer
></script> -->
<script setup>
import { ref, computed, onMounted, nextTick, watch, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import useUserStore from '@/stores/user';
import FingerprintJS, { sources as fpSources, loadSources } from '@fingerprintjs/fingerprintjs';
import { useVisitorData } from '@fingerprint/vue';
import { http } from '@/api';
import md5 from 'js-md5';


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
const dialogValue = ref(false); // 登录对话框是否显示
const isVerifyPass = ref(false); // 是否需要验证密码
const loading = ref(false);  // 登录加载中
const isLoading = ref(false);  // 是否正在加载中
const dialogValue1 = ref(false); // 多个商户选择对话框是否显示
// const isFirstVisit = ref(true); // 是否是首次访问
// const showForgotPasswordDialog = ref(false); // 是否显示忘记密码对话框
// const resettingPassword = ref(false); // 是否正在重置密码
// const countdown = ref(0); // 验证码倒计时
// const forgotPasswordFormRef = ref(null); // 忘记密码表单引用
const groupNeedBindGoogle = ref(false); // 是否需要绑定Google验证码

const EmailVerifyshow = ref(false); // 是否显示邮箱验证码输入框
const emailCountdown = ref(0); // 邮箱验证码倒计时
let emailCountdownTimer = null; // 倒计时定时器

watch(EmailVerifyshow, (newVal) => {
  if (newVal) {
    startEmailCountdown();
  } else {
    resetEmailCountdown();
  }
});

function startEmailCountdown() {
  if (emailCountdownTimer) {
    clearInterval(emailCountdownTimer);
  }
  emailCountdown.value = 60;
  emailCountdownTimer = setInterval(() => {
    emailCountdown.value--;
    if (emailCountdown.value <= 0) {
      clearInterval(emailCountdownTimer);
      emailCountdownTimer = null;
    }
  }, 1000);
}

function resetEmailCountdown() {
  if (emailCountdownTimer) {
    clearInterval(emailCountdownTimer);
    emailCountdownTimer = null;
  }
  emailCountdown.value = 0;
}

async function sendEmailCode() {
  try {
    await groupLoginLogin();
    startEmailCountdown();
  } catch (error) {
    ElMessage.error(error.msg || '获取验证码失败');
  }
}

// // 忘记密码表单数据
// const forgotPasswordForm = ref({
//   email: '',
//   verificationCode: ''
// });

// // 忘记密码验证规则
// const forgotPasswordRules = ref({
//   email: [
//     { required: true, message: '请输入邮箱', trigger: 'blur' },
//     { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
//   ],
//   verificationCode: [
//     { required: true, message: '请输入验证码', trigger: 'blur' },
//     { min: 6, max: 6, message: '验证码长度为 6 个字符', trigger: 'blur' }
//   ]
// });

// 对话框打开时设置焦点
function handleDialogOpen() {
  nextTick(() => {
    // 获取当前可见对话框中的验证码输入框
    const activeDialog = document.querySelector('.account-dialog.is-visible');
    if (activeDialog) {
      const firstInput = activeDialog.querySelector('.code-input');
      if (firstInput) {
        firstInput.focus();
      }
    } else {
      // 备用方案：直接找第一个输入框
      const firstInput = document.querySelector('.code-input');
      if (firstInput) {
        firstInput.focus();
      }
    }
  });
}

// 验证码输入处理
const codeInputs = ref([]);

// 处理验证码输入
function handleCodeInput(event, index) {
  const input = event.target;
  const value = input.value;
  
  // 只允许输入数字
  if (!/^[0-9]$/.test(value) && value !== '') {
    input.value = '';
    return;
  }
  
  // 自动跳转到下一个输入框
  if (value !== '' && index < 5) {
    const nextInput = input.nextElementSibling;
    if (nextInput) {
      nextInput.focus();
    }
  }
  
  // 更新 loginForm.code
  updateLoginCode();
}

// 处理键盘事件
function handleCodeKeydown(event, index) {
  const input = event.target;
  
  // 处理退格键
  if (event.key === 'Backspace') {
    if (input.value !== '') {
      // 如果当前输入框有内容，清空它
      input.value = '';
      updateLoginCode();
    } else if (index > 0) {
      // 如果当前输入框为空且不是第一个，移动到前一个输入框
      const prevInput = input.previousElementSibling;
      if (prevInput) {
        prevInput.focus();
      }
    }
  }
  
  // 处理左右箭头
  if (event.key === 'ArrowLeft') {
    if (index > 0) {
      const prevInput = input.previousElementSibling;
      if (prevInput) {
        prevInput.focus();
        // 确保光标在数字后面
        setTimeout(() => {
          prevInput.setSelectionRange(prevInput.value.length, prevInput.value.length);
        }, 0);
      }
    }
  }
  
  if (event.key === 'ArrowRight' && index < 5) {
    const nextInput = input.nextElementSibling;
    if (nextInput) {
      nextInput.focus();
    }
  }
  
  // 处理回车键
  if (event.key === 'Enter') {
    // 这里可以添加验证码提交逻辑
    submitForm();
  }
}

// 处理粘贴事件
function handleCodePaste(event) {
  event.preventDefault();
  const pasteData = event.clipboardData.getData('text');
  const code = pasteData.replace(/\D/g, '').substring(0, 6);
  
  for (let i = 0; i < code.length; i++) {
    const input = document.querySelectorAll('.code-input')[i];
    if (input) {
      input.value = code[i];
    }
  }
  
  // 更新 loginForm.code
  updateLoginCode();
  
  // 聚焦到最后一个非空输入框的下一个
  const lastFilledIndex = code.length - 1;
  if (lastFilledIndex < 5) {
    const nextInput = document.querySelectorAll('.code-input')[lastFilledIndex + 1];
    if (nextInput) {
      nextInput.focus();
    }
  }
}

// 更新 loginForm.code
function updateLoginCode() {
  const inputs = document.querySelectorAll('.code-input');
  let code = '';
  inputs.forEach(input => {
    code += input.value;
  });
  loginForm.value.code = code;
  
  // 当验证码长度达到6位时自动调用登录
  if (code.length === 6) {
    submitForm();
  }
}

// 关闭对话框并清空验证码
function closeDialog() {
  // 关闭对话框
  isVerifyPass.value = false;
  dialogValue.value = false;
  // 清空所有验证码输入框
  const inputs = document.querySelectorAll('.code-input');
  inputs.forEach(input => {
    input.value = '';
  });
  
  // 清空loginForm.code
  loginForm.value.code = '';
  // 清空邮箱验证码
  loginForm.value.EmailCode = '';
}

// 关闭dialogValue1 选择账户 退出登录信息
function closeDialog1() {
  dialogValue1.value = false;
  searchKey.value = '';
   // 重置token
  userStore.resetToken();
}

// 处理用户名变化 - 简化版（只要输入框值改变就重置）
function handleUsernameChange() {
  console.log('用户名变化:', { current: loginForm.value.username, EmailVerifyshow: EmailVerifyshow.value });
  // 只要用户名任何变化（包括选中粘贴）都重置邮箱验证码状态
  EmailVerifyshow.value = false;
  loginForm.value.EmailCode = '';
  console.log('重置邮箱验证码状态');
}

// 处理输入事件，去除所有空格
function handleInput(field) {
  if (loginForm.value[field]) {
    loginForm.value[field] = loginForm.value[field].replace(/\s/g, '');
  }
  
  if (field === 'username') {
    // 只要输入用户名时也重置邮箱验证码状态
    EmailVerifyshow.value = false;
    loginForm.value.EmailCode = '';
  }
}


// 账户列表
const accounts = ref([
 
]);

// 登录表单数据
const loginForm = ref({
  username: "",
  password: "",
  EmailCode: "",
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
  ],
  password: [
    { required: true, message: "请输入您的密码", trigger: "blur" },
    { min: 6, message: "密码长度不能小于 6 位", trigger: "blur" },
  ],
});

// 计算属性
const filteredAccounts = computed(() => {
  const keyword = (searchKey.value || '').trim().toLowerCase();
  
  if (!keyword) {
    return accounts.value;
  }
  
  return accounts.value.filter(
    (account) =>
      account &&
      (account.id?.toLowerCase().includes(keyword) ||
        account.company?.toLowerCase().includes(keyword) ||
        account.accountNumber?.toLowerCase().includes(keyword))
  );
});



// 生命周期钩子
onMounted(() => {
  // 重置token
  userStore.resetToken();
  nextTick(() => {
    userInput.value.focus();
  });
  
  // const hasVisited = localStorage.getItem("hasVisited");
  // isFirstVisit.value = !hasVisited;
  // localStorage.setItem("hasVisited", "true");
  
  dialogValue.value = false;
  isVerifyPass.value = false;
  loading.value = false;
  isLoading.value = false;
  dialogValue1.value = false;
});

onBeforeUnmount(() => {
  resetEmailCountdown();
});

// 方法
// 验证登录指纹，是否是常用设备
// async function compareOnEnter() {
//   try {
//     const fp = await FingerprintJS.load({ monitoring: false });
//     const result = await fp.get();
//     const currentFingerprint = result.visitorId;
//     const previousFingerprint = localStorage.getItem("previousFingerprint");

//     // 如果指纹不匹配，提示
//     if (
//       previousFingerprint &&
//       currentFingerprint !== previousFingerprint
//     ) {
//       // ElMessage.warning("检测到设备变更，请注意安全！");
//     }

//     localStorage.setItem("previousFingerprint", currentFingerprint);
//   } catch (error) {
//     console.error('获取指纹失败:', error);
//   }
// }





// 单商户登录提交
async function _login() {
  loading.value = true;
  try {
    await userStore.login(loginForm.value);
    router.push({ path: "/home" });
  } catch (error) {
    console.log("-------------", error);
    if (error.code === 401 && error.data && error.data.googledata) {
      const { IsBinding, qrCodeImageUrl } = error.data.googledata;
      if (!IsBinding) {
        qrcode.value = qrCodeImageUrl;
        dialogValue.value = true;
      }
    }
  } finally {
    loading.value = false;
  }
}

// 集团登录提交（带设备信息）
async function _groupLogin() {
  loading.value = true;
  try {
    const { fingerprint, deviceInfo } = await getDeviceInfo();
    
   const res =  await userStore.groupLogin({
      email: loginForm.value.username,
      password: loginForm.value.password,
      code: loginForm.value.code,
      deviceFingerprint: fingerprint,
      EmailCode: loginForm.value.EmailCode,
      deviceInfo: deviceInfo
    });
    if (res.autoSelected) {
         // 单商户，自动登录成功
         router.push({ path: "/home" });
    } else {
      // 多个商户，等待用户选择
     // 转换为账号列表格式
        accounts.value = res.merchants.filter(m => !m.code?.startsWith('G')).map(m => ({
                  id: m.code,
                  code: m.code,
                  // siteUrl: m.siteUrl || '',
                  type: m.qq || '未配置网站',
                      balance: m.balance || '0.00',
    createdOn: formatDateTime(m.createdOn) || '',
                }));
                // dialogValue.value = false; // 关闭MFA2验证码弹窗
                closeDialog(); // 关闭MFA2验证码弹窗
      dialogValue1.value = true;  // 显示选择商户弹窗
     loading.value = false;
    }
  } catch (error) {
    console.log("-------------", error);
    if (error.code === 401 && error.data && error.data.googledata) {
      const { IsBinding, isVerified, qrCodeImageUrl } = error.data.googledata;
      if (!IsBinding) {
        qrcode.value = qrCodeImageUrl;  // 赋值给二维码图片
        groupNeedBindGoogle.value = true;
        // dialogValue.value = true;  // dialogValue.value 为 true 时，显示MFA2验证码弹窗
      } else if (isVerified === false) {
        ElMessage.error("MFA2验证码错误，请重新输入");
      }
    }
    //  else if (error.code === 401) {
    //   ElMessage.error(error.msg || "MFA2验证码1错误");
    // }
  } finally {
    loading.value = false;
  }
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  // 如果是字符串，先转换为 Date 对象
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  const pad = (n) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

//  集团登录提交


// 单商户登录提交
async function submitForm() {
  // if (!isFirstVisit.value) {
  //   await compareOnEnter();
  // }

  loginFormRef.value.validate((valid) => {
    if (!valid) {
      return false;
    }
    loading.value = true;
    
    // 根据用户名判断登录类型
    if (loginForm.value.username.includes('@')) {
      _groupLogin();
    } else {
      // 单商户登录
      _login();
    }
  });
}

// 点击按钮触发验证/登录
async function checkHuman() {
// 判断是单商户登录还是集团商户登录
if (loginForm.value.username.includes('@')) {
  // 集团商户登录
  if(EmailVerifyshow.value==true&&loginForm.value.EmailCode==""){
    ElMessage.error("请输入邮箱验证码");
    return;
  } else if(EmailVerifyshow.value==true&&loginForm.value.EmailCode.length !== 6){
    ElMessage.error("邮箱验证码长度不正确");
    return;
  } else if(EmailVerifyshow.value==true&&loginForm.value.EmailCode) {
        // if (loginForm.value.EmailCode) {
          // 这里用来验证邮箱验证码是否正确
          // 如果邮箱验证码正确，isVerifyPass.value 为 true
          // 如果邮箱验证码错误，isVerifyPass.value 为 false
          const verifyRes = await http.verifyEmailCode({
            email: loginForm.value.username,
            // groupCode: 'G10001',  // 不需要了
            code: loginForm.value.EmailCode,
          });
          if (verifyRes.code == 200) {
            isVerifyPass.value = true;
          } else {
            isVerifyPass.value = false;
          }
        // }
  } else{
groupLoginLogin();
  }
} else {
  // 单商户登录
  singleLoginLogin();
}
}


//  单商户登录
async function singleLoginLogin() {
  try {
    const { fingerprint, deviceInfo } = await getDeviceInfo();
    isLoading.value = true;
    const res = await http.prelogin(loginForm.value);

    console.log(res);
    if (res.code == 200) {
      isVerifyPass.value = true;
      // 焦点设置已通过watch监听isVerifyPass变化实现
    }if (res.code === 401 && res.data && res.data.googledata) {
      const { IsBinding, qrCodeImageUrl } = res.data.googledata;
      if (!IsBinding) {
        qrcode.value = qrCodeImageUrl;
        dialogValue.value = true;
      }
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


//  集团商户登录
async function groupLoginLogin() {
  try {
    isLoading.value = true;

    const { fingerprint, deviceInfo } = await getDeviceInfo();

    const res = await http.groupPrelogin({
      email: loginForm.value.username,
      password: loginForm.value.password,
      code: loginForm.value.code,
      deviceFingerprint: fingerprint,
      deviceInfo: deviceInfo
    });

    console.log("集团登录响应:",res);
    if (res.code == 200) {
      // 验证邮箱是否已验证
      if(res.data.EmailVerify==true){
        EmailVerifyshow.value = true;
        // ElMessage.error(res.msg); // 新设备登录需要邮箱验证码
        if (!loginForm.value.EmailCode) {
          ElMessage.error(res.msg);
          return;
        }
      }else{
      isVerifyPass.value = true;
      }
    } if (res.code === 401 && res.data && res.data.googledata) {
      const { IsBinding, qrCodeImageUrl } = res.data.googledata;
      if (!IsBinding) {
        qrcode.value = qrCodeImageUrl;
        dialogValue.value = true;
      }
    }
  } 
  
  catch (error) {
    console.log("aws-----aws--------", error);
    if (error && error.isCaptchaCancel) {
      ElMessage.info("已取消安全验证");
    }
  } finally {
    isLoading.value = false;
  }
}




// -----------------------获取设备信息（使用 @fingerprint/vue）-----------------------

const { getData } = useVisitorData({
    immediate: false
  });

async function getDeviceInfo() {
  try {
    // linkedId：把本次识别事件与登录框账号关联，便于事后在 Fingerprint 控制台按账号过滤查询
    const visitorData = await getData({ 
      linkedId: loginForm.value.username,
      tag: { userAction: 'login' },        // webhook 回来时后端能对上这是登录动作
     });
    console.log('-----',visitorData);
    
    const fingerprint = visitorData?.visitor_id || '';
    
    const os = getOS();
    let osVersion = '   ';
    if (os === 'MacOS') {
      osVersion = await getAccurateMacVersion();
    } else if (os === 'Windows') {
      osVersion = await getAccurateWindowsVersion();
    } else {
      osVersion = getOSVersion();
    }

    const deviceInfo = {
      visitorData: visitorData,   // 添加fingerprint，详细信息
      os: os,                          // 操作系统名称（Windows/MacOS/Linux/Android/iOS）
      osVersion: osVersion,            // 操作系统版本号（已支持区分Win10/Win11）
      browser: getBrowser(),            // 浏览器名称（Chrome/Edge/Safari/Firefox等）
      browserVersion: getBrowserVersion(), // 浏览器版本号
      device: getDeviceType(),           // 设备类型（Desktop/Mobile/Tablet）
      deviceModel: getDeviceModel(),     // 设备型号（iPhone/iPad/Android设备型号等）
      language: getLanguage(),            // 浏览器语言（如zh-CN/en-US）
      userAgent: navigator.userAgent      // 完整的User-Agent字符串
    };

    console.log('✅ Fingerprint:', fingerprint);
    console.log('✅ Device Info:', deviceInfo);
    return { fingerprint, deviceInfo };

  } catch (err) {
    console.error('❌ 获取设备信息失败', err);
    return {
      fingerprint: '获取失败',
      deviceInfo: {
        os: '获取失败',
        osVersion: '获取失败',
        browser: '获取失败',
        browserVersion: '获取失败',
        device: '获取失败',
        deviceModel: '获取失败',
        language: '获取失败',
        userAgent: navigator.userAgent || '获取失败'
      }
    };
  }
}

/**
 * 获取操作系统名称
 */
function getOS() {
  const userAgent = navigator.userAgent;
  if (userAgent.indexOf('Android') !== -1) return 'Android';
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'iOS';
  if (userAgent.indexOf('Win') !== -1) return 'Windows';
  if (userAgent.indexOf('Mac') !== -1) return 'MacOS';
  if (userAgent.indexOf('Linux') !== -1 && userAgent.indexOf('Android') === -1) return 'Linux';
  return 'Unknown';
}

/**
 * 获取操作系统版本号
 */
function getOSVersion() {
  const userAgent = navigator.userAgent;

  if (userAgent.indexOf('Windows NT') !== -1) {
    const match = userAgent.match(/Windows NT (\d+\.\d+)/);
    if (match) {
      const versionMap = {
        '10.0': '10',
        '6.3': '8.1', '6.2': '8', '6.1': '7', '6.0': 'Vista', '5.1': 'XP'
      };
      return versionMap[match[1]] || match[1];
    }
  }
  if (userAgent.indexOf('Mac OS X') !== -1) {
    const match = userAgent.match(/Mac OS X (\d+[._]\d+[._]\d+[._]?\d*)/);
    return match ? match[1].replace(/_/g, '.') : 'Unknown';
  }
  if (userAgent.indexOf('Android') !== -1) {
    const match = userAgent.match(/Android (\d+\.\d+(?:\.\d+)?)/);
    return match ? match[1] : 'Unknown';
  }
  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    const match = userAgent.match(/(?:iPhone OS|CPU OS) (\d+_\d+(?:_\d+)?)/);
    return match ? match[1].replace(/_/g, '.') : 'Unknown';
  }
  return 'Unknown';
}

/**
 * 异步获取精准的 Mac 操作系统版本
 */
async function getAccurateMacVersion() {
  const userAgent = navigator.userAgent;

  if (userAgent.indexOf('Mac') === -1) {
    return getOSVersion();
  }

  if (navigator.userAgentData) {
    try {
      const highEntropy = await navigator.userAgentData.getHighEntropyValues(['platformVersion']);
      const darwinMajor = parseInt(highEntropy.platformVersion.split('.')[0]);

      // 2026 最新映射
      const macVersionMap = {
        25: '16',
        24: '15 (Sequoia)',
        23: '14 (Sonoma)',
        22: '13 (Ventura)',
        21: '12 (Monterey)',
        20: '11 (Big Sur)'
      };

      return macVersionMap[darwinMajor] || `10.15+ (Darwin: ${highEntropy.platformVersion})`;
    } catch (e) {
      console.warn('Client Hints API 调用失败，准备降级:', e.message);
    }
  }

  return getOSVersion();
}

/**
 * 异步获取精准 Windows 版本（完美区分 Win10 / Win11）
 */
async function getAccurateWindowsVersion() {
  const baseVersion = getOSVersion();

  if (navigator.userAgentData) {
    try {
      const highEntropy = await navigator.userAgentData.getHighEntropyValues(['platformVersion']);
      const pv = highEntropy.platformVersion;
      const build = parseInt(pv.split('.')[2]) || 0;

      if (build >= 22000) {
        return '11';
      } else if (build >= 10000) {
        return '10';
      }
    } catch (e) {
      console.warn('Client Hints API 调用失败');
    }
  }

  return baseVersion;
}

/**
 * 获取浏览器名称
 */
function getBrowser() {
  const userAgent = navigator.userAgent;
  if (userAgent.indexOf('Edg/') !== -1) return 'Edge';
  if (userAgent.indexOf('OPR/') !== -1) return 'Opera';
  if (userAgent.indexOf('Chrome/') !== -1 && userAgent.indexOf('Edg') === -1) return 'Chrome';
  if (userAgent.indexOf('Safari/') !== -1 && userAgent.indexOf('Chrome') === -1) return 'Safari';
  if (userAgent.indexOf('Firefox/') !== -1) return 'Firefox';
  if (userAgent.indexOf('MSIE ') !== -1 || userAgent.indexOf('Trident/') !== -1) return 'IE';
  return 'Unknown';
}

/**
 * 获取浏览器版本号
 */
function getBrowserVersion() {
  const userAgent = navigator.userAgent;

  const edgeMatch = userAgent.match(/Edg\/([\d.]+)/);
  if (edgeMatch) return edgeMatch[1];

  const operaMatch = userAgent.match(/OPR\/([\d.]+)/);
  if (operaMatch) return operaMatch[1];

  const chromeMatch = userAgent.match(/Chrome\/([\d.]+)/);
  if (chromeMatch) return chromeMatch[1];

  const safariMatch = userAgent.match(/Version\/([\d.]+)/);
  if (safariMatch && userAgent.indexOf('Chrome') === -1) {
    return safariMatch[1];
  }

  const firefoxMatch = userAgent.match(/Firefox\/([\d.]+)/);
  if (firefoxMatch) return firefoxMatch[1];

  const ieMatch = userAgent.match(/rv:([\d.]+)/);
  if (ieMatch && userAgent.indexOf('Trident') !== -1) {
    return ieMatch[1];
  }

  const msieMatch = userAgent.match(/MSIE ([\d.]+)/);
  if (msieMatch) return msieMatch[1];

  return 'Unknown';
}

/**
 * 获取设备类型
 */
function getDeviceType() {
  const userAgent = navigator.userAgent;
  if (/ipad/i.test(userAgent)) return 'Tablet';
  if (/mobile/i.test(userAgent)) return 'Mobile';
  if (/tablet/i.test(userAgent)) return 'Tablet';
  if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return 'Tablet';
  return 'Desktop';
}

/**
 * 获取设备型号
 */
function getDeviceModel() {
  const userAgent = navigator.userAgent;

  if (/iPhone/.test(userAgent)) return 'iPhone';
  if (/iPad/.test(userAgent)) return 'iPad';
  if (userAgent.indexOf('iPod') !== -1) return 'iPod';

  if (userAgent.indexOf('Android') !== -1) {
    const modelMatch = userAgent.match(/Android\s+[\d.]+;\s*([^;)]+?)(?=\s+(?:Build|))/i);
    if (modelMatch && modelMatch[1].trim()) {
      const model = modelMatch[1].trim();
      if (!/Build|\d+\.\d+/.test(model)) {
        return model;
      }
    }
    return 'Android Device';
  }

  return 'Unknown';
}

/**
 * 获取浏览器语言
 */
function getLanguage() {
  return navigator.language || navigator.userLanguage || 'Unknown';
}




//  选择商户
async function confirmBind(account) {

  loginForm.value.code = "";

  if (groupNeedBindGoogle.value) {
      dialogValue.value = false;
    groupNeedBindGoogle.value = false;  // 关闭MFA2验证码弹窗
    // isVerifyPass.value = true;
    // nextTick(() => {
    //   codeInput.value.focus();
    // });
    return;
  }

  if (account && account.code) {
    try {
      // 显示加载状态
      loading.value = true;
      
      const res = await userStore.selectMerchant(account.code);
      console.log("登录选择用户");
      
      if(res.code == 200){
        // 关闭弹窗
        dialogValue.value = false;
        dialogValue1.value = false;
        // 跳转到首页
        router.push({ path: "/home" });
      }else{
        ElMessage.error(res.msg || "选择商户失败");
      }
    } catch (err) {
      ElMessage.error(err.msg || "选择商户失败");
    } finally {
      loading.value = false;
    }
  }
}

// 发送验证码
// async function sendVerificationCode() {
//   try {
//     // 验证邮箱格式
//     await forgotPasswordFormRef.value.validateField('email');
    
//     // 模拟发送验证码
//     ElMessage.info('验证码已发送到您的邮箱');
    
//     // 开始倒计时
//     countdown.value = 60;
//     const timer = setInterval(() => {
//       countdown.value--;
//       if (countdown.value <= 0) {
//         clearInterval(timer);
//       }
//     }, 1000);
//   } catch (error) {
//     // 验证失败，不发送验证码
//   }
// }

// 重置密码
// async function resetPassword() {
//   try {
//     await forgotPasswordFormRef.value.validate();
    
//     resettingPassword.value = true;
    
//     // 模拟后端API调用延迟
//     await new Promise(resolve => setTimeout(resolve, 1000));
    
//     // 重置成功
//     ElMessage.success('密码重置成功，请查看邮箱获取新密码');
//     showForgotPasswordDialog.value = false;
    
//     // 重置表单
//     forgotPasswordForm.value = {
//       email: '',
//       verificationCode: ''
//     };
//   } catch (error) {
//     if (error !== 'cancel') {
//       ElMessage.error('请填写完整信息');
//     }
//   } finally {
//     resettingPassword.value = false;
//   }
// }
</script>
<style scoped lang="scss">
  :deep(.login-form .el-input__inner) {
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
  position: relative;
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

/* 验证码输入样式 */
.verification-code-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px 0;
}

.code-inputs {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.code-input {
  width: 50px;
  height: 50px;
  border: 1px solid #e6dcdc;
  border-radius: 5px;
  font-size: 24px;
  font-weight: 600;
  text-align: center;
  transition: all 0.3s ease;
  outline: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:focus {
    border-color: #db0011;
    box-shadow: 0 0 0 2px rgba(255, 64, 64, 0.2);
    transform: translateY(-1px);
  }

  &:hover {
    border-color: #ffc6c6;
  }
}

.code-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 10px;
  text-align: center;
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
  padding:  25px 0;
  margin-bottom: 10px;
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
}

/* 登录动画 */
.login-animation {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 0;
  animation: fadeIn 0.5s ease-out;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #db0011;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

.loading-text {
  font-size: 14px;
  color: #606266;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.dialog-title1 {
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
  min-height: 150px; /* 确保loading能看到 */
  max-height: 220px; /* 大约3个账户的高度 */
  overflow-y: auto; /* 超出部分滚动 */
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
  width: 90%;
  font-size: 14px;
  color: #888;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
:deep(.login-form .el-form-item__label) {
  font-size: 13px !important;
  line-height: 16px !important;
}
:deep(.login-form .el-form-item__label::before) {
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

.manual-link {
  position: fixed;
  top: 20px;
  right: 20px;
  font-size: 14px;
  color: #409eff;
  text-decoration: none;
  transition: color 0.2s;
  z-index: 9;

  &:hover {
    color: #409eff;
    text-decoration: underline;
  }
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

.balance-value {
  // color: #67c23a;  // Element Plus 绿色主题色
  font-weight: 600;
}



:deep(.email-code-btn) {
  background-color: #db0011 !important;   /* 主题红色背景 */
  border-color: #db0011 !important;       /* 主题红色边框 */
  color: #fff !important;                  /* 白色文字 */
  width: 100%;
  height: 100%;
  padding: 0 15px;
  border-radius: 0 24px 24px 0;           /* 左边直角，右边圆角，和输入框对齐 */
  margin-left: -1px;                       /* 消除和输入框的缝隙 */
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background-color: #b8000d !important;  /* hover 深一点的红 */
    border-color: #b8000d !important;
    opacity: 0.9;
  }

  &:disabled {
    background-color: #f56c6c !important;  /* 禁用时浅红 */
    border-color: #f56c6c !important;
    opacity: 0.6;
    cursor: not-allowed;
  }
}
:deep(.el-input-group__append) {
 padding: 0  !important;
}
</style>