<template>
  <div class="page-container">
    <header class="page-header">
      <h1>{{ title }}</h1>
      <hr />
    </header>

    <main class="page-content">
      <div class="content-wrapper">
        <el-card shadow="never">
          <div class="query-form">
            <div class="form-item">
              <div class="form-label">订单号- 集团商户里的 - 01311110522940471237107  /  C94647：- DD006260412101107732508826</div>
              <el-input
                type="textarea"
                v-model="orderInput"
                :rows="6"
                placeholder="输入订单号，支持中英文逗号、换行符分隔（最多50个）&#10;支持：商户订单号、平台订单号、银行订单号、E单号"
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
        </el-card>

        <!-- 查询结果 -->
        <template v-if="queryResult">
          <!-- 属于本集团的订单 -->
          <el-card shadow="never" style="margin-top: 16px;">
            <template #header>
              <span>查询到的订单（属于本集团）</span>
              <el-tag size="small" style="margin-left: 8px;">{{ queryResult.foundOrders.length }} 条</el-tag>
            </template>
            <el-table
              border
              v-loading="loading"
              max-height="500px"
              :data="queryResult.foundOrders"
            >
              <el-table-column align="center" prop="inputOrderNo" label="输入订单号" width="180"></el-table-column>
              <el-table-column align="center" prop="orderTypeText" label="订单类型" width="80">
                <template #default="{ row }">
                  <el-tag :type="orderTypeTag(row.orderType)" size="small">{{ row.orderTypeText }}</el-tag>
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
              <el-table-column align="center" label="E单号" width="180">
                <template #default="{ row }">
                  {{ row.billingCity || row.bankArea || '-' }}
                </template>
              </el-table-column>
              <el-table-column align="center" prop="statusText" label="状态" width="110">
                <template #default="{ row }">
                  <el-tag v-if="row.statusText" :type="statusTagType(row)" size="small">{{ row.statusText }}</el-tag>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column align="center" prop="createdOn" label="创建时间" width="180">
                <template #default="{ row }">
                  {{ formatTime(row.createdOn) }}
                </template>
              </el-table-column>
            </el-table>
          </el-card>

          <!-- 不属于本集团的订单 -->
          <el-card v-if="queryResult.notGroupOrders.length" shadow="never" style="margin-top: 16px;">
            <template #header>
              <span style="color: #E6A23C;">订单存在但不属于本集团</span>
              <el-tag type="warning" size="small" style="margin-left: 8px;">{{ queryResult.notGroupOrders.length }} 个</el-tag>
            </template>
            <div class="order-list">
              <el-tag
                v-for="order in queryResult.notGroupOrders"
                :key="order"
                type="warning"
                size="medium"
                style="margin: 4px;"
              >{{ order }}</el-tag>
            </div>
          </el-card>

          <!-- 完全查不到的订单 -->
          <el-card v-if="queryResult.notFoundOrders.length" shadow="never" style="margin-top: 16px;">
            <template #header>
              <span style="color: #F56C6C;">未查询到的订单</span>
              <el-tag type="danger" size="small" style="margin-left: 8px;">{{ queryResult.notFoundOrders.length }} 个</el-tag>
            </template>
            <div class="order-list">
              <el-tag
                v-for="order in queryResult.notFoundOrders"
                :key="order"
                type="danger"
                size="medium"
                style="margin: 4px;"
              >{{ order }}</el-tag>
            </div>
          </el-card>
        </template>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { http } from '@/api';
import useUserStore from '@/stores/user';

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
  return map[type] || '';
};

const statusTagType = (row) => {
  const st = row.statusText;
  if (st === '成功已回调' || st === '成功') return 'success';
  if (st === '成功未回调') return '';
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
.page-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
  
  h1 {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 12px;
  }
  
  hr {
    border: none;
    border-top: 1px solid #ebeef5;
    margin: 0;
  }
}

.page-content {
  .content-wrapper {
    // 样式已应用
  }
}

.query-form {
  .form-label {
    font-size: 14px;
    color: #606266;
    margin-bottom: 8px;
  }
  .form-actions {
    margin-top: 16px;
  }
}
.order-list {
  display: flex;
  flex-wrap: wrap;
}
</style>