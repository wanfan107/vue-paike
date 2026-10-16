<template>
  <div class="app-page">
    <header class="app-page-header">
      <h1>{{ t('menu.groupTotalView') }}</h1>
    </header>

    <main>
      <div class="table-layout">
        <div class="table_time">
          <div class="time-controls">
            <el-date-picker
              v-model="selectedTime"
              type="datetime"
              :placeholder="t('groupStatistics.overview.selectTime')"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              :show-now="false"
              style="width: 180px;"
              @change="getdata"
            />
            <el-select
              v-model="timeRange"
              :placeholder="t('groupStatistics.overview.selectTimeRange')"
              style="width: 140px;"
              @change="getdata"
            >
              <el-option :label="t('groupStatistics.overview.last5Min')" value="5" />
              <el-option :label="t('groupStatistics.overview.last15Min')" value="15" />
              <el-option :label="t('groupStatistics.overview.last30Min')" value="30" />
              <el-option :label="t('groupStatistics.overview.last1Hour')" value="60" />
            </el-select>
            <el-popover
              :title="t('groupStatistics.overview.tipTitle')"
              :content="t('groupStatistics.overview.tipContent')"
              placement="bottom"
            >
              <template #reference><el-icon><WarningFilled /></el-icon></template>
            </el-popover>
            <el-button :icon="Refresh" @click.stop="getdata()">{{ t('common.refresh') }}</el-button>
          </div>
        </div>

        <div class="merchant-filter-bar">
          <span class="filter-label">{{ t('groupStatistics.overview.merchantFilter') }}</span>
          <div class="merchant-select-wrapper">
            <el-select
              v-model="selectedMerchants"
              multiple
              collapse-tags
              collapse-tags-tooltip
              :placeholder="t('groupStatistics.overview.selectMerchant')"
              style="width: 250px;"
              size="small"
            >
              <el-option
                v-for="m in merchantOptions"
                :key="m.code"
                :label="`${m.code}${m.qq ? ' - ' + m.qq : ''}`"
                :value="m.code"
              />
            </el-select>
            <div class="select-buttons">
              <el-button size="small" @click="selectAll">{{ t('groupStatistics.overview.selectAll') }}</el-button>
              <el-button size="small" @click="selectInverse">{{ t('groupStatistics.overview.selectInverse') }}</el-button>
            </div>
          </div>
        </div>
        <div class="chart-container">
          <div :style="{ height: tableHeight + 'px' }" style="overflow: hidden;">
            <el-table :data="tableRows" border size="small" :height="tableHeight">
              <el-table-column prop="code" :label="t('groupStatistics.overview.merchantCode')" align="center" width="160" />
              <el-table-column prop="orderCount" :label="t('groupStatistics.overview.createdOrders')" align="center" />
              <el-table-column prop="successCount" :label="t('groupStatistics.overview.successOrders')" align="center" />
              <el-table-column prop="successRate" :label="t('groupStatistics.overview.successRate')" align="center" />
            </el-table>
          </div>
          <div class="resize-handle" @mousedown="startResize"></div>
        </div>
        <!-- 图表 -->
        <div class="chart-wrapper">
          <div ref="chartContainer" style="width: 100%; height: 700px;"></div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { Refresh } from "@element-plus/icons-vue";
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { http } from "@/api";
import * as echarts from 'echarts';

// 从设计 tokens 读取 CSS 变量（ECharts 画布无法解析 var(...)，必须取值）
const cssVar = (name, fallback) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

// 集团即时统计
const { t } = useI18n();

const props = defineProps({
  title: {
    type: String,
    default: "",
  },
});

// 时间控件
const selectedTime = ref('');
const timeRange = ref('5');

// 商户列表
const merchantOptions = ref([]);
const selectedMerchants = ref([]);
const isFirstLoad = ref(true);

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

const tableHeight = ref(150);
let isResizing = false;
let startY = 0;
let startHeight = 0;

const startResize = (e) => {
  isResizing = true;
  startY = e.clientY;
  startHeight = tableHeight.value;
  document.addEventListener('mousemove', doResize);
  document.addEventListener('mouseup', stopResize);
  document.body.style.cursor = 'row-resize';
  document.body.style.userSelect = 'none';
};

const doResize = (e) => {
  if (!isResizing) return;
  const diff = e.clientY - startY;
  const newHeight = startHeight + diff;
  if (newHeight >= 100 && newHeight <= 600) {
    tableHeight.value = newHeight;
  }
};

const stopResize = () => {
  isResizing = false;
  document.removeEventListener('mousemove', doResize);
  document.removeEventListener('mouseup', stopResize);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
};

// 解析成功率字符串为数值
const parseRate = (rateStr) => {
  if (!rateStr) return 0;
  return parseFloat(String(rateStr).replace('%', '')) || 0;
};

// 表格行（按多选过滤，末行集团汇总）
const tableRows = computed(() => {
  if (selectedMerchants.value.length === 0) {
    return [];
  }
  const rows = apiData.value.merchants.filter(m =>
    selectedMerchants.value.includes(m.code)
  ).map(m => ({
    code: m.code,
    orderCount: m.orderCount,
    successCount: m.successCount,
    successRate: m.successRate,
  }));
  // 集团汇总行
  rows.push({
    code: t('groupStatistics.overview.groupSummary'),
    orderCount: apiData.value.group.orderCount,
    successCount: apiData.value.group.successCount,
    successRate: apiData.value.group.successRate,
  });
  return rows;
});

// 图表配置（themeTick：主题切换时自增，令 computed 重新读取 cssVar）
const themeTick = ref(0);
const realTimeChart = computed(() => {
  void themeTick.value;
  const groupChart = apiData.value.groupChart || [];
  const times = groupChart.map(p => p.time);

  const series = [];

  const merchantCharts = apiData.value.merchantCharts || [];
  const merchantColors = ['#2d8ef6', '#ff9f43', '#ee5a24', '#6c5ce7', '#00cec9', '#fd79a8', '#0984e3', '#e17055'];
  let colorIdx = 0;
  merchantCharts.forEach(mc => {
    if (selectedMerchants.value.includes(mc.code)) {
      const color = merchantColors[colorIdx % merchantColors.length];
      colorIdx++;
      series.push({
        name: `${mc.code} ${t('groupStatistics.overview.successRate')}`,
        type: "line",
        data: mc.points.map(p => parseRate(p.successRate)),
        symbol: "circle",
        symbolSize: 6,
        smooth: true,
        showSymbol: true,
        lineStyle: { color, width: 3 },
        itemStyle: { color, borderColor: cssVar('--color-surface', '#fff'), borderWidth: 1 },
        areaStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: color + "4D" },
              { offset: 1, color: color + "08" },
            ],
          },
        },
      });
    }
  });

  return {
    title: {
      text: t('groupStatistics.overview.chartTitle'),
      left: "center",
      top: 20,
      textStyle: {
        color: cssVar('--text-secondary', '#606266'),
        fontSize: 16,
      },
    },
    tooltip: {
      trigger: "axis",
      confine: false,
      appendToBody: true,
      maxWidth: 500,
      maxHeight: 500,
      formatter: function (params) {
        let result = params[0].axisValue + "<br/><br/>";
        const sortedParams = [...params].sort((a, b) => (b.value || 0) - (a.value || 0));
        const itemsPerColumn = 10;
        const columnCount = Math.ceil(sortedParams.length / itemsPerColumn);
        result += '<table style="width:100%;border-collapse:collapse;">';
        result += '<tr>';
        for (let col = 0; col < columnCount; col++) {
          result += '<td style="padding:2px 8px;text-align:left;vertical-align:top;">';
          for (let row = 0; row < itemsPerColumn; row++) {
            const idx = col * itemsPerColumn + row;
            if (idx >= sortedParams.length) break;
            const p = sortedParams[idx];
            result += '<span style="display:inline-block;margin-right:5px;border-radius:50%;width:10px;height:10px;background-color:' + p.color + ';"></span>';
            result += p.seriesName + ": " + p.value.toFixed(2) + "%<br/>";
          }
          result += '</td>';
        }
        result += '</tr></table>';
        return result;
      },
    },
    legend: {
      data: series.map(s => s.name),
      bottom: 10,
      left: "center",
      orient: "horizontal",
      itemGap: 10,
      itemWidth: 14,
      itemHeight: 14,
      textStyle: {
        color: cssVar('--text-secondary', '#606266'),
        fontSize: 12,
      },
      pageTextStyle: {
        color: cssVar('--text-secondary', '#606266'),
      },
      pageIconColor: cssVar('--text-secondary', '#606266'),
      pageIconInactiveColor: cssVar('--text-faint', '#c0c4cc'),
      pageFormatter: "{current}/{total}",
      pageButtonPosition: "end",
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
      data: times,
      boundaryGap: false,
      axisLine: { lineStyle: { color: cssVar('--color-border-soft', '#e4e7ed') } },
      splitLine: { show: false },
      axisTick: { show: true, alignWithLabel: true, lineStyle: { color: cssVar('--color-border-soft', '#e4e7ed') } },
      axisLabel: { textStyle: { color: cssVar('--text-secondary', '#606266'), align: "center" }, fontSize: 10, margin: 15, rotate: 0 },
    },
    yAxis: {
      type: "value",
      name: t('groupStatistics.overview.axisSuccessRate'),
      min: 70,
      max: 100,
      axisLine: { show: true, lineStyle: { color: cssVar('--color-border-soft', '#e4e7ed') } },
      splitLine: { show: true, lineStyle: { color: cssVar('--color-border-soft', '#e4e7ed'), type: "dashed" } },
      axisLabel: { color: cssVar('--text-secondary', '#606266'), formatter: "{value}%", fontSize: 12 },
      axisTick: { show: false },
      nameTextStyle: { color: cssVar('--text-secondary', '#606266'), fontSize: 12, padding: [0, 30, 0, 0] },
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
      ElMessage.warning(res.msg || t('groupStatistics.overview.fetchFailed'));
      return;
    }

    apiData.value = {
      merchants: data.merchants || [],
      group: data.group || { orderCount: 0, successCount: 0, successRate: "0.00%" },
      groupChart: data.groupChart || [],
      merchantCharts: data.merchantCharts || [],
    };

    if (isFirstLoad.value) {
      const sortedMerchants = [...(data.merchants || [])].sort((a, b) => (b.successCount || 0) - (a.successCount || 0));
      selectedMerchants.value = sortedMerchants.slice(0, 3).map(m => m.code);
      isFirstLoad.value = false;
    }

    if (chartInstance) {
      chartInstance.setOption(realTimeChart.value, true);
    }
  } catch (error) {
    ElMessage.error(error.msg || t('groupStatistics.overview.fetchFailed'));
    console.error(error);
  }
};

// 监听图表配置变化，更新图表
watch(realTimeChart, (newOption) => {
  if (chartInstance) {
    chartInstance.setOption(newOption, true);
  }
}, { deep: true });

const selectAll = () => {
  selectedMerchants.value = merchantOptions.value.map(m => m.code);
};

const selectInverse = () => {
  const allCodes = merchantOptions.value.map(m => m.code);
  const selectedSet = new Set(selectedMerchants.value);
  selectedMerchants.value = allCodes.filter(code => !selectedSet.has(code));
};

// 主题切换：重读 cssVar 重绘图表
const onThemeChange = () => { themeTick.value++; };

onMounted(async () => {
  window.addEventListener('app-theme-change', onThemeChange);
  // 拉取集团商户列表（前端过滤掉 G 开头的 code，不展示给用户）
  try {
    const mres = await http.getGroupMerchants();
    const list = (mres.data || []).filter(m => !m.code.startsWith('G'));
    merchantOptions.value = list;
    const sortedList = [...list].sort((a, b) => (b.successCount || 0) - (a.successCount || 0));
    selectedMerchants.value = sortedList.slice(0, 3).map(m => m.code);
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
  window.removeEventListener('app-theme-change', onThemeChange);
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
  flex-wrap: wrap;

  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper) {
    height: 40px;
    border-radius: 6px;
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
    margin-bottom: $spacing-sm;
    flex-shrink: 0;
  }

  .merchant-filter-bar {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    padding: $spacing-md $spacing-lg;
    background-color: var(--color-hover);
    border-radius: $border-radius-md;
    margin-bottom: $spacing-lg;

    .filter-label {
      font-size: $font-size-base;
      color: $text-color-secondary;
      font-weight: 500;
      white-space: nowrap;
    }

    .merchant-select-wrapper {
      display: flex;
      align-items: center;
      gap: $spacing-sm;

      .select-buttons {
        display: flex;
        flex-direction: row;
        gap: $spacing-xs;
      }
    }
  }

  .chart-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 0;
    overflow: hidden;
  }

  .chart-container {
    margin-bottom: 20px;
    
    .resize-handle {
      height: 6px;
      background: var(--color-border-soft);
      cursor: row-resize;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: -1px;
      
      &:hover {
        background: var(--color-border);
      }
      
      &::after {
        content: '';
        width: 30px;
        height: 4px;
        background: var(--text-faint);
        border-radius: 2px;
      }
    }
  }
}
</style>
