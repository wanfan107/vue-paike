<template>
  <div class="page-container">
    <header class="page-header">
      <h1>{{ title }}</h1>
    </header>

    <main class="page-content">
      <div>
        <hr>
      </div>
      <div class="content-wrapper">
        <div class="table-layout">
          <div class="table_time">
            <div class="time-controls" style="display: flex; align-items: center; justify-content: flex-end; gap: 10px; margin-bottom: 10px;">
              <!-- 日期时间选择器 -->
              <el-date-picker
                v-model="selectedTime"
                type="datetime"
                placeholder="选择时间"            
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
                :show-now="false"
                style="width: 180px; border-radius: 4px;"
                size="small"
                @change="getdata"
              />
              <!-- 时间范围下拉 -->
              <el-select
                v-model="timeRange"
                placeholder="选择时间范围"
                style="width: 180px; border-radius: 4px;"
                size="small"
                @change="getdata"
              >
                <el-option label="近5分钟" value="5" />
                <el-option label="近15分钟" value="15" />
                <el-option label="近30分钟" value="30" />
                <el-option label="近1小时" value="60" />
              </el-select>
              <el-popover
                title="温馨提示"
                content="为了统计准确性，统计时间自动提前两分钟。例如：当前时间是01:00:00，您统计近5分钟成功率数据，实际展示的订单数量及成功率区间为00:53:00-00:58:00"
                placement="bottom"
              >
                <template #reference><el-icon><WarningFilled /></el-icon></template>
              </el-popover>
              <el-tooltip class="item" effect="dark" content="刷新数据" placement="bottom">
                <el-button circle :icon="Refresh" style="margin-right: 20px;" @click.stop="getdata()"></el-button>
              </el-tooltip>
            </div>
          </div>
          <!-- 动画金额图 -->
          <div style="flex-shrink: 0;">
            <ProjectBox :showAll="true" :data="projectData"/>
          </div>
          <!-- 图表 -->
          <div class="chart-wrapper">
            <div ref="chartContainer" style="width: 100%; height: 600px;"></div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { Search, Refresh, ArrowRight, Calendar } from "@element-plus/icons-vue";
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { http } from "@/api";
import ProjectBox from "./component/project.vue";
import * as echarts from 'echarts';
import useUserStore from "@/stores/user";

const userStore = useUserStore();

// 银行页面
const props = defineProps({
  title: {
    type: String,
    default: "即时报表",
  },
});

// 动画金额数据
const projectData = ref({
  orderCount: 0,
  successCount: 0,
  successRate: 0,
});

// DailyReport相关数据
const selectedTime = ref('');
const timeRange = ref('5');

// 格式化当前时间
const formatCurrentTime = (currency) => {
  const pad = (n) => String(n).padStart(2, '0');
  let targetDate;

  if (currency === 'BRL') {
    // 巴西时区 UTC-3 计算逻辑
    const now = new Date();
    // 当前时间距离UTC的毫秒偏移
    const utcOffsetMs = now.getTimezoneOffset() * 60 * 1000;
    // UTC-3 = UTC时间 - 3小时
    const brazilTs = now.getTime() + utcOffsetMs - 3 * 3600 * 1000;
    targetDate = new Date(brazilTs);
  } else {
    // 非巴西币种，使用本地浏览器时间
    targetDate = new Date();
  }

  const year = targetDate.getFullYear();
  const month = pad(targetDate.getMonth() + 1);
  const day = pad(targetDate.getDate());
  const hour = pad(targetDate.getHours());
  const minute = pad(targetDate.getMinutes());
  const second = pad(targetDate.getSeconds());

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};


// 图表容器引用
const chartContainer = ref(null);
let chartInstance = null;



// 搜索方法
// DailyReport方法
// const refreshData = () => {
//   // 刷新数据逻辑
//   getdata();
// };

// 图表数据
const chartData = ref({
  dates: [],
  collectionSuccessRates: [],
  collectionAmounts: [],
  collectionCounts: []
});

// 图表配置
const realTimeChart = computed(() => {
  const { dates, collectionSuccessRates, collectionAmounts, collectionCounts } = chartData.value;

  return {
    title: {
      text: "收款成功率趋势",
      left: "center",
      top: 20,
      textStyle: {
        color: "#666",
        fontSize: 16,
      },
    },
    tooltip: {
      trigger: "axis",
      formatter: function (params) {
        const index = params[0].dataIndex;
        let result = params[0].axisValue + "<br/>";
        result += "收款笔数成功率: " + collectionSuccessRates[index] + "%<br/>";
        result += "收款金额: R$ " + collectionAmounts[index].toLocaleString() + "<br/>";
        result += "收款笔数: " + collectionCounts[index] + "笔";
        return result;
      },
    },
    legend: {
      data: ["收款成功率"],
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
      bottom: "10%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: dates,
      boundaryGap: false,
      axisLine: { lineStyle: { color: "#d8d8d8" } },
      splitLine: { show: false },
      axisTick: { show: true, alignWithLabel: true, lineStyle: { color: "#d8d8d8" } },
      axisLabel: { textStyle: { color: "#666", align: "center" }, fontSize: 10, margin: 15, rotate: 0 },
    },
    yAxis: {
      type: "value",
      name: "成功率 (%)",
      min: 70,
      max: 100,
      axisLine: { show: true, lineStyle: { color: "#d8d8d8" } },
      splitLine: { show: true, lineStyle: { color: "#f0f0f0", type: "dashed" } },
      axisLabel: { color: "#666", formatter: "{value}%", fontSize: 12 },
      axisTick: { show: false },
      nameTextStyle: { color: "#666", fontSize: 12, padding: [0, 30, 0, 0] },
    },
    series: [
      {
        name: "收款成功率",
        type: "line",
        data: collectionSuccessRates,
        symbol: "circle",
        symbolSize: 6,
        smooth: true,
        showSymbol: true,
        lineStyle: { color: "#48bb78", width: 3 },
        itemStyle: { color: "#48bb78", borderColor: "#fff", borderWidth: 1 },
        areaStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(72, 187, 120, 0.3)" },
              { offset: 1, color: "rgba(72, 187, 120, 0.05)" },
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
    // 检查容器尺寸
    const checkSize = () => {
      if (!chartContainer.value) return;
      const clientWidth = chartContainer.value.clientWidth;
      const clientHeight = chartContainer.value.clientHeight;
      
      if (clientWidth > 0 && clientHeight > 0) {
        // 先销毁可能存在的旧实例
        if (chartInstance) {
          chartInstance.dispose();
        }
        // 创建新实例
        chartInstance = echarts.init(chartContainer.value);
        // 清空并设置新选项
        chartInstance.setOption(realTimeChart.value, true);
        
        // 监听窗口大小变化，自适应图表
        window.addEventListener('resize', handleResize);
      } else {
        // 等待下一帧再检查
        requestAnimationFrame(checkSize);
      }
    };
    
    // 开始检查尺寸
    checkSize();
  }
};

// 图表自适应
const handleResize = () => {
  chartInstance?.resize();
};

// 销毁图表
const destroyChart = () => {
  window.removeEventListener('resize', handleResize);
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
};

// 格式化时间为 YYYY-MM-DD HH:mm:ss
const formatTime = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const getdata = async () => {
  try {
    let endTime, startTime;
    
    if (selectedTime.value) {
      const endDate = new Date(selectedTime.value.replace(/-/g, '/'));
      const adjustedEndDate = new Date(endDate.getTime() - 2 * 60 * 1000);
      endTime = formatTime(adjustedEndDate);
      startTime = formatTime(new Date(adjustedEndDate.getTime() - parseInt(timeRange.value) * 60 * 1000));
    } else {
      const now = new Date();
      const adjustedNow = new Date(now.getTime() - 2 * 60 * 1000);
      endTime = formatTime(adjustedNow);
      startTime = formatTime(new Date(adjustedNow.getTime() - parseInt(timeRange.value) * 60 * 1000));
    }

    const collectRes = await http.collectSuccessRatio({ startTime, endTime });

    console.log("代收成功率数据", collectRes);

    const collectList = collectRes.data?.list || [];
    
    projectData.value.orderCount = parseInt(collectRes.data?.totalOrderCount || '0');
    projectData.value.successCount = parseInt(collectRes.data?.totalSuccessCount || '0');
    projectData.value.successRate = parseFloat(collectRes.data?.totalSuccessRate.replace('%', '') || '0');

    const sortedTimes = collectList.map(item => item.time).sort();
    
    chartData.value = {
      dates: sortedTimes,
      collectionSuccessRates: sortedTimes.map(time => {
        const item = collectList.find(i => i.time === time);
        return item ? parseFloat(item.successRate?.replace('%', '') || '0') : 0;
      }),
      collectionAmounts: sortedTimes.map(time => {
        const item = collectList.find(i => i.time === time);
        return item ? parseFloat(item.totalAmount || '0') : 0;
      }),
      collectionCounts: sortedTimes.map(time => {
        const item = collectList.find(i => i.time === time);
        return item ? item.orderCount || 0 : 0;
      })
    };

    if (chartInstance) {
      chartInstance.setOption(realTimeChart.value, true);
    }

  } catch (error) {
    ElMessage.error(error.msg || "获取数据失败");
    console.error(error);
  }
};


// 监听图表配置变化，更新图表
watch(realTimeChart, (newOption) => {
  if (chartInstance) {
    // 强制清空并设置新选项
    chartInstance.setOption(newOption, true);
  }
}, { deep: true });

onMounted(() => {
  // 设置默认时间为当前时间
  selectedTime.value = formatCurrentTime(userStore.merchantInfo.currency);
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
</style>
