<template>
  <div class="pay-password-container">
    <el-card class="pay-password-card">
      <div class="card-header">
        <div class="header-title">修改支付密码</div>
        <div class="header-subtitle">使用集团账户MFA2验证修改商户支付密码</div>
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
      title="操作成功"
      message="集团商户支付密码设置成功"
      description="下次支付请使用新密码"
      @confirm="handleSuccessConfirm"
    />
  </div>
</template>
<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import useUserStore from '@/stores/user';
import { ElMessage } from 'element-plus';
import { http } from "@/api";
import SubmitForm from '@/components/SubmitForm.vue';
import SuccessDialog from '@/components/SuccessDialog.vue';

// 获取用户 store
const userStore = useUserStore();

// 定义响应式数据
const showSuccessDialog = ref(false);
const loading = ref(false);
const passwordStrength = ref(0); // 0-4 表示密码强度等级
const passwordStrengthText = ref("");
const passwordStrengthColor = ref("#ff0000"); // 默认红色
const passwordStrengthWidth = ref("0%");
const formList = ref([
  {
    label: "集团支付密码",
    name: "title",
  },
    {
          label: "商户号",
          prop: "merchantCode",
          name: "select",
          placeholder: "请选择商户号",
          options: [],
          rules: [
            { required: true, message: "请选择商户号", trigger: "change" },
          ],
    },
  {
    label: "原始支付密码",
    prop: "oldPassword",
    placeholder: "请输入原始支付密码",
    name: "input",
    type: "password",
    showPassword: true,
    rules: [
      { required: true, message: "请输入原始支付密码", trigger: "blur" },
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
      { required: true, message: "请输入新密码", trigger: "blur" },
      {
        validator: (rule, value, callback) => {
          if (!value) {
            callback(new Error("请输入新密码"));
          } else if (value.length < 6) {
            callback(new Error("密码长度至少6位"));
          } else if (/\s/.test(value)) {  // 新增：检查是否包含空格
      callback(new Error('密码不能包含空格'));
    } else if (!/[a-zA-Z]/.test(value)) {
            callback(new Error("密码必须包含字母"));
          } else if (!/\d/.test(value)) {
            callback(new Error("密码必须包含数字"));
          } else if (!/[^A-Za-z0-9]/.test(value)) {
            callback(new Error("密码必须包含特殊字符"));
          } else if (passwordStrength.value < 3) {
            callback(new Error("密码强度需达到中高及以上"));
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
              backgroundColor: i < passwordStrength.value ? passwordStrengthColor.value : "#e4e7ed",
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
      { required: true, message: "请输入确认新密码", trigger: "blur" },
    ],
  },
  {
    label: "MFA2验证码",
    prop: "emailCode",
    name: "input",
    placeholder: "请输入MFA2验证码",
    rules: [
      { required: true, message: "请输入MFA2验证码", trigger: "blur" },
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
    ElMessage.error("两次输入的密码不一致");
    return;
  }

  if (passwordStrength.value < 3) {
    ElMessage.error("密码强度需达到中高及以上");
    return;
  }

  if (ruleForm.value.newPassword.length < 6) {
    ElMessage.error("密码长度至少6位");
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
          formList.value.find(
            (item) => item.prop === "merchantCode"
          ).options = res.data .filter(m => !m.code?.startsWith('G')).map((m) => ({
            value: m.code,
            name: m.code + (m.siteUrl ? ` (${m.siteUrl})` : ""),
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
// ... existing code ...
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
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  overflow: hidden;

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }
}

.card-header {
  background-color: #f8f9fa;
  padding: 24px;
  text-align: center;
  border-bottom: 1px solid #e9ecef;
}

.header-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.header-subtitle {
  font-size: 14px;
  color: #666;
}

.form-container {
  padding: 24px;
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
  border: 1px solid #dcdfe6;
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


::v-deep(.password-strength-container) {
  width: 100%;
  // margin-top: 10px;
  // padding: 10px;
  // background-color: #f8f9fa;
  border-radius: 6px;
}

::v-deep(.password-strength-header) {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 8px;
}

::v-deep(.password-strength-boxes) {
  display: flex;
  margin: 8px 0;
}

::v-deep(.password-strength-box) {
  width: 25%;
  height: 5px;
  background-color: #e4e7ed;
  border-radius: 5px;
  margin-left: 5px;
}

::v-deep(.password-strength-text) {
  margin-top: 5px;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
}
</style>
