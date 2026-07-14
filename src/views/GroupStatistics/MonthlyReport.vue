<template>
  <div class="page-container">
    <header class="page-header">
      <h1>{{ title }}</h1>
      <hr />
    </header>

    <main class="page-content">
      <div class="content-wrapper">
        <!-- 搜索和筛选区域 -->
        <div class="search-container">
          <el-form :inline="false" :model="searchForm" class="search-form">
            <el-form-item label="订单时间">
              <el-date-picker
                v-model="searchForm.time"
                type="monthrange"
                unlink-panels
                :shortcuts="shortcuts"
                range-separator="至"
                start-placeholder="开始月份"
                end-placeholder="结束月份"
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleSearch" :loading="loading">搜索</el-button>
              <el-button :icon="Refresh" @click="clearSearch" :loading="loading">刷新</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 曲线商户筛选（独立区域） -->
        <div class="merchant-filter-bar">
          <span class="filter-label">曲线商户筛选</span>
          <div class="merchant-select-wrapper">
            <el-select
              v-model="selectedMerchants"
              multiple
              collapse-tags
              collapse-tags-tooltip
              placeholder="选择商户（默认仅展示集团）"
              style="width: 250px;"
              size="small"
              @change="updateCharts"
            >
              <el-option v-for="m in merchantOptions" :key="m.code" :label="m.code" :value="m.code" />
            </el-select>
            <div class="select-buttons">
              <el-button size="small" @click="selectAll">全选</el-button>
              <el-button size="small" @click="selectInverse">反选</el-button>
            </div>
          </div>
        </div>

        <!-- 图表区域 -->
        <div class="fade">
          <div v-if="show === true && tableData.length > 0" class="chart-container">
            <div class="charts-wrapper">
              <div class="chart-item balance-chart">
                <div ref="balanceChartRef" style="width: 100%; height: calc(100% );"></div>
              </div>
              <div class="chart-item line-chart">
                <div class="chart-header">
                  <el-select v-model="paymentFilter" size="small" style="width: 100px;" @change="updateCharts">
                    <el-option label="收款" value="payin" />
                    <el-option label="付款" value="payout" />
                  </el-select>
                </div>
                <div ref="lineChartRef" style="width: 100%; height: calc(100% - 20px);"></div>
              </div>
            </div>
          </div>
          <div v-else-if="show === true && tableData.length === 0" class="empty-chart-state">
            <el-empty description="暂无数据" />
          </div>
        </div>

        <!-- 表格内容区域 -->
        <div class="table-container">
          <el-skeleton :loading="loading" :count="5" animated>
            <template #default>
              <el-table
                ref="table"
                
                :data="tableData"
                v-loading="loading"
                element-loading-spinner="el-icon-loading"
                element-loading-background="rgba(255, 255, 255, 0.8)"
                row-key="Month"
                @expand-change="onExpandChange"
                @row-click="onRowClick"
                :expand-row-keys="expandRowKeys"
                style="cursor: pointer;"
              >
                <el-table-column type="expand">
                  <template #default="scope">
                    <div class="expand-content">
                      <el-table
                        :data="scope.row.merchantItems || []"
                        :summary-method="getMerchantSummaries"
                        show-summary
                        :sum-text="'集团汇总'"
                        border
                        style="width: 100%; margin-top: 10px"
                        size="small"
                        class="expand-table"
                      >
                        <el-table-column prop="code" label="商户号" align="center" />
                        <el-table-column prop="SuccessCountPayin" label="收款笔数" align="center" />
                        <el-table-column prop="TotalAmountReceived" label="收款总额" align="center" />
                        <el-table-column prop="SuccessFeePayin" label="收款手续费" align="center" />
                        <el-table-column prop="SuccessRateCountPayin" label="收款笔数成功率" align="center">
                          <template #default="scope">
                            {{ toPercent(scope.row.SuccessRateCountPayin) }}
                          </template>
                        </el-table-column>
                        <el-table-column prop="SuccessCountPayout" label="付款笔数" align="center" />
                        <el-table-column prop="SuccessAmountPayout" label="付款总额" align="center" />
                        <el-table-column prop="SuccessRateCountPayout" label="付款笔数成功率" align="center">
                          <template #default="scope">
                            {{ toPercent(scope.row.SuccessRateCountPayout) }}
                          </template>
                        </el-table-column>
                      </el-table>
                    </div>
                    <div class="expand-charts-container">
                      <div class="expand-chart-item">
                        <div :ref="el => setChartRef(el, scope.row, 'collection')" style="width: 100%; height: 250px"></div>
                      </div>
                      <div class="expand-chart-item">
                        <div :ref="el => setChartRef(el, scope.row, 'payment')" style="width: 100%; height: 250px"></div>
                      </div>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="Month" label="月份" align="center" width="120" sortable />
                <el-table-column
                  min-width="140px"
                  align="right"
                  v-for="item in columns"
                  :key="item.prop"
                  :prop="item.prop"
                >
                  <template #header>
                    <span>{{ item.label }}</span>
                    <el-tooltip v-if="item.tooltip" :content="item.tooltip" placement="top">
                      <span style="margin-left: 5px;"><el-icon><QuestionFilled /></el-icon></span>
                    </el-tooltip>
                  </template>
                  <template #default="scope">
                    <span>{{ formatNumber(scope.row[item.prop]) }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </template>
          </el-skeleton>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { Search, Refresh } from "@element-plus/icons-vue";
import { ref, reactive, onMounted, onBeforeUnmount, computed, watch, nextTick } from "vue";
import { ElMessage } from "element-plus";
import * as echarts from 'echarts';
import { http } from "@/api";

const props = defineProps({
  title: { type: String, default: "集团每月报表" },
});

const show = ref(true);
const loading = ref(false);

// 搜索表单
const searchForm = reactive({ time: [] });

// 商户列表
const merchantOptions = ref([]);
const selectedMerchants = ref([]);

// 收支筛选
const paymentFilter = ref('payin');

// 接口数据
const tableData = ref([]);
const groupChart = ref([]);
const merchantCharts = ref([]);

// 表格列配置
const columns = reactive([
  { prop: "PreviousMonthBalance", label: "期初余额" },
  { prop: "SuccessAmountPayin", label: "当月收款总额" },
  { prop: "SuccessAmountPayout", label: "当月付款总额" },
  { prop: "TotalAmountReceived", label: "净收款总额", tooltip: "计算公式：当月收款总额 - 当月付款总额" },
  { prop: "CurrentMonthBalance", label: "期末余额" },
]);

// 快捷月份
const shortcuts = [
  { text: '本月', value: () => { const end = new Date(); const start = new Date(end.getFullYear(), end.getMonth(), 1); return [start, end]; } },
  { text: '上月', value: () => { const d = new Date(); const start = new Date(d.getFullYear(), d.getMonth() - 1, 1); const end = new Date(d.getFullYear(), d.getMonth(), 0); return [start, end]; } },
  { text: '近3个月', value: () => { const end = new Date(); const start = new Date(end.getFullYear(), end.getMonth() - 2, 1); return [start, end]; } },
  { text: '近6个月', value: () => { const end = new Date(); const start = new Date(end.getFullYear(), end.getMonth() - 5, 1); return [start, end]; } },
  { text: '今年', value: () => { const end = new Date(); const start = new Date(end.getFullYear(), 0, 1); return [start, end]; } },
];

// 格式化数字
const formatNumber = (val) => {
  if (val === null || val === undefined || val === '') return '0.00';
  const num = Number(val);
  if (isNaN(num)) return val;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// 图表容器
const lineChartRef = ref(null);
let lineChart = null;
const balanceChartRef = ref(null);
let balanceChart = null;

// 商户曲线颜色
const merchantColors = ['#2d8ef6', '#ff9f43', '#ee5a24', '#6c5ce7', '#00cec9', '#fd79a8', '#0984e3', '#e17055'];

// 收款/付款金额趋势图
const lineChartOption = computed(() => {
  const points = groupChart.value;
  const months = points.map(p => p.x);
  const series = [];
  if (paymentFilter.value === 'payin') {
    series.push({
      name: "集团收款金额",
      type: "line",
      data: points.map(p => p.payinAmount),
      smooth: true,
      symbol: "circle",
      symbolSize: 4,
      lineStyle: { width: 2, color: "#48bb78" },
      itemStyle: { color: "#48bb78" },
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
    });
  }
  if (paymentFilter.value === 'payout') {
    series.push({
      name: "集团付款金额",
      type: "line",
      data: points.map(p => p.payoutAmount),
      smooth: true,
      symbol: "circle",
      symbolSize: 4,
      lineStyle: { width: 2, color: "#db0011" },
      itemStyle: { color: "#db0011" },
      areaStyle: {
        color: {
          type: "linear",
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(219, 0, 17, 0.3)" },
            { offset: 1, color: "rgba(219, 0, 17, 0.05)" },
          ],
        },
      },
    });
  }
  let colorIdx = 0;
  merchantCharts.value.forEach(mc => {
    if (selectedMerchants.value.includes(mc.code)) {
      const color = merchantColors[colorIdx % merchantColors.length];
      colorIdx++;
      if (paymentFilter.value === 'payin') {
        series.push({
          name: mc.code + " 收款",
          type: "line",
          data: mc.points.map(p => p.payinAmount),
          smooth: true,
          symbol: "circle",
          symbolSize: 4,
          showSymbol: true,
          lineStyle: { width: 2, color },
          itemStyle: { color },
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
      if (paymentFilter.value === 'payout') {
        series.push({
          name: mc.code + " 付款",
          type: "line",
          data: mc.points.map(p => p.payoutAmount),
          smooth: true,
          symbol: "circle",
          symbolSize: 4,
          showSymbol: true,
          lineStyle: { width: 2, color, type: "dashed" },
          itemStyle: { color },
          areaStyle: {
            color: {
              type: "linear",
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: color + "33" },
                { offset: 1, color: color + "05" },
              ],
            },
          },
        });
      }
    }
  });
  return {
    title: {
      text: "收款金额与付款金额趋势",
      left: '0%',
      top: '0%',
      textStyle: { fontSize: 14, color: '#666' },
    },
    tooltip: {
      trigger: "axis",
      confine: false,
      appendToBody: true,
      maxWidth: 500,
      maxHeight: 500,
      formatter: function (params) {
        if (!params || params.length === 0) return '';
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
            result += p.seriesName + ": R$ " + (p.value !== undefined && p.value !== null ? p.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0') + "<br/>";
          }
          result += '</td>';
        }
        result += '</tr></table>';
        return result;
      },
    },
    // legend: {
    //   data: series.map(s => s.name),
    //   top: "5%",
    //   textStyle: { color: "#666", fontSize: 13 },
    // },
    grid: {
      left: '3%',
      right: '3%',
      bottom: '5%',
      top: '20%',
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: months,
      boundaryGap: true,
      axisLine: { lineStyle: { color: "#d8d8d8" } },
      splitLine: { show: false },
      axisTick: { show: true, alignWithLabel: true, lineStyle: { color: "#d8d8d8" } },
      axisLabel: { color: "#666", align: "center", fontSize: 12, margin: 15 },
    },
    yAxis: {
      type: "value",
      name: "金额",
      axisLine: { show: true, lineStyle: { color: "#d8d8d8" } },
      axisTick: { show: true, lineStyle: { color: "#d8d8d8" } },
      axisLabel: {
        color: "#666",
        fontSize: 12,
        formatter: (value) => {
          if (value >= 100000000) {
            return 'R$' + (value / 100000000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '亿';
          } else if (value >= 10000) {
            return 'R$' + (value / 10000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '万';
          }
          return 'R$' + value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        },
      },
      splitLine: { show: true, lineStyle: { color: "#f0f0f0", type: "dashed" } },
      nameTextStyle: { color: "#666", fontSize: 12, padding: [0, 30, 0, 0] },
    },
    series,
  };
});

// 期初余额趋势图
const balanceChartOption = computed(() => {
  const points = groupChart.value;
  const months = points.map(p => p.x);
  const series = [
    {
      name: "集团期初余额",
      type: "line",
      data: points.map(p => p.prevBalance),
      smooth: true,
      symbol: "circle",
      symbolSize: 4,
      lineStyle: { width: 2, color: "#48bb78" },
      itemStyle: { color: "#48bb78" },
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
  let colorIdx = 0;
  merchantCharts.value.forEach(mc => {
    if (selectedMerchants.value.includes(mc.code)) {
      const color = merchantColors[colorIdx % merchantColors.length];
      colorIdx++;
      series.push({
        name: mc.code + " 期初余额",
        type: "line",
        data: mc.points.map(p => p.prevBalance),
        smooth: true,
        symbol: "circle",
        symbolSize: 4,
        showSymbol: true,
        lineStyle: { width: 2, color },
        itemStyle: { color },
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
      text: "期初余额趋势",
      left: '0%',
      top: '0%',
      textStyle: { fontSize: 14, color: '#666' },
    },
    tooltip: {
      trigger: "axis",
      confine: false,
      appendToBody: true,
      maxWidth: 500,
      maxHeight: 500,
      formatter: function (params) {
        if (!params || params.length === 0) return '';
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
            result += p.seriesName + ": R$ " + (p.value !== undefined && p.value !== null ? p.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0') + "<br/>";
          }
          result += '</td>';
        }
        result += '</tr></table>';
        return result;
      },
    },
    // legend: {
    //   data: series.map(s => s.name),
    //   top: "5%",
    //   textStyle: { color: "#666", fontSize: 13 },
    // },
    grid: {
      left: '3%',
      right: '3%',
      bottom: '5%',
      top: '20%',
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: months,
      boundaryGap: true,
      axisLine: { lineStyle: { color: "#d8d8d8" } },
      splitLine: { show: false },
      axisTick: { show: true, alignWithLabel: true, lineStyle: { color: "#d8d8d8" } },
      axisLabel: { color: "#666", align: "center", fontSize: 12, margin: 15 },
    },
    yAxis: {
      type: "value",
      name: "余额",
      axisLine: { show: true, lineStyle: { color: "#d8d8d8" } },
      axisTick: { show: true, lineStyle: { color: "#d8d8d8" } },
      axisLabel: {
        color: "#666",
        fontSize: 12,
        formatter: (value) => {
          if (value >= 100000000) {
            return 'R$' + (value / 100000000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '亿';
          } else if (value >= 10000) {
            return 'R$' + (value / 10000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '万';
          }
          return 'R$' + value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        },
      },
      splitLine: { show: true, lineStyle: { color: "#f0f0f0", type: "dashed" } },
      nameTextStyle: { color: "#666", fontSize: 12, padding: [0, 30, 0, 0] },
    },
    series,
  };
});

const initLineChart = () => {
  if (!lineChartRef.value) return;
  if (lineChartRef.value.clientWidth === 0 || lineChartRef.value.clientHeight === 0) {
    console.warn('折线图容器宽高为0，无法初始化');
    return;
  }
  if (lineChart) lineChart.dispose();
  lineChart = echarts.init(lineChartRef.value);
  lineChart.setOption(lineChartOption.value, true);
};

const initBalanceChart = () => {
  if (!balanceChartRef.value) return;
  if (balanceChartRef.value.clientWidth === 0 || balanceChartRef.value.clientHeight === 0) {
    console.warn('余额图表容器宽高为0，无法初始化');
    return;
  }
  if (balanceChart) balanceChart.dispose();
  balanceChart = echarts.init(balanceChartRef.value);
  balanceChart.setOption(balanceChartOption.value, true);
};

const updateCharts = () => {
  if (lineChart) lineChart.setOption(lineChartOption.value, true);
  if (balanceChart) balanceChart.setOption(balanceChartOption.value, true);
};

const handleResize = () => {
  lineChart?.resize();
  balanceChart?.resize();
};

// 格式化月份为 yyyy-MM
const formatMonth = (d) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

// 搜索
const handleSearch = async () => {
  if (!searchForm.time || searchForm.time.length !== 2) {
    ElMessage.warning("请选择月份范围");
    return;
  }
  await loadData();
};

const clearSearch = async () => {
  await loadData();
};

const loadData = async () => {
  loading.value = true;
  try {
    let startMonth, endMonth;
    if (searchForm.time && searchForm.time.length === 2) {
      startMonth = formatMonth(searchForm.time[0]);
      endMonth = formatMonth(searchForm.time[1]);
    } else {
      // 默认近6个月
      const end = new Date();
      const start = new Date(end.getFullYear(), end.getMonth() - 5, 1);
      startMonth = formatMonth(start);
      endMonth = formatMonth(end);
    }

    const res = await http.groupMonthlyRpt({ startMonth, endMonth });
    const data = res.data;
    if (!data) {
      ElMessage.warning(res.msg || "获取数据失败");
      tableData.value = [];
      return;
    }

    tableData.value = (data.list || []).map(row => ({
      ...row,
      merchantItems: (row.merchantItems || []).filter(it => !it.code?.startsWith('G')),
    }));
    groupChart.value = data.groupChart || [];
    merchantCharts.value = data.merchantCharts || [];
    show.value = true;

    await nextTick();
    initLineChart();
    initBalanceChart();
  } catch (error) {
    ElMessage.error(error.msg || "获取数据失败");
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// ===== 展开行相关 =====
const expandRowKeys = ref([]);
const chartInstances = ref(new Map());

// 百分比格式化
const toPercent = (val) => {
  if (val === null || val === undefined || val === '') return '-';
  const num = Number(val);
  if (isNaN(num)) return val;
  return num.toFixed(2) + '%';
};

// 点击行展开/收起
const onRowClick = (row) => {
  const key = row.Month;
  const index = expandRowKeys.value.indexOf(key);
  if (index > -1) {
    expandRowKeys.value.splice(index, 1);
  } else {
    expandRowKeys.value.push(key);
  }
  show.value = expandRowKeys.value.length === 0;
  
  if (show.value) {
    nextTick(() => {
      initLineChart();
      initBalanceChart();
    });
  }
};

// 表格展开行事件
const onExpandChange = (row, expandedRows) => {
  show.value = expandedRows.length === 0;
  expandRowKeys.value = expandedRows.map(item => item.Month);

  if (show.value) {
    nextTick(() => {
      initLineChart();
      initBalanceChart();
    });
  } else if (row && expandedRows.includes(row)) {
    nextTick(() => {
      updateRowCharts(row);
    });
  } else if (row) {
    destroyRowCharts(row);
  }
};

// 生成唯一行标识
const getRowKey = (row, type) => {
  const rowId = row.Month || row.id || Math.random().toString(36).substring(2, 9);
  return `${rowId}-${type}`;
};

// 设置展开行图表引用
const setChartRef = (el, row, type) => {
  if (el && row) {
    const key = getRowKey(row, type);
    chartInstances.value.set(key, { el, row, type });
    nextTick(() => {
      if (el.clientWidth === 0 || el.clientHeight === 0) return;
      try {
        initRowChart(el, row, type);
      } catch (error) {
        console.error(`初始化展开行${type}图表失败:`, error);
      }
    });
  } else if (!el && row) {
    const key = getRowKey(row, type);
    const inst = chartInstances.value.get(key);
    if (inst) {
      if (inst.resizeHandler) window.removeEventListener('resize', inst.resizeHandler);
      if (inst.chart && !inst.chart.isDisposed()) {
        try { inst.chart.dispose(); } catch (e) { console.error(e); }
      }
      chartInstances.value.delete(key);
    }
  }
};

// 初始化展开行图表
const initRowChart = (el, row, type) => {
  if (!el || !row) return;
  if (el.clientWidth === 0 || el.clientHeight === 0) return;
  const key = getRowKey(row, type);
  const existing = chartInstances.value.get(key);
  if (existing && existing.chart) {
    if (existing.resizeHandler) window.removeEventListener('resize', existing.resizeHandler);
    if (!existing.chart.isDisposed()) {
      try { existing.chart.dispose(); } catch (e) { console.error(e); }
    }
    chartInstances.value.delete(key);
  }
  try {
    const chart = echarts.init(el);
    const option = type === 'collection' ? getCollectionPieChart(row) : getPaymentPieChart(row);
    chart.setOption(option);
    const resizeHandler = () => { if (chart && !chart.isDisposed()) chart.resize(); };
    chartInstances.value.set(key, { el, chart, row, type, resizeHandler });
    window.addEventListener('resize', resizeHandler);
  } catch (error) {
    console.error('初始化图表失败:', error);
  }
};

// 更新展开行图表
const updateRowCharts = (row) => {
  if (!row) return;
  ['collection', 'payment'].forEach(type => {
    const key = getRowKey(row, type);
    const inst = chartInstances.value.get(key);
    if (inst && inst.chart && !inst.chart.isDisposed()) {
      try {
        inst.chart.setOption(type === 'collection' ? getCollectionPieChart(row) : getPaymentPieChart(row));
      } catch (e) { console.error(e); }
    }
  });
};

// 销毁展开行图表
const destroyRowCharts = (row) => {
  if (!row) return;
  ['collection', 'payment'].forEach(type => {
    const key = getRowKey(row, type);
    const inst = chartInstances.value.get(key);
    if (inst) {
      if (inst.resizeHandler) window.removeEventListener('resize', inst.resizeHandler);
      if (inst.chart && !inst.chart.isDisposed()) {
        try { inst.chart.dispose(); } catch (e) { console.error(e); }
      }
      chartInstances.value.delete(key);
    }
  });
};

// 商户明细表格合计方法
const getMerchantSummaries = (param) => {
  const { columns, data } = param;
  const sums = [];
  columns.forEach((column, index) => {
    if (index === 0) { sums[index] = '集团汇总'; return; }
    if (column.property === 'SuccessRateCountPayin' || column.property === 'SuccessRateCountPayout') {
      sums[index] = 'N/A'; return;
    }
    const values = data.map(item => Number(item[column.property]));
    if (!values.every(value => isNaN(value))) {
      sums[index] = values.reduce((prev, curr) => {
        const value = Number(curr);
        if (!isNaN(value)) return prev + value;
        return prev;
      }, 0).toFixed(2);
    } else {
      sums[index] = 'N/A';
    }
  });
  return sums;
};

// 收款饼图：各商户收款总额占比
const getCollectionPieChart = (row) => {
  const items = row.merchantItems || [];
  let data = items.map(it => ({
    name: it.code || '未知',
    value: Number(it.SuccessAmountPayin) || 0,
  })).filter(item => item.value > 0);

  const colors = [
    {
      type: 'linear',
      x: 0, y: 0, x2: 1, y2: 1,
      colorStops: [{ offset: 0, color: '#667eea' }, { offset: 1, color: '#764ba2' }]
    },
    {
      type: 'linear',
      x: 0, y: 0, x2: 1, y2: 1,
      colorStops: [{ offset: 0, color: '#f093fb' }, { offset: 1, color: '#f5576c' }]
    },
    {
      type: 'linear',
      x: 0, y: 0, x2: 1, y2: 1,
      colorStops: [{ offset: 0, color: '#43e97b' }, { offset: 1, color: '#38f9d7' }]
    },
    {
      type: 'linear',
      x: 0, y: 0, x2: 1, y2: 1,
      colorStops: [{ offset: 0, color: '#999999' }, { offset: 1, color: '#cccccc' }]
    },
  ];

  data.sort((a, b) => b.value - a.value);

  const top3 = data.slice(0, 3);
  const others = data.slice(3);

  if (others.length > 0) {
    const othersTotal = others.reduce((sum, item) => sum + item.value, 0);
    top3.push({
      name: '其他',
      value: othersTotal,
      others: others,
      itemStyle: {
        color: colors[3],
        borderRadius: 8,
        borderColor: '#fff',
        borderWidth: 2
      }
    });
  }

  top3.forEach((item, index) => {
    if (!item.itemStyle) {
      item.itemStyle = {
        color: colors[index % colors.length],
        borderRadius: 8,
        borderColor: '#fff',
        borderWidth: 2
      };
    }
  });

  data = top3;

  return {
    title: { text: "各商户收款总额占比", left: "center", textStyle: { color: "#333", fontSize: 15, fontWeight: 600 }, padding: [10, 0, 10, 0] },
    tooltip: {
      trigger: "item",
      confine: false,
      appendToBody: true,
      maxWidth: 400,
      maxHeight: 500,
      formatter: function(params) {
        let result = `${params.seriesName}<br/>${params.name}: R$${params.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (占比${Number(params.percent).toFixed(2)}%)`;
        if (params.data.others && params.data.others.length > 0) {
          result += '<br/><br/>包含：';
          params.data.others.forEach((otherItem, idx) => {
            result += `<br/>${otherItem.name}: R$${otherItem.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          });
        }
        return result;
      },
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      borderColor: "transparent",
      borderWidth: 0,
      textStyle: { color: "#fff", fontSize: 12 }
    },
    legend: { orient: "horizontal", bottom: "5%", data: data.map(item => item.name), textStyle: { color: "#666", fontSize: 12 }, itemGap: 15 },
    series: [{
      name: "收款总额", type: "pie", radius: ["50%", ""], center: ["50%", "50%"], data: data, avoidLabelOverlap: true,
      itemStyle: { borderRadius: 10, borderColor: "#fff", borderWidth: 3 },
      label: { show: true, formatter: (params) => `${params.name}\n${Number(params.percent).toFixed(2)}%`, color: "#333", fontSize: 11, fontWeight: 500 },
      labelLine: { show: true, length: 15, length2: 10, smooth: true },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: "bold" } }
    }],
  };
};

// 付款饼图：各商户付款总额占比
const getPaymentPieChart = (row) => {
  const items = row.merchantItems || [];
  let data = items.map(it => ({
    name: it.code || '未知',
    value: Number(it.SuccessAmountPayout) || 0,
  })).filter(item => item.value > 0);

  const colors = [
    {
      type: 'linear',
      x: 0, y: 0, x2: 1, y2: 1,
      colorStops: [{ offset: 0, color: '#ff9a9e' }, { offset: 1, color: '#fecfef' }]
    },
    {
      type: 'linear',
      x: 0, y: 0, x2: 1, y2: 1,
      colorStops: [{ offset: 0, color: '#a1c4fd' }, { offset: 1, color: '#c2e9fb' }]
    },
    {
      type: 'linear',
      x: 0, y: 0, x2: 1, y2: 1,
      colorStops: [{ offset: 0, color: '#d299c2' }, { offset: 1, color: '#fef9d7' }]
    },
    {
      type: 'linear',
      x: 0, y: 0, x2: 1, y2: 1,
      colorStops: [{ offset: 0, color: '#999999' }, { offset: 1, color: '#cccccc' }]
    },
  ];

  data.sort((a, b) => b.value - a.value);

  const top3 = data.slice(0, 3);
  const others = data.slice(3);

  if (others.length > 0) {
    const othersTotal = others.reduce((sum, item) => sum + item.value, 0);
    top3.push({
      name: '其他',
      value: othersTotal,
      others: others,
      itemStyle: {
        color: colors[3],
        borderRadius: 8,
        borderColor: '#fff',
        borderWidth: 2
      }
    });
  }

  top3.forEach((item, index) => {
    if (!item.itemStyle) {
      item.itemStyle = {
        color: colors[index % colors.length],
        borderRadius: 8,
        borderColor: '#fff',
        borderWidth: 2
      };
    }
  });

  data = top3;

  return {
    title: { text: "各商户付款总额占比", left: "center", textStyle: { color: "#333", fontSize: 15, fontWeight: 600 }, padding: [10, 0, 10, 0] },
    tooltip: {
      trigger: "item",
      confine: false,
      appendToBody: true,
      maxWidth: 400,
      maxHeight: 500,
      formatter: function(params) {
        let result = `${params.seriesName}<br/>${params.name}: R$${params.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (占比${Number(params.percent).toFixed(2)}%)`;
        if (params.data.others && params.data.others.length > 0) {
          result += '<br/><br/>包含：';
          params.data.others.forEach((otherItem, idx) => {
            result += `<br/>${otherItem.name}: R$${otherItem.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          });
        }
        return result;
      },
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      borderColor: "transparent",
      borderWidth: 0,
      textStyle: { color: "#fff", fontSize: 12 }
    },
    legend: { orient: "horizontal", bottom: "5%", data: data.map(item => item.name), textStyle: { color: "#666", fontSize: 12 }, itemGap: 15 },
    series: [{
      name: "付款总额", type: "pie", radius: ["50%", ""], center: ["50%", "50%"], data: data, avoidLabelOverlap: true,
      itemStyle: { borderRadius: 10, borderColor: "#fff", borderWidth: 3 },
      label: { show: true, formatter: (params) => `${params.name}\n${Number(params.percent).toFixed(2)}%`, color: "#333", fontSize: 11, fontWeight: 500 },
      labelLine: { show: true, length: 15, length2: 10, smooth: true },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: "bold" } }
    }],
  };
};

const selectAll = () => {
  selectedMerchants.value = merchantOptions.value.map(m => m.code);
  updateCharts();
};

const selectInverse = () => {
  const allCodes = merchantOptions.value.map(m => m.code);
  const selectedSet = new Set(selectedMerchants.value);
  selectedMerchants.value = allCodes.filter(code => !selectedSet.has(code));
  updateCharts();
};

onMounted(async () => {
  // 默认近6个月
  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth() - 5, 1);
  searchForm.time = [start, end];

  // 拉取商户列表
  try {
    const mres = await http.getGroupMerchants();
    // 前端过滤掉 G 开头的商户 code
    merchantOptions.value = (mres.data || []).filter(m => !m.code || !m.code.startsWith('G'));
    // 默认选中前2个商户
    // selectedMerchants.value = merchantOptions.value.slice(0, 2).map(m => m.code);
  } catch (e) {
    console.error("获取集团商户列表失败", e);
  }

  window.addEventListener('resize', handleResize);
  await loadData();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  if (lineChart) { lineChart.dispose(); lineChart = null; }
  if (balanceChart) { balanceChart.dispose(); balanceChart = null; }
  // 销毁所有展开行图表
  chartInstances.value.forEach((inst) => {
    if (inst.resizeHandler) window.removeEventListener('resize', inst.resizeHandler);
    if (inst.chart && !inst.chart.isDisposed()) {
      try { inst.chart.dispose(); } catch (e) { console.error(e); }
    }
  });
  chartInstances.value.clear();
});

// 监听图表配置变化
watch([lineChartOption, balanceChartOption], () => {
  updateCharts();
}, { deep: true });
</script>
<style scoped lang="scss">
@use "../../styles/variables.scss" as *;

.page-container {
  background-color: #fff;
  border-radius: 24px;
  margin: $spacing-lg;
  min-height: 100%;
}

.page-header {
  padding: $spacing-lg;
  h1 { margin: 0; font-size: $font-size-xl; color: $text-color; }
  hr {
    margin: 0px;
    height: 0px;
    opacity: 0.2;
    border-width: 0px 0px 1px;
    border-color: inherit;
    border-style: solid;
    width: 100%;
  }
}

.page-content {
  padding: $spacing-lg;
}

.content-wrapper {
  background-color: white;
  padding: 0 $spacing-xl;
  border-radius: $border-radius-md;
}

.search-container {
  margin-bottom: $spacing-lg;

  .search-form {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;

    ::deep(.el-form-item) {
      margin-bottom: $spacing-sm;
    }
  }
}

.merchant-filter-bar {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md $spacing-lg;
  background-color: #f5f7fa;
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

      ::deep(.el-button) {
        padding: 4px 12px;
        font-size: $font-size-small;
      }
    }
  }
}

/* 图表区域样式 */
.chart-container {
  display: flex;
  flex-direction: column;
  margin-bottom: $spacing-lg;
  gap: $spacing-md;
  
  .chart-item {
    background-color: #fff;
    border-radius: $border-radius-md;
    padding: $spacing-md;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  }
  
  .charts-wrapper {
    display: flex;
    gap: $spacing-md;
    height: 400px;
    
    .chart-item {
      flex: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    
    .chart-header {
      display: flex;
      justify-content: flex-end;
      align-items: center;
    }
  }
}

.empty-chart-state {
  text-align: center;
  padding: 40px;
}

.table-container {
  margin-top: $spacing-lg;
}

.expand-content {
  padding: 10px 20px;
  background: #fafafa;
}

.expand-charts-container {
  display: flex;
  margin: 15px 0;
  gap: 15px;

  .expand-chart-item {
    flex: 1;
    background-color: #fafafa;
    border-radius: 8px;
    padding: 10px;
    box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.05);
  }
}
</style>
