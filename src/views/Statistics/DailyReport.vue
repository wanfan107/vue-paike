<template>
  <div class="app-page">
    <header class="app-page-header">
      <h1>{{ t('menu.dailyReport') }}</h1>
    </header>

    <main>
        <!-- 搜索和筛选区域 -->
        <div class="search-panel">
          <el-form :inline="false" :model="searchForm" class="search-form">
            <el-form-item label="订单时间">
              <el-date-picker
                v-model="searchForm.time"
                type="daterange"
                unlink-panels
                :disabled-date="disabledDate"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
              />
            </el-form-item>

            <el-form-item class="search-actions">
              <el-button
                type="primary"
                :icon="Search"
                @click="handleSearch"
                :loading="loading"
              >
                搜索
              </el-button>
              <el-button
                :icon="Refresh"
                @click="clearSearch"
                :loading="loading"
              >
                刷新
              </el-button>
              <!-- <el-button
                :icon="Download"
                @click="onExport"
                type="primary"
                :loading="exportLoading"
              >
                导出
              </el-button> -->
            </el-form-item>
          </el-form>
        </div>

        <!-- 图表区域 -->
        <div class="fade" >
          <div v-if="show===true && tableData.length > 0" class="chart-container">
            <!-- 商户数据汇总 -->
            <div class="merchant-summary">
              <div class="summary-card today-collect">
                <div class="summary-title">今日代收总额</div>
                <div class="summary-value">{{ formatCurrency(merchantSummaryData.todayCollect, currency.value) }}</div>
              </div>
              <div class="summary-card yesterday-collect">
                <div class="summary-title">昨日代收总额</div>
                <div class="summary-value">{{ formatCurrency(merchantSummaryData.yesterdayCollect, currency.value) }}</div>
              </div>
              <div class="summary-card today-pay">
                <div class="summary-title">今日代付总额</div>
                <div class="summary-value">{{ formatCurrency(merchantSummaryData.todayPay, currency.value) }}</div>
              </div>
              <div class="summary-card yesterday-pay">
                <div class="summary-title">昨日代付总额</div>
                <div class="summary-value">{{ formatCurrency(merchantSummaryData.yesterdayPay, currency.value) }}</div>
              </div>
            </div>
            <div class="charts-wrapper">
              <div class="chart-item balance-chart">
                <div ref="balanceChartRef" style="width: 100%; height: 100%;"></div>
              </div>
              <div class="chart-item line-chart">
                <div ref="lineChartRef" style="width: 100%; height: 100%;"></div>
              </div>
            </div>
          </div>
          <div v-else-if="show===true && tableData.length === 0" class="empty-chart-state">
            <el-empty description="暂无数据" />
          </div>
        </div>

        <!-- 表格内容区域 -->
        <div class="table-panel">
          <!-- 骨架屏 -->
          <el-skeleton :loading="loading" :count="5" animated>
            <template #default>
          
              <!-- 表格 -->
              <el-table 
                
                ref="table"
                max-height="800"
                :data="tableData" 
                v-loading="loading"
                element-loading-spinner="el-icon-loading"
                element-loading-background="rgba(255, 255, 255, 0.8)"
                @expand-change="onExpandChange"
                @row-click="onRowClick"
                :preserve-expanded-content="preserveExpanded"
                :expand-row-keys="expandRowKeys"
                row-key="OrderDate"
                style="cursor: pointer;"
              >
                <el-table-column type="expand" >
                  <template #default="scope">
                    <div class="expand-content">
                      <el-table
                        :data="scope.row.items"
                        :summary-method="getSummaries"
                        show-summary
                        :sum-text="'总计'"
                        border
                        style="width: 100%; margin-top: 10px"
                        size="small"
                        class="expand-table"
                      >
                        <el-table-column
                          prop="typeName"
                          label="类型"
                          align="center"
                        ></el-table-column>
                        <el-table-column
                          prop="SuccessCountPayin"
                          label="收款笔数"
                          align="center"
                        > </el-table-column>
                        <el-table-column
                          prop="SuccessAmountPayin"
                          label="收款总额"
                          align="center"
                        >
                        </el-table-column>
                        <el-table-column
                          prop="SuccessOrderFee"
                          label="收款手续费"
                          align="center"
                        >
                        </el-table-column>
                        <el-table-column
                          prop="SuccessRatePayin"
                          label="收款笔数成功率"
                          align="center"
                        >
                        </el-table-column>
                        <el-table-column
                          prop="SuccessCountPayout"
                          label="付款笔数"
                          align="center"
                        >
                        </el-table-column>
                        <el-table-column
                          prop="SuccessAmountPayout"
                          label="付款总额"
                          align="center"
                        >
                        </el-table-column>
                        <el-table-column
                          prop="SuccessFeePayout"
                          label="付款手续费"
                          align="center"
                        >
                        </el-table-column>
                        <el-table-column
                          prop="SuccessRatePayout"
                          label="付款笔数成功率"
                          align="center"
                        >
                        </el-table-column>
                      </el-table>
                    </div>
                    <div class="expand-charts-container">
                      <div class="expand-chart-item">
                        <div :ref="el => setChartRef(el, scope.row, 'collection')" style="width: 100%; height: 200px"></div>
                      </div>
                      <div class="expand-chart-item">
                        <div :ref="el => setChartRef(el, scope.row, 'payment')" style="width: 100%; height: 200px"></div>
                      </div>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="OrderDate" label="日期" align="center" width="120" sortable></el-table-column>
                <el-table-column
                  min-width="140px"
                  align="center"
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
                    <span v-if="item.type === 'select'">
                      {{ item.mapping[scope.row[item.prop]] }}
                    </span>
                    <span v-else-if="item.percentage">{{
                      toPercent(scope.row[item.prop])
                    }}</span>
                    <span v-else>{{ formatNumber(scope.row[item.prop]) }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </template>
          </el-skeleton>
        </div>

        <!-- 分页 -->
    </main>
  </div>
</template>

<script setup>
import { Search, Refresh, Download } from "@element-plus/icons-vue";
import { ref, reactive, onMounted, onUnmounted, computed, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import useUserStore from "@/stores/user";
import * as echarts from 'echarts';
import { http } from "@/api";
import { getDateRange, disabledFutureDate } from "@/utils/brazilTime";
import { formatCurrency, formatCurrencyWithUnit } from '@/utils/currency';

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

// 每日报表
const { t } = useI18n();

const props = defineProps({
  title: {
    type: String,
    default: "",
  },
});


// 页面状态数据
const preserveExpanded = ref(false);
const show = ref(true);
const expandRowKeys = ref([]);





// 搜索表单数据
const searchForm = reactive({
  type: "",
  time: [],
  orderNo: "",
  merchantOrderNo: "",
});

// 时间范围选项
// const timeRangeOptions = [
//   { label: "昨天", value: "yesterday" },
//   { label: "3天", value: "3days" },
//   { label: "7天", value: "7days" },
// ];

// 表格列配置
const columns = reactive([
  { prop: "PreviousDayEndBalance", label: "期初余额" },
  { prop: "SuccessAmountPayin", label: "当日收款总额" },
  { prop: "SuccessAmountPayout", label: "当日付款总额" },
  { prop: "TotalAmountReceived", label: "净收款总额", tooltip: "计算公式：当日收款总额 - 当日付款总额" },
  { prop: "CurrentDayEndBalance", label: "期末余额" },
]);

// 计算属性
const realTimeChart = computed(() => {
  // 生成假数据用于展示收款金额和付款金额
  const dates = [];
  const collectionAmounts = [];
  const paymentAmounts = [];

  tableData.value.forEach((item) => {
    dates.push(item.OrderDate ? item.OrderDate.split('T')[0] : '');
    collectionAmounts.push(item.SuccessAmountPayin || 0);
    paymentAmounts.push(item.SuccessAmountPayout || 0);
  });

  return {
    title: {
      text: "收款金额与付款金额趋势",
    left: '0%',
      top: '0%',
      textStyle: {
        fontSize: 14,
        color: cssVar('--text-secondary','#606266')
      }
    },
    tooltip: {
      trigger: "axis",
      formatter: function(params) {
        let result = params[0].axisValueLabel + '<br/>';
        params.forEach(function(item) {
          result += '<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:' + item.color + ';"></span>' + item.seriesName + ': ' + formatCurrency(item.value, currency.value) + '<br/>';
        });
        return result;
      }
    },
    legend: {
      data: ["收款金额", "付款金额"],
      top: "5%",
      textStyle: {
        color: cssVar('--text-secondary','#606266'),
        fontSize: 13,
      },
    },
    grid: {
      left: '3%',
      right: '3%',
      bottom: '5%',
      top: '20%',
      containLabel: true
    },
    xAxis: {
      type: "category",
      data: dates,
      boundaryGap: true,
      axisLine: {
        lineStyle: {
          color: cssVar('--color-border-soft','#e4e7ed'),
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
          color: cssVar('--color-border-soft','#e4e7ed'),
        },
      },
      axisLabel: {
        color: cssVar('--text-secondary','#606266'),
        align: "center",
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
          color: cssVar('--color-border-soft','#e4e7ed'),
        },
      },
      axisTick: {
        show: true,
        lineStyle: {
          color: cssVar('--color-border-soft','#e4e7ed'),
        },
      },
      axisLabel: {
        color: cssVar('--text-secondary','#606266'),
        fontSize: 12,
        formatter: (value) => formatCurrencyWithUnit(value, currency.value),
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: cssVar('--color-border-soft','#e4e7ed'),
          type: "dashed",
        },
      },
    },
    series: [
      {
        name: "收款金额",
        type: "line",
        data: collectionAmounts,
        smooth: true,
        symbol: "circle",
        symbolSize: 4,
        lineStyle: {
          color: cssVar('--color-receive', '#16a34a'),
          width: 2,
        },
        itemStyle: {
          color: cssVar('--color-receive', '#16a34a'),
        },
        areaStyle: {
          color: areaGradient(cssVar('--color-receive', '#16a34a')),
        },
      },
      {
        name: "付款金额",
        type: "line",
        data: paymentAmounts,
        smooth: true,
        symbol: "circle",
        symbolSize: 4,
        lineStyle: {
          color: cssVar('--color-send', '#f56c6c'),
          width: 2,
        },
        itemStyle: {
          color: cssVar('--color-send', '#f56c6c'),
        },
        areaStyle: {
          color: areaGradient(cssVar('--color-send', '#f56c6c')),
        },
      },
    ],
  };
});

const balanceChartOption = computed(() => {
  const dates = balanceChartData.value.dates;
  const PreviousDayEndBalance = balanceChartData.value.PreviousDayEndBalance;

  return {
    title: {
      text: '期初余额',
      left: '0%',
      top: '0%',
      textStyle: {
        fontSize: 14,
        color: cssVar('--text-secondary','#606266')
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        let result = params[0].axisValueLabel + '<br/>';
        params.forEach(function(item) {
          result += '<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:' + item.color + ';"></span>' + item.seriesName + ': ' + formatCurrency(item.value, currency.value) + '<br/>';
        });
        return result;
      }
    },
    grid: {
      left: '3%',
      right: '3%',
      bottom: '5%',
      top: '20%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: true,
      axisLine: {
        lineStyle: {
          color: cssVar('--color-border-soft','#e4e7ed')
        }
      },
      axisTick: {
        show: true,
        alignWithLabel: true,
        lineStyle: {
          color: cssVar('--color-border-soft','#e4e7ed')
        }
      },
      axisLabel: {
        fontSize: 12,
        color: cssVar('--text-secondary','#606266'),
        margin: 15,
      }
    },
    yAxis: {
      show: true,
      type: 'value',
      name: '余额',
      axisLine: {
        show: true,
        lineStyle: {
          color: cssVar('--color-border-soft','#e4e7ed')
        }
      },
      axisTick: {
        show: true,
        lineStyle: {
          color: cssVar('--color-border-soft','#e4e7ed')
        }
      },
      axisLabel: {
        fontSize: 12,
        color: cssVar('--text-secondary','#606266'),
        formatter: (value) => {
          if (value >= 100000000) {
            return 'R$' + (value / 100000000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '亿';
          } else if (value >= 10000) {
            return 'R$' + (value / 10000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '万';
          }
          return 'R$' + value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: cssVar('--color-border-soft','#e4e7ed'),
          type: 'dashed'
        }
      }
    },
    series: [{
      name: '余额',
      type: 'line',
      data: PreviousDayEndBalance,
      smooth: true,
      itemStyle: {
        color: cssVar('--brand-primary', '#16a34a')
      },
      lineStyle: {
        width: 2
      },
      symbol: 'circle',
      symbolSize: 4,
      areaStyle: {
        color: areaGradient(cssVar('--brand-primary', '#16a34a'))
      }
    }]
  };
});

// 页面状态
const loading = ref(false);
const tableData = ref([]);
const exportLoading = ref(false);

// 商户汇总数据（单独调用接口）
const merchantSummaryData = ref({
  todayCollect: 0,
  todayPay: 0,
  yesterdayCollect: 0,
  yesterdayPay: 0
});

// 获取商户汇总数据（单独调用接口，只传今天和昨天）
const fetchMerchantSummary = async () => {
  try {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const res = await http.financeReportByDay({
      startDate: formatDate(yesterday),
      endDate: formatDate(now),
    });
    
    if (res.code === 200) {
      const data = res.data?.list || [];
      
      const today = formatDate(now);
      const yesterdayStr = formatDate(yesterday);
      
      let todayCollect = 0;
      let todayPay = 0;
      let yesterdayCollect = 0;
      let yesterdayPay = 0;
      
      data.forEach(item => {
        const orderDate = item.OrderDate ? item.OrderDate.split('T')[0] : '';
        if (orderDate === today) {
          todayCollect = item.SuccessAmountPayin || 0;
          todayPay = item.SuccessAmountPayout || 0;
        } else if (orderDate === yesterdayStr) {
          yesterdayCollect = item.SuccessAmountPayin || 0;
          yesterdayPay = item.SuccessAmountPayout || 0;
        }
      });
      
      merchantSummaryData.value = {
        todayCollect,
        todayPay,
        yesterdayCollect,
        yesterdayPay
      };
    }
  } catch (error) {
    console.error('获取商户汇总数据失败:', error);
  }
};

// 图表引用
const lineChartRef = ref(null);
const balanceChartRef = ref(null);
const chartInstances = ref(new Map()); // 存储展开行的图表实例

// 期初余额图表数据
const balanceChartData = ref({
  dates: [],
  PreviousDayEndBalance: []
});

// 路由实例
const router = useRouter();

// 时间范围选择器回调
// const onTimeRangeChange = (data) => {
//   console.log(data);
//   searchForm.time = [data.timeRange[0], data.timeRange[1]];
//   handleSearch();
// };


// 点击行展开/收起
const onRowClick = (row) => {
  const key = row.OrderDate;
  const index = expandRowKeys.value.indexOf(key);
  if (index > -1) {
    expandRowKeys.value.splice(index, 1);
  } else {
    if (!row.items) {
      const itemsData = [
        {
          typeName: '汇总',
          SuccessCountPayin: row.SuccessCountPayin || 0,
          SuccessAmountPayin: row.SuccessAmountPayin || 0,
          SuccessOrderFee: row.SuccessOrderFee || 0,
          SuccessRatePayin: toPercent(row.SuccessRatePayin),
          SuccessCountPayout: row.SuccessCountPayout || 0,
          SuccessAmountPayout: row.SuccessAmountPayout || 0,
          SuccessFeePayout: row.SuccessFeePayout || 0,
          SuccessRatePayout: toPercent(row.SuccessRatePayout),
        },
        {
          typeName: '违规订单',
          SuccessCountPayin: 0,
          SuccessAmountPayin: 0,
          SuccessOrderFee: 0,
          SuccessRatePayin: '-',
          SuccessCountPayout: 0,
          SuccessAmountPayout: 0,
          SuccessFeePayout: 0,
          SuccessRatePayout: '-',
        }
      ];

      Object.assign(row, { items: itemsData });
    } else {
      const hasExtraData = row.items.some(item =>
        item.typeName === '违规订单'
      );

      if (!hasExtraData) {
        const updatedItems = row.items.map(item => ({
          ...item,
          SuccessRatePayin: toPercent(item.SuccessRatePayin),
          SuccessRatePayout: toPercent(item.SuccessRatePayout),
          SuccessOrderFee: item.SuccessOrderFee || 0,
          SuccessFeePayout: item.SuccessFeePayout || 0,
        }));

        const extraItems = [
          {
            typeName: '违规订单',
            SuccessCountPayin: 0,
            SuccessAmountPayin: 0,
            SuccessOrderFee: 0,
            SuccessRatePayin: '-',
            SuccessCountPayout: 0,
            SuccessAmountPayout: 0,
            SuccessFeePayout: 0,
            SuccessRatePayout: '-',
          }
        ];

        updatedItems.push(...extraItems);

        Object.assign(row, { items: updatedItems });
      }
    }

    if (!row.chartData) {
      row.chartData = [...row.items];
    }

    expandRowKeys.value.push(key);
  }
  show.value = expandRowKeys.value.length === 0;
  
  if (show.value) {
    nextTick(() => {
      initMainCharts();
    });
  }
};

// 表格展开行事件
const onExpandChange = (row, expandedRows) => {
  // 当有行展开时隐藏图表，没有行展开时显示图表
  show.value = expandedRows.length === 0;
  console.log('展开行数量:', expandedRows.length, 'show值:', show.value);

  // 更新expandRowKeys数组
  expandRowKeys.value = expandedRows.map(item => item.OrderDate);

  // 只在展开时添加数据（expandedRows包含当前展开的行）
  if (row && row.items && expandedRows.includes(row)) {
    // 检查是否已经添加过额外数据（避免重复添加）
    const hasExtraData = row.items.some(item =>
      item.typeName === '收款手续费' || item.typeName === '违规订单'
    );

    if (!hasExtraData) {
      // 创建新的items数组，而不是直接修改原数组
      const updatedItems = row.items.map(item => ({
        ...item,
        SuccessRatePayin: toPercent(item.SuccessRatePayin),
        SuccessRatePayout: toPercent(item.SuccessRatePayout),
        SuccessOrderFee: item.SuccessOrderFee || 0,
        SuccessFeePayout: item.SuccessFeePayout || 0,
      }));

      // 添加违规订单数据（收款手续费作为一列，不再单独一行）
      const extraItems = [
        {
          typeName: '违规订单',
          SuccessCountPayin: 0,
          SuccessAmountPayin: 0,
          SuccessOrderFee: 0,
          SuccessRatePayin: '-',
          SuccessCountPayout: 0,
          SuccessAmountPayout: 0,
          SuccessFeePayout: 0,
          SuccessRatePayout: '-',
        }
      ];

      // 将额外数据添加到updatedItems
      updatedItems.push(...extraItems);

      // 使用Vue的响应式方式更新items，避免触发不必要的重新渲染
      Object.assign(row, { items: updatedItems });
    }

    // 为每个行维护独立的图表数据，使用行的唯一标识作为key
    if (!row.chartData) {
      row.chartData = [...row.items];
    }
    
    // 在下一个tick更新展开行的图表，确保DOM已经更新
    nextTick(() => {
      // 再次检查DOM是否已经完全渲染
      nextTick(() => {
        updateRowCharts(row);
      });
    });
  } else if (row) {
    // 折叠时销毁图表实例，避免内存泄漏
    destroyRowCharts(row);
  }
};

// 生成唯一的行标识符
const getRowKey = (row, type) => {
  // 优先使用OrderDate，如果没有则使用索引或其他唯一标识
  const rowId = row.OrderDate || row.id || Math.random().toString(36).substring(2, 9);
  return `${rowId}-${type}`;
};

// 设置展开行的图表引用
const setChartRef = (el, row, type) => {
  if (el && row) {
    const key = getRowKey(row, type);
    chartInstances.value.set(key, { el, row, type });
    
    // 使用nextTick确保DOM已经更新，容器有正确的宽高
    nextTick(() => {
      // 再次检查DOM元素是否有正确的宽高
      if (el.clientWidth === 0 || el.clientHeight === 0) {
        console.warn('图表容器宽高为0，无法初始化图表');
        return;
      }
      
      // 初始化图表
      try {
        initRowChart(el, row, type);
        console.log(`展开行${type}图表初始化成功`);
      } catch (error) {
        console.error(`初始化展开行${type}图表失败:`, error);
      }
    });
  } else if (!el && row) {
    // 当元素被销毁时，从chartInstances中删除对应的条目
    const key = getRowKey(row, type);
    const chartInstance = chartInstances.value.get(key);
    if (chartInstance) {
      if (chartInstance.resizeHandler) {
        window.removeEventListener('resize', chartInstance.resizeHandler);
      }
      if (chartInstance.chart && !chartInstance.chart.isDisposed()) {
        try {
          chartInstance.chart.dispose();
          console.log(`展开行${type}图表销毁成功`);
        } catch (error) {
          console.error('销毁图表失败:', error);
        }
      }
      chartInstances.value.delete(key);
    }
  }
};

// 初始化展开行的图表
const initRowChart = (el, row, type) => {
  if (!el || !row) return;
  
  // 检查DOM元素是否有正确的宽高
  if (el.clientWidth === 0 || el.clientHeight === 0) {
    console.warn('图表容器宽高为0，无法初始化图表');
    return;
  }
  
  // 检查是否已经存在图表实例，如果存在则先销毁
  const key = getRowKey(row, type);
  const existingChart = chartInstances.value.get(key);
  if (existingChart && existingChart.chart) {
    if (existingChart.resizeHandler) {
      window.removeEventListener('resize', existingChart.resizeHandler);
    }
    if (!existingChart.chart.isDisposed()) {
      try {
        existingChart.chart.dispose();
      } catch (error) {
        console.error('销毁图表失败:', error);
      }
    }
    chartInstances.value.delete(key);
  }
  
  try {
    const chart = echarts.init(el);
    const option = type === 'collection' ? getCollectionPieChart(row) : getPaymentPieChart(row);
    chart.setOption(option);
    
    // 存储图表实例
    const resizeHandler = () => {
      if (chart && !chart.isDisposed()) {
        chart.resize();
      }
    };
    chartInstances.value.set(key, { el, chart, row, type, resizeHandler });
    
    // 添加 resize 事件监听
    window.addEventListener('resize', resizeHandler);
  } catch (error) {
    console.error('初始化图表失败:', error);
  }
};

// 更新展开行的图表
const updateRowCharts = (row) => {
  if (!row) return;
  
  // 更新收款饼图
  const collectionKey = getRowKey(row, 'collection');
  const collectionChart = chartInstances.value.get(collectionKey);
  if (collectionChart && collectionChart.chart && !collectionChart.chart.isDisposed()) {
    try {
      const option = getCollectionPieChart(row);
      collectionChart.chart.setOption(option);
    } catch (error) {
      console.error('更新收款饼图失败:', error);
    }
  }
  
  // 更新付款饼图
  const paymentKey = getRowKey(row, 'payment');
  const paymentChart = chartInstances.value.get(paymentKey);
  if (paymentChart && paymentChart.chart && !paymentChart.chart.isDisposed()) {
    try {
      const option = getPaymentPieChart(row);
      paymentChart.chart.setOption(option);
    } catch (error) {
      console.error('更新付款饼图失败:', error);
    }
  }
};

// 销毁展开行的图表
const destroyRowCharts = (row) => {
  if (!row) return;
  
  // 销毁收款饼图
  const collectionKey = getRowKey(row, 'collection');
  const collectionChart = chartInstances.value.get(collectionKey);
  if (collectionChart) {
    if (collectionChart.resizeHandler) {
      window.removeEventListener('resize', collectionChart.resizeHandler);
    }
    if (collectionChart.chart && !collectionChart.chart.isDisposed()) {
      try {
        collectionChart.chart.dispose();
      } catch (error) {
        console.error('销毁收款饼图失败:', error);
      }
    }
    chartInstances.value.delete(collectionKey);
  }
  
  // 销毁付款饼图
  const paymentKey = getRowKey(row, 'payment');
  const paymentChart = chartInstances.value.get(paymentKey);
  if (paymentChart) {
    if (paymentChart.resizeHandler) {
      window.removeEventListener('resize', paymentChart.resizeHandler);
    }
    if (paymentChart.chart && !paymentChart.chart.isDisposed()) {
      try {
        paymentChart.chart.dispose();
      } catch (error) {
        console.error('销毁付款饼图失败:', error);
      }
    }
    chartInstances.value.delete(paymentKey);
  }
};

// 表格合计方法
const getSummaries = (param) => {
  const { columns, data } = param;
  const sums = [];
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '总计';
      return;
    }
    // 检查列名是否为收款成功率
    if (column.property === 'SuccessRatePayin') {
      sums[index] = 'N/A';
      return;
    }
    const values = data.map(item => Number(item[column.property]));
    if (!values.every(value => isNaN(value))) {
      sums[index] = values.reduce((prev, curr) => {
        const value = Number(curr);
        if (!isNaN(value)) {
          return prev + value;
        } else {
          return prev;
        }
      }, 0).toFixed(2);
    } else {
      sums[index] = 'N/A';
    }
  });

  return sums;
};

// 收款饼图：展示 手续费 + 商户分账
const getCollectionPieChart = (row) => {
  const feeValue = Number(row.SuccessOrderFee) || 0;
  const merchantProfitValue = Number(row.MerchantProfit) || 0;

  const data = [
    { name: '收款手续费', value: feeValue },
    { name: '商户分账', value: merchantProfitValue },
  ].filter(item => item.value > 0);

  // 高级渐变色方案
  const colors = [
    {
      type: 'linear',
      x: 0,
      y: 0,
      x2: 1,
      y2: 1,
      colorStops: [
        { offset: 0, color: '#667eea' },
        { offset: 1, color: '#764ba2' }
      ]
    },
    {
      type: 'linear',
      x: 0,
      y: 0,
      x2: 1,
      y2: 1,
      colorStops: [
        { offset: 0, color: '#f093fb' },
        { offset: 1, color: '#f5576c' }
      ]
    },
    {
      type: 'linear',
      x: 0,
      y: 0,
      x2: 1,
      y2: 1,
      colorStops: [
        { offset: 0, color: '#43e97b' },
        { offset: 1, color: '#38f9d7' }
      ]
    },
    {
      type: 'linear',
      x: 0,
      y: 0,
      x2: 1,
      y2: 1,
      colorStops: [
        { offset: 0, color: '#fa709a' },
        { offset: 1, color: '#fee140' }
      ]
    },
    {
      type: 'linear',
      x: 0,
      y: 0,
      x2: 1,
      y2: 1,
      colorStops: [
        { offset: 0, color: '#a18cd1' },
        { offset: 1, color: '#fbc2eb' }
      ]
    }
  ];

  // 为数据添加颜色
  data.forEach((item, index) => {
    item.itemStyle = {
      color: colors[index % colors.length],
      borderRadius: 8,
      borderColor: '#fff',
      borderWidth: 2
    };
  });

  return {
    title: {
      text: "收款金额分布",
      left: "center",
      textStyle: {
        color: cssVar('--text-primary','#303133'),
        fontSize: 15,
        fontWeight: 600
      },
      padding: [10, 0, 10, 0]
    },
    tooltip: {
      trigger: "item",
      formatter: function(params) {
        let color = params.color;
        // 如果颜色是对象（渐变色），提取起始颜色
        return `${params.seriesName}<br/>${params.name}: ${formatCurrency(params.value, currency.value)} (占比${Number(params.percent).toFixed(2)}%)`;
      },
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      borderColor: "transparent",
      borderWidth: 0,
      textStyle: {
        color: "#fff"
      }
    },
    legend: {
      orient: "horizontal",
      bottom: "5%",
      data: data.map((item) => item.name),
      textStyle: {
        color: cssVar('--text-secondary','#606266'),
        fontSize: 12
      },
      itemGap: 15
    },
    series: [
      {
        name: "收款金额",
        type: "pie",
        radius: ["50%", ""],
        center: ["50%", "50%"],
        data: data,
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 10,
          borderColor: "#fff",
          borderWidth: 3
        },
        label: {
          show: true,
          formatter: function(params) {
            return `${params.name}\n${Number(params.percent).toFixed(2)}%`;
          },
          color: cssVar('--text-primary','#303133'),
          fontSize: 11,
          fontWeight: 500
        },
        labelLine: {
          show: true,
          length: 15,
          length2: 10,
          smooth: true
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: "bold"
          }
        }
      },
    ],
  };
};

// 付款饼图：按后端返回的 PayoutByBank 维度统计（如 PIX 金额、USDT 金额）+ 代付手续费
const getPaymentPieChart = (row) => {
  // 使用后端按 bank 维度返回的代付成功金额列表
  const bankList = row.PayoutByBank || [];
  const data = bankList.map((it) => ({
    name: it.bank || "未知",
    value: Number(it.amount) || 0,
  })).filter(item => item.value > 0);

  // 追加代付手续费（= 单笔手续费 + 比例手续费，status=2）作为独立扇区，与收款饼图的"手续费"扇区对称
  const payoutFeeValue = Number(row.SuccessFeePayout) || 0;
  if (payoutFeeValue > 0) {
    data.push({ name: '手续费', value: payoutFeeValue });
  }

  // 高级渐变色方案（与收款不同的配色）
  const colors = [
    {
      type: 'linear',
      x: 0,
      y: 0,
      x2: 1,
      y2: 1,
      colorStops: [
        { offset: 0, color: '#ff9a9e' },
        { offset: 1, color: '#fecfef' }
      ]
    },
    {
      type: 'linear',
      x: 0,
      y: 0,
      x2: 1,
      y2: 1,
      colorStops: [
        { offset: 0, color: '#a1c4fd' },
        { offset: 1, color: '#c2e9fb' }
      ]
    },
    {
      type: 'linear',
      x: 0,
      y: 0,
      x2: 1,
      y2: 1,
      colorStops: [
        { offset: 0, color: '#d299c2' },
        { offset: 1, color: '#fef9d7' }
      ]
    },
    {
      type: 'linear',
      x: 0,
      y: 0,
      x2: 1,
      y2: 1,
      colorStops: [
        { offset: 0, color: '#89f7fe' },
        { offset: 1, color: '#66a6ff' }
      ]
    },
    {
      type: 'linear',
      x: 0,
      y: 0,
      x2: 1,
      y2: 1,
      colorStops: [
        { offset: 0, color: '#fddb92' },
        { offset: 1, color: '#d1fdff' }
      ]
    },
    {
      type: 'linear',
      x: 0,
      y: 0,
      x2: 1,
      y2: 1,
      colorStops: [
        { offset: 0, color: '#c471f5' },
        { offset: 1, color: '#fa71cd' }
      ]
    }
  ];

  // 为数据添加颜色
  data.forEach((item, index) => {
    item.itemStyle = {
      color: colors[index % colors.length],
      borderRadius: 8,
      borderColor: '#fff',
      borderWidth: 2
    };
  });

  return {
    title: {
      text: "付款金额分布",
      left: "center",
      textStyle: {
        color: cssVar('--text-primary','#303133'),
        fontSize: 15,
        fontWeight: 600
      },
      padding: [10, 0, 10, 0]
    },
    tooltip: {
      trigger: "item",
      formatter: function(params) {
        let color = params.color;
        // 如果颜色是对象（渐变色），提取起始颜色
        return `${params.seriesName}<br/>${params.name}: ${formatCurrency(params.value, currency.value)} (占比${Number(params.percent).toFixed(2)}%)`;
      },
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      borderColor: "transparent",
      borderWidth: 0,
      textStyle: {
        color: "#fff"
      }
    },
    legend: {
      orient: "horizontal",
      bottom: "5%",
      data: data.map((item) => item.name),
      textStyle: {
        color: cssVar('--text-secondary','#606266'),
        fontSize: 12
      },
      itemGap: 15
    },
    series: [
      {
        name: "付款金额",
        type: "pie",
        radius: ["50%", ""],
        center: ["50%", "50%"],
        data: data,
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 10,
          borderColor: "#fff",
          borderWidth: 3
        },
        label: {
          show: true,
          formatter: function(params) {
            return `${params.name}\n${Number(params.percent).toFixed(2)}%`;
          },
          color: cssVar('--text-primary','#303133'),
          fontSize: 11,
          fontWeight: 500
        },
        labelLine: {
          show: true,
          length: 15,
          length2: 10,
          smooth: true
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: "bold"
          }
        }
      },
    ],
  };
};

// 使用 Pinia Store
// 禁用日期函数，只能选择到昨天（根据币种选择时区）
const disabledDate = (time) => {
  return disabledFutureDate(time, currency);
};

// 设置默认时间范围（最近7天，根据币种选择时区）
const setDefaultTime = () => {
  const range = getDateRange(7, currency);
  searchForm.time = [range.start, range.end];
};

// 刷新方法
const clearSearch = () => {
  setDefaultTime();
  searchForm.merchantOrderNo = "";
  searchForm.orderNo = "";
  handleSearch();
  // 更新商户汇总数据
  fetchMerchantSummary();
};


// 格式化时间为 YYYY-MM-DD
const formatTime = (date) => {
  // 如果是字符串，先转换为 Date 对象
  const d = typeof date === 'string' ? new Date(date.replace(/-/g, '/')) : date;
  if (!(d instanceof Date) || isNaN(d.getTime())) {
    return '';
  }
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// 搜索方法
const handleSearch = async () => {
  if (!searchForm.time || searchForm.time.length !== 2) {
    ElMessage.warning('请选择日期范围');
    return;
  }

  loading.value = true;
  try {
    const startDate = formatTime(searchForm.time[0]);
    const endDate = formatTime(searchForm.time[1]);
    
    const res = await http.financeReportByDay({
      startDate,
      endDate,
    });
    // 更新商户汇总数据
    await fetchMerchantSummary();
    if (res.code === 200) {
      const data = res.data?.list || [];
      if (Array.isArray(data) && data.length > 0) {
        data.forEach((item) => {
          item.OrderDate = item.OrderDate ? item.OrderDate.split('T')[0] : '';
          item.TotalAmountReceived = (item.SuccessAmountPayin || 0) - (item.SuccessAmountPayout || 0);
        });
        tableData.value = data;
        
        balanceChartData.value = {
          dates: data.map(item => {
            const dateStr = item.OrderDate;
            if (dateStr && dateStr.includes('T')) {
              return dateStr.split('T')[0];
            }
            const date = new Date(dateStr);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          }),
          PreviousDayEndBalance: data.map(item => item.PreviousDayEndBalance || 0)
        };
      } else {
        tableData.value = [];
        balanceChartData.value = {
          dates: [],
          PreviousDayEndBalance: []
        };
        ElMessage.info('暂无数据');
      }
    } else {
      ElMessage.error(res.msg || '查询失败');
    }
    
  } catch (error) {
    console.error('查询失败:', error);
    ElMessage.error('查询失败，请稍后重试');
    tableData.value = [];
  } finally {
    loading.value = false;
  }
};

// 百分比转换方法
const toPercent = (num) => {
  if (!num || num==0) return "0.00%";
  if (num > 1) {
    return num.toFixed(2) + "%";
  }
  return (num * 100).toFixed(2) + "%";
};

// 格式化数字，保留2位小数
const formatNumber = (num) => {
  if (num === null || num === undefined || num === '' || isNaN(num)) {
    return '0.00';
  }
  return parseFloat(num).toFixed(2);
};

// 分页相关方法
// 图表实例
let lineChart = null;
let lineChartResizeHandler = null;
let balanceChart = null;
let balanceChartResizeHandler = null;

// 初始化单个图表的辅助函数
const initChart = (chartRef, chartInstance, resizeHandler, option) => {
  if (!chartRef.value) {
    console.warn('图表容器不存在');
    return null;
  }
  
  // 检查DOM元素是否有正确的宽高
  if (chartRef.value.clientWidth === 0 || chartRef.value.clientHeight === 0) {
    console.warn('图表容器宽高为0，无法初始化图表');
    return null;
  }
  
  // 先销毁已存在的图表实例
  if (chartInstance && !chartInstance.isDisposed()) {
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler);
    }
    chartInstance.dispose();
  }
  
  try {
    const newChart = echarts.init(chartRef.value);
    newChart.setOption(option);
    
    // 添加 resize 事件监听
    const newResizeHandler = () => {
      if (newChart && !newChart.isDisposed()) {
        newChart.resize();
      }
    };
    window.addEventListener('resize', newResizeHandler);
    
    return { chart: newChart, resizeHandler: newResizeHandler };
  } catch (error) {
    console.error('初始化图表失败:', error);
    return null;
  }
};

// 初始化主图表
const initMainCharts = () => {
  // 只有当show为true时才初始化图表，因为此时图表容器才会显示
  if (!show.value) {
    console.log('图表容器未显示，跳过初始化');
    return;
  }
  
  // 初始化折线图
  const lineChartResult = initChart(lineChartRef, lineChart, lineChartResizeHandler, realTimeChart.value);
  if (lineChartResult) {
    lineChart = lineChartResult.chart;
    lineChartResizeHandler = lineChartResult.resizeHandler;
    console.log('折线图初始化成功');
  }
  
  // 初始化期初余额图表
  const balanceChartResult = initChart(balanceChartRef, balanceChart, balanceChartResizeHandler, balanceChartOption.value);
  if (balanceChartResult) {
    balanceChart = balanceChartResult.chart;
    balanceChartResizeHandler = balanceChartResult.resizeHandler;
    console.log('期初余额图表初始化成功');
  }
};

// 更新主图表
const updateMainCharts = () => {
  if (lineChart && !lineChart.isDisposed()) {
    try {
      lineChart.setOption(realTimeChart.value);
    } catch (error) {
      console.error('更新折线图失败:', error);
    }
  }
  
  if (balanceChart && !balanceChart.isDisposed()) {
    try {
      balanceChart.setOption(balanceChartOption.value);
    } catch (error) {
      console.error('更新期初余额图表失败:', error);
    }
  }
};

// 初始化数据
// 主题切换：重读 cssVar 重绘图表
const onThemeChange = () => updateCharts();

onMounted(async () => {
  window.addEventListener('app-theme-change', onThemeChange);
  setDefaultTime();

  // 等待数据加载完成后再初始化图表
  await handleSearch();
  
  // 获取商户汇总数据（单独调用接口，只传今天和昨天）
  await fetchMerchantSummary();
  
  // 在下一个tick初始化图表
  nextTick(() => {
    initMainCharts();
  });
});

// 监听表格数据变化，更新图表
watch(tableData, () => {
  nextTick(() => {
    console.log('表格数据变化，更新图表');
    // 重新初始化图表，确保图表能够正确显示
    initMainCharts();
  });
}, { deep: true });

// 监听show变化，更新图表显示
watch(show, (newVal) => {
  if (newVal) {
    nextTick(() => {
      console.log('show值变化，重新初始化图表');
      // 重新初始化图表，确保图表能够正确显示
      initMainCharts();
    });
  }
});

// 组件卸载时清理图表
onUnmounted(() => {
  window.removeEventListener('app-theme-change', onThemeChange);
  // 销毁折线图
  if (lineChart && !lineChart.isDisposed()) {
    try {
      if (lineChartResizeHandler) {
        window.removeEventListener('resize', lineChartResizeHandler);
        lineChartResizeHandler = null;
      }
      lineChart.dispose();
      lineChart = null;
    } catch (error) {
      console.error('销毁折线图失败:', error);
    }
  }
  
  // 销毁期初余额图表
  if (balanceChart && !balanceChart.isDisposed()) {
    try {
      if (balanceChartResizeHandler) {
        window.removeEventListener('resize', balanceChartResizeHandler);
        balanceChartResizeHandler = null;
      }
      balanceChart.dispose();
      balanceChart = null;
    } catch (error) {
      console.error('销毁期初余额图表失败:', error);
    }
  }
  
  // 销毁所有展开行图表
  chartInstances.value.forEach((chartInstance) => {
    if (chartInstance) {
      if (chartInstance.resizeHandler) {
        window.removeEventListener('resize', chartInstance.resizeHandler);
      }
      if (chartInstance.chart && !chartInstance.chart.isDisposed()) {
        try {
          chartInstance.chart.dispose();
        } catch (error) {
          console.error('销毁展开行图表失败:', error);
        }
      }
    }
  });
  chartInstances.value.clear();
});

// 获取查询参数
// const getQueryParams = () => {
//   return {
//     billEndTime: searchForm.time[1],
//     billStartTime: searchForm.time[0],
//     id: userStore.userInfo.id,
//     merchantOrderNo: searchForm.merchantOrderNo,
//     orderNo: searchForm.orderNo,
//     type: searchForm.type,
//   };
// };

// 导出方法
// const onExport = async () => {
//   try {
//     // 确认对话框
//     await ElMessageBox.confirm("确定导出数据吗?", "提示", {
//       confirmButtonText: "确定",
//       cancelButtonText: "取消",
//       type: "warning",
//     });

//     exportLoading.value = true;

//     // 创建导出
//     await http.exportFinance(getQueryParams());

//     // 跳转到导出记录页面
//     router.push({ name: "exportRecord" });

//     ElMessage.success("导出请求已提交，请到导出记录页面查看");
//   } catch (error) {
//     if (error !== "cancel") {
//       // 不是取消操作时才显示错误信息
//       console.error("导出失败:", error);
//       ElMessage.error("导出失败，请稍后重试");
//     }
//   } finally {
//     exportLoading.value = false;
//   }
// };
</script>

<style scoped lang="scss">
@use "../../styles/variables.scss" as *;

.amount-income {
  color: var(--brand-primary);
  font-weight: 500;
}

.amount-expense {
  color: var(--color-send);
  font-weight: 500;
}

/* 图表区域样式 */
.chart-container {
  display: flex;
  flex-direction: column;
  margin-top: 24px;
  margin-bottom: $spacing-lg;
  gap: $spacing-md;
  
  .chart-item {
    background-color: var(--color-surface, #fff);
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
    }
  }
}

/* 商户数据汇总 */
.merchant-summary {
  display: flex;
  gap: $spacing-md;
  margin-bottom: $spacing-md;
  
  .summary-card {
    flex: 1;
    background-color: var(--color-surface, #fff);
    border-radius: var(--radius-lg);
    padding: $spacing-lg;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    text-align: center;
    border-left: 4px solid var(--color-border-soft);

    .summary-title {
      font-size: 14px;
      color: var(--text-secondary);
      margin-bottom: $spacing-sm;
    }

    .summary-value {
      font-size: 24px;
      font-weight: bold;
      color: var(--text-primary);
      font-variant-numeric: tabular-nums;
    }

    &.today-collect {
      border-left-color: var(--color-receive);
      background: linear-gradient(135deg, var(--color-receive-bg) 0%, #fff 100%);
      .summary-value { color: var(--color-receive); }
    }

    &.yesterday-collect {
      border-left-color: color-mix(in srgb, var(--color-receive) 60%, #fff);
      background: linear-gradient(135deg, var(--color-receive-bg) 0%, #fff 100%);
      .summary-value { color: var(--color-receive); }
    }

    &.today-pay {
      border-left-color: var(--color-send);
      background: linear-gradient(135deg, var(--color-send-bg) 0%, #fff 100%);
      .summary-value { color: var(--color-send); }
    }

    &.yesterday-pay {
      border-left-color: color-mix(in srgb, var(--color-send) 60%, #fff);
      background: linear-gradient(135deg, var(--color-send-bg) 0%, #fff 100%);
      .summary-value { color: var(--color-send); }
    }
  }
}

/* 展开行图表样式 */
.expand-charts-container {
  display: flex;
  margin: $spacing-md 0;
  gap: $spacing-md;
  
  .expand-chart-item {
    flex: 1;
    background-color: var(--color-hover);
    border-radius: $border-radius-md;
    padding: $spacing-sm;
    box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.05);
  }
}

/* 空图表状态样式 */
.empty-chart-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  background-color: var(--color-surface, #fff);
  border-radius: $border-radius-md;
  padding: $spacing-md;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: $spacing-lg;
}

/* 过渡效果 */
.fade {
  transition: opacity 0.3s ease;
}



// 响应式设计
@media (max-width: 1200px) {
  .chart-container {
    flex-direction: column;
    
    .chart-item {
      width: 100%;
      margin-bottom: $spacing-md;
    }
    
    .charts-wrapper {
      flex-direction: column;
      height: auto;
      
      .chart-item {
        height: 300px;
      }
    }
  }
  
  .expand-charts-container {
    flex-direction: column;
    
    .expand-chart-item {
      width: 100%;
      margin-bottom: $spacing-sm;
    }
  }
}

@media (max-width: 768px) {
  .table-panel {
    overflow-x: auto;
  }

  .search-panel {
    .search-form {
      flex-direction: column;
    }
    .el-form-item {
      width: 100%;
    }
    .el-form-item__label {
      width: 100%;
    }
    .el-form-item__content {
      width: 100%;
    }
    .el-input {
      width: 100% !important;
    }
  }

  .expand-charts-container {
    flex-direction: column;
    
    .expand-chart-item {
      width: 100%;
      margin-bottom: $spacing-sm;
    }
  }

  .chart-item {
    padding: $spacing-sm;
  }
  
  .chart-item .el-empty {
    padding: $spacing-md 0;
  }
}

</style>
