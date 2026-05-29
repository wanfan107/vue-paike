<template>
  <div class="page-container">
    <div class="page-content-wrapper">
      <header class="page-header">
        <h1>Univepay | 首 页</h1>
        <div class="user-actions">
          <!-- 简洁风格按钮 -->
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
          <el-button class="simple-button" size="small" plain>
            <svg-icon icon-class="caidan" size="20px" class="custom-class" />
            完整报表
          </el-button>
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
            <el-table-column
              show-overflow-tooltip
              align="center"
              v-for="item in columns"
              :key="item.prop"
              :prop="item.prop"
              :label="item.label"
            >
              <template #default="scope">
                <template v-if="item.type === 'select'">
                  <el-tag
                    v-if="item.isTag"
                    :type="tagTypeColor[scope.row[item.prop]] || item.tagType"
                    >{{ item.mapping[scope.row[item.prop]] }}</el-tag
                  >
                  <span v-else>{{ item.mapping[scope.row[item.prop]] }}</span>
                </template>
                <span v-else>{{ scope.row[item.prop] }}</span>
              </template>
            </el-table-column>
          </el-table>
        </section>
      </main>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import ProjectBox from "./component/project.vue";
import FastBox from "./component/fast.vue";
import { View, Hide, Refresh } from "@element-plus/icons-vue";
import useUserStore from '../../stores/user';
import { http } from '@/api'; // 假设http是从api/index.js导入的

// 定义响应式变量
const loading = ref(false);
const tableData = ref([]);
const showData = ref(true); // 控制project.vue数据显示/隐藏的状态
const projectBoxRef = ref(null); // 用于访问ProjectBox组件的方法
// 初始化store
const userStore = useUserStore();
const columns = [
  { prop: "merchantorderno", label: "商户单号" },
  { prop: "orderno", label: "平台订单号" },
  { prop: "orderamount", label: "订单金额" },
  { prop: "realamount", label: "入账金额" },
  { prop: "balance", label: "变后余额" },
  { prop: "createtime", label: "入账时间" },
  {
    prop: "type",
    label: "类型",
    type: "select",
    isTag: true,
    tagType: "success",
    mapping: {
      K00001: "冻结订单",
      K00002: "收款入款",
      K00003: "付款出款",
      K00004: "冻结申请",
      K00005: "付款失败",
      K00006: "付款手续费",
      K00007: "历史数据结算",
      K00008: "风控解冻",
      K00009: "人工上帐",
      K00010: "付款单笔手续费",
      K00011: "付款比例手续费",
      K00012: "付款冲正",
      K00013: "人工扣款",
      K00014: "集团转入",
      K00015: "集团转出",
      K00016: "提现",
      K00017: "授信",
      K00018: "授信还款",
    },
  },
  { prop: "memo", label: "类型说明" },
];

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

// 刷新ProjectBox数据
const refreshData = () => {
  if (projectBoxRef.value && projectBoxRef.value.getdata) {
    projectBoxRef.value.getdata();
  }
  // 同时刷新最近交易数据
  getdata();
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
      tableData.value = res.data.list;
    }

    console.log("10条数据", res);
  } catch (error) {
    console.error("获取数据失败", error);
  } finally {
    loading.value = false;
  }
}

// 页面挂载时获取数据
onMounted(() => {
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
