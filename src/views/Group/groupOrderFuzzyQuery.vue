<template>
  <div class="page-container">
    <header class="page-header">
      <h1>{{ title }}</h1>
      <hr />
    </header>

    <main class="page-content">
      <div class="content-wrapper">
        <div class="search-container">
          <el-input
            type="textarea"
            v-model="orderInput"
            :rows="6"
            placeholder="输入订单号，支持中英文逗号、换行符分隔（最多50个）&#10;支持：商户订单号、平台订单号、银行订单号"
          ></el-input>
        </div>
        
        <div class="form-row">
          <div class="form-item">
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

        <!-- 查询结果 -->
        <template v-if="queryResult">
          <!-- 空状态提示 -->
          <div class="empty-state" v-if="queryResult.foundOrders.length === 0 && queryResult.notGroupOrders.length === 0 && queryResult.notFoundOrders.length === 0">
            <div class="empty-icon">📋</div>
            <h2>未查询到订单</h2>
            <p>请尝试其他搜索条件</p>
          </div>

          <!-- 属于本集团的订单 -->
          <div v-if="queryResult.foundOrders.length" class="result-section">
            <div class="section-header">
              <span>查询到的订单（属于本集团）</span>
              <el-tag size="medium" style="margin-left: 8px;font-size: 16px;">{{ queryResult.foundOrders.length }} 条</el-tag>
            </div>
            <el-table
              border
              v-loading="loading"
              max-height="500px"
              :data="queryResult.foundOrders"
              stripe
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
              <!-- <el-table-column align="center" prop="supplierOrder" label="银行订单号" width="180">
                <template #default="{ row }">
                  {{ row.supplierOrder || '-' }}
                </template>
              </el-table-column> -->
              <el-table-column align="center" label="银行单号" width="180">
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
          </div>

          <!-- 不属于本集团的订单 -->
          <div v-if="queryResult.notGroupOrders.length" class="result-section">
            <div class="section-header warning">
              <span>订单存在但不属于本集团</span>
              <el-tag type="warning" size="small" style="margin-left: 8px;font-size: 16px;">{{ queryResult.notGroupOrders.length }} 个</el-tag>
            </div>
            <div class="order-list">
              <el-tag
                v-for="order in queryResult.notGroupOrders"
                :key="order"
                type="warning"
                size="medium"
              >{{ order }}</el-tag>
            </div>
          </div>

          <!-- 完全查不到的订单 -->
          <div v-if="queryResult.notFoundOrders.length" class="result-section">
            <div class="section-header danger">
              <span>未查询到的订单</span>
              <el-tag type="danger" size="small" style="margin-left: 8px;font-size: 16px;">{{ queryResult.notFoundOrders.length }} 个</el-tag>
            </div>
            <div class="order-list">
              <el-tag
                v-for="order in queryResult.notFoundOrders"
                :key="order"
                type="danger"
                size="medium"
              >{{ order }}</el-tag>
            </div>
          </div>
        </template>
        
        <!-- 初始空状态 -->
        <div class="empty-state" v-if="!queryResult">
          <div class="empty-icon">📋</div>
          <h2>{{ title }}</h2>
          <p>请输入订单号进行查询</p>
        </div>
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
@use "../../styles/variables.scss" as *;

.page-container {
  background-color: #fff;
  border-radius: 24px;
  margin: $spacing-lg;
}

.page-header {
  padding: $spacing-lg;
  h1 {
    margin: 0;
    font-size: $font-size-xl;
    color: $text-color;
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
  background-color: white;
  padding: $spacing-xl;
  border-radius: $border-radius-md;
}

.empty-state {
  text-align: center;
  padding: $spacing-xl;
  color: #666;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: $spacing-lg;
  opacity: 0.5;
}

.empty-state h2 {
  margin: 0 0 $spacing-sm 0;
  font-size: $font-size-xl;
  color: $text-color;
}

.empty-state p {
  margin: 0;
  font-size: $font-size-base;
}

.search-container {
  margin-bottom: $spacing-lg;
  
  :deep(.el-textarea__inner) {
    border-radius: 24px !important;
    padding: 16px;
    font-size: $font-size-base;
  }
}

.form-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: $spacing-lg;
}

.form-item {
  .form-label {
    font-size: 14px;
    color: #606266;
    margin-bottom: 8px;
  }
}

.form-actions {
  display: flex;
  gap: $spacing-md;
}

.result-section {
  margin-bottom: $spacing-lg;
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-md;
    padding-bottom: $spacing-sm;
    border-bottom: 1px solid #ebeef5;
    
    span {
      font-size: $font-size-xl;
      font-weight: 600;
      color: $text-color;
    }
    
    &.warning span {
      color: #E6A23C;
    }
    
    &.danger span {
      color: #F56C6C;
    }
  }
}

.order-list {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
}

:deep(.el-table) {
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  
  .el-table__header-wrapper th {
    background-color: #f8f9fa;
    font-weight: 600;
    color: #495057;
  }
  
  .el-table__row {
    transition: background-color 0.3s ease;
    
    &:hover {
      background-color: #f8f9fa;
    }
  }
}

:deep(.el-button--primary) {
  padding: 10px 20px;
  font-size: 14px;
  transition: all 0.3s;
}

:deep(.el-button) {
  padding: 10px 20px;
  font-size: 14px;
  transition: all 0.3s;
}
</style>