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
                type="daterange"
                unlink-panels
                :shortcuts="shortcuts"
                :disabled-date="disabledDate"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
              />
            </el-form-item>

            <el-form-item>
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
                        <div class="chart-item pie-chart">
              <div :style="{ height: tableHeight + 'px' }" style="overflow: hidden;">
                <el-table :data="pieTableData" border :height="tableHeight">
                  <el-table-column prop="merchantCode" label="商户号" sortable />
                  <el-table-column prop="todayCollect" label="今日代收总额" sortable />
                  <el-table-column prop="yesterdayCollect" label="昨日代收总额" sortable />
                  <el-table-column prop="todayPay" label="今日代付总额" sortable />
                  <el-table-column prop="yesterdayPay" label="昨日代付总额" sortable />
                </el-table>
              </div>
              <div class="resize-handle" @mousedown="startResize"></div>
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
        <div class="table-container">
              <!-- <TimeRangeSelector
                @change="onTimeRangeChange"
                :timeRangeOptions="timeRangeOptions"
                :defaultValue="'7days'"
                :format="'yyyy-MM-dd'"
              /> -->
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
                :preserve-expanded-content="preserveExpanded"
                :expand-row-keys="expandRowKeys"
                row-key="OrderDate"
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
                          label="收款总金额"
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
                          label="付款总金额"
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
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="pagination.currentPage"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 30, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { Search, Refresh, Download } from "@element-plus/icons-vue";
import { ref, reactive, onMounted, onUnmounted, computed, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import TimeRangeSelector from "@/components/TimeRangeSelector.vue";
import useUserStore from "@/stores/user";
import * as echarts from 'echarts';
import { http } from "@/api";
// 每日报表
const props = defineProps({
  title: {
    type: String,
    default: "每日报表",
  },
});

const mapping = {
  ALL: -1,
  PENDING: 0,
  SUCCESS: 1,
  FAILED: 2,
  // REFUND: "REFUND",
  // PART_SUC: "PART_SUC",
};
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
  { prop: "Totalamountreceived", label: "收款总金额", tooltip: "计算公式：当日收款总额 - 当日付款总额" },
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
        color: '#666'
      }
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
            ": R$" +
            item.value +
            "<br/>";
        });
        return result;
      },
    },
    legend: {
      data: ["收款金额", "付款金额"],
      top: "5%",
      textStyle: {
        color: "#666",
        fontSize: 13,
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '8%',
      top: '20%',
      containLabel: true
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
        color: "#666",
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
        formatter: "R${value}",
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
        color: '#666'
      }
    },
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '20%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: {
        lineStyle: {
          color: '#d8d8d8'
        }
      },
      axisLabel: {
        fontSize: 10,
        color: '#999'
      }
    },
    yAxis: {
      show: false,
      type: 'value'
    },
    series: [{
      name: '余额',
      type: 'line',
      data: PreviousDayEndBalance,
      itemStyle: {
        color: '#48bb78'
      },
      lineStyle: {
        width: 2
      },
      symbol: 'circle',
      symbolSize: 4,
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            {
              offset: 0,
              color: 'rgba(72, 187, 120, 0.3)'
            },
            {
              offset: 1,
              color: 'rgba(72, 187, 120, 0.05)'
            }
          ]
        }
      }
    }]
  };
});

const pieTableData = computed(() => {
  return tableData.value.map((item) => ({
    merchantCode: item.merchantCode || '-',
    todayCollect: item.SuccessAmountPayin || '0.00',
    yesterdayCollect: item.YesterdayPayinAmount || '0.00',
    todayPay: item.SuccessAmountPayout || '0.00',
    yesterdayPay: item.YesterdayPayoutAmount || '0.00',
  }));
});

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0,
});

// 页面状态
const loading = ref(false);
const tableData = ref([]);
const exportLoading = ref(false);

// 表格可拉伸高度
const tableHeight = ref(200);
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
      item.typeName === '手续费' || item.typeName === '违规订单'
    );

    if (!hasExtraData) {
      // 创建新的items数组，而不是直接修改原数组
      const updatedItems = row.items.map(item => ({
        ...item,
        SuccessRatePayin: toPercent(item.SuccessRatePayin),
        // SuccessAmountPayin: formatNumber(item.SuccessAmountPayin),
        SuccessRatePayout: toPercent(item.SuccessRatePayout),
        // SuccessOrderFee: formatNumber(item.SuccessOrderFee),
      }));

      // 添加手续费和违规订单数据
      const extraItems = [
        {
          typeName: '手续费',
          SuccessCountPayin: '-',
          SuccessAmountPayin: '-',
          SuccessCountPayout: '-',
          SuccessAmountPayout: row.SuccessOrderFee || 0,
          SuccessRatePayin: '-',
        },
        {
          typeName: '违规订单',
          SuccessCountPayin: 0,
          SuccessAmountPayin: 0,
          SuccessCountPayout: 0,
          SuccessAmountPayout: 0,
          SuccessRatePayin: '-',
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
      }, 0);
    } else {
      sums[index] = 'N/A';
    }
  });

  return sums;
};

// 收款饼图
const getCollectionPieChart = (row) => {
  // 使用该行的items数据
  const data = (row.items || []).map((item) => ({
    name: item.typeName || "未知",
    value: item.SuccessAmountPayin || 0,
  })).filter(item => item.value > 0);

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
        color: "#333",
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
        return `${params.seriesName}<br/>${params.name}: R$${params.value} (占比${params.percent}%)`;
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
        color: "#666",
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
          formatter: "{b}\n{d}%",
          color: "#333",
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

// 付款饼图
const getPaymentPieChart = (row) => {
  // 使用该行的items数据
  const data = (row.items || []).map((item) => ({
    name: item.typeName || "未知",
    value: item.SuccessAmountPayout || 0,
  })).filter(item => item.value > 0);

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
        color: "#333",
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
        return `${params.seriesName}<br/>${params.name}: R$${params.value} (占比${params.percent}%)`;
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
        color: "#666",
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
          formatter: "{b}\n{d}%",
          color: "#333",
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
const userStore = useUserStore();
const standardtime = computed(() => {
  return userStore.merchantInfo?.standardtime
    ? +userStore.merchantInfo.standardtime * 60 * 60 * 1000
    : 0;
});

// 禁用日期函数，只能选择到昨天
const disabledDate = (time) => {
  // 获取当前时间戳
  const timestamp = Date.now();
  const localDate = new Date(timestamp);
  const timezoneOffset = localDate.getTimezoneOffset();
  
  // 获取昨天的日期（考虑时区）
  const yesterday = new Date(timestamp - 3600 * 1000 * 24 + timezoneOffset * 60 * 1000 + standardtime.value);
  yesterday.setHours(0, 0, 0, 0);
  
  // 创建一个新的日期对象，只保留年月日，忽略时分秒
  const selectedDate = new Date(time.getFullYear(), time.getMonth(), time.getDate());
  // 创建昨天的日期对象，只保留年月日
  const yesterdayDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
  // 比较日期，禁用昨天之后的日期
  return selectedDate.getTime() > yesterdayDate.getTime();
};

// 将 shortcuts 也定义为 computed，确保响应式
const shortcuts = computed(() => [
  {
    text: "昨天",
    value: () => {
      const timestamp = Date.now();
      const localDate = new Date(timestamp);
      const timezoneOffset = localDate.getTimezoneOffset() * 60 * 1000;
      const standardTimeOffset = userStore.merchantInfo?.standardtime
        ? +userStore.merchantInfo.standardtime * 60 * 60 * 1000
        : 0;

      // 创建昨天的日期
      const yesterday = new Date(
        timestamp - 24 * 3600 * 1000 + timezoneOffset + standardTimeOffset,
      );

      // 设置开始时间（00:00:00.000）
      const start = new Date(
        yesterday.getFullYear(),
        yesterday.getMonth(),
        yesterday.getDate(),
      );
      start.setHours(0, 0, 0, 0);

      // 设置结束时间（00:00:00.000，左闭右闭）
      const end = new Date(
        yesterday.getFullYear(),
        yesterday.getMonth(),
        yesterday.getDate(),
      );
      end.setHours(0, 0, 0, 0);

      return [start, end];
    },
  },
  {
    text: "3天",
    value: () => {
      const timestamp = Date.now();
      const localDate = new Date(timestamp);
      const timezoneOffset = localDate.getTimezoneOffset() * 60 * 1000;
      const standardTimeOffset = userStore.merchantInfo?.standardtime
        ? +userStore.merchantInfo.standardtime * 60 * 60 * 1000
        : 0;

      // 2天前的开始时间（左闭右闭，3天 = 今天-2天 到 今天）
      const startDate = new Date(
        timestamp - 2 * 24 * 3600 * 1000 + timezoneOffset + standardTimeOffset,
      );
      const start = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
      );
      start.setHours(0, 0, 0, 0);

      // 当前日期的结束时间
      const endDate = new Date(timestamp + timezoneOffset + standardTimeOffset);
      const end = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate(),
      );
      end.setHours(0, 0, 0, 0);

      return [start, end];
    },
  },
  {
    text: "7天",
    value: () => {
      const timestamp = Date.now();
      const localDate = new Date(timestamp);
      const timezoneOffset = localDate.getTimezoneOffset() * 60 * 1000;
      const standardTimeOffset = userStore.merchantInfo?.standardtime
        ? +userStore.merchantInfo.standardtime * 60 * 60 * 1000
        : 0;

      // 6天前的开始时间（左闭右闭，7天 = 今天-6天 到 今天）
      const startDate = new Date(
        timestamp - 6 * 24 * 3600 * 1000 + timezoneOffset + standardTimeOffset,
      );
      const start = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
      );
      start.setHours(0, 0, 0, 0);

      // 当前日期的结束时间
      const endDate = new Date(timestamp + timezoneOffset + standardTimeOffset);
      const end = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate(),
      );
      end.setHours(0, 0, 0, 0);

      return [start, end];
    },
  },
]);

// 刷新方法
const clearSearch = () => {
  searchForm.time = [];
  searchForm.merchantOrderNo = "";
  searchForm.orderNo = "";
  pagination.currentPage = 1;
  handleSearch();
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
    
    const res = await http.statisticsByDayBoth({
      startDate,
      endDate,
    });
    
    if (res.code === 200) {
      const data = res.data?.list || [];
      if (Array.isArray(data) && data.length > 0) {
        data.forEach((item) => {
          item.OrderDate = item.OrderDate ? item.OrderDate.split('T')[0] : '';
          item.Totalamountreceived = (item.SuccessAmountPayin || 0) - (item.SuccessAmountPayout || 0);
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
const handleSizeChange = (val) => {
  pagination.pageSize = val;
  handleSearch(); // 重新搜索
};

const handleCurrentChange = (val) => {
  pagination.currentPage = val;
  handleSearch(); // 重新搜索
};

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
onMounted(async () => {
  const timestamp = Date.now();
  const localDate = new Date(timestamp);
  const timezoneOffset = localDate.getTimezoneOffset() * 60 * 1000;
  const standardTimeOffset = userStore.merchantInfo?.standardtime
    ? +userStore.merchantInfo.standardtime * 60 * 60 * 1000
    : 0;

  const startDate = new Date(
    timestamp - 6 * 24 * 3600 * 1000 + timezoneOffset + standardTimeOffset,
  );
  const start = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate(),
  );
  start.setHours(0, 0, 0, 0);

  const endDate = new Date(timestamp + timezoneOffset + standardTimeOffset);
  const end = new Date(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate(),
  );
  end.setHours(0, 0, 0, 0);

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  searchForm.time = [formatDate(start), formatDate(end)];
  
  // 等待数据加载完成后再初始化图表
  await handleSearch();
  
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

.page-container {
  background-color: #fff;
  border-radius: 24px;
  margin: $spacing-lg;
  min-height: 100%;
}

.page-header {
  padding: $spacing-lg;
  h1 {
    margin: 0;
    font-size: $font-size-xl;
    color: $text-color;
  }
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

  .search-form {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;

    ::deep(.el-form-item) {
      margin-bottom: $spacing-sm;
    }
  }
}

.table-container {
  margin-top: $spacing-lg;
}

.amount-income {
  color: #67c23a;
  font-weight: 500;
}

.amount-expense {
  color: #f56c6c;
  font-weight: 500;
}

.pagination-container {
  margin-top: $spacing-lg;
  display: flex;
  justify-content: center;
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
    }
  }
}

.resize-handle {
  height: 6px;
  background: linear-gradient(90deg, transparent, #e0e0e0 20%, #e0e0e0 80%, transparent);
  cursor: row-resize;
  margin-top: 4px;
  border-radius: 3px;
  transition: background 0.2s;
  
  &:hover {
    background: linear-gradient(90deg, transparent, #c0c0c0 20%, #c0c0c0 80%, transparent);
  }
}

/* 展开行图表样式 */
.expand-charts-container {
  display: flex;
  margin: $spacing-md 0;
  gap: $spacing-md;
  
  .expand-chart-item {
    flex: 1;
    background-color: #fafafa;
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
  background-color: #fff;
  border-radius: $border-radius-md;
  padding: $spacing-md;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: $spacing-lg;
}

/* 过渡效果 */
.fade {
  transition: opacity 0.3s ease;
}



// 表格样式
:deep(.el-table) {
  .el-table__header th {
    background-color: #fafafa;
    color: #606266;
    font-weight: 500;
  }

  .el-table__row {
    transition: background-color 0.3s;
  }
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
  .table-container {
    overflow-x: auto;
  }

  .search-container {
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

  .page-container {
    margin: $spacing-sm;
    border-radius: $border-radius-sm;
  }

  .page-header {
    padding: $spacing-md;
  }

  .page-content {
    padding: $spacing-md;
  }

  .content-wrapper {
    padding: 0 $spacing-md;
  }
  
  .chart-item {
    padding: $spacing-sm;
  }
  
  .chart-item .el-empty {
    padding: $spacing-md 0;
  }
}

/* 展开行表格样式 */
::v-deep(.expand-table) {
  background-color: #fafafa;
  
  & th {
    background-color: #f5f7fa !important;
    color: #606266;
    font-weight: 500;
  }
  
  & td {
    background-color: #fafafa;
    border-color: #ebeef5;
  }
  
  & .el-table__body tr:hover > td {
    background-color: #f0f2f5 !important;
  }
  
  & .el-table__footer-wrapper {
    background-color: #f5f7fa;
  }
}
</style>
