<template>
  <div class="app-page">
    <header class="app-page-header">
      <h1>{{ t('account.payPassword.pageTitle') }}</h1>
    </header>

    <main>
      <div class="form-panel">
        <div class="panel-header">
          <div class="panel-title">{{ t('account.payPassword.panelTitle') }}</div>
          <div class="panel-subtitle">{{ t('account.payPassword.panelSubtitle') }}</div>
        </div>
        <div class="form-container">
          <SubmitForm
            :form-list="formList"
            :rule-form="ruleForm"
            :loading="loading"
            @save="submit"
            @close="close"
          />
        </div>
      </div>
    </main>

    <SuccessDialog
      v-model="showSuccessDialog"
      title="操作成功"
      message="支付密码设置成功"
      description="下次支付请使用新密码"
      @confirm="handleSuccessConfirm"
    />
  </div>
</template>
<script setup>
import { ref, computed, watch } from 'vue';
import useUserStore from '@/stores/user';
import { ElMessage } from 'element-plus';
import { http } from "@/api";
import SubmitForm from '@/components/SubmitForm.vue';
import SuccessDialog from '@/components/SuccessDialog.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// 获取用户 store
const userStore = useUserStore();

// 定义响应式数据
const showSuccessDialog = ref(false);  // 成功弹窗是否显示
const loading = ref(false);
const passwordStrength = ref(0); // 0-4 表示密码强度等级
const passwordStrengthText = ref("");
const passwordStrengthColor = ref("#ff0000"); // 默认红色
const passwordStrengthWidth = ref("0%");
const formList = ref([
  {
    label: "支付密码",
    name: "title",
  },
  {
    label: "原始支付密码",
    prop: "oldPassword",
    placeholder: "请输入原始支付密码",
    name: "input",
    type: "password",
    showPassword: true,
    rules: [
      { required: true, message: t('account.payPassword.rules.oldRequired'), trigger: "blur" },
    ],
  },
  {
    label: "新密码",
    prop: "newPassword",
    placeholder: "请输入新密码",
    name: "input",
    type: "password",
    showPassword: true,
    rules: [
      { required: true, message: t('account.payPassword.rules.newRequired'), trigger: "blur" },
      {
        validator: (rule, value, callback) => {
          if (!value) {
            callback(new Error(t('account.payPassword.rules.newRequired')));
          } else if (value.length < 6) {
            callback(new Error(t('account.payPassword.rules.min6')));
          } else if (!/[a-zA-Z]/.test(value)) {
            callback(new Error(t('account.payPassword.rules.needLetter')));
          } else if (!/\d/.test(value)) {
            callback(new Error(t('account.payPassword.rules.needNumber')));
          } else if (!/[^A-Za-z0-9]/.test(value)) {
            callback(new Error(t('account.payPassword.rules.needSpecial')));
          } else if (passwordStrength.value < 3) {
            callback(new Error(t('account.payPassword.rules.strength')));
          } else {
            callback();
          }
        },
        trigger: "blur"
      },
    ],
  },
  // 添加密码强度显示在新密码下方
  {
    label: "",
    name: "custom",
    render: (h) => {
      if (!ruleForm.value.newPassword) return null;

      const strengthBoxes = [];
      for (let i = 0; i < 4; i++) {
        strengthBoxes.push(
          h("div", {
            class: "password-strength-box",
            style: {
              backgroundColor: i < passwordStrength.value ? passwordStrengthColor.value : "var(--color-border-soft, #e4e7ed)",
              marginLeft: i > 0 ? "5px" : "0",
            },
          })
        );
      }

      return h(
        "div",
        { class: "password-strength-container" },
        [
          h("div", { class: "password-strength-header" },),
          h("div", { class: "password-strength-boxes" }, strengthBoxes),
          h(
            "div",
            {
              class: "password-strength-text",
              style: { color: passwordStrengthColor.value },
            },
            // passwordStrengthText.value
          ),
        ]
      );
    },
  },
  {
    label: "确认新密码",
    prop: "confirmPassword",
    placeholder: "请输入确认新密码",
    name: "input",
    type: "password",
    showPassword: true,
    rules: [
      { required: true, message: t('account.payPassword.rules.confirmRequired'), trigger: "blur" },
    ],
  },
  {
    label: "MFA2验证码",
    prop: "emailCode",
    name: "input",
    placeholder: "请输入MFA2验证码",
    rules: [
      { required: true, message: t('account.payPassword.rules.mfaRequired'), trigger: "blur" },
    ],
  },
]);

const ruleForm = ref({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
  emailCode: "",
});

// 定义计算属性
const merchantInfo = computed(() => userStore.merchantInfo);

// 计算密码强度的方法
const calculatePasswordStrength = (password) => {
  let strength = 0;
  let text = "强度低";
  let color = "#ff0000"; // 红色
  let width = "0%";

  if (!password) {
    passwordStrength.value = 0;
    passwordStrengthText.value = "";
    passwordStrengthColor.value = "#ff0000";
    passwordStrengthWidth.value = "0%";
    return;
  }

  // 检查长度
  if (password.length >= 6) strength += 0;

  // 检查是否包含小写字母
  if (/[a-z]/.test(password)) strength += 1;

  // 检查是否包含大写字母
  if (/[A-Z]/.test(password)) strength += 1;

  // 检查是否包含数字
  if (/\d/.test(password)) strength += 1;

  // 检查是否包含特殊字符
  if (/[^A-Za-z0-9]/.test(password)) strength += 1;

  passwordStrength.value = strength;

  // 计算宽度 (0% to 100%)
  width = (strength / 4) * 100 + "%";

  // 根据强度设置文本和颜色
  if (strength <= 1) {
    text = "强度低";
    color = "#ff0000"; // 红色
  } else if (strength <= 2) {
    text = "强度中";
    color = "#ff8800"; // 橙色
  } else if (strength <= 3) {
    text = "强度中高";
    color = "#aabb00"; // 黄绿色
  } else {
    text = "强度高";
    color = "#00ff00"; // 绿色
  }

  passwordStrengthText.value = text;
  passwordStrengthColor.value = color;
  passwordStrengthWidth.value = width;
};

// 检查密码是否符合要求（至少字母和数字组合）
const isPasswordValid = (password) => {
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  return hasLetter && hasNumber;
};

// 提交表单
const submit = () => {
  if (ruleForm.value.newPassword !== ruleForm.value.confirmPassword) {
    ElMessage.error(t('account.payPassword.msg.mismatch'));
    return;
  }

  if (passwordStrength.value < 3) {
    ElMessage.error(t('account.payPassword.msg.strengthLow'));
    return;
  }

  if (ruleForm.value.newPassword.length < 6) {
    ElMessage.error(t('account.payPassword.msg.minLength'));
    return;
  }

  loading.value = true;
  http
    .updatePayPassword({
      id: merchantInfo.value.id,
      oldPayPassword: ruleForm.value.oldPassword,
      newPayPassword: ruleForm.value.newPassword,
      code: ruleForm.value.emailCode,
    })
    .then((res) => {
      loading.value = false;
      if (res.code === 200) {
        showSuccessDialog.value = true;
      }
    });
};

const handleSuccessConfirm = () => {
  showSuccessDialog.value = false;
  ruleForm.value = {
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
    emailCode: "",
  };
};

// 关闭表单
const close = () => {
  ruleForm.value = {
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
    emailCode: "",
  };
};

// 监听新密码的变化，实时计算密码强度
watch(
  () => ruleForm.value.newPassword,
  (newVal) => {
    calculatePasswordStrength(newVal);
  }
);
</script>
<style scoped lang="scss">
@use "../../../styles/variables.scss" as *;

.form-panel {
  max-width: 700px;
  margin: 0 auto;
  background: var(--color-elevated);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.panel-header {
  padding: 24px;
  text-align: center;
  border-bottom: 1px solid var(--color-border-soft);
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.panel-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
}

.form-container {
  padding: 24px;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 14px;
}

:deep(.el-input__inner),
:deep(.el-textarea__inner) {
  height: 40px;
  border-radius: 6px;
  border: 1px solid var(--color-border-soft);
  transition: all 0.3s;
  font-size: 14px;
}

:deep(.el-textarea__inner) {
  height: auto;
  min-height: 80px;
}

:deep(.el-button) {
  padding: 10px 20px;
  font-size: 14px;
  transition: all 0.3s;
}

/* 密码强度指示器 */
:deep(.password-strength-container) {
  width: 100%;
  border-radius: 6px;
}

:deep(.password-strength-header) {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

:deep(.password-strength-boxes) {
  display: flex;
  margin: 8px 0;
}

:deep(.password-strength-box) {
  width: 25%;
  height: 5px;
  background-color: var(--color-border-soft);
  border-radius: 5px;
  margin-left: 5px;
}

:deep(.password-strength-text) {
  margin-top: 5px;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
}

/* 适配移动端 */
@media (max-width: 768px) {
  .form-panel {
    max-width: 100%;
  }

  .form-container {
    padding: 16px;
  }

  .panel-header {
    padding: 16px;
  }

  .panel-title {
    font-size: 18px;
  }
}
</style>
