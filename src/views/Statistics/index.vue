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
        <!-- 标签页 -->
        <el-tabs 
          v-model="activeName" 
          type="card" 
          class="demo-tabs" 
          @tab-click="handleClick" 
          tab-position="top"
        > 
          <el-tab-pane label="订单统计" name="first">
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
                <div ref="chartContainer" style="width: 100%; height: 500px;"></div>
              </div>
            </div>
          </el-tab-pane> 
          <el-tab-pane label="余额趋势" name="second">
            <div class="config-content">
              <!-- 日期范围选择 -->
              <div class="date-range-container">
                <div class="date-range">
                   <el-date-picker
                v-model="searchForm.orderTime"
                type="daterange"
                :shortcuts="shortcuts"
                range-separator="To"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
              />
                  <el-button size="small" class="search-button" @click="getdataBoth">
                    <el-icon><Search /></el-icon>
                  </el-button>
                </div>
              </div>
              
              <!-- 图表区域 -->
              <div class="chart-container">
                <!-- 左侧图表：当日结束余额 -->
                <div class="chart-item">
                  <div class="chart-content">
                    <div ref="balanceChartRef" style="width: 100%; height: 100%;"></div>
                  </div>
                </div>
                <!-- 右侧图表：代收代付交易总额 -->
                <div class="chart-item">

                  <div class="chart-content">
                    <div ref="transactionChartRef" style="width: 100%; height: 100%;"></div>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane> 
        </el-tabs>
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

// 标签页相关数据
const activeName = ref('first');

// 处理标签页点击
const handleClick = (tab) => {
  if(tab.props.name=='first'){
    getdata();
  }else{
    getdataBoth();
  }
  console.log('标签页切换:', tab.props.name);
};

// 搜索表单
const searchForm = reactive({
  orderTime: []
});

// 日期选择器快捷选项
const shortcuts = [
  {
    text: '最近7天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
      return [start, end];
    }
  },
  {
    text: '最近30天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
      return [start, end];
    }
  }
];

// DailyReport相关数据
const selectedTime = ref('');
const timeRange = ref('5');

// 格式化当前时间
const formatCurrentTime = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
};


// 图表容器引用
const chartContainer = ref(null);
let chartInstance = null;

// 右侧标签页图表容器引用
const balanceChartRef = ref(null);
const transactionChartRef = ref(null);
let balanceChartInstance = null;
let transactionChartInstance = null;

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
  paymentSuccessRates: [],
  collectionAmounts: [],
  paymentAmounts: [],
  collectionCounts: [],
  paymentCounts: []
});

// 图表配置
const realTimeChart = computed(() => {
  const { dates, collectionSuccessRates, paymentSuccessRates, collectionAmounts, paymentAmounts, collectionCounts, paymentCounts } = chartData.value;

  // 如果没有数据，生成假数据用于展示
  // if (dates.length === 0) {
  //   const tempDates = [];
  //   const tempCollectionRates = [];
  //   const tempPaymentRates = [];
  //   const tempCollectionAmounts = [];
  //   const tempPaymentAmounts = [];
  //   const tempCollectionCounts = [];
  //   const tempPaymentCounts = [];

  //   for (let i = 23; i >= 0; i--) {
  //     const date = new Date();
  //     date.setHours(date.getHours() - i);
  //     tempDates.push(`${date.getHours()}:00`);
  //     tempCollectionRates.push(parseFloat((Math.random() * 14 + 85).toFixed(2)));
  //     tempPaymentRates.push(parseFloat((Math.random() * 18 + 80).toFixed(2)));
  //     tempCollectionAmounts.push(Math.floor(Math.random() * 40000) + 100000);
  //     tempPaymentAmounts.push(Math.floor(Math.random() * 32000) + 80000);
  //     tempCollectionCounts.push(Math.floor(Math.random() * 400) + 100);
  //     tempPaymentCounts.push(Math.floor(Math.random() * 320) + 80);
  //   }

  //   return {
  //     title: {
  //       text: "收款与付款成功率趋势",
  //       left: "center",
  //       top: 20,
  //       textStyle: {
  //         color: "#666",
  //         fontSize: 16,
  //       },
  //     },
  //     tooltip: {
  //       trigger: "axis",
  //       backgroundColor: "rgba(0,0,0,0.8)",
  //       borderColor: "#2d8ef6",
  //       textStyle: {
  //         color: "#fff",
  //       },
  //       formatter: function (params) {
  //         const index = params[0].dataIndex;
  //         let result = params[0].axisValue + "<br/>";
  //         const enabledSeries = new Set();
  //         let collectionMarker = "";
  //         let paymentMarker = "";
          
  //         params.forEach(function (item) {
  //           enabledSeries.add(item.seriesName);
  //           if (item.seriesName === "收款成功率") collectionMarker = item.marker;
  //           else if (item.seriesName === "付款成功率") paymentMarker = item.marker;
  //         });
          
  //         if (enabledSeries.has("收款成功率")) {
  //           result += collectionMarker + " 成功率: " + params.find(p => p.seriesName === "收款成功率").value + "%<br/>";
  //           result += collectionMarker + " 收款金额: R$ " + tempCollectionAmounts[index].toLocaleString() + "<br/>";
  //           result += collectionMarker + " 收款笔数: " + tempCollectionCounts[index] + "笔<br/>";
  //         }
  //         if (enabledSeries.has("付款成功率")) {
  //           result += paymentMarker + " 成功率: " + params.find(p => p.seriesName === "付款成功率").value + "%<br/>";
  //           result += paymentMarker + " 付款金额: R$ " + tempPaymentAmounts[index].toLocaleString() + "<br/>";
  //           result += paymentMarker + " 付款笔数: " + tempPaymentCounts[index] + "笔";
  //         }
  //         return result;
  //       },
  //     },
  //     legend: {
  //       data: ["收款成功率", "付款成功率"],
  //       bottom: "5%",
  //       textStyle: {
  //         color: "#666",
  //         fontSize: 13,
  //       },
  //     },
  //     grid: {
  //       top: "25%",
  //       left: "5%",
  //       right: "5%",
  //       bottom: "15%",
  //       containLabel: true,
  //     },
  //     xAxis: {
  //       type: "category",
  //       data: tempDates,
  //       boundaryGap: false,
  //       axisLine: { lineStyle: { color: "#d8d8d8" } },
  //       splitLine: { show: false },
  //       axisTick: { show: true, alignWithLabel: true, lineStyle: { color: "#d8d8d8" } },
  //       axisLabel: { textStyle: { color: "#666", align: "center" }, fontSize: 12, margin: 15 },
  //     },
  //     yAxis: {
  //       type: "value",
  //       name: "成功率 (%)",
  //       min: 70,
  //       max: 100,
  //       axisLine: { show: true, lineStyle: { color: "#d8d8d8" } },
  //       splitLine: { show: true, lineStyle: { color: "#f0f0f0", type: "dashed" } },
  //       axisLabel: { color: "#666", formatter: "{value}%", fontSize: 12 },
  //       axisTick: { show: false },
  //       nameTextStyle: { color: "#666", fontSize: 12, padding: [0, 30, 0, 0] },
  //     },
  //     series: [
  //       {
  //         name: "收款成功率",
  //         type: "line",
  //         data: tempCollectionRates,
  //         symbol: "circle",
  //         symbolSize: 6,
  //         smooth: true,
  //         showSymbol: true,
  //         lineStyle: { color: "#48bb78", width: 3 },
  //         itemStyle: { color: "#48bb78", borderColor: "#fff", borderWidth: 1 },
  //         areaStyle: {
  //           color: {
  //             type: "linear",
  //             x: 0, y: 0, x2: 0, y2: 1,
  //             colorStops: [
  //               { offset: 0, color: "rgba(72, 187, 120, 0.3)" },
  //               { offset: 1, color: "rgba(72, 187, 120, 0.05)" },
  //             ],
  //           },
  //         },
  //       },
  //       {
  //         name: "付款成功率",
  //         type: "line",
  //         data: tempPaymentRates,
  //         symbol: "circle",
  //         symbolSize: 6,
  //         smooth: true,
  //         showSymbol: true,
  //         lineStyle: { color: "#db0011", width: 3 },
  //         itemStyle: { color: "#db0011", borderColor: "#fff", borderWidth: 1 },
  //         areaStyle: {
  //           color: {
  //             type: "linear",
  //             x: 0, y: 0, x2: 0, y2: 1,
  //             colorStops: [
  //               { offset: 0, color: "rgba(219, 0, 17, 0.3)" },
  //               { offset: 1, color: "rgba(219, 0, 17, 0.05)" },
  //             ],
  //           },
  //         },
  //       },
  //     ],
  //   };
  // }

  // 使用真实数据
  return {
    title: {
      text: "收款与付款成功率趋势",
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
        const index = params[0].dataIndex;
        let result = params[0].axisValue + "<br/>";
        const enabledSeries = new Set();
        let collectionMarker = "";
        let paymentMarker = "";
        
        params.forEach(function (item) {
          enabledSeries.add(item.seriesName);
          if (item.seriesName === "收款成功率") collectionMarker = item.marker;
          else if (item.seriesName === "付款成功率") paymentMarker = item.marker;
        });
        
        if (enabledSeries.has("收款成功率")) {
          result += collectionMarker + " 成功率: " + collectionSuccessRates[index] + "%<br/>";
          result += collectionMarker + " 收款金额: R$ " + collectionAmounts[index].toLocaleString() + "<br/>";
          result += collectionMarker + " 收款笔数: " + collectionCounts[index] + "笔<br/>";
        }
        if (enabledSeries.has("付款成功率")) {
          result += paymentMarker + " 成功率: " + paymentSuccessRates[index] + "%<br/>";
          result += paymentMarker + " 付款金额: R$ " + paymentAmounts[index].toLocaleString() + "<br/>";
          result += paymentMarker + " 付款笔数: " + paymentCounts[index] + "笔";
        }
        return result;
      },
    },
    legend: {
      data: ["收款成功率", "付款成功率"],
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
      {
        name: "付款成功率",
        type: "line",
        data: paymentSuccessRates,
        symbol: "circle",
        symbolSize: 6,
        smooth: true,
        showSymbol: true,
        lineStyle: { color: "#db0011", width: 3 },
        itemStyle: { color: "#db0011", borderColor: "#fff", borderWidth: 1 },
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

// 初始化余额图表-期初余额
const initBalanceChart = (chartData = null) => {
  if (balanceChartRef.value) {
    // 检查容器尺寸
    const checkSize = () => {
      if (!balanceChartRef.value) return;
      const clientWidth = balanceChartRef.value.clientWidth;
      const clientHeight = balanceChartRef.value.clientHeight;
      
      if (clientWidth > 0 && clientHeight > 0) {
        // 先销毁可能存在的旧实例
        if (balanceChartInstance) {
          balanceChartInstance.dispose();
        }
        // 创建新实例
        balanceChartInstance = echarts.init(balanceChartRef.value);
        
                const dates = chartData?.dates || [];
        const PreviousDayEndBalance = chartData?.PreviousDayEndBalance || [];
        // 图表配置
        const option = {
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
        
        // 设置图表选项
        balanceChartInstance.setOption(option);
        
        // 监听窗口大小变化
        window.addEventListener('resize', handleBalanceChartResize);
      } else {
        // 等待下一帧再检查
        requestAnimationFrame(checkSize);
      }
    };
    
    // 开始检查尺寸
    checkSize();
  }
};

// 余额图表自适应
const handleBalanceChartResize = () => {
  balanceChartInstance?.resize();
};

// 初始化交易总额图表
const initTransactionChart = (chartData = null) => {
  if (transactionChartRef.value) {
    // 检查容器尺寸
    const checkSize = () => {
      if (!transactionChartRef.value) return;
      const clientWidth = transactionChartRef.value.clientWidth;
      const clientHeight = transactionChartRef.value.clientHeight;
      
      if (clientWidth > 0 && clientHeight > 0) {
        // 先销毁可能存在的旧实例
        if (transactionChartInstance) {
          transactionChartInstance.dispose();
        }
        // 创建新实例
        transactionChartInstance = echarts.init(transactionChartRef.value);
        
        // 使用真实数据或默认模拟数据
        const dates = chartData?.dates || [];
        const payinData = chartData?.payinData || [];
        const payoutData = chartData?.payoutData || [];
        
        // 图表配置
        const option = {
          title: {
            text: '当日代收总额，代付总额',
            left: '0%',
            top: '0%',
            textStyle: {
              fontSize: 14,
              color: '#666'
            }
          },
          tooltip: {
            trigger: 'axis',
            formatter: function(params) {
              let result = `${params[0].axisValue}<br/>`;
              params.forEach(item => {
                result += `${item.marker} ${item.seriesName}: R$ ${item.value.toLocaleString()}<br/>`;
              });
              return result;
            }
          },
          legend: {
            data: ['代收总额', '代付总额'],
            top: '10%',
            left: '0%',
            textStyle: {
              fontSize: 12,
              color: '#666'
            },
            icon: 'circle',
            itemWidth: 6,
            itemHeight: 6
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '10%',
            top: '25%',
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
            type: 'value',
            axisLabel: {
              fontSize: 10,
              color: '#999',
              formatter: function(value) {
                return 'R$ ' + value.toLocaleString();
              }
            },
            axisLine: {
              show: true,
              lineStyle: {
                color: '#d8d8d8'
              }
            },
            splitLine: {
              lineStyle: {
                color: '#f0f0f0'
              }
            }
          },
          series: [
            {
              name: '代收总额',
              type: 'line',
              data: payinData,
              itemStyle: {
                color: '#db0011'
              },
              lineStyle: {
                width: 2
              },
              symbol: 'circle',
              symbolSize: 4
            },
            {
              name: '代付总额',
              type: 'line',
              data: payoutData,
              itemStyle: {
                color: '#f59e0b'
              },
              lineStyle: {
                width: 2
              },
              symbol: 'circle',
              symbolSize: 4
            }
          ]
        };
        
        // 设置图表选项
        transactionChartInstance.setOption(option);
        
        // 监听窗口大小变化
        window.addEventListener('resize', handleTransactionChartResize);
      } else {
        // 等待下一帧再检查
        requestAnimationFrame(checkSize);
      }
    };
    
    // 开始检查尺寸
    checkSize();
  }
};

// 交易总额图表自适应
const handleTransactionChartResize = () => {
  transactionChartInstance?.resize();
};

// 销毁右侧标签页图表
const destroyRightCharts = () => {
  window.removeEventListener('resize', handleBalanceChartResize);
  window.removeEventListener('resize', handleTransactionChartResize);
  
  if (balanceChartInstance) {
    balanceChartInstance.dispose();
    balanceChartInstance = null;
  }
  
  if (transactionChartInstance) {
    transactionChartInstance.dispose();
    transactionChartInstance = null;
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
  // 结束时间提前两分钟
  const adjustedEndDate = new Date(endDate.getTime() - 2 * 60 * 1000);
  endTime = formatTime(adjustedEndDate);
  // 开始时间基于提前后的结束时间计算
  startTime = formatTime(new Date(adjustedEndDate.getTime() - parseInt(timeRange.value) * 60 * 1000));
  console.log("endTime", endTime);
  console.log("startTime", startTime);
} else {
  const now = new Date();
  // 结束时间提前两分钟
  const adjustedNow = new Date(now.getTime() - 2 * 60 * 1000);
  endTime = formatTime(adjustedNow);
  // 开始时间基于提前后的结束时间计算
  startTime = formatTime(new Date(adjustedNow.getTime() - parseInt(timeRange.value) * 60 * 1000));
}

    const [payRes, collectRes] = await Promise.all([
      http.paySuccessRatio({ startTime, endTime }),
      http.collectSuccessRatio({ startTime, endTime })
    ]);

    console.log("代付成功率数据", payRes);
    console.log("代收成功率数据", collectRes);

    const payList = payRes.data?.list || [];
    const collectList = collectRes.data?.list || [];
     // 累加创建订单和成功订单
      projectData.value.orderCount = parseInt(collectRes.data?.totalOrderCount || '0');
      projectData.value.successCount = parseInt(collectRes.data?.totalSuccessCount || '0');
      projectData.value.successRate = parseFloat(collectRes.data?.totalSuccessRate.replace('%', '') || '0');
    const mergedData = {};
    
    payList.forEach(item => {
      mergedData[item.time] = {
        payOrderCount: item.orderCount || 0,
        paySuccessCount: item.successCount || 0,
        paySuccessRate: parseFloat(item.successRate?.replace('%', '') || '0'),
        payTotalAmount: parseFloat(item.totalAmount || '0'),
        paySuccessAmount: parseFloat(item.successAmount || '0'),
        collectOrderCount: 0,
        collectSuccessCount: 0,
        collectSuccessRate: 0,
        collectTotalAmount: 0,
        collectSuccessAmount: 0
      };
    });

    collectList.forEach(item => {
      if (!mergedData[item.time]) {
        mergedData[item.time] = {
          payOrderCount: 0,
          paySuccessCount: 0,
          paySuccessRate: 0,
          payTotalAmount: 0,
          paySuccessAmount: 0,
          collectOrderCount: 0,
          collectSuccessCount: 0,
          collectSuccessRate: 0,
          collectTotalAmount: 0,
          collectSuccessAmount: 0
        };
      }
 

      mergedData[item.time].collectOrderCount = item.orderCount || 0;
      mergedData[item.time].collectSuccessCount = item.successCount || 0;
      mergedData[item.time].collectSuccessRate = parseFloat(item.successRate?.replace('%', '') || '0');
      mergedData[item.time].collectTotalAmount = parseFloat(item.totalAmount || '0');
      mergedData[item.time].collectSuccessAmount = parseFloat(item.successAmount || '0');
    });


    const sortedTimes = Object.keys(mergedData).sort();
    
    chartData.value = {
      dates: sortedTimes,
      collectionSuccessRates: sortedTimes.map(t => mergedData[t].collectSuccessRate),
      paymentSuccessRates: sortedTimes.map(t => mergedData[t].paySuccessRate),
      collectionAmounts: sortedTimes.map(t => mergedData[t].collectTotalAmount),
      paymentAmounts: sortedTimes.map(t => mergedData[t].payTotalAmount),
      collectionCounts: sortedTimes.map(t => mergedData[t].collectOrderCount),
      paymentCounts: sortedTimes.map(t => mergedData[t].payOrderCount)
    };

    if (chartInstance) {
      chartInstance.setOption(realTimeChart.value, true);
    }

  } catch (error) {
    ElMessage.error(  error.msg || "获取数据失败");
    console.error(error);
  }
};
const getdataBoth = async () => {
  try {
    let startDate, endDate;
    
    const formatDateToString = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    if (searchForm.orderTime && searchForm.orderTime.length === 2) {
      startDate = searchForm.orderTime[0];
      endDate = searchForm.orderTime[1];
    } else {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
      startDate = formatDateToString(start);
      endDate = formatDateToString(end);
    }
    
    let res = await http.statisticsByDayBoth({
      startDate: startDate,
      endDate: endDate,
    });
    console.log("按天统计代收代付汇总数据", res.data.list);
    
    const data = res.data?.list || [];
    if (Array.isArray(data) && data.length > 0) {
      const chartData = {
        dates: data.map(item => {
          const dateStr = item.OrderDate;
          if (dateStr && dateStr.includes('T')) {
            return dateStr.split('T')[0];
          }
          const date = new Date(dateStr);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        }),
        payinData: data.map(item => item.TotalAmountPayin || 0),
        payoutData: data.map(item => item.TotalAmountPayout || 0),
        PreviousDayEndBalance: data.map(item => item.PreviousDayEndBalance || 0)
      };
      
      initTransactionChart(chartData);
      initBalanceChart(chartData);
    }
  } catch (error) {
    ElMessage.error("获取数据失败");
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
  selectedTime.value = formatCurrentTime();
  getdata();
  // 组件挂载后初始化图表
  initChart();
  
  // 初始化右侧标签页图表
  setTimeout(() => {
    initBalanceChart();
    initTransactionChart();
  }, 100);
});

onBeforeUnmount(() => {
  // 组件卸载前销毁图表
  destroyChart();
  destroyRightCharts();
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



// 配置页面内容样式
.config-content {
  padding: $spacing-lg;
  background-color: #f8f9fa;
  border-radius: $border-radius-md;
  min-height: 500px;
  
  h3 {
    margin: 0 0 $spacing-md 0;
    color: $text-color;
  }
  
  p {
    color: #666;
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
// 标签页样式
.demo-tabs { 
  :deep(.el-tabs__header) {
    margin-bottom: $spacing-lg;
  }
  
  :deep(.el-tabs__content) {
    min-height: 600px;
  }
}
:deep(.el-tabs__nav) {
  width: 100%;
}
:deep(.el-tabs__item) {
  width: 50%;
}
:deep(.el-tabs--card>.el-tabs__header .el-tabs__nav){
  border-radius: 15px 15px 0 0;
}

// 配置页面内容样式
.config-content {
  padding: $spacing-lg;
  background-color: #f8f9fa;
  border-radius: $border-radius-md;
  min-height: 500px;
}

// 日期范围选择器样式
.date-range-container {
  margin-bottom: $spacing-lg;
  
  .date-range {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    justify-content: flex-end;
    
    span {
      font-size: 14px;
      color: #666;
    }
    
    .date-button,
    .search-button {
      border-radius: 4px;
    }
  }
}

// 图表容器样式
.chart-container {
  display: flex;
  gap: $spacing-lg;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
  
  .chart-item {
    flex: 1;
    background-color: #fff;
    border-radius: $border-radius-md;
    padding: $spacing-md;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    
    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: $spacing-md;
      
      h3 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #333;
        background-color: #f8f9fa;
        padding: 4px 12px;
        border-radius: 12px;
        display: inline-block;
      }
      
      .search-button {
        border-radius: 4px;
      }
    }
    
    .chart-content {
      height: 300px;
      
      .chart-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        position: relative;
        padding: 20px;
        
        .chart-title {
          font-size: 14px;
          color: #666;
          margin-bottom: $spacing-sm;
          text-align: center;
        }
        
        .chart-data {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin-bottom: $spacing-md;
        }
        
        .chart-bars {
          display: flex;
          align-items: flex-end;
          gap: 10px;
          height: 150px;
          width: 100%;
          margin-bottom: $spacing-sm;
          
          .chart-bar {
            flex: 1;
            border-radius: 4px 4px 0 0;
            transition: height 0.3s ease;
          }
        }
        
        .chart-labels {
          display: flex;
          justify-content: space-between;
          width: 100%;
          font-size: 12px;
          color: #999;
          
          span {
            flex: 1;
            text-align: center;
          }
        }
        
        .chart-legend {
          display: flex;
          gap: 10px;
          margin-top: $spacing-md;
          font-size: 12px;
          color: #666;
          
          .legend-item {
            display: flex;
            align-items: center;
            gap: 5px;
            
            .legend-color {
              width: 12px;
              height: 12px;
              border-radius: 2px;
            }
          }
        }
      }
      
      .balance-chart {
        background: linear-gradient(to bottom, rgba(72, 187, 120, 0.1), rgba(72, 187, 120, 0.3));
        border-radius: $border-radius-sm;
        
        .chart-title {
          color: #48bb78;
        }
      }
      
      .transaction-chart {
        background: linear-gradient(to bottom, rgba(219, 0, 17, 0.1), rgba(219, 0, 17, 0.3));
        border-radius: $border-radius-sm;
        
        .chart-title {
          color: #db0011;
        }
      }
    }
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
