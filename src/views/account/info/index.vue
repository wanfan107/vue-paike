<template>
  <div class="app-page">
    <header class="app-page-header">
      <h1>{{ t('account.info.pageTitle') }}</h1>
    </header>

    <main>
      <div class="form-panel">
        <div class="panel-header">
          <div class="panel-title">{{ t('account.info.panelTitle') }}</div>
        </div>
        <div class="form-container">
          <SubmitForm
            :footer="false"
            :footer1="true"
            :form-list="formList"
            :rule-form="ruleForm"
            @save="submit"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import useUserStore from '@/stores/user';
import SubmitForm from '@/components/SubmitForm.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const userStore = useUserStore();

const formList = computed(() => [
  {
    label: t('account.info.form.merchantNo'),
    prop: "id",
    name: "input",
    colSpan: 24,
    disabled: true,
  },
  {
    label: t('account.info.form.contact'),
    prop: "email",
    name: "input",
    disabled: true,
  },
  {
    label: t('account.info.form.mfaLogin'),
    prop: "google",
    name: "switch",
    activeText: t('account.info.form.switchOn'),
    inactiveText: t('account.info.form.switchOff'),
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

watch(
  () => userStore.merchantInfo,
  (val) => {
    if (val) {
      ruleForm.value.id = val.id;
      ruleForm.value.email = val.email;
    }
  },
  { deep: true, immediate: true }
);

const submit = () => {};
</script>

<style scoped lang="scss">
@use "../../../styles/variables.scss" as *;

.form-panel {
  max-width: 550px;
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

:deep(.el-input__inner) {
  height: 40px;
  border-radius: 6px;
  border: 1px solid var(--color-border-soft);
  transition: all 0.3s;
  font-size: 14px;
}

:deep(.el-input.is-disabled .el-input__inner) {
  background-color: var(--color-bg-soft);
  border-color: var(--color-border-soft);
  color: var(--text-secondary);
  cursor: default;
}

:deep(.el-switch) {
  margin-top: 8px;
}

:deep(.el-switch__input.is-checked + .el-switch__core) {
  background-color: var(--brand-primary);
  border-color: var(--brand-primary);
}

:deep(.el-switch__core) {
  border-radius: 15px;
  width: 50px;
  height: 30px;
}

:deep(.el-switch__core::after) {
  width: 26px;
  height: 26px;
  border-radius: 50%;
}

:deep(.el-switch__input.is-checked + .el-switch__core::after) {
  margin-left: -28px;
}

@media (max-width: 768px) {
  .form-panel {
    max-width: 100%;
  }

  .form-container {
    padding: 16px;
  }
}
</style>
