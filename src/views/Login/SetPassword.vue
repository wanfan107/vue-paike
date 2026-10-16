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

      <div v-if="isLoading" class="login-form">
        <div class="loading-text">{{ t('login.verifying') }}</div>
      </div>

      <div v-else-if="tokenError" class="login-form">
        <div class="error-icon">!</div>
        <h2 class="error-title">{{ tokenError }}</h2>
        <p class="error-hint">{{ t('login.contactAdminResend') }}</p>
        <el-button    style="width: 100%"
              type="primary"
              size="default"
              :loading="isLoading"
               @click="goToLogin">{{ t('login.goToLogin') }}</el-button>
      </div>

      <div v-else-if="success" class="login-form">
        <div class="success-icon">&#10003;</div>
        <h2 class="success-title">{{ t('login.passwordSetSuccess') }}</h2>
        <p class="success-hint">{{ t('login.accountActivated') }}</p>
        <el-button  style="width: 100%"
              type="primary"
              size="default"
              :loading="isLoading"
              @click="goToLogin">{{ t('login.goToLogin') }}</el-button>
      </div>

      <div v-else class="login-form">
        <el-form
          ref="passwordFormRef"
          label-position="top"
          :model="passwordForm"
          @keyup.enter.native="submitForm"
          :rules="rules"
        >
          <div class="form-title">{{ t('login.userSetPasswordTitle') }}</div>
          <p class="form-subtitle" v-if="tokenData">
            {{ tokenData.tokenType === 'ResetPassword' ? t('login.resetYourPassword') : t('login.activateAndSetPassword') }}
          </p>
          
          <el-form-item :label="t('login.newPassword')" prop="newPassword">
            <el-input
              v-model="passwordForm.newPassword"
              size="default"
              type="password"
              show-password
              :placeholder="t('login.newPasswordHint')"
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
              :placeholder="t('login.reenterPassword')"
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
              {{ submitButtonText }}
            </el-button>
          </el-form-item>
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
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { http } from '@/api';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const passwordFormRef = ref(null);
const isLoading = ref(true);
const passwordStrength = ref(0);
const passwordStrengthColor = ref('#ff0000');
const passwordStrengthWidth = ref('0%');
const passwordStrengthText = ref('');
const tokenError = ref('');
const tokenData = ref(null);
const success = ref(false);

const passwordForm = ref({
  newPassword: '',
  confirmPassword: ''
});

const rules = computed(() => ({
  newPassword: [
    { required: true, message: t('login.rules.newPasswordRequired'), trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!value) {
          callback(new Error(t('login.rules.newPasswordRequired')));
        } else if (value.length < 6) {
          callback(new Error(t('login.rules.min6')));
        } else if (/\s/.test(value)) {  // 新增：检查是否包含空格
      callback(new Error(t('login.rules.noSpace')));
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
  let text = t('login.strength.low');

  if (!password) {
    passwordStrength.value = 0;
    passwordStrengthColor.value = '#ff0000';
    passwordStrengthWidth.value = '0%';
    passwordStrengthText.value = '';
    return;
  }

  if (password.length >= 6) strength += 1;
  if (/[a-z]/.test(password)) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/\d/.test(password)) strength += 1;
  if (/[^A-Za-z0-9]/.test(password)) strength += 1;

  passwordStrength.value = strength;
  passwordStrengthWidth.value = (strength / 4) * 100 + '%';

  if (strength <= 1) {
    text = t('login.strength.low');
    color = '#ff0000';
  } else if (strength <= 2) {
    text = t('login.strength.mid');
    color = '#ff8800';
  } else if (strength <= 3) {
    text = t('login.strength.midHigh');
    color = '#aabb00';
  } else {
    text = t('login.strength.high');
    color = '#1a7f37';
  }

  passwordStrengthColor.value = color;
  passwordStrengthText.value = text;
};

watch(
  () => passwordForm.value.newPassword,
  (newVal) => {
    calculatePasswordStrength(newVal);
  }
);



const submitButtonText = computed(() => {
  return t('login.confirmSetPassword');
});

onMounted(() => {
  
  verifyToken(); // 验证token
});

  async function verifyToken() {
  isLoading.value = true;
  const token = route.query.token || '';
  if (!token) {
    tokenError.value = t('login.msg.invalidLinkNoToken');
    isLoading.value = false;
    return;
  }
  try {
    const res = await http.verifySetPasswordToken({ token: token });
    if (res.code === 200) {
      tokenData.value = res.data;
    } else {
      tokenError.value = res.msg || t('login.msg.invalidLink');
    }
  } catch (e) {
    tokenError.value = t('login.msg.verifyFailedRetry');
  }
  isLoading.value = false;
}


async function submitForm() {
  try {
    await passwordFormRef.value.validate();
    
    isLoading.value = true;
    
    const res = await http.setGroupUserPassword({
      token: route.query.token,
      password: passwordForm.value.newPassword,
    });
    
    if (res.code === 200) {
      success.value = true;
      ElMessage.success(res.msg || t('login.passwordSetSuccess'));
    } else {
      ElMessage.error(res.msg || t('login.msg.setFailed'));
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(t('login.msg.setPasswordFailed'));
    }
  } finally {
    isLoading.value = false;
  }
}

function goToLogin() {
  router.push('/Login');
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

  .el-input__inner {
    height: 44px;
    border-radius: 24px;
    font-size: 14px;
    padding: 0 15px;
  }

  .el-button {
    height: 44px;
    font-size: 16px;
    font-weight: 500;
    border-radius: 24px;
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

.loading-text {
  text-align: center;
  color: #57606a;
  font-size: 14px;
  padding: 20px 0;
}

.error-icon,
.success-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  font-size: 24px;
  font-weight: bold;
}

.error-icon {
  background-color: #ffebe9;
  color: #cf222e;
}

.success-icon {
  background-color: #dafbe1;
  color: #1a7f37;
}

.error-title,
.success-title {
  text-align: center;
  font-size: 18px;
  color: #24292f;
  margin: 0 0 8px;
}

.error-hint,
.success-hint {
  text-align: center;
  font-size: 14px;
  color: #57606a;
  margin: 0 0 20px;
  line-height: 1.5;
}

.form-subtitle {
  text-align: center;
  font-size: 13px;
  color: #57606a;
  margin: 0 0 20px;
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