<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <div class="login-logo">
          <img
            style="width: 170px"
            src="@/assets/image/pix-payment-logo-lockup.png"
            alt="Pix Payment Logo"
          />
          <div class="login-subtitle">Finance</div>
        </div>
      </div>
      <div class="login-form">
        <el-form
          ref="passwordFormRef"
          label-position="top"
          :model="passwordForm"
          @keyup.enter.native="submitForm"
          :rules="rules"
        >
          <div class="form-title">{{ t('login.resetPasswordTitle') }}</div>
          
          <el-form-item :label="t('login.email')" prop="email">
            <el-input
              v-model="passwordForm.email"
              size="default"
              type="text"
              :placeholder="t('login.emailPlaceholder')"
              disabled
            ></el-input>
          </el-form-item>

          <el-form-item :label="t('login.captcha')" prop="verificationCode">
            <el-input
              v-model="passwordForm.verificationCode"
              size="default"
              type="text"
              :placeholder="t('login.captchaPlaceholder')"
            >
              <template #append>
                <el-button
                  type="text"
                  :disabled="countdown > 0"
                  @click="sendVerificationCode"
                >
                  {{ countdown > 0 ? t('login.resendCode', { n: countdown }) : t('login.getCode') }}
                </el-button>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item :label="t('login.newPassword')" prop="newPassword">
            <el-input
              v-model="passwordForm.newPassword"
              size="default"
              type="password"
              show-password
              :placeholder="t('login.newPasswordPlaceholder')"
            ></el-input>
            <div v-if="passwordForm.newPassword" class="password-strength-container">
              <div class="password-strength-boxes">
                <div
                  v-for="i in 4"
                  :key="i"
                  class="password-strength-box"
                  :style="{
                    backgroundColor: i <= passwordStrength ? passwordStrengthColor : '#e4e7ed',
                    marginLeft: i > 1 ? '5px' : '0'
                  }"
                ></div>
              </div>
            </div>
          </el-form-item>

          <el-form-item :label="t('login.confirmPassword')" prop="confirmPassword">
            <el-input
              v-model="passwordForm.confirmPassword"
              size="default"
              type="password"
              show-password
              :placeholder="t('login.confirmPasswordPlaceholder')"
            ></el-input>
          </el-form-item>

          <el-form-item>
            <el-button
              style="width: 100%"
              type="primary"
              size="default"
              :loading="isLoading"
              @click="submitForm"
            >
              {{ t('login.confirmResetPassword') }}
            </el-button>
          </el-form-item>

          <div style="text-align: center; margin-top: 16px;">
            <el-link type="primary" @click="goToLogin">{{ t('login.backToLogin') }}</el-link>
          </div>
        </el-form>
      </div>
      <div class="css-zg4aas">
        <div class="css-1s7xaob">
          <p class="chakra-text css-i8munm">PIX © 2026</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';

const router = useRouter();
const { t } = useI18n();

const passwordFormRef = ref(null);
const isLoading = ref(false);
const countdown = ref(0);
const passwordStrength = ref(0);
const passwordStrengthColor = ref('#ff0000');

const passwordForm = ref({
  email: '',
  verificationCode: '',
  newPassword: '',
  confirmPassword: ''
});

const rules = computed(() => ({
  email: [
    { required: true, message: t('login.rules.emailRequired'), trigger: 'blur' },
    { type: 'email', message: t('login.rules.emailFormat'), trigger: 'blur' }
  ],
  verificationCode: [
    { required: true, message: t('login.rules.captchaRequired'), trigger: 'blur' },
    { min: 6, max: 6, message: t('login.rules.captchaLen'), trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: t('login.rules.newPasswordRequired'), trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!value) {
          callback(new Error(t('login.rules.newPasswordRequired')));
        } else if (value.length < 6) {
          callback(new Error(t('login.rules.min6')));
        } else if (!/[a-zA-Z]/.test(value)) {
          callback(new Error(t('login.rules.needLetter')));
        } else if (!/\d/.test(value)) {
          callback(new Error(t('login.rules.needNumber')));
        } else if (!/[^A-Za-z0-9]/.test(value)) {
          callback(new Error(t('login.rules.needSpecial')));
        } else if (passwordStrength.value < 3) {
          callback(new Error(t('login.rules.strengthLow')));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    { required: true, message: t('login.rules.confirmPasswordRequired'), trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.value.newPassword) {
          callback(new Error(t('login.rules.passwordMismatch')));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
}));

const calculatePasswordStrength = (password) => {
  let strength = 0;
  let color = '#ff0000';

  if (!password) {
    passwordStrength.value = 0;
    passwordStrengthColor.value = '#ff0000';
    return;
  }

  if (password.length >= 6) strength += 0;
  if (/[a-z]/.test(password)) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/\d/.test(password)) strength += 1;
  if (/[^A-Za-z0-9]/.test(password)) strength += 1;

  passwordStrength.value = strength;

  if (strength <= 1) {
    color = '#ff0000';
  } else if (strength <= 2) {
    color = '#ff8800';
  } else if (strength <= 3) {
    color = '#aabb00';
  } else {
    color = '#00ff00';
  }

  passwordStrengthColor.value = color;
};

watch(
  () => passwordForm.value.newPassword,
  (newVal) => {
    calculatePasswordStrength(newVal);
  }
);

async function sendVerificationCode() {
  try {
    await passwordFormRef.value.validateField('email');
    
    ElMessage.info(t('login.msg.codeSentToEmail'));
    
    countdown.value = 60;
    const timer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        clearInterval(timer);
      }
    }, 1000);
  } catch (error) {
    // 验证失败，不发送验证码
  }
}

async function submitForm() {
  try {
    await passwordFormRef.value.validate();
    
    isLoading.value = true;
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    ElMessage.success(t('login.msg.resetSuccess'));
    
    router.push('/login');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(t('login.msg.fillComplete'));
    }
  } finally {
    isLoading.value = false;
  }
}

function goToLogin() {
  router.push('/login');
}
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7fafc;
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
}

.login-form {
  width: 100%;
  background-color: var(--color-surface, #ffffff);
  padding: 30px;
  border-radius: 24px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  box-sizing: border-box;

  .el-form-item {
    margin-bottom: 20px;
  }

  // .el-input__inner {
  //   height: 44px;
  //   border-radius: 24px;
  //   font-size: 14px;
  //   padding: 0 15px;
  // }

  .el-button {
    // height: 44px;
    font-size: 13px;
    font-weight: 500;
    border-radius: 24px;
    padding: 0 15px;
  }
}

.form-title {
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 24px;
  color: #303133;
}

.password-strength-container {
  margin-top: 10px;
  width: 100%;
}

.password-strength-boxes {
  display: flex;
  width: 100%;
  height: 5px;
}

.password-strength-box {
  flex: 1;
  height: 5px;
  background-color: var(--color-border-soft, #e4e7ed);
  border-radius: 5px;
  margin-left: 3px;

  &:first-child {
    margin-left: 0;
  }
}

.css-zg4aas {
  position: fixed;
  bottom: 0;
  padding-inline: 24px;
  margin-inline: auto;
  max-width: 100%;
}

.css-1s7xaob {
  display: flex;
  flex-direction: column;
  align-items: center;
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

:deep(.el-form-item__label) {
  font-size: 13px !important;
  line-height: 16px !important;
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
</style>