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
            <div class="time-controls" style="display: flex; align-items: center; justify-content: flex-end; gap: 10px; margin-bottom: 10px; flex-wrap: wrap;">
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
                style="width: 140px; border-radius: 4px;"
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
                <el-button circle :icon="Refresh" style="margin-right: 10px;" @click.stop="getdata()"></el-button>
              </el-tooltip>
            </div>
          </div>
          <!-- 商户多选 + 表格 -->
          <div style="margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 13px; color: #666;">商户筛选：</span>
            <el-select
              v-model="selectedMerchants"
              multiple
              collapse-tags
              collapse-tags-tooltip
              placeholder="选择商户（默认全部）"
              style="width: 360px;"
              size="small"
            >
              <el-option
                v-for="m in merchantOptions"
                :key="m.code"
                :label="m.code"
                :value="m.code"
              />
            </el-select>
          </div>
          <el-table :data="tableRows" border size="small" style="margin-bottom: 20px;" max-height="320">
            <el-table-column prop="code" label="商户代码" align="center" width="160" />
            <el-table-column prop="orderCount" label="创建订单" align="center" />
            <el-table-column prop="successCount" label="成功订单" align="center" />
            <el-table-column prop="successRate" label="成功率" align="center" />
          </el-table>
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
import { Refresh } from "@element-plus/icons-vue";
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { http } from "@/api";
import * as echarts from 'echarts';

// 集团即时统计
const props = defineProps({
  title: {
    type: String,
    default: "集团即时统计",
  },
});

// 时间控件
const selectedTime = ref('');
const timeRange = ref('5');

// 商户列表
const merchantOptions = ref([]);
const selectedMerchants = ref([]);

// 接口返回数据
const apiData = ref({
  merchants: [],
  group: { orderCount: 0, successCount: 0, successRate: "0.00%" },
  groupChart: [],
  merchantCharts: [],
});

// 格式化当前时间（按币种时区）
const formatCurrentTime = (currency) => {
  const pad = (n) => String(n).padStart(2, '0');
  let targetDate;
  if (currency === 'BRL') {
    const now = new Date();
    const utcOffsetMs = now.getTimezoneOffset() * 60 * 1000;
    const brazilTs = now.getTime() + utcOffsetMs - 3 * 3600 * 1000;
    targetDate = new Date(brazilTs);
  } else {
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

// 解析成功率字符串为数值
const parseRate = (rateStr) => {
  if (!rateStr) return 0;
  return parseFloat(String(rateStr).replace('%', '')) || 0;
};

// 表格行（按多选过滤，末行集团汇总）
const tableRows = computed(() => {
  const rows = apiData.value.merchants.filter(m =>
    selectedMerchants.value.length === 0 || selectedMerchants.value.includes(m.code)
  ).map(m => ({
    code: m.code,
    orderCount: m.orderCount,
    successCount: m.successCount,
    successRate: m.successRate,
  }));
  // 集团汇总行
  rows.push({
    code: '集团汇总',
    orderCount: apiData.value.group.orderCount,
    successCount: apiData.value.group.successCount,
    successRate: apiData.value.group.successRate,
  });
  return rows;
});

// 图表配置
const realTimeChart = computed(() => {
  const groupChart = apiData.value.groupChart || [];
  const times = groupChart.map(p => p.time);

  // 集团成功率曲线
  const groupRates = groupChart.map(p => parseRate(p.successRate));

  const series = [
    {
      name: "集团成功率",
      type: "line",
      data: groupRates,
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
  ];

  // 已选商户的曲线（控制表格的 selectedMerchants 同时控制曲线展示）
  const merchantCharts = apiData.value.merchantCharts || [];
  const merchantColors = ['#2d8ef6', '#ff9f43', '#ee5a24', '#6c5ce7', '#00cec9', '#fd79a8', '#0984e3', '#e17055'];
  let colorIdx = 0;
  merchantCharts.forEach(mc => {
    if (selectedMerchants.value.includes(mc.code)) {
      const color = merchantColors[colorIdx % merchantColors.length];
      colorIdx++;
      series.push({
        name: mc.code + " 成功率",
        type: "line",
        data: mc.points.map(p => parseRate(p.successRate)),
        symbol: "circle",
        symbolSize: 5,
        smooth: true,
        showSymbol: false,
        lineStyle: { color, width: 2 },
        itemStyle: { color },
      });
    }
  });

  return {
    title: {
      text: "集团收款成功率趋势",
      left: "center",
      top: 20,
      textStyle: { color: "#666", fontSize: 16 },
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(0,0,0,0.8)",
      borderColor: "#2d8ef6",
      textStyle: { color: "#fff" },
      formatter: function (params) {
        let result = params[0].axisValue + "<br/>";
        params.forEach(p => {
          result += p.seriesName + ": " + p.value.toFixed(2) + "%<br/>";
        });
        return result;
      },
    },
    legend: {
      data: series.map(s => s.name),
      bottom: "5%",
      textStyle: { color: "#666", fontSize: 13 },
    },
    grid: {
      top: "15%",
      left: "5%",
      right: "5%",
      bottom: "12%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: times,
      boundaryGap: false,
      axisLine: { lineStyle: { color: "#d8d8d8" } },
      splitLine: { show: false },
      axisTick: { show: true, alignWithLabel: true, lineStyle: { color: "#d8d8d8" } },
      axisLabel: { textStyle: { color: "#666", align: "center" }, fontSize: 10, margin: 15, rotate: 0 },
    },
    yAxis: {
      type: "value",
      name: "成功率 (%)",
      axisLine: { show: true, lineStyle: { color: "#d8d8d8" } },
      splitLine: { show: true, lineStyle: { color: "#f0f0f0", type: "dashed" } },
      axisLabel: { color: "#666", formatter: "{value}%", fontSize: 12 },
      axisTick: { show: false },
      nameTextStyle: { color: "#666", fontSize: 12, padding: [0, 30, 0, 0] },
    },
    series,
  };
});

// 初始化图表
const initChart = () => {
  if (chartContainer.value) {
    const checkSize = () => {
      if (!chartContainer.value) return;
      const clientWidth = chartContainer.value.clientWidth;
      const clientHeight = chartContainer.value.clientHeight;
      if (clientWidth > 0 && clientHeight > 0) {
        if (chartInstance) {
          chartInstance.dispose();
        }
        chartInstance = echarts.init(chartContainer.value);
        chartInstance.setOption(realTimeChart.value, true);
        window.addEventListener('resize', handleResize);
      } else {
        requestAnimationFrame(checkSize);
      }
    };
    checkSize();
  }
};

const handleResize = () => {
  chartInstance?.resize();
};

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

    const res = await http.groupRealtime({ startTime, endTime });
    const data = res.data;
    if (!data) {
      ElMessage.warning(res.msg || "获取数据失败");
      return;
    }

    apiData.value = {
      merchants: data.merchants || [],
      group: data.group || { orderCount: 0, successCount: 0, successRate: "0.00%" },
      groupChart: data.groupChart || [],
      merchantCharts: data.merchantCharts || [],
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
    chartInstance.setOption(newOption, true);
  }
}, { deep: true });

onMounted(async () => {
  // 拉取集团商户列表（前端过滤掉 G 开头的 code，不展示给用户）
  try {
    const mres = await http.getGroupMerchants();
    const list = (mres.data || []).filter(m => !m.code.startsWith('G'));
    merchantOptions.value = list;
    selectedMerchants.value = list.map(m => m.code);
  } catch (e) {
    console.error("获取集团商户列表失败", e);
  }
  // 默认时间
  const currency = merchantOptions.value.find(m => m.isDefault)?.currency || 'BRL';
  selectedTime.value = formatCurrentTime(currency);
  await getdata();
  initChart();
});

onBeforeUnmount(() => {
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

// 每日报表相关样式
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
