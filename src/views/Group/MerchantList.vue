<template>
  <div class="app-page">
    <header class="app-page-header">
      <h1>{{ t('menu.merchantList') }}</h1>
    </header>

    <main>
        <!-- 搜索区域 -->
        <!-- <div class="search-container">
          <el-form :inline="false" :model="searchForm" class="search-form">
            <el-form-item :label="t('order.groupMerchantList.search.merchantCode')">
              <el-input
                v-model="searchForm.code"
                :placeholder="t('order.groupMerchantList.search.merchantCodePlaceholder')"
                clearable
                style="width: 180px"
              />
            </el-form-item>
            <el-form-item :label="t('order.groupMerchantList.search.status')">
              <el-select
                v-model="searchForm.status"
                :placeholder="t('order.groupMerchantList.search.statusAll')"
                clearable
                style="width: 120px"
              >
                <el-option :value="0" :label="t('order.groupMerchantList.search.status0')" />
                <el-option :value="1" :label="t('order.groupMerchantList.search.status1')" />
                <el-option :value="2" :label="t('order.groupMerchantList.search.status2')" />
                <el-option :value="3" :label="t('order.groupMerchantList.search.status3')" />
                <el-option :value="4" :label="t('order.groupMerchantList.search.status4')" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="search">
                查询
              </el-button>
              <el-button :icon="Refresh" @click="resetSearch">
                刷新
              </el-button>
            </el-form-item>
          </el-form>
        </div> -->

        <!-- 统计信息 -->
        <div class="stats-section">
          <div class="stat-card">
            <div class="stat-value">{{ totalCount }}</div>
            <div class="stat-label">{{ t('order.groupMerchantList.stat.totalCount') }}</div>
          </div>
          <div class="stat-card info">
            <div class="stat-value">{{ totalBalance }}</div>
            <div class="stat-label">{{ t('order.groupMerchantList.stat.totalBalance') }}</div>
          </div>
          <div class="stat-card success">
            <div class="stat-value">{{ activeCount }}</div>
            <div class="stat-label">{{ t('order.groupMerchantList.stat.activeCount') }}</div>
          </div>
          <div class="stat-card danger">
            <div class="stat-value">{{ frozenCount }}</div>
            <div class="stat-label">{{ t('order.groupMerchantList.stat.frozenCount') }}</div>
          </div>
          <div class="stat-card warning">
            <div class="stat-value">{{ suspendedCount }}</div>
            <div class="stat-label">{{ t('order.groupMerchantList.stat.suspendedCount') }}</div>
          </div>
        </div>

        <!-- 商户列表 -->
        <div class="table-panel">
          <el-table :data="merchantList" border style="width: 100%" v-loading="loading">
            <el-table-column prop="isGroup" :label="t('order.groupMerchantList.table.type')" width="120" align="center">
              <template #default="{ row }">
                <el-tag :type="row.isGroup ? 'warning' : 'danger'" size="small">
                  {{ row.isGroup ? t('order.groupMerchantList.table.typeGroup') : t('order.groupMerchantList.table.typeMerchant') }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="code" :label="t('order.groupMerchantList.table.code')" min-width="100" align="left"></el-table-column>
            <el-table-column prop="balance" :label="t('order.groupMerchantList.table.balance')" min-width="150" align="right">
              <template #default="{ row }">
                {{ formatMoney(row.balance) }}
              </template>
            </el-table-column>
            <el-table-column prop="checkedBalanceTime" :label="t('order.groupMerchantList.table.balanceUpdateTime')" width="170" align="center">
              <template #default="{ row }">
                {{ formatDate(row.checkedBalanceTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="currency" :label="t('order.groupMerchantList.table.currency')" width="90" align="center"></el-table-column>
            <el-table-column prop="status" :label="t('order.groupMerchantList.table.status')" width="120" align="center">
              <template #default="{ row }">
                <StatusPill :type="statusPillType(row.status)" :text="statusText(row.status)" />
              </template>
            </el-table-column>
            <el-table-column prop="isSuspended" :label="t('order.groupMerchantList.table.suspended')" width="150" align="center">
              <template #default="{ row }">
                <StatusPill
                  :type="row.isSuspended ? 'success' : 'neutral'"
                  :text="row.isSuspended ? t('order.groupMerchantList.table.yes') : t('order.groupMerchantList.table.no')"
                />
              </template>
            </el-table-column>
            <!-- <el-table-column prop="telegram" label="电报群" min-width="260">
              <template #default="{ row }">
                <a :href="row.telegram" target="_blank" v-if="row.telegram">
                  {{ row.telegram }}
                </a>
                <span v-else>-</span>
              </template>
            </el-table-column> -->
            <el-table-column prop="telegram" :label="t('order.groupMerchantList.table.website')" min-width="320" align="left">
              <template #default="{ row }">
                <el-tooltip
                  v-if="editingCode === row.code"
                  :content="t('order.groupMerchantList.table.websiteTipSave')"
                  placement="top"
                  :show-after="300"
                >
                  <div class="website-edit-wrap">
                    <el-input
                      ref="websiteInputRef"
                      v-model="editWebsite"
                      maxlength="50"
                      show-word-limit
                      size="small"
                      :placeholder="t('order.groupMerchantList.table.websitePlaceholder')"
                      @input="filterWebsiteInput"
                      @blur="handleBlur(row)"
                      @keyup.enter="handleEnter(row)"
                      @keyup.esc="cancelEdit"
                      @mousedown.stop
                    />
                    <span class="edit-hint">{{ t('order.groupMerchantList.table.websiteHint') }}</span>
                  </div>
                </el-tooltip>
                <el-tooltip
                  v-else
                  :content="t('order.groupMerchantList.table.websiteTipEdit')"
                  placement="top"
                  :show-after="300"
                >
                  <div class="website-cell" @click="startEdit(row)">
                    <span class="website-text">{{ row.qq || '—' }}</span>
                    <span v-if="!row.qq" class="website-placeholder">{{ t('order.groupMerchantList.table.websiteEmpty') }}</span>
                    <el-icon class="edit-icon"><Edit /></el-icon>
                  </div>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column v-if="hasCreditUsed" prop="creditUsed" :label="t('order.groupMerchantList.table.creditUsed')" width="120" align="right" >
              <template #default="{ row }">
                {{ formatMoney(row.creditUsed) }}
              </template>
            </el-table-column>
            <!-- <el-table-column prop="creditMax" label="授信上限" width="120" align="right">
              <template #default="{ row }">
                {{ formatMoney(row.creditMax) }}
              </template>
            </el-table-column> -->
            <el-table-column prop="createdOn" :label="t('order.groupMerchantList.table.createdOn')" width="170" align="center">
              <template #default="{ row }">
                {{ formatDate(row.createdOn) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { Search, Refresh, Edit } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { http } from '@/api';
import useUserStore from '@/stores/user';
import { formatCurrency } from '@/utils/currency';
import StatusPill from '@/components/StatusPill.vue';

const userStore = useUserStore();
const currency = computed(() => userStore.merchantInfo?.currency);

defineProps({
  title: {
    type: String,
    default: "",
  },
});

// 搜索表单
const searchForm = reactive({
  code: '',
  status: ''
});

// 状态变量
const { t } = useI18n();

const loading = ref(false);
const merchantList = ref([]);

const statusMap = {
  0: "未激活",
  1: "基本状态",
  2: "风控冻结",
  3: "财务冻结",
  4: "启用商户"
};

const statusKeyMap = {
  0: 'order.groupMerchantList.table.status0',
  1: 'order.groupMerchantList.table.status1',
  2: 'order.groupMerchantList.table.status2',
  3: 'order.groupMerchantList.table.status3',
  4: 'order.groupMerchantList.table.status4'
};

// 统计数据
const totalCount = computed(() => merchantList.value.length);
const totalBalance = computed(() => {
  const total = merchantList.value.reduce((sum, m) => sum + (Number(m.balance) || 0), 0);
  return formatCurrency(total, currency.value);
});
const activeCount = computed(() => merchantList.value.filter(m => m.status === 4).length);
const frozenCount = computed(() => merchantList.value.filter(m => m.status === 2 || m.status === 3).length);
const suspendedCount = computed(() => merchantList.value.filter(m => m.isSuspended).length);
const hasCreditUsed = computed(() => merchantList.value.some(m => Number(m.creditUsed) > 0));

const statusText = (status) => {
  const key = statusKeyMap[status];
  if (key) return t(key);
  return statusMap[status] || t('order.groupMerchantList.table.statusUnknown');
};

const statusPillType = (status) => {
  const map = { 0: "neutral", 1: "neutral", 2: "danger", 3: "warning", 4: "success" };
  return map[status] || "neutral";
};

const formatMoney = (val) => {
  if (val == null) return "-";
  return formatCurrency(val, currency.value);
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("zh-CN");
  } catch (e) {
    return dateStr;
  }
};

const loadData = async () => {
  loading.value = true;
  try {
    const res = await http.getGroupMerchants();
    if (res.code === 200) {
      merchantList.value = res.data.filter(m => !m.code?.startsWith('G')) || [];
    } else {
      ElMessage.error(res.msg || t('order.groupMerchantList.msg.loadFailed'));
    }
  } catch (e) {
    ElMessage.error(t('order.groupMerchantList.msg.loadFailed'));
  }
  loading.value = false;
};

// const search = () => {
//   loadData();
// };

// const resetSearch = () => {
//   searchForm.code = '';
//   searchForm.status = '';
//   loadData();
// };

// 网站字段行内编辑状态
const editingCode = ref('');
const editWebsite = ref('');
const websiteInputRef = ref(null);
const isSubmitting = ref(false);

const filterWebsiteInput = (val) => {
  const filtered = (val || '').replace(/[\u4e00-\u9fa5\s]/g, '');
  if (filtered !== val) {
    editWebsite.value = filtered;
  }
};

const startEdit = (row) => {
  editingCode.value = row.code;
  editWebsite.value = row.qq || '';
  nextTick(() => {
    if (websiteInputRef.value?.focus) {
      websiteInputRef.value.focus();
    }
  });
};

const cancelEdit = () => {
  editingCode.value = '';
  editWebsite.value = '';
  isSubmitting.value = false;
};

const handleBlur = async (row) => {
  if (isSubmitting.value) return;
  const newVal = (editWebsite.value || '').trim();
  if (newVal === (row.qq || '')) {
    cancelEdit();
    return;
  }
  isSubmitting.value = true;
  await saveWebsite(row);
};

const handleEnter = async (row) => {
  if (isSubmitting.value) return;
  const newVal = (editWebsite.value || '').trim();
  if (newVal === (row.qq || '')) {
    cancelEdit();
    return;
  }
  isSubmitting.value = true;
  await saveWebsite(row);
};

const saveWebsite = async (row) => {
  const newVal = (editWebsite.value || '').trim();
  if (newVal.length > 50) {
    ElMessage.warning(t('order.groupMerchantList.msg.websiteTooLong'));
    isSubmitting.value = false;
    return;
  }
  if (newVal && !/^(https?):\/\/[^\s]+$/.test(newVal)) {
    ElMessage.warning(t('order.groupMerchantList.msg.websiteInvalid'));
    isSubmitting.value = false;
    return;
  }
  try {
    await ElMessageBox.confirm(
      t('order.groupMerchantList.msg.websiteConfirmMsg', {
        code: row.code,
        value: newVal || t('order.groupMerchantList.msg.websiteEmptyValue')
      }),
      t('order.groupMerchantList.msg.websiteConfirmTitle'),
      { confirmButtonText: t('common.confirm'), cancelButtonText: t('common.cancel'), type: 'warning' }
    );
  } catch (e) {
    cancelEdit();
    return;
  }
  try {
    const res = await http.updateMerchantWebsite({ merchantCode: row.code, website: newVal });
    if (res.code === 200) {
      ElMessage.success(t('order.groupMerchantList.msg.updateSuccess'));
      row.qq = newVal;
    } else {
      ElMessage.error(res.msg || t('order.groupMerchantList.msg.updateFailed'));
    }
  } catch (e) {
    ElMessage.error(t('order.groupMerchantList.msg.updateFailed'));
  } finally {
    cancelEdit();
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped lang="scss">
@use "../../styles/variables.scss" as *;

.stats-section {
  display: flex;
  gap: $spacing-md;
  margin-bottom: $spacing-lg;
  flex-wrap: wrap;
}

.stat-card {
  flex: 1;
  min-width: 150px;
  padding: $spacing-md;
  background-color: var(--color-hover);
  border-radius: $border-radius-sm;
  text-align: center;
  border-left: 4px solid var(--text-faint);

  &.success {
    border-left-color: var(--brand-primary);
    background-color: var(--color-receive-bg, #f0f9eb);
  }

  &.danger {
    border-left-color: var(--color-send);
    background-color: var(--color-send-bg, #fef0f0);
  }

  &.warning {
    border-left-color: var(--color-warning, #e6a23c);
    background-color: var(--color-status-warn-bg, #fdf6ec);
  }

  .stat-value {
    font-size: 28px;
    font-weight: 700;
    color: var(--text-primary);
  }

  .stat-label {
    font-size: 13px;
    color: var(--text-faint);
    margin-top: 4px;
  }
}

.table-panel {
  margin-top: $spacing-lg;
}

.website-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  min-height: 32px;

  &:hover {
    background-color: var(--color-hover);

    .edit-icon {
      color: var(--brand-primary, #16a34a);
    }
  }

  .website-text {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text-primary);
    font-size: 14px;
  }

  .website-placeholder {
    flex: 1;
    color: var(--text-faint);
    font-size: 13px;
    font-style: italic;
  }

  .edit-icon {
    color: var(--text-faint);
    font-size: 14px;
    transition: color 0.2s ease;
    flex-shrink: 0;
  }
}

.website-edit-wrap {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;

  .el-input {
    width: 100%;
  }

  :deep(.el-input__wrapper) {
    border-radius: 6px;
    box-shadow: 0 0 0 1px var(--brand-primary, #16a34a) inset;
    transition: box-shadow 0.2s ease;

    &:hover {
      box-shadow: 0 0 0 1px var(--brand-primary, #16a34a) inset;
    }

    &.is-focus {
      box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.2) inset, 0 0 8px rgba(22, 163, 74, 0.15);
    }
  }

  :deep(.el-input__inner) {
    font-size: 14px;
    height: 32px;
    line-height: 32px;

    &::placeholder {
      color: var(--text-faint);
    }
  }

  .edit-hint {
    font-size: 11px;
    color: var(--text-faint, #a8abb2);
    line-height: 1;
    letter-spacing: 0.3px;
  }
}

.website-edit-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  .el-input {
    flex: 1;
  }
}

@media (max-width: 768px) {
  .table-panel {
    overflow-x: auto;
  }
  .stats-section {
    flex-direction: column;
  }
  .stat-card {
    min-width: auto;
  }
}
</style>