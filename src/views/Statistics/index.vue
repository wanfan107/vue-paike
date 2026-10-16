<template>
  <div class="app-page">
    <header class="app-page-header">
      <h1>{{ t('menu.totalView') }}</h1>
    </header>

    <main>
      <div class="table-layout">
          <div class="table_time">
            <div class="time-controls">
              <!-- 日期时间选择器 -->
              <el-date-picker
                v-model="selectedTime"
                type="datetime"
                :placeholder="t('statistics.overview.selectTime')"            
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
                :show-now="false"
                @change="getdata"
              />
              <!-- 时间范围下拉 -->
              <el-select
                v-model="timeRange"
                :placeholder="t('statistics.overview.selectTimeRange')"
                @change="getdata"
              >
                <el-option :label="t('statistics.overview.last5min')" value="5" />
                <el-option :label="t('statistics.overview.last15min')" value="15" />
                <el-option :label="t('statistics.overview.last30min')" value="30" />
                <el-option :label="t('statistics.overview.last1hour')" value="60" />
              </el-select>
              <el-popover
                :title="t('statistics.overview.tipTitle')"
                :content="t('statistics.overview.tipContent')"
                placement="bottom"
              >
                <template #reference><el-icon><WarningFilled /></el-icon></template>
              </el-popover>
              <el-tooltip class="item" effect="dark" :content="t('statistics.overview.refreshData')" placement="bottom">
                <el-button :icon="Refresh" @click.stop="getdata()">{{ t('common.refresh') }}</el-button>
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
    </main>
  </div>
</template>

<script setup>
import { Search, Refresh, ArrowRight, Calendar } from "@element-plus/icons-vue";
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { http } from "@/api";
import ProjectBox from "./component/project.vue";
import * as echarts from 'echarts';
import useUserStore from "@/stores/user";
import { formatCurrency } from '@/utils/currency';

const userStore = useUserStore();
const currency = computed(() => userStore.merchantInfo?.currency);

const cssVar = (name, fallback) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

// 折线面积渐变：token 色自上而下淡出
const hexToRgba = (hex, alpha) => {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const areaGradient = (color, alpha = 0.3) =>
  new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: hexToRgba(color, alpha) },
    { offset: 1, color: hexToRgba(color, 0) },
  ]);

// 银行页面
const { t, locale } = useI18n();

const props = defineProps({
  title: {
    type: String,
    default: "",
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
  const now = new Date();
  let targetDate;

  // 巴西本地时区偏移：UTC-3 → getTimezoneOffset() 返回 180 分钟
  const isUserInBrazil = now.getTimezoneOffset() === 180;

  if (currency === 'BRL') {
    if (isUserInBrazil) {
      // 用户就在巴西本地，直接用本地时间，不用偏移计算
      targetDate = new Date();
    } else {
      // 海外用户使用BRL币种，手动换算UTC-3巴西时间
      const utcOffsetMs = now.getTimezoneOffset() * 60 * 1000;
      const brazilTs = now.getTime() + utcOffsetMs - 3 * 3600 * 1000;
      targetDate = new Date(brazilTs);
    }
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

// 图表配置（themeTick：主题切换时自增，令 computed 重新读取 cssVar）
const themeTick = ref(0);
const realTimeChart = computed(() => {
  void themeTick.value;
  const { dates, collectionSuccessRates, collectionAmounts, collectionCounts } = chartData.value;

  return {
    title: {
      text: t('statistics.overview.chartTitle'),
      left: "center",
      top: 20,
      textStyle: {
        color: cssVar('--text-secondary', '#606266'),
        fontSize: 16,
      },
    },
    tooltip: {
      trigger: "axis",
      formatter: function (params) {
        const index = params[0].dataIndex;
        let result = params[0].axisValue + "<br/>";
        result += t('statistics.overview.tooltipSuccessRate', { rate: collectionSuccessRates[index] }) + "<br/>";
        result += t('statistics.overview.tooltipAmount') + formatCurrency(collectionAmounts[index], currency.value) + "<br/>";
        result += t('statistics.overview.tooltipCount', { count: collectionCounts[index] });
        return result;
      },
    },
    legend: {
      data: [t('statistics.overview.successRateName')],
      bottom: "5%",
      textStyle: {
        color: cssVar('--text-secondary', '#606266'),
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
      axisLine: { lineStyle: { color: cssVar('--color-border-soft', '#e4e7ed') } },
      splitLine: { show: false },
      axisTick: { show: true, alignWithLabel: true, lineStyle: { color: cssVar('--color-border-soft', '#e4e7ed') } },
      axisLabel: { textStyle: { color: cssVar('--text-secondary', '#606266'), align: "center" }, fontSize: 10, margin: 15, rotate: 0 },
    },
    yAxis: {
      type: "value",
      name: t('statistics.overview.successRateAxis'),
      min: 70,
      max: 100,
      axisLine: { show: true, lineStyle: { color: cssVar('--color-border-soft', '#e4e7ed') } },
      splitLine: { show: true, lineStyle: { color: cssVar('--color-border-soft', '#e4e7ed'), type: "dashed" } },
      axisLabel: { color: cssVar('--text-secondary', '#606266'), formatter: "{value}%", fontSize: 12 },
      axisTick: { show: false },
      nameTextStyle: { color: cssVar('--text-secondary', '#606266'), fontSize: 12, padding: [0, 30, 0, 0] },
    },
    series: [
      {
        name: t('statistics.overview.successRateName'),
        type: "line",
        data: collectionSuccessRates,
        symbol: "circle",
        symbolSize: 6,
        smooth: true,
        showSymbol: true,
        lineStyle: { color: cssVar('--brand-primary', '#16a34a'), width: 3 },
        itemStyle: { color: cssVar('--brand-primary', '#16a34a'), borderColor: "#fff", borderWidth: 1 },
        areaStyle: { color: areaGradient(cssVar('--brand-primary', '#16a34a')) },
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
    ElMessage.error(error.msg || t('statistics.overview.getDataFailed'));
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

// 主题切换：重读 cssVar 重绘图表
const onThemeChange = () => { themeTick.value++; };

// 语言切换：图表内文案需重算重绘（computed 不追踪 i18n 文案变化）
watch(locale, () => { themeTick.value++; });

onMounted(() => {
  window.addEventListener('app-theme-change', onThemeChange);
  // 设置默认时间为当前时间
  selectedTime.value = formatCurrentTime(userStore.merchantInfo.currency);
  getdata();
  // 组件挂载后初始化图表
  initChart();
});

onBeforeUnmount(() => {
  window.removeEventListener('app-theme-change', onThemeChange);
  // 组件卸载前销毁图表
  destroyChart();
});
</script>
<style scoped lang="scss">
@use "../../styles/variables.scss" as *;

.time-controls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-bottom: 10px;
  --el-component-size: 40px;
  --el-border-radius-base: 6px;

  :deep(.el-date-editor),
  :deep(.el-select) {
    width: 180px;
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
