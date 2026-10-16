<template>
  <div class="app-page">
    <header class="app-page-header">
      <h1>{{ t('account.config.pageTitle') }}</h1>
    </header>

    <main>
      <div class="form-panel">
        <div class="panel-header">
          <div class="panel-title">{{ t('account.config.panelTitle') }}</div>
          <div class="panel-subtitle">{{ t('account.config.panelSubtitle') }}</div>
        </div>
        <div class="form-container">
          <SubmitForm
            :formStyle="{}"
            :form-list="formList"
            :rule-form="ruleForm"
            :loading="loading"
            :footer="false"
            :footer2="false"
            @save="submit"
            @close="close"
          >
          <!-- <template #secretKey> -->
            <!--          默认掩藏，提示输入MFA2验证码查看 -->
            <!-- <div
              v-if="isGogleCode"
              :style="{
                color: '#00000040',
                width: '100%',
                wordBreak: 'break-all',
                whiteSpace: 'normal',
                overflow: 'hidden',
                lineHeight: '24px',
              }"
            >
              {{ ruleForm.secretKey }}
              <el-button type="text" @click="hideCode">隐藏</el-button>
            </div>
            <div
              :style="{
                color: '#00000040',
                width: '100%',
                wordBreak: 'break-all',
                whiteSpace: 'normal',
                overflow: 'hidden',
                lineHeight: '24px',
              }"
              v-else
            >
              ***************************************
              <el-button type="text" @click="openCode">查看</el-button>
            </div> -->
          <!-- </template> -->
        </SubmitForm>
        </div>
      </div>
    </main>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue';
import useUserStore from '@/stores/user';
import { ElMessage } from 'element-plus';
import { http } from "@/api";
import SubmitForm from '@/components/SubmitForm.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// 获取用户 store
const userStore = useUserStore();

// 定义响应式数据
const loading = ref(false);
const isGogleCode = ref(false);
const formList = ref([
  // 接口地址、应用信息、应用ID - appID 、通道ID - txChannel、虚拟账号、平台公钥(验签)、付款设置、商户公钥(加签)、付款IP
  // {
  //   label: "接口地址",
  //   prop: "apiUrl",
  //   placeholder: "请输入接口地址",
  // },
  {
    label: "应用信息",
    name: "title",
  },
  {
    label: "账户信息",
    prop: "accountId",
  },
  // {
  //   label: "商户密钥",
  //   prop: "secretKey",
  //   slot: true,
  // },

  {
    label: "付款设置",
    name: "title",
  },
  {
    label: "付款IP",
    prop: "paymentIP",
    placeholder: "多个IP以#隔开",
    name: "input",
    type: "textarea",
    disabled: true, // 修改函数返回值为布尔类型   禁用
    rules: [{ required: true, message: "请输入付款IP", trigger: "blur" }],
  },
  {
    label: "登陆IP白名单",
    prop: "paymentIP1",
    placeholder: "多个IP以#隔开",
    name: "input",
    type: "textarea",
    disabled: true,  // 修改函数返回值为布尔类型   启用
    rules: [{ required: true, message: "登陆IP白名单", trigger: "blur" }],
  },
]);

const ruleForm = ref({
  paymentIP: "",
  paymentIP1: "", // ip白名单
  code: "",
  apiUrl: "https://apifox.com/apidoc/shared-729a5437-e2e0-423a-b359-c2c52127d873",
  accountId: "",
  productCode: "",
  testAccount: "",
  secretKey: "",
});

// 定义计算属性
const merchantInfo = computed(() => userStore.merchantInfo);

// 生命周期钩子 - 组件挂载后
onMounted(() => {
  ruleForm.value.accountId = merchantInfo.value.id;
  ruleForm.value.secretKey = merchantInfo.value.tokenKey;
  http.payWhiteList({ id: merchantInfo.value.id }).then((res) => {
    ruleForm.value.paymentIP = res.data.list.join("#");
    ruleForm.value.paymentIP1 = res.data.list2.join("#");
  });
});

// 显示密钥
const openCode = () => {
  isGogleCode.value = true;
};

// 隐藏密钥
const hideCode = () => {
  isGogleCode.value = false;
};

// 提交表单
const submit = () => {
  loading.value = true;
  http
    .savePayWhiteList({
      id: merchantInfo.value.id,
      ipList: ruleForm.value.paymentIP.split("#"),
      code: ruleForm.value.code,
    })
    .then((res) => {
      loading.value = false;
      if (res.code === 200) {
        ElMessage.success("保存成功");
        ruleForm.value.paymentIP = "";
        ruleForm.value.code = "";
      }
    });
};

// 关闭表单536901
const close = () => {
  ruleForm.value.paymentIP1 = "";
  ruleForm.value.code = "";
};
</script>
<style scoped lang="scss">
@use "../../../styles/variables.scss" as *;

.form-panel {
  max-width: 900px;
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
