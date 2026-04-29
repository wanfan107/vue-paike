<template>
  <div class="account-info-container">
    <el-card class="account-card" shadow="hover">
      <div class="card-header">
        <div class="header-title">个人信息</div>
        <!-- <div class="header-subtitle">查看和管理您的账户信息</div> -->
      </div>
      <div class="form-container">
        <SubmitForm
          :footer="false"
          :footer1="true"
          :form-list="formList"
          :rule-form="ruleForm"
          @save="submit"
        ></SubmitForm>
      </div>
    </el-card>
  </div>
</template>
<script setup>
import { ref, computed, watch } from 'vue';
import useUserStore from '@/stores/user';
import SubmitForm from '@/components/SubmitForm.vue';

// 获取用户 store
const userStore = useUserStore();

// 定义响应式数据
const formList = ref([
  {
    label: "支付商户号",
    prop: "id",
    name: "input",
    colSpan: 24,
    disabled: true,
  },
  {
    label: "联系方式",
    prop: "email",
    name: "input",
    disabled: true,
  },
  {
    label: "登录MFA2验证",
    prop: "google",
    name: "switch",
    activeText: "开启",
    inactiveText: "关闭",
    activeValue: 1,
    inactiveValue: 0,
    colSpan: 24,
    disabled: true,
  },
]);

const ruleForm = ref({
  username: "",
  email: "",
  google: 1,
  googleCode: "",
});

// 定义计算属性
const merchantInfo = computed(() => userStore.merchantInfo);

// 定义监听
watch(
  () => merchantInfo.value,
  (val) => {
    console.log(val);
    if (val) {
      ruleForm.value.id = val.id;
      ruleForm.value.email = val.email;
    }
  },
  {
    deep: true,
    immediate: true,
  }
);

// 定义方法
const submit = () => {};
</script>
<style scoped lang="scss">
// 容器样式
.account-info-container {
  min-height: calc(100vh - 200px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  // background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

// 卡片样式
.account-card {
  width: 100%;
  max-width: 550px;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  background: white;

  &:hover {
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
    transform: translateY(-5px);
  }
}

// 卡片头部
.card-header {
  // background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  padding: 24px;
  text-align: center;
}

.header-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.header-subtitle {
  font-size: 14px;
  opacity: 0.9;
  font-weight: 400;
}

// 表单容器
.form-container {
  padding: 32px 40px 40px;
}

// 表单项样式
::v-deep .el-form-item {
  margin-bottom: 28px;
  transition: all 0.3s ease;
}

::v-deep .el-form-item:last-child {
  margin-bottom: 0;
}

// 标签样式
::v-deep .el-form-item__label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
  padding-bottom: 8px;
  display: block;
}

// 输入框样式
::v-deep .el-input {
  width: 100%;
}

::v-deep .el-input__inner {
  height: 48px;
  padding: 0 16px;
  font-size: 15px;
  border-radius: 10px;
  border: 2px solid #e1e8ed;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background-color: #fafbfc;
  color: #2c3e50;

  &:focus {
    border-color: #4facfe;
    box-shadow: 0 0 0 4px rgba(79, 172, 254, 0.15);
    background-color: white;
  }
}

// 禁用状态的输入框
::v-deep .el-input.is-disabled .el-input__inner {
  background-color: #f8f9fa;
  border-color: #e9ecef;
  color: #6c757d;
  cursor: default;
}

// 开关样式
::v-deep .el-switch {
  margin-top: 8px;
}

::v-deep .el-switch__input.is-checked + .el-switch__core {
  background-color: #4facfe;
  border-color: #4facfe;
}

::v-deep .el-switch__core {
  border-radius: 15px;
  width: 50px;
  height: 30px;
}

::v-deep .el-switch__core::after {
  width: 26px;
  height: 26px;
  border-radius: 50%;
}

::v-deep .el-switch__input.is-checked + .el-switch__core::after {
  margin-left: -28px;
}

// 分隔线样式
::v-deep .el-divider--horizontal {
  margin: 0;
  background-color: #e9ecef;
}

// 加载状态
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

// 响应式设计
@media (max-width: 768px) {
  .account-info-container {
    padding: 20px;
  }

  .account-card {
    max-width: 100%;
    margin: 0;
  }

  .form-container {
    padding: 24px 28px 32px;
  }

  ::v-deep .el-form-item {
    margin-bottom: 24px;
  }
}
</style>
