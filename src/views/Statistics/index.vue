<template>
  <div class="page-container">
    <header class="page-header">
      <h1>{{ title }}</h1>
      <hr />
    </header>

    <main class="page-content">
      <div class="content-wrapper">
        <div class="table-layout">
            <div class="table_time">
              <div class="time-controls" style="display: flex; align-items: center; justify-content: flex-end; gap: 10px; margin-bottom: 10px;">
                <!-- 日期时间选择器 -->
                <el-date-picker
                  v-model="selectedTime"
                  type="datetime"
                  placeholder="选择时间"
                  value-format="yyyy-MM-dd HH:mm:ss"
                  format="yyyy/MM/dd HH:mm"
                  style="width: 180px; border-radius: 4px;"
                  size="small"
                  :picker-options="pickerOptions"
                />
                <!-- 时间范围下拉 -->
                <el-select
                  v-model="timeRange"
                  placeholder="选择时间范围"
                  style="width: 180px; border-radius: 4px;"
                  size="small"
                >
                  <el-option label="Últimos 60 minutos" value="last60min" />
                  <el-option label="Últimas 30 horas" value="last24h" />
                  <el-option label="Últimos 15 dias" value="last7d" />
                  <el-option label="Últimos 5 dias" value="last7d" />
                </el-select>
                <el-tooltip class="item" effect="dark" content="刷新数据" placement="bottom">
                  <el-button circle :icon="Refresh" style="margin-right: 20px;" @click.stop="refreshData"></el-button>
                </el-tooltip>
              </div>
            </div>
            <!-- 动画金额图 -->
            <div style="flex-shrink: 0;">
              <ProjectBox :showAll="true" />
            </div>
            <!-- 图表 -->
            <div class="chart-wrapper">
              <div ref="chartContainer" style="width: 100%; height: 700px;"></div>
            </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { Search, Refresh } from "@element-plus/icons-vue";
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { http } from "@/api";
import ProjectBox from "./component/project.vue";
import * as echarts from 'echarts';

// 银行页面
const props = defineProps({
  title: {
    type: String,
    default: "当日报表",
  },
});

// 数据搜索相关
let datalist = [];
const input = ref('');

// DailyReport相关数据
const selectedTime = ref(new Date().toISOString().slice(0, 19).replace('T', ' '));
const timeRange = ref('last60min');
const pickerOptions = reactive({
  disabledDate(time) {
    const now = new Date();
    const maxDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
    return time.getTime() < maxDate.getTime();
  },
});

const tableData = ref([]);
const data = ref([]);

// 图表容器引用
const chartContainer = ref(null);
let chartInstance = null;

// 搜索方法
// DailyReport方法
const refreshData = () => {
  // 刷新数据逻辑
  getdata();
};

// 图表配置
const realTimeChart = computed(() => {
  // 生成假数据用于展示收款金额和付款金额
  const dates = [];
  const collectionAmounts = [];
  const paymentAmounts = [];

  // 生成最近7天的假数据
  for (let i = 24; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(`${date.getMonth() + 1}-${date.getDate()}`);

    // 生成随机的收款金额（范围在10000-50000之间）
    collectionAmounts.push(Math.floor(Math.random() * 40000) + 100000);

    // 生成随机的付款金额（范围在8000-40000之间，略低于收款金额）
    paymentAmounts.push(Math.floor(Math.random() * 32000) + 80000);
  }

  return {
    title: {
      text: "收款金额与付款金额趋势",
      left: "center",
      top: 20,
      textStyle: {
        color: "#666",
        fontSize: 16,
      },
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(0,0,0,0.8)",
      borderColor: "#2d8ef6",
      textStyle: {
        color: "#fff",
      },
      formatter: function (params) {
        let result = params[0].axisValue + "<br/>";
        params.forEach(function (item) {
          result +=
            item.marker +
            " " +
            item.seriesName +
            ": ¥" +
            item.value.toLocaleString() +
            "<br/>";
        });
        return result;
      },
    },
    legend: {
      data: ["收款金额", "付款金额"],
      bottom: "5%",
      textStyle: {
        color: "#666",
        fontSize: 13,
      },
    },
    grid: {
      top: "25%",
      left: "5%",
      right: "5%",
      bottom: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: dates,
      boundaryGap: false,
      axisLine: {
        lineStyle: {
          color: "#d8d8d8",
        },
      },
      splitLine: {
        show: false,
        lineStyle: {
          color: "#DCE2E8",
        },
      },
      axisTick: {
        show: true,
        alignWithLabel: true,
        lineStyle: {
          color: "#d8d8d8",
        },
      },
      axisLabel: {
        textStyle: {
          color: "#666",
          align: "center",
        },
        fontSize: 12,
        margin: 15,
      },
    },
    yAxis: {
      type: "value",
      name: "金额",
      axisLine: {
        show: true,
        lineStyle: {
          color: "#d8d8d8",
        },
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: "#f0f0f0",
          type: "dashed",
        },
      },
      axisLabel: {
        color: "#666",
        formatter: "¥{value}",
        fontSize: 12,
      },
      axisTick: {
        show: false,
      },
      nameTextStyle: {
        color: "#666",
        fontSize: 12,
        padding: [0, 30, 0, 0],
      },
    },
    series: [
      {
        name: "收款金额",
        type: "line",
        data: collectionAmounts,
        symbol: "circle",
        symbolSize: 6,
        smooth: true,
        showSymbol: true,
        lineStyle: {
          color: "#48bb78",
          width: 3,
        },
        itemStyle: {
          color: "#48bb78",
          borderColor: "#fff",
          borderWidth: 1,
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: "rgba(72, 187, 120, 0.3)",
              },
              {
                offset: 1,
                color: "rgba(72, 187, 120, 0.05)",
              },
            ],
          },
        },
      },
      {
        name: "付款金额",
        type: "line",
        data: paymentAmounts,
        symbol: "circle",
        symbolSize: 6,
        smooth: true,
        showSymbol: true,
        lineStyle: {
          color: "#db0011",
          width: 3,
        },
        itemStyle: {
          color: "#db0011",
          borderColor: "#fff",
          borderWidth: 1,
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: "rgba(219, 0, 17, 0.3)",
              },
              {
                offset: 1,
                color: "rgba(219, 0, 17, 0.05)",
              },
            ],
          },
        },
      },
    ],
  };
});

// 初始化图表
const initChart = () => {
  if (chartContainer.value) {
    chartInstance = echarts.init(chartContainer.value);
    chartInstance.setOption(realTimeChart.value);
    
    // 监听窗口大小变化，自适应图表
    window.addEventListener('resize', handleResize);
  }
};

// 图表自适应
const handleResize = () => {
  chartInstance?.resize();
};

// 销毁图表
const destroyChart = () => {
  window.removeEventListener('resize', handleResize);
  chartInstance?.dispose();
  chartInstance = null;
};

const getdata = async () => {
  try {
    let res = await http.financeReportByDay({
      startDate: selectedTime.value,
      endDate: selectedTime.value,
    });
    console.log("每日数据", res);
  } catch (error) {
    ElMessage.error("获取数据失败");
  }
};

// 监听图表配置变化，更新图表
watch(realTimeChart, (newOption) => {
  chartInstance?.setOption(newOption, true);
}, { deep: true });

onMounted(() => {
  getdata();
  // 组件挂载后初始化图表
  initChart();
});

onBeforeUnmount(() => {
  // 组件卸载前销毁图表
  destroyChart();
});
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



.content-wrapper {
  background-color: white;
  padding: $spacing-lg;
  border-radius: $border-radius-md;
  // box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
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
  display: flex; 
  align-items: center; 
  justify-content: center; 
  gap: 12px;
  margin-bottom: $spacing-lg;
  input{
    border-radius: 24px !important;
  }
}

// DailyReport相关样式
.table-layout {
  width: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;

  :deep(.el-card) {
    width: 100%;
    height: auto;
    overflow: hidden;

    .el-card__body {
      width: 100%;
      padding: 20px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
    }
  }

  .table_time {
    margin-bottom: 20px;
    flex-shrink: 0;
  }

  .chart-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 0;
    overflow: hidden;
  }
}
</style>
