<template>
  <div class="pay-password-container">
    <el-card class="pay-password-card">
      <div class="card-header">
        <div class="header-title">{{ t('order.groupPayPassword.header.title') }}</div>
        <div class="header-subtitle">{{ t('order.groupPayPassword.header.subtitle') }}</div>
      </div>
      <div class="form-container">
        <SubmitForm
          :form-list="formList"
          :rule-form="ruleForm"
          :loading="loading"
          @save="submit"
          @close="close"
        ></SubmitForm>
      </div>
    </el-card>
    <SuccessDialog
      v-model="showSuccessDialog"
      :title="t('order.groupPayPassword.success.title')"
      :message="t('order.groupPayPassword.success.message')"
      :description="t('order.groupPayPassword.success.description')"
      @confirm="handleSuccessConfirm"
    />
  </div>
</template>
<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import useUserStore from '@/stores/user';
import { ElMessage } from 'element-plus';
import { http } from "@/api";
import SubmitForm from '@/components/SubmitForm.vue';
import SuccessDialog from '@/components/SuccessDialog.vue';

// 获取用户 store
const userStore = useUserStore();

const { t } = useI18n();

// 定义响应式数据
const showSuccessDialog = ref(false);
const loading = ref(false);
const passwordStrength = ref(0); // 0-4 表示密码强度等级
const passwordStrengthText = ref("");
const passwordStrengthColor = ref("var(--color-send)"); // 默认低强度色
const passwordStrengthWidth = ref("0%");
const merchantOptions = ref([]);
const formList = computed(() => [
  {
    label: t('order.groupPayPassword.form.sectionTitle'),
    name: "title",
  },
    {
          label: t('order.groupPayPassword.form.merchantCode'),
          prop: "merchantCode",
          name: "select",
          placeholder: t('order.groupPayPassword.form.merchantCodePlaceholder'),
          options: merchantOptions.value,
          rules: [
            { required: true, message: t('order.groupPayPassword.rules.merchantCodeRequired'), trigger: "change" },
          ],
    },
  {
    label: t('order.groupPayPassword.form.oldPassword'),
    prop: "oldPassword",
    placeholder: t('order.groupPayPassword.form.oldPasswordPlaceholder'),
    name: "input",
    type: "password",
    showPassword: true,
    rules: [
      { required: true, message: t('order.groupPayPassword.rules.oldPasswordRequired'), trigger: "blur" },
    ],
  },
  {
    label: t('order.groupPayPassword.form.newPassword'),
    prop: "newPassword",
    placeholder: t('order.groupPayPassword.form.newPasswordPlaceholder'),
    name: "input",
    type: "password",
    showPassword: true,
    rules: [
      { required: true, message: t('order.groupPayPassword.rules.newPasswordRequired'), trigger: "blur" },
      {
        validator: (rule, value, callback) => {
          if (!value) {
            callback(new Error(t('order.groupPayPassword.rules.newPasswordRequired')));
          } else if (value.length < 6) {
            callback(new Error(t('order.groupPayPassword.rules.min6')));
          } else if (/\s/.test(value)) {  // 新增：检查是否包含空格
      callback(new Error(t('order.groupPayPassword.rules.noSpace')));
    } else if (!/[a-zA-Z]/.test(value)) {
            callback(new Error(t('order.groupPayPassword.rules.needLetter')));
          } else if (!/\d/.test(value)) {
            callback(new Error(t('order.groupPayPassword.rules.needNumber')));
          } else if (!/[^A-Za-z0-9]/.test(value)) {
            callback(new Error(t('order.groupPayPassword.rules.needSpecial')));
          } else if (passwordStrength.value < 3) {
            callback(new Error(t('order.groupPayPassword.rules.strengthLow')));
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
              backgroundColor: i < passwordStrength.value ? passwordStrengthColor.value : "var(--color-border-soft)",
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
    label: t('order.groupPayPassword.form.confirmPassword'),
    prop: "confirmPassword",
    placeholder: t('order.groupPayPassword.form.confirmPasswordPlaceholder'),
    name: "input",
    type: "password",
    showPassword: true,
    rules: [
      { required: true, message: t('order.groupPayPassword.rules.confirmPasswordRequired'), trigger: "blur" },
    ],
  },
  {
    label: t('order.groupPayPassword.form.mfa'),
    prop: "emailCode",
    name: "input",
    placeholder: t('order.groupPayPassword.form.mfaPlaceholder'),
    rules: [
      { required: true, message: t('order.groupPayPassword.rules.mfaRequired'), trigger: "blur" },
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
  let text = t('order.groupPayPassword.strength.low');
  let color = "var(--color-send)"; // 低强度
  let width = "0%";

  if (!password) {
    passwordStrength.value = 0;
    passwordStrengthText.value = "";
    passwordStrengthColor.value = "var(--color-send)";
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
    text = t('order.groupPayPassword.strength.low');
    color = "var(--color-send)"; // 低强度
  } else if (strength <= 2) {
    text = t('order.groupPayPassword.strength.mid');
    color = "var(--color-status-warn)"; // 中强度
  } else if (strength <= 3) {
    text = t('order.groupPayPassword.strength.midHigh');
    color = "var(--brand-primary)"; // 中高强度
  } else {
    text = t('order.groupPayPassword.strength.high');
    color = "var(--color-receive)"; // 高强度
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
    ElMessage.error(t('order.groupPayPassword.msg.notMatch'));
    return;
  }

  if (passwordStrength.value < 3) {
    ElMessage.error(t('order.groupPayPassword.msg.strengthLow'));
    return;
  }

  if (ruleForm.value.newPassword.length < 6) {
    ElMessage.error(t('order.groupPayPassword.msg.min6'));
    return;
  }

  loading.value = true;
  http
    .updateGroupPayPassword({
      merchantCode: ruleForm.value.merchantCode,
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
    merchantCode: "",
    confirmPassword: "",
    emailCode: "",
  };
};

// 组件挂载时加载商户列表
onMounted(() => {
  loadMerchants();
});



  const loadMerchants = () => {
      http.getGroupMerchants().then((res) => {
        if (res.code === 200 && res.data) {
          merchantOptions.value = res.data .filter(m => !m.code?.startsWith('G')).map((m) => ({
            value: m.code,
            name: m.code + (m.qq ? ` - ${m.qq}` : ""),
          }));
        }
      });
    }

// 关闭表单
const close = () => {
  ruleForm.value = {
    oldPassword: "",
    newPassword: "",
    merchantCode: "",
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
.pay-password-container {
  display: flex;
  justify-content: center;
  align-items: center;
    flex-direction: column;
  min-height: calc(100vh - 200px);
  padding: 20px;
}

.pay-password-card {
  width: 100%;
  max-width: 700px;
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  transition: all 0.3s ease;
  overflow: hidden;

  &:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }
}

.card-header {
  background-color: var(--color-elevated);
  padding: 24px;
  text-align: center;
  border-bottom: 1px solid var(--color-border-soft);
}

.header-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.header-subtitle {
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
  border: 1px solid var(--color-border);
  transition: all 0.3s;
  font-size: 14px;
}

:deep(.el-textarea__inner) {
  height: auto;
  min-height: 80px;
}


:deep(.el-button--primary) {
  // background-color: #409eff;
  // border-color: #409eff;
  // border-radius: 6px;
  padding: 10px 20px;
  font-size: 14px;
  transition: all 0.3s;
}

:deep(.el-button) {
  padding: 10px 20px;
  font-size: 14px;
  transition: all 0.3s;
}

/* 针对标题样式的优化 */
:deep(.el-form-item__label[for=""]) {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
  display: block;
}

/* 适配移动端 */
@media (max-width: 768px) {
  .pay-password-container {
    padding: 10px;
    min-height: calc(100vh - 150px);
  }

  .pay-password-card {
    max-width: 100%;
  }

  .form-container {
    padding: 16px;
  }

  .card-header {
    padding: 16px;
  }

  .header-title {
    font-size: 18px;
  }
}

/* 密码强度指示器样式 */


:deep(.password-strength-container) {
  width: 100%;
  // margin-top: 10px;
  // padding: 10px;
  // background-color: #f8f9fa;
  border-radius: 6px;
}

:deep(.password-strength-header) {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-regular);
  margin-bottom: 8px;
}

:deep(.password-strength-boxes) {
  display: flex;
  margin: 8px 0;
}

:deep(.password-strength-box) {
  width: 25%;
  height: 5px;
  background-color: var(--color-border-soft, #e4e7ed);
  border-radius: 5px;
  margin-left: 5px;
}

:deep(.password-strength-text) {
  margin-top: 5px;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
}
</style>
