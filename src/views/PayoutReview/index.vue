<template>
  <div class="app-page">
    <header class="app-page-header">
      <h1>{{ t('menu.payoutReview') }}</h1>
    </header>

    <main>
        <!-- 搜索和筛选区域 -->
        <div class="search-panel">
          <el-form :inline="false" :model="searchForm" class="search-form">
            <el-form-item :label="t('order.payoutReview.search.hours')">
              <el-select v-model="searchForm.hours" style="width: 130px">
                <el-option :label="t('order.payoutReview.search.hours1')" :value="1" />
                <el-option :label="t('order.payoutReview.search.hours3')" :value="3" />
                <el-option :label="t('order.payoutReview.search.hours6')" :value="6" />
              </el-select>
            </el-form-item>

            <el-form-item :label="t('order.payoutReview.search.type')">
              <el-select v-model="searchForm.reviewType" style="width: 140px">
                <el-option :label="t('order.payoutReview.search.all')" value="" />
                <el-option :label="t('order.payoutReview.search.largePayout')" value="LargePayout" />
                <el-option :label="t('order.payoutReview.search.riskHold')" value="RiskHold" />
              </el-select>
            </el-form-item>

            <el-form-item v-if="isGroup" :label="t('order.payoutReview.search.merchant')">
              <el-select
                v-model="searchForm.merchantCode"
                :placeholder="t('order.payoutReview.search.allMerchants')"
                clearable
                filterable
                style="width: 220px"
              >
                <el-option
                  v-for="m in merchantOptions"
                  :key="m.code"
                  :label="m.qq ? `${m.code} - ${m.qq}` : m.code"
                  :value="m.code"
                />
              </el-select>
            </el-form-item>

            <el-form-item class="search-actions">
              <el-button type="primary" :icon="Search" :loading="loading" @click="handleSearch">
                {{ t('common.search') }}
              </el-button>
              <el-button :icon="Refresh" :loading="loading" @click="handleRefresh">
                {{ t('common.refresh') }}
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 批量操作栏（表格上方） -->
        <div v-if="selectedRows.length" class="batch-bar">
          <span class="batch-info">
            {{ t('order.payoutReview.batch.selected', { n: selectedRows.length }) }}
          </span>
          <el-button
            size="small"
            type="success"
            plain
            :disabled="!selectedRows.length || deciding"
            @click="submitDecide('allow')"
          >
            {{ t('order.payoutReview.batch.allow') }}
          </el-button>
          <el-button
            size="small"
            type="danger"
            plain
            :disabled="!selectedRows.length || deciding"
            @click="submitDecide('reject')"
          >
            {{ t('order.payoutReview.batch.reject') }}
          </el-button>
          <span class="batch-tip">{{ t('order.payoutReview.batch.maxTip') }}</span>
        </div>

        <!-- 表格内容区域 -->
        <div class="table-panel">
          <el-table
            v-loading="loading"
            :data="tableData"
            stripe
            @selection-change="onSelectionChange"
          >
            <el-table-column type="selection" width="45" align="center" />
            <el-table-column :label="t('order.payoutReview.table.type')" width="100" align="center">
              <template #default="{ row }">
                <StatusPill
                  :type="row.reviewType === 'RiskHold' ? 'danger' : 'warning'"
                  :text="row.reviewTypeText"
                />
              </template>
            </el-table-column>
            <el-table-column prop="merchant" :label="t('order.payoutReview.table.merchant')" width="100" align="center" />
            <el-table-column :label="t('order.payoutReview.table.merchantOrderNo')" min-width="220" align="left">
              <template #default="{ row }">
                <CopyText :text="row.merchantOrder" :title="t('order.payoutReview.table.copyMerchantNo')" />
              </template>
            </el-table-column>
            <el-table-column :label="t('order.payoutReview.table.serialNo')" min-width="220" align="left">
              <template #default="{ row }">
                <CopyText :text="row.serialNo" :title="t('order.payoutReview.table.copySerialNo')" />
              </template>
            </el-table-column>
            <el-table-column :label="t('order.payoutReview.table.amount')" width="120" align="right">
              <template #default="{ row }">
                {{ formatAmount(row.amount) }}
              </template>
            </el-table-column>
            <el-table-column prop="bankCardNo" :label="t('order.payoutReview.table.bankCardNo')" min-width="140" align="left" />
            <el-table-column prop="bankAccount" :label="t('order.payoutReview.table.bankAccount')" min-width="120" align="left" />
            <el-table-column prop="currency" :label="t('order.payoutReview.table.currency')" width="70" align="center" />
            <el-table-column :label="t('order.payoutReview.table.riskDetail')" min-width="200" align="left">
              <template #default="{ row }">
                <div v-if="row.reviewType === 'RiskHold'" class="risk-detail">
                  <div class="risk-label">{{ row.riskTypeLabel || t('order.payoutReview.risk.paused') }}</div>
                  <div
                    v-if="row.riskCurrentValue !== null && row.riskCurrentValue !== undefined"
                    class="risk-line"
                  >
                    {{ t('order.payoutReview.risk.accumulated', { current: formatAmount(row.riskCurrentValue), trigger: formatAmount(row.riskTriggerValue) }) }}
                  </div>
                  <div v-if="row.riskTimeWindowSeconds" class="risk-line">
                    {{ t('order.payoutReview.risk.window', { window: formatWindow(row.riskTimeWindowSeconds) }) }}
                  </div>
                  <div v-if="row.riskMess" class="risk-line">{{ row.riskMess }}</div>
                </div>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="createdOn" :label="t('order.payoutReview.table.applyTime')" width="160" align="center" />
            <el-table-column :label="t('order.payoutReview.table.memo')" min-width="120" align="left">
              <template #default="{ row }">
                {{ row.memo || '-' }}
              </template>
            </el-table-column>
            <el-table-column :label="t('order.payoutReview.table.action')" width="150" align="center" fixed="right">
              <template #default="{ row }">
                <el-button
                  size="small"
                  type="success"
                  plain
                  :disabled="deciding"
                  @click.stop="handleRowDecide('allow', row)"
                >
                  {{ t('order.payoutReview.table.allow') }}
                </el-button>
                <el-button
                  size="small"
                  type="danger"
                  plain
                  :disabled="deciding"
                  @click.stop="handleRowDecide('reject', row)"
                >
                  {{ t('order.payoutReview.table.reject') }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="pagination.pageNo"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh } from '@element-plus/icons-vue';
import { http } from '@/api';
import useUserStore from '@/stores/user';
import CopyText from '@/components/CopyText.vue';
import StatusPill from '@/components/StatusPill.vue';

const { t } = useI18n();
const userStore = useUserStore();

// 集团身份才显示商户筛选（商户 JWT 只能查本号，由后端保证）
const isGroup = computed(() => !!userStore.groupToken);
const merchantOptions = ref([]);

const loading = ref(false);
const deciding = ref(false);
const tableData = ref([]);
const selectedRows = ref([]);

const searchForm = reactive({
  hours: 3, // 回溯小时数，默认 3，合法 1~6
  reviewType: '', // 空=全部；LargePayout / RiskHold
  merchantCode: '', // 集团收窄用；空=可见商户全集
});

const pagination = reactive({
  pageNo: 1,
  pageSize: 50,
  total: 0,
});

// ================ 查询待审列表 ================
const fetchPending = async () => {
  loading.value = true;
  try {
    const res = await http.payoutReviewPending({
      hours: searchForm.hours,
      merchantCode: searchForm.merchantCode || '',
      reviewType: searchForm.reviewType || '',
      pageNo: pagination.pageNo,
      pageSize: pagination.pageSize,
    });
    // 本接口业务外壳：code 0 成功 / -1 失败（HTTP 恒为 200）
    if (res.code === 0) {
      tableData.value = res.data?.items || [];
      pagination.total = res.data?.total || 0;
      // 回显页大小（后端可能截断到 100）
      if (res.data?.pageSize) {
        pagination.pageSize = res.data.pageSize;
      }
      // 数据已刷新，清空勾选
      selectedRows.value = [];
    } else {
      ElMessage.error(res.message || t('order.payoutReview.msg.queryFailed'));
    }
  } catch (err) {
    console.error('查询待审列表失败:', err);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.pageNo = 1;
  fetchPending();
};

const handleRefresh = () => {
  fetchPending();
};

const handleSizeChange = () => {
  pagination.pageNo = 1;
  fetchPending();
};

const handleCurrentChange = () => {
  fetchPending();
};

// ================ 集团商户列表 ================
const loadMerchantOptions = () => {
  http
    .getGroupMerchants()
    .then((res) => {
      if (res.code === 200 && Array.isArray(res.data)) {
        merchantOptions.value = res.data.filter((m) => m.code && !m.code.startsWith('G'));
      }
    })
    .catch(() => {
      ElMessage.error(t('order.payoutReview.msg.loadMerchantFailed'));
    });
};

// ================ 放行 / 拒绝 ================
const onSelectionChange = (rows) => {
  selectedRows.value = rows;
};

const handleRowDecide = (action, row) => {
  doDecide(action, [row.serialNo]);
};

const submitDecide = async (action) => {
  const serialNos = selectedRows.value.map((r) => r.serialNo);
  if (!serialNos.length) {
    ElMessage.warning(t('order.payoutReview.msg.batchNeedSelect'));
    return;
  }
  // 后端上限 50，前端先拦
  if (serialNos.length > 50) {
    ElMessage.error(t('order.payoutReview.msg.batchMax50'));
    return;
  }
  await doDecide(action, serialNos);
};

const doDecide = async (action, serialNos) => {
  const isAllow = action === 'allow';
  const confirmTitle = isAllow ? t('order.payoutReview.confirm.allowTitle') : t('order.payoutReview.confirm.rejectTitle');
  const confirmMsg = isAllow
    ? t('order.payoutReview.confirm.allowMsg', { n: serialNos.length })
    : t('order.payoutReview.confirm.rejectMsg', { n: serialNos.length });
  try {
    await ElMessageBox.confirm(
      confirmMsg,
      confirmTitle,
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
      }
    );
  } catch {
    return; // 用户取消
  }

  deciding.value = true;
  try {
    const res = await http.payoutReviewDecide({ action, serialNos });
    if (res.code === 0) {
      const successCount = res.data?.successCount ?? serialNos.length;
      ElMessage.success(
        isAllow
          ? t('order.payoutReview.msg.allowed', { n: successCount })
          : t('order.payoutReview.msg.rejected', { n: successCount })
      );
    } else {
      const items = res.data?.items;
      if (Array.isArray(items) && items.length > 0) {
        // 部分失败：汇总 toast + 失败原因归并（含 AlreadyProcessed 原样文案）
        const counts = {};
        items
          .filter((i) => !i.success)
          .forEach((i) => {
            const msg = i.message || t('order.payoutReview.msg.processFailed');
            counts[msg] = (counts[msg] || 0) + 1;
          });
        const reasonText = Object.entries(counts)
          .map(([msg, c]) => (c > 1 ? `${msg}×${c}` : msg))
          .join('；');
        ElMessage({
          type: 'warning',
          message: t('order.payoutReview.msg.partialFail', {
            s: res.data?.successCount ?? 0,
            f: res.data?.failCount ?? 0,
            reason: reasonText,
          }),
          duration: 6000,
        });
      } else {
        // 整单参数错误（action 非法 / 空数组 / 超 50 等），data 为 {}
        ElMessage.error(res.message || t('order.payoutReview.msg.processFailed'));
      }
    }
    // 成功或部分失败都刷新：已处理单从待审列表消失
    fetchPending();
  } catch (err) {
    console.error('放行/拒绝提交失败:', err);
  } finally {
    deciding.value = false;
  }
};

// ================ 展示格式化 ================
// 金额保留两位小数 + 千分位（审核场景需要精确金额，不走取整）
const formatAmount = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// 统计窗口（秒）→「x 小时」
const formatWindow = (seconds) => {
  const h = Number(seconds) / 3600;
  if (Number.isInteger(h)) return `${h} ${t('order.payoutReview.common.hours')}`;
  return `${h.toFixed(1)} ${t('order.payoutReview.common.hours')}`;
};

onMounted(() => {
  if (isGroup.value) {
    loadMerchantOptions();
  }
  fetchPending();
});
</script>

<style scoped lang="scss">
@use "../../styles/variables.scss" as *;

// 批量操作栏：位于搜索区与表格之间
.batch-bar {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin-bottom: $spacing-md;
  padding: 8px 12px;
  background-color: var(--color-hover);
  border-radius: $border-radius-md;

  .batch-info {
    font-size: 14px;
    color: var(--text-primary, #18181b);

    b {
      color: $primary-color;
    }
  }

  .batch-tip {
    font-size: 12px;
    color: var(--text-primary, #18181b)-secondary;
    margin-left: auto;
  }
}

.risk-detail {
  text-align: left;

  .risk-label {
    font-weight: 600;
    color: $danger-color;
  }

  .risk-line {
    font-size: 12px;
    color: var(--text-primary, #18181b)-secondary;
    word-break: break-all;
  }
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: $spacing-md;
}
</style>
