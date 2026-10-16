<template>
  <div class="page-container">
    <header class="page-header">
      <h1>{{ t('menu.loginIPWhiteList') }}</h1>
      <hr />
    </header>

    <main class="page-content">
      <div class="content-wrapper">
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="120px"
          class="whitelist-form"
        >
          <el-form-item :label="t('order.groupIPWhiteList.form.merchantCode')" prop="merchantCode">
            <el-select
              v-model="form.merchantCode"
              :placeholder="t('order.groupIPWhiteList.form.merchantCodePlaceholder')"
              style="width: 280px;"
              clearable
            >
              <el-option
                v-for="merchant in merchants"
                :key="merchant.code"
                :label="`${merchant.code}${merchant.qq ? ' - ' + merchant.qq : ''}`"
                :value="merchant.code"
              />
            </el-select>
          </el-form-item>

          <el-divider />

          <div class="section-block">
            <div class="section-title">{{ t('order.groupIPWhiteList.form.loginSectionTitle') }}</div>
            <el-form-item :label="t('order.groupIPWhiteList.form.ipAddress')" prop="loginIp">
              <el-input
                v-model="form.loginIp"
                type="textarea"
                :placeholder="t('order.groupIPWhiteList.form.loginIpPlaceholder')"
                :rows="3"
                clearable
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="submitForm('3')">{{ t('order.groupIPWhiteList.form.saveLoginIp') }}</el-button>
            </el-form-item>
          </div>

          <div class="section-block">
            <div class="section-title">{{ t('order.groupIPWhiteList.form.paySectionTitle') }}</div>
            <el-form-item :label="t('order.groupIPWhiteList.form.ipAddress')" prop="payIp">
              <el-input
                v-model="form.payIp"
                type="textarea"
                :placeholder="t('order.groupIPWhiteList.form.payIpPlaceholder')"
                :rows="3"
                clearable
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="submitForm('1')">{{ t('order.groupIPWhiteList.form.savePayIp') }}</el-button>
            </el-form-item>
          </div>
        </el-form>

        <!-- IP白名单查询 -->
        <div class="query-section">
          <div class="section-title">{{ t('order.groupIPWhiteList.query.title') }}</div>
          <el-form
            ref="queryFormRef"
            :model="queryForm"
            class="query-form"
            label-width="100px"
          >
            <el-form-item :label="t('order.groupIPWhiteList.query.merchantCode')">
              <el-select
                v-model="queryForm.merchantCode"
                :placeholder="t('order.groupIPWhiteList.query.merchantCodePlaceholder')"
                style="width: 280px;"
                clearable
              >
                <el-option
                  v-for="merchant in merchants"
                  :key="merchant.code"
                  :label="`${merchant.code}${merchant.qq ? ' - ' + merchant.qq : ''}`"
                  :value="merchant.code"
                />
              </el-select>
            </el-form-item>

            <el-form-item :label="t('order.groupIPWhiteList.query.type')">
              <el-select
                v-model="queryForm.useFor"
                :placeholder="t('order.groupIPWhiteList.query.typePlaceholder')"
                style="width: 200px;"
                clearable
              >
                <el-option :label="t('order.groupIPWhiteList.query.typeLogin')" value="3" />
                <el-option :label="t('order.groupIPWhiteList.query.typePay')" value="1" />
              </el-select>
            </el-form-item>

            <!-- <el-form-item label="MFA2验证码">
              <el-input
                v-model="queryForm.code"
                placeholder="请输入MFA2验证码"
                style="width: 150px;"
                clearable
              />
            </el-form-item> -->

            <el-form-item>
              <el-button type="primary" @click="queryIpWhiteList">{{ t('order.groupIPWhiteList.query.searchBtn') }}</el-button>
              <el-button @click="resetQueryForm">{{ t('order.groupIPWhiteList.query.resetBtn') }}</el-button>
            </el-form-item>
          </el-form>

          <!-- 批量删除按钮 -->
          <div style="display: flex; justify-content: flex-end; margin-bottom: 12px;">
            <el-button
              type="danger"
              size="small"
              :disabled="selectedIps.length === 0"
              @click="handleBatchDelete"
            >
              {{ t('order.groupIPWhiteList.query.batchDelete', { count: selectedIps.length }) }}
            </el-button>
          </div>

          <el-table
            v-loading="queryLoading"
            :data="ipList"
            style="width: 100%"
            max-height="500"
            stripe
            border
            :selectable="row => row.enabled"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="merchantCode" :label="t('order.groupIPWhiteList.table.merchantCode')" width="120" />
            <el-table-column prop="ip" :label="t('order.groupIPWhiteList.table.ip')" min-width="200" />
            <el-table-column prop="useForDisplay" :label="t('order.groupIPWhiteList.table.useFor')" width="100" />
            <el-table-column prop="enabled" :label="t('order.groupIPWhiteList.table.status')" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.enabled ? 'success' : 'danger'">
                  {{ scope.row.enabled ? t('order.groupIPWhiteList.table.enabled') : t('order.groupIPWhiteList.table.disabled') }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="t('order.groupIPWhiteList.table.action')" width="120">
              <template #default="scope">
                <el-button
                  type="danger"
                  size="small"
                  :disabled="!scope.row.enabled"
                  @click="handleDelete(scope.row)"
                >
                  {{ t('order.groupIPWhiteList.table.delete') }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>

        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { Search } from "@element-plus/icons-vue";
import { ref, reactive, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import { http } from "@/api";

const { t } = useI18n();

const props = defineProps({
  title: {
    type: String,
    default: "",
  },
});

const formRef = ref(null);
const merchants = ref([]);

const form = reactive({
  merchantCode: '',
  googleCode: '',
  loginIp: '',
  payIp: ''
});

const rules = computed(() => ({
  merchantCode: [
    { required: true, message: t('order.groupIPWhiteList.rules.merchantCodeRequired'), trigger: 'change' }
  ]
}));

// 查询表单
const queryFormRef = ref(null);
const queryLoading = ref(false);
const ipList = ref([]);

const queryForm = reactive({
  merchantCode: '',
  useFor: '',
  code: ''
});

// 选中的IP列表（用于批量删除）
const selectedIps = ref([]);

// 选择变化处理
const handleSelectionChange = (val) => {
  selectedIps.value = val;
};

// 单独删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      t('order.groupIPWhiteList.msg.deleteConfirmMsg', { ip: row.ip }),
      t('order.groupIPWhiteList.msg.deleteConfirmTitle'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      }
    ).then(async () => {
      await doDelete([row]);
    }).catch(() => {});
  } catch (error) {
    // 用户取消
  }
};

// 批量删除
const handleBatchDelete = async () => {
  if (selectedIps.value.length === 0) {
    ElMessage.warning(t('order.groupIPWhiteList.msg.selectFirst'));
    return;
  }

  try {
    await ElMessageBox.confirm(
      t('order.groupIPWhiteList.msg.batchDeleteConfirmMsg', { count: selectedIps.value.length }),
      t('order.groupIPWhiteList.msg.batchDeleteConfirmTitle'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      }
    ).then(async () => {
      await doDelete(selectedIps.value);
    }).catch(() => {});
  } catch (error) {
    // 用户取消
  }
};

// 执行删除操作
const doDelete = async (deleteList) => {
  if (!deleteList || deleteList.length === 0) return;
  
  const merchantCode = deleteList[0].merchantCode;
  
  const items = deleteList.map(item => ({
    merchantCode: item.merchantCode,
    ipAddress: item.ip,
    useFor: item.useFor
  }));
  
  try {
    const res = await http.deleteIpWhiteList({
      items: items,
      merchantCode: merchantCode,
      code: ''
    });
    
    if (res.Success) {
      ElMessage.success(res.Data?.Message || t('order.groupIPWhiteList.msg.deleteSuccess'));
      // 重新查询刷新列表
      if (queryForm.merchantCode) {
        await queryIpWhiteList();
      }
      selectedIps.value = [];
    } else {
      ElMessage.error(res.ErrorMessage || t('order.groupIPWhiteList.msg.deleteFailed'));
    }
  } catch (error) {
    ElMessage.error(t('order.groupIPWhiteList.msg.deleteFailed'));
  }
};

const loadMerchants = async () => {
  try {
    const res = await http.getGroupMerchants();
    if (res.code === 200 && res.data) {
      merchants.value = res.data.filter(m => !m.code?.startsWith('G')).map(item => ({
        code: item.code,
        name: item.name,
        qq: item.qq,
      }));
    }
  } catch (error) {
    ElMessage.error(t('order.groupIPWhiteList.msg.loadMerchantsFailed'));
  }
};

const submitForm = async (useFor) => {
  if (!formRef.value) return;
  
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  
  const ipInput = useFor === '3' ? form.loginIp : form.payIp;
  const ipList = ipInput.split('#').map(ip => ip.trim()).filter(ip => ip);
  
  if (ipList.length === 0) {
    ElMessage.warning(useFor === '3' ? t('order.groupIPWhiteList.msg.loginIpRequired') : t('order.groupIPWhiteList.msg.payIpRequired'));
    return;
  }
  
  const items = ipList.map(ip => ({
    merchantCode: form.merchantCode,
    ipAddress: ip,
    useFor: parseInt(useFor)
  }));
  
  try {
    const googleCode = await ElMessageBox.prompt(
      t('order.groupIPWhiteList.msg.mfaPromptMsg'),
      t('order.groupIPWhiteList.msg.mfaPromptTitle'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        inputPattern: /^\d{6}$/,
        inputErrorMessage: t('order.groupIPWhiteList.msg.mfaPattern')
      }
    ).catch(() => null);
    
    if (!googleCode) {
      return;
    }
    
    const res = await http.addLoginIp({
      items: items,
      merchantCode: form.merchantCode,
      applicantCode: '',
      applicantName: '',
      code: googleCode.value
    });
    if (res.Success) {
      ElMessage.success(res.Data?.Message || t('order.groupIPWhiteList.msg.saveSuccess'));
      if (useFor === '3') {
        form.loginIp = '';
      } else {
        form.payIp = '';
      }
    } else {
      ElMessage.error(res.ErrorMessage || t('order.groupIPWhiteList.msg.saveFailed'));
    }
  } catch (error) {
    ElMessage.error(t('order.groupIPWhiteList.msg.saveFailed'));
  }
};

// 查询IP白名单
const queryIpWhiteList = async () => {
  if (!queryForm.merchantCode) {
    ElMessage.warning(t('order.groupIPWhiteList.msg.merchantCodeRequired'));
    return;
  }
  // if (!queryForm.code) {
  //   ElMessage.warning('请输入MFA2验证码');
  //   return;
  // }

  queryLoading.value = true;
  try {
    const params = {
      merchantcode: queryForm.merchantCode,
      code: queryForm.code,
      useFor: queryForm.useFor || ''
    };

    const res = await http.queryIpWhiteList(params);
    if (res.Success && res.Data && res.Data.merchants) {
      const allIps = [];
      res.Data.merchants.forEach(merchant => {
        if (merchant.ips && merchant.ips.length > 0) {
          merchant.ips.forEach(ipItem => {
            allIps.push({
              merchantCode: merchant.merchantCode,
              ip: ipItem.ip,
              useFor: ipItem.useFor,
              useForDisplay: ipItem.useForDisplay,
              enabled: ipItem.enabled
            });
          });
        }
      });
      ipList.value = allIps;
    } else {
      ipList.value = [];
      ElMessage.warning(res.ErrorMessage || t('order.groupIPWhiteList.msg.noData'));
    }
  } catch (error) {
    ElMessage.error(t('order.groupIPWhiteList.msg.queryFailed'));
    ipList.value = [];
  } finally {
    queryLoading.value = false;
  }
};

// 重置查询表单
const resetQueryForm = () => {
  queryForm.merchantCode = '';
  queryForm.useFor = '';
  queryForm.code = '';
  ipList.value = [];
};

onMounted(() => {
  loadMerchants();
});
</script>
<style scoped lang="scss">
@use "../../styles/variables.scss" as *;

.page-container {
  background-color: var(--color-surface, #ffffff);
  border-radius: 24px;
  margin: $spacing-lg;
}

.page-header {
  padding: $spacing-lg;
  h1 {
    margin: 0;
    font-size: $font-size-xl;
    color: var(--text-primary, #18181b);
  }
  hr {
    text-size-adjust: 100%;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizelegibility;
    color-scheme: light;
    font-feature-settings: "kern";
    font-family: "Geist Sans", sans-serif;
    line-height: 1.5;
    overflow-wrap: break-word;
    margin: 0px;
    box-sizing: content-box;
    height: 0px;
    overflow: visible;
    opacity: 0.2;
    border-width: 0px 0px 1px;
    border-image: initial;
    border-color: inherit;
    border-style: solid;
    width: 100%;
  }
}

.balance-info {
  font-weight: 500;
  color: $primary-color;
}

.notification-icon {
  font-size: $font-size-large;
  cursor: pointer;
  position: relative;
}

.page-content {
  padding: $spacing-lg;
}

.content-wrapper {
  background-color: var(--color-surface, white);
  padding: $spacing-xl;
  border-radius: $border-radius-md;
}

.whitelist-form {
  padding: $spacing-lg;
  background-color: var(--color-hover, #fafafa);
  border-radius: $border-radius-md;
  border: 1px solid var(--color-border-soft, #e8e8e8);

  :deep(.el-form-item) {
    margin-bottom: $spacing-lg;
  }

  :deep(.el-divider) {
    margin: $spacing-lg 0;
  }

  :deep(.el-input__wrapper),
  :deep(.el-textarea__inner) {
    border-radius: 15px;
  }

  :deep(.el-select) {
    width: 100%;
  }

  :deep(.el-button) {
    min-width: 120px;
    border-radius: 8px;
  }
}

.section-block {
  background-color: var(--color-surface, white);
  border-radius: $border-radius-md;
  padding: $spacing-lg;
  margin-bottom: $spacing-lg;
  border: 1px solid var(--color-border-soft, #e8e8e8);

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary, #18181b);
    margin-bottom: $spacing-md;
    padding-bottom: $spacing-sm;
    border-bottom: 2px solid $primary-color;
  }
}

.query-section {
  margin-top: $spacing-xl;
  padding: $spacing-lg;
  background-color: var(--color-hover, #fafafa);
  border-radius: $border-radius-md;
  border: 1px solid var(--color-border-soft, #e8e8e8);

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary, #18181b);
    margin-bottom: $spacing-lg;
    padding-bottom: $spacing-sm;
    border-bottom: 2px solid $primary-color;
  }

  .query-form {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: $spacing-md;
    margin-bottom: $spacing-lg;
    padding: $spacing-md;
    background-color: var(--color-surface, white);
    border-radius: $border-radius-md;

    :deep(.el-form-item) {
      margin-bottom: 0;
    }
  }
}
</style>
