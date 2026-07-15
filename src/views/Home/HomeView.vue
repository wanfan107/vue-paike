<template>
  <div class="page-container">
    <div class="page-content-wrapper">
      <header class="page-header">
        <h1>Univepay | 首 页</h1>
        <div class="user-actions">
          <div class="balance-display">
            <span class="balance-label">可用余额</span>
            <span class="balance-amount">{{ showData ? formatBalance(availableBalance) : '****' }}</span>
          </div>
          <el-tooltip
            class="box-item"
            effect="dark"
            :content="showData ? '隐藏金额' : '查看金额'"
            placement="bottom"
          >
            <el-button 
              class="simple-button" 
              :icon="showData ? Hide: View " 
              size="small" 
              plain 
              @click="toggleShowData" 
              style="margin-left: 0 !important;"
            ></el-button>
          </el-tooltip>

          <el-tooltip
            class="box-item"
            effect="dark"
            content="刷新数据"
            placement="bottom"
          >
            <el-button 
              class="simple-button" 
              :icon="Refresh" 
              size="small" 
              plain 
              @click="refreshData" 
              :loading="loading" 
              style="margin-right: 20px;"
            ></el-button>
          </el-tooltip>
        </div>
      </header>

      <main class="page-content">
        <!-- 卡片统计 -->
        <ProjectBox ref="projectBoxRef" :show-data="showData" />
        <!-- 快速访问 -->
        <div class="section-header">
          <h2>快捷访问</h2>
        </div>
        <FastBox />
        <!-- 最近交易 -->
        <div class="section-header">
          <h2>最新交易</h2>
          <!-- <el-button class="simple-button" size="small" plain>
            <svg-icon icon-class="caidan" size="20px" class="custom-class" />
            完整报表
          </el-button> -->
        </div>
        <section class="recent-transactions" >
          <el-table
            stripe
            v-loading="loading"
            height="450"
            :data="tableData"
            style="width: 100%"
            element-loading-spinner="el-icon-loading"
            element-loading-background="rgba(255, 255, 255, 0.8)"
          >
            <el-table-column label="商户单号" width="280" align="center">
              <template #default="{ row }">
                <CopyText 
                  :text="row.merchantorderno" 
                  title="点击复制订单号"
                />
              </template>
            </el-table-column>
            <el-table-column label="平台订单号" width="280" align="center">
              <template #default="{ row }">
                <CopyText 
                  :text="row.orderno" 
                  :id="'orderno-' + row.orderno"
                  title="点击复制平台订单号"
                />
              </template>
            </el-table-column>
            <el-table-column prop="orderamount" label="订单金额" align="center">
              <template #default="{ row }">
                {{ formatCurrency(row.orderamount, currency.value) }}
              </template>
            </el-table-column>
            <el-table-column prop="realamount" label="入账金额" align="center">
              <template #default="{ row }">
                {{ formatCurrency(row.realamount, currency.value) }}
              </template>
            </el-table-column>
            <el-table-column prop="balance" label="变后余额" align="center">
              <template #default="{ row }">
                {{ formatCurrency(row.balance, currency.value) }}
              </template>
            </el-table-column>
            <el-table-column prop="createtime" label="入账时间" width="180" align="center" />
            <el-table-column prop="type" label="类型" align="center">
              <template #default="{ row }">
                <el-tag :type="getTypeColor(row.type)">
                  {{ getTypeName(row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="memo" label="类型说明" show-overflow-tooltip align="center" />
          </el-table>
        </section>
      </main>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, computed } from 'vue';
import ProjectBox from "./component/project.vue";
import FastBox from "./component/fast.vue";
import { View, Hide, Refresh } from "@element-plus/icons-vue";
import CopyText from '@/components/CopyText.vue';
import useUserStore from '../../stores/user';
import { http } from '@/api';
import { formatCurrency } from '../../utils/currency';

// 定义响应式变量
const loading = ref(false);
const tableData = ref([]);
const showData = ref(true); // 控制project.vue数据显示/隐藏的状态
const projectBoxRef = ref(null); // 用于访问ProjectBox组件的方法
const availableBalance = ref(0); // 可用余额
// 初始化store
const userStore = useUserStore();
const currency = computed(() => userStore.merchantInfo?.currency);

const orderTypes = ref([]);

const tagTypeColor = {
  K00001: "danger",
  K00002: "success",
  K00003: "danger",
  K00004: "danger",
  K00005: "success",
  K00006: "danger",
  K00007: "success",
  K00008: "success",
  K00009: "success",
  K00010: "danger",
  K00011: "danger",
  K00012: "success",
  K00013: "danger",
  K00014: "success",
  K00015: "danger",
  K00016: "danger",
  K00017: "success",
  K00018: "danger",
};

const getTypeName = (code) => {
  const type = orderTypes.value.find(item => item.code === code);
  return type ? type.name : code;
};

const getTypeColor = (code) => {
  if (!code) return 'info';
  return tagTypeColor[code] || 'info';
};

// 格式化日期函数
const formatDate = (date, format) => {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return format
    .replace('yyyy', year)
    .replace('MM', month)
    .replace('dd', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

// 切换数据显示/隐藏状态
const toggleShowData = () => {
  showData.value = !showData.value;
};

const formatBalance = (balance) => {
  return formatCurrency(balance, currency.value);
};

// 刷新ProjectBox数据
const refreshData = async () => {
  // 获取可用余额
  await getMerchantBalance();
  
  if (projectBoxRef.value && projectBoxRef.value.getdata) {
    projectBoxRef.value.getdata();
  }
  // 同时刷新最近交易数据
  getdata();
};

// 获取商户余额
const getMerchantBalance = async () => {
  try {
    const merchantRes = await http.merchant({
      id: userStore.merchantInfo.id,
    });
    if (merchantRes.code === 200 && merchantRes.data) {
      availableBalance.value = merchantRes.data.Balance || 0;
    }
  } catch (error) {
    console.error("获取商户余额失败:", error);
  }
};

// 10条数据获取函数
async function getdata() {
  loading.value = true;
  try {
    const timestamp = Date.now();
    const localDate = new Date(timestamp);
    const timezoneOffset = localDate.getTimezoneOffset() * 60 * 1000;
    // 假设standardtime是一个固定值，或者从store中获取
    const standardtime = 0;
    const adjustedDate = new Date(timestamp + timezoneOffset + standardtime);
    const start = new Date(adjustedDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(adjustedDate);
    end.setHours(23, 59, 59, 999);
    
    const formattedStart = formatDate(start, "yyyy-MM-dd HH:mm:ss");
    const formattedEnd = formatDate(end, "yyyy-MM-dd HH:mm:ss");
    
    let res = await http.financePage({
      billStartTime: formattedStart,
      billEndTime: formattedEnd,
      id: userStore.merchantId,
      merchantOrderNo: "",
      orderNo: "",
      pageNo: 1,
      pageSize: 10,
      type: "",
    });
    
    if (res.code === 200) {
      // 安全检查，确保 list 存在并且是数组
      if (res.data && Array.isArray(res.data.list)) {
        tableData.value = res.data.list;
      } else {
        tableData.value = [];
      }
    } else {
      // 如果接口返回失败，也清空数据
      tableData.value = [];
    }

    console.log("10条数据", res);
  } catch (error) {
    console.error("获取数据失败", error);
    // 出错时也清空数据
    tableData.value = [];
  } finally {
    loading.value = false;
  }
}

const loadOrderTypes = async () => {
  try {
    const res = await http.orderTypesCount({
      pageNo: 1,
      pageSize: 100
    });
    if (res.code === 200 && res.data.list) {
      orderTypes.value = res.data.list;
    }
  } catch (error) {
    console.error('获取订单类型失败:', error);
  }
};

// 页面挂载时获取数据
onMounted(async () => {
  await loadOrderTypes();
  getMerchantBalance();
  getdata();
});
</script>
<style scoped lang="scss">
@use "../../styles/variables.scss" as *;

.page-container {
  min-height: 100vh;
  background-color: $background-color;
}
.page-content-wrapper {
  width: 100%;
  // max-width: 1348px;
  margin: 0 auto;
  // padding: 0 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-lg;
  // background-color: white;
  // border-bottom: 1px solid #e0e0e0;
  // box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.page-header h1 {
  margin: 0;
  font-size: $font-size-xl;
  color: $text-color;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: $spacing-lg;
}

.balance-display {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding-right: $spacing-lg;
  border-right: 1px solid #e0e0e0;
  
  .balance-label {
    font-size: 12px;
    color: #999;
    margin-bottom: 2px;
  }
  
  .balance-amount {
    font-size: 18px;
    font-weight: bold;
    color: #191919;
  }
}
// 简洁按钮样式
.simple-button {
  border: 1px solid #dcdfe6;
  color: #606266;
  background-color: #ffffff;
  border-radius: 50px;

  &:hover {
    background-color: transparent !important;
  }
}

.page-content {
  padding: $spacing-lg;
}

/* 最近交易 */
.recent-transactions {
  background-color: white;
  padding: $spacing-lg;
  border-radius: $border-radius-md;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  // margin-bottom: $spacing-lg;
  margin-top: 20px;

  h2 {
    margin: 0;
    font-size: $font-size-large;
    color: $text-color;
  }

  .view-all {
    font-size: $font-size-small;

    &:hover {
      // text-decoration: underline;
    }
  }
}

.transactions-empty {
  text-align: center;
  padding: $spacing-xl;
  color: #666;

  .empty-icon {
    font-size: 3rem;
    margin-bottom: $spacing-lg;
    opacity: 0.5;
  }

  p {
    margin: 0;
    font-size: $font-size-base;
  }
}
</style>
