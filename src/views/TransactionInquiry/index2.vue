<template>
  <div class="app-page">
    <header class="app-page-header">
      <h1>{{ title }}</h1>
    </header>

    <main>
        <div class="search-panel">
          <div class="query-form">
            <div class="form-item">
              <div class="form-label">订单号- 集团商户里的 - 01311110522940471237107  /  C94647：- DD006260412101107732508826</div>
              <el-input
                type="textarea"
                v-model="orderInput"
                :rows="6"
                placeholder="输入订单号，支持中英文逗号、换行符分隔（最多50个）&#10;支持：商户订单号、平台订单号、银行订单号"
              ></el-input>
            </div>
            <div class="form-item" style="margin-top: 16px;">
              <div class="form-label">订单类型</div>
              <el-select v-model="orderType" placeholder="请选择" style="width: 200px;">
                <el-option label="所有" value="all"></el-option>
                <el-option label="收款" value="payin"></el-option>
                <el-option label="付款" value="payout"></el-option>
              </el-select>
            </div>
            <div class="form-actions">
              <el-button type="primary" :loading="loading" @click="onQuery">查询</el-button>
              <el-button @click="onReset">重置</el-button>
            </div>
          </div>
        </div>

        <!-- 查询结果 -->
        <template v-if="queryResult">
          <!-- 属于本集团的订单 -->
          <div class="table-panel" style="margin-top: 16px;">
            <div class="panel-header">
              <span>查询到的订单（属于本集团）</span>
              <el-tag size="small" style="margin-left: 8px;">{{ queryResult.foundOrders.length }} 条</el-tag>
            </div>
            <el-table
              v-loading="loading"
              max-height="500px"
              :data="queryResult.foundOrders"
            >
              <el-table-column align="center" prop="inputOrderNo" label="输入订单号" width="180"></el-table-column>
              <el-table-column align="center" prop="orderTypeText" label="订单类型" width="80">
                <template #default="{ row }">
                  <StatusPill :type="orderTypeTag(row.orderType)" :text="row.orderTypeText" />
                </template>
              </el-table-column>
              <el-table-column align="center" prop="merchant" label="商户号" width="80"></el-table-column>
              <el-table-column align="center" prop="merchantOrder" label="商户订单号" width="180"></el-table-column>
              <el-table-column align="center" prop="serialNo" label="平台订单号" width="180"></el-table-column>
              <el-table-column align="center" prop="supplierOrder" label="银行订单号" width="180">
                <template #default="{ row }">
                  {{ row.supplierOrder || '-' }}
                </template>
              </el-table-column>
              <el-table-column align="center" label="银行单号" width="180">
                <template #default="{ row }">
                  {{ row.billingCity || row.bankArea || '-' }}
                </template>
              </el-table-column>
              <el-table-column align="center" prop="statusText" label="状态" width="110">
                <template #default="{ row }">
                  <StatusPill v-if="row.statusText" :type="statusTagType(row)" :text="row.statusText" />
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column align="center" prop="createdOn" label="创建时间" width="180">
                <template #default="{ row }">
                  {{ formatTime(row.createdOn) }}
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 不属于本集团的订单 -->
          <div v-if="queryResult.notGroupOrders.length" class="table-panel" style="margin-top: 16px;">
            <div class="panel-header">
              <span style="color: var(--color-status-warn);">订单存在但不属于本集团</span>
              <el-tag type="warning" size="small" style="margin-left: 8px;">{{ queryResult.notGroupOrders.length }} 个</el-tag>
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
              <span style="color: var(--color-send);">未查询到的订单</span>
              <el-tag type="danger" size="small" style="margin-left: 8px;">{{ queryResult.notFoundOrders.length }} 个</el-tag>
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
import { ElMessage } from 'element-plus';
import { http } from '@/api';
import useUserStore from '@/stores/user';
import StatusPill from '@/components/StatusPill.vue';

const props = defineProps({
  title: {
    type: String,
    default: '集团订单查询',
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
    ElMessage.warning('请输入订单号');
    return;
  }
  if (orders.length > 50) {
    ElMessage.warning('单次最多查询50个订单号');
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
        `查询完成：找到${found}条，不属于本集团${notGroup}个，未找到${notFound}个`
      );
    } else {
      ElMessage.error(res.msg || '查询失败');
    }
  } catch (err) {
    ElMessage.error('查询异常');
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