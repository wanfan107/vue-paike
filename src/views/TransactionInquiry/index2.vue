<template>
  <div class="app-page">
    <header class="app-page-header">
      <h1>{{ t('menu.transactionInquiry2') }}</h1>
    </header>

    <main>
        <div class="search-panel">
          <div class="query-form">
            <div class="form-item">
              <div class="form-label">{{ t('order.transactionInquiry2.search.orderNoLabel') }}</div>
              <el-input
                type="textarea"
                v-model="orderInput"
                :rows="6"
                :placeholder="t('order.transactionInquiry2.search.placeholder')"
              ></el-input>
            </div>
            <div class="form-item" style="margin-top: 16px;">
              <div class="form-label">{{ t('order.transactionInquiry2.search.orderType') }}</div>
              <el-select v-model="orderType" :placeholder="t('order.transactionInquiry2.search.orderTypePlaceholder')" style="width: 200px;">
                <el-option :label="t('order.transactionInquiry2.search.typeAll')" value="all"></el-option>
                <el-option :label="t('order.transactionInquiry2.search.typePayin')" value="payin"></el-option>
                <el-option :label="t('order.transactionInquiry2.search.typePayout')" value="payout"></el-option>
              </el-select>
            </div>
            <div class="form-actions">
              <el-button type="primary" :loading="loading" @click="onQuery">{{ t('order.transactionInquiry2.search.query') }}</el-button>
              <el-button @click="onReset">{{ t('order.transactionInquiry2.search.reset') }}</el-button>
            </div>
          </div>
        </div>

        <!-- 查询结果 -->
        <template v-if="queryResult">
          <!-- 属于本集团的订单 -->
          <div class="table-panel" style="margin-top: 16px;">
            <div class="panel-header">
              <span>{{ t('order.transactionInquiry2.result.foundTitle') }}</span>
              <el-tag size="small" style="margin-left: 8px;">{{ queryResult.foundOrders.length }} {{ t('order.transactionInquiry2.result.unitTiao') }}</el-tag>
            </div>
            <el-table
              v-loading="loading"
              max-height="500px"
              :data="queryResult.foundOrders"
            >
              <el-table-column align="center" prop="inputOrderNo" :label="t('order.transactionInquiry2.table.inputOrderNo')" width="180"></el-table-column>
              <el-table-column align="center" prop="orderTypeText" :label="t('order.transactionInquiry2.table.orderType')" width="80">
                <template #default="{ row }">
                  <StatusPill :type="orderTypeTag(row.orderType)" :text="row.orderTypeText" />
                </template>
              </el-table-column>
              <el-table-column align="center" prop="merchant" :label="t('order.transactionInquiry2.table.merchant')" width="80"></el-table-column>
              <el-table-column align="center" prop="merchantOrder" :label="t('order.transactionInquiry2.table.merchantOrder')" width="180"></el-table-column>
              <el-table-column align="center" prop="serialNo" :label="t('order.transactionInquiry2.table.serialNo')" width="180"></el-table-column>
              <el-table-column align="center" prop="supplierOrder" :label="t('order.transactionInquiry2.table.bankOrderNo')" width="180">
                <template #default="{ row }">
                  {{ row.supplierOrder || '-' }}
                </template>
              </el-table-column>
              <el-table-column align="center" :label="t('order.transactionInquiry2.table.bankNo')" width="180">
                <template #default="{ row }">
                  {{ row.billingCity || row.bankArea || '-' }}
                </template>
              </el-table-column>
              <el-table-column align="center" prop="statusText" :label="t('order.transactionInquiry2.table.status')" width="110">
                <template #default="{ row }">
                  <StatusPill v-if="row.statusText" :type="statusTagType(row)" :text="row.statusText" />
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column align="center" prop="createdOn" :label="t('order.transactionInquiry2.table.createdOn')" width="180">
                <template #default="{ row }">
                  {{ formatTime(row.createdOn) }}
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 不属于本集团的订单 -->
          <div v-if="queryResult.notGroupOrders.length" class="table-panel" style="margin-top: 16px;">
            <div class="panel-header">
              <span style="color: var(--color-status-warn);">{{ t('order.transactionInquiry2.result.notGroupTitle') }}</span>
              <el-tag type="warning" size="small" style="margin-left: 8px;">{{ queryResult.notGroupOrders.length }} {{ t('order.transactionInquiry2.result.unitGe') }}</el-tag>
            </div>
            <div class="order-list">
              <el-tag
                v-for="order in queryResult.notGroupOrders"
                :key="order"
                type="warning"
                size="medium"
                style="margin: 4px;"
              >{{ order }}</el-tag>
            </div>
          </div>

          <!-- 完全查不到的订单 -->
          <div v-if="queryResult.notFoundOrders.length" class="table-panel" style="margin-top: 16px;">
            <div class="panel-header">
              <span style="color: var(--color-send);">{{ t('order.transactionInquiry2.result.notFoundTitle') }}</span>
              <el-tag type="danger" size="small" style="margin-left: 8px;">{{ queryResult.notFoundOrders.length }} {{ t('order.transactionInquiry2.result.unitGe') }}</el-tag>
            </div>
            <div class="order-list">
              <el-tag
                v-for="order in queryResult.notFoundOrders"
                :key="order"
                type="danger"
                size="medium"
                style="margin: 4px;"
              >{{ order }}</el-tag>
            </div>
          </div>
        </template>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { http } from '@/api';
import useUserStore from '@/stores/user';
import StatusPill from '@/components/StatusPill.vue';

const { t } = useI18n();

const props = defineProps({
  title: {
    type: String,
    default: "",
  },
});

const userStore = useUserStore();
const orderInput = ref('');
const orderType = ref('all');
const loading = ref(false);
const queryResult = ref(null);

const parseOrders = () => {
  if (!orderInput.value.trim()) return [];
  return orderInput.value
    .split(/[,，\n\r]+/)
    .map((o) => o.trim())
    .filter((o) => o.length > 0);
};

const onQuery = async () => {
  const orders = parseOrders();
  if (!orders.length) {
    ElMessage.warning(t('order.transactionInquiry2.msg.inputRequired'));
    return;
  }
  if (orders.length > 50) {
    ElMessage.warning(t('order.transactionInquiry2.msg.max50'));
    return;
  }

  loading.value = true;
  try {
    const res = await http.groupOrderQuery({
      orderList: orders,
      orderType: orderType.value
    });
    if (res.code === 200) {
      queryResult.value = res.data;
      const found = res.data.foundOrders.length;
      const notGroup = res.data.notGroupOrders.length;
      const notFound = res.data.notFoundOrders.length;
      ElMessage.success(
        t('order.transactionInquiry2.msg.summary', { found, notGroup, notFound })
      );
    } else {
      ElMessage.error(res.msg || t('order.transactionInquiry2.msg.queryFailed'));
    }
  } catch (err) {
    ElMessage.error(t('order.transactionInquiry2.msg.queryError'));
  } finally {
    loading.value = false;
  }
};

const onReset = () => {
  orderInput.value = '';
  orderType.value = 'all';
  queryResult.value = null;
};

const orderTypeTag = (type) => {
  const map = { payin: 'success', payout: 'warning', payflow: 'info' };
  return map[type] || 'neutral';
};

const statusTagType = (row) => {
  const st = row.statusText;
  if (st === '成功已回调' || st === '成功') return 'success';
  if (st === '成功未回调') return 'primary';
  if (st === '进行中') return 'warning';
  if (st === '失败') return 'danger';
  return 'info';
};

const formatTime = (val) => {
  if (!val) return '-';
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};
</script>

<style scoped lang="scss">
.query-form {
  .form-label {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 8px;
  }
  .form-actions {
    margin-top: 16px;
  }
}

.panel-header {
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border-soft);
  margin-bottom: 12px;
  font-weight: 600;
}

.order-list {
  display: flex;
  flex-wrap: wrap;
}
</style>