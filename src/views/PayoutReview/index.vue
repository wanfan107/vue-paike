<template>
  <div class="app-page">
    <header class="app-page-header">
      <h1>{{ title }}</h1>
    </header>

    <main>
        <!-- 搜索和筛选区域 -->
        <div class="search-panel">
          <el-form :inline="false" :model="searchForm" class="search-form">
            <el-form-item label="时间窗口">
              <el-select v-model="searchForm.hours" style="width: 130px">
                <el-option label="近1小时" :value="1" />
                <el-option label="近3小时" :value="3" />
                <el-option label="近6小时" :value="6" />
              </el-select>
            </el-form-item>

            <el-form-item label="类型">
              <el-select v-model="searchForm.reviewType" style="width: 140px">
                <el-option label="全部" value="" />
                <el-option label="大额出款" value="LargePayout" />
                <el-option label="风控暂停" value="RiskHold" />
              </el-select>
            </el-form-item>

            <el-form-item v-if="isGroup" label="商户">
              <el-select
                v-model="searchForm.merchantCode"
                placeholder="全部商户"
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
                搜索
              </el-button>
              <el-button :icon="Refresh" :loading="loading" @click="handleRefresh">
                刷新
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 批量操作栏（表格上方） -->
        <div v-if="selectedRows.length" class="batch-bar">
          <span class="batch-info">
            已选 <b>{{ selectedRows.length }}</b> 笔
          </span>
          <el-button
            size="small"
            type="success"
            plain
            :disabled="!selectedRows.length || deciding"
            @click="submitDecide('allow')"
          >
            批量放行
          </el-button>
          <el-button
            size="small"
            type="danger"
            plain
            :disabled="!selectedRows.length || deciding"
            @click="submitDecide('reject')"
          >
            批量拒绝
          </el-button>
          <span class="batch-tip">单次最多处理 50 单</span>
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
            <el-table-column label="类型" width="100" align="center">
              <template #default="{ row }">
                <StatusPill
                  :type="row.reviewType === 'RiskHold' ? 'danger' : 'warning'"
                  :text="row.reviewTypeText"
                />
              </template>
            </el-table-column>
            <el-table-column prop="merchant" label="商户号" width="100" align="center" />
            <el-table-column label="商户单号" min-width="220" align="left">
              <template #default="{ row }">
                <CopyText :text="row.merchantOrder" title="点击复制商户单号" />
              </template>
            </el-table-column>
            <el-table-column label="系统单号" min-width="220" align="left">
              <template #default="{ row }">
                <CopyText :text="row.serialNo" title="点击复制系统单号" />
              </template>
            </el-table-column>
            <el-table-column label="金额" width="120" align="right">
              <template #default="{ row }">
                {{ formatAmount(row.amount) }}
              </template>
            </el-table-column>
            <el-table-column prop="bankCardNo" label="出款账号" min-width="140" align="left" />
            <el-table-column prop="bankAccount" label="户名" min-width="120" align="left" />
            <el-table-column prop="currency" label="币种" width="70" align="center" />
            <el-table-column label="风控详情" min-width="200" align="left">
              <template #default="{ row }">
                <div v-if="row.reviewType === 'RiskHold'" class="risk-detail">
                  <div class="risk-label">{{ row.riskTypeLabel || '风控暂停' }}</div>
                  <div
                    v-if="row.riskCurrentValue !== null && row.riskCurrentValue !== undefined"
                    class="risk-line"
                  >
                    累计 {{ formatAmount(row.riskCurrentValue) }} / 阈值
                    {{ formatAmount(row.riskTriggerValue) }}
                  </div>
                  <div v-if="row.riskTimeWindowSeconds" class="risk-line">
                    统计窗口：{{ formatWindow(row.riskTimeWindowSeconds) }}
                  </div>
                  <div v-if="row.riskMess" class="risk-line">{{ row.riskMess }}</div>
                </div>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="createdOn" label="申请时间" width="160" align="center" />
            <el-table-column label="备注" min-width="120" align="left">
              <template #default="{ row }">
                {{ row.memo || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" align="center" fixed="right">
              <template #default="{ row }">
                <el-button
                  size="small"
                  type="success"
                  plain
                  :disabled="deciding"
                  @click.stop="handleRowDecide('allow', row)"
                >
                  放行
                </el-button>
                <el-button
                  size="small"
                  type="danger"
                  plain
                  :disabled="deciding"
                  @click.stop="handleRowDecide('reject', row)"
                >
                  拒绝
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
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh } from '@element-plus/icons-vue';
import { http } from '@/api';
import useUserStore from '@/stores/user';
import CopyText from '@/components/CopyText.vue';
import StatusPill from '@/components/StatusPill.vue';

const title = '大额出款审核';
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
      ElMessage.error(res.message || '查询失败');
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
      ElMessage.error('获取商户列表失败');
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
    ElMessage.warning('请先勾选要处理的订单');
    return;
  }
  // 后端上限 50，前端先拦
  if (serialNos.length > 50) {
    ElMessage.error('单次最多处理 50 单');
    return;
  }
  await doDecide(action, serialNos);
};

const doDecide = async (action, serialNos) => {
  const actionText = action === 'allow' ? '放行' : '拒绝';
  try {
    await ElMessageBox.confirm(
      `即将${actionText} ${serialNos.length} 笔出款，${action === 'allow' ? '放行后进入出款队列' : '拒绝后将退回流水'}（先提交生效，后到不得改判）。确认执行？`,
      `${actionText}确认`,
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
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
      ElMessage.success(
        action === 'allow'
          ? `已放行 ${res.data?.successCount ?? serialNos.length} 笔，等待出款`
          : `已拒绝 ${res.data?.successCount ?? serialNos.length} 笔，等待退回流水`
      );
    } else {
      const items = res.data?.items;
      if (Array.isArray(items) && items.length > 0) {
        // 部分失败：汇总 toast + 失败原因归并（含 AlreadyProcessed 原样文案）
        const counts = {};
        items
          .filter((i) => !i.success)
          .forEach((i) => {
            const msg = i.message || '处理失败';
            counts[msg] = (counts[msg] || 0) + 1;
          });
        const reasonText = Object.entries(counts)
          .map(([msg, c]) => (c > 1 ? `${msg}×${c}` : msg))
          .join('；');
        ElMessage({
          type: 'warning',
          message: `成功 ${res.data?.successCount ?? 0} 笔，失败 ${res.data?.failCount ?? 0} 笔：${reasonText}`,
          duration: 6000,
        });
      } else {
        // 整单参数错误（action 非法 / 空数组 / 超 50 等），data 为 {}
        ElMessage.error(res.message || '处理失败');
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
  if (Number.isInteger(h)) return `${h} 小时`;
  return `${h.toFixed(1)} 小时`;
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
