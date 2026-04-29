<template>
  <div>
<el-form ref="form" :model="form" label-width="80px" :inline="true">
  <el-form-item label="日期">
         <el-date-picker
            v-model="form.billTime"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            type="daterange"
            :value-format="'yyyy-MM-dd'"
            :style="{ width: '360px' }"
            :picker-options="pickerOptions"
        ></el-date-picker>
  </el-form-item>
  <el-form-item>
      <el-button type="primary" @click="onSearch" icon="el-icon-search">搜索</el-button>
        <el-button @click="onReset" icon="el-icon-refresh">刷新</el-button>
  </el-form-item>
</el-form>
    <div class="table-layout">
      <el-card shadow="never">
        <div class="table-handle" v-if="exportExcel">
          <vue-json-excel
            :data="tableData2"
            :fields="excelFields"
            name="统计报表.xls"
            type="xls"
          >
            <el-button type="primary" size="mini" icon="el-icon-refresh"
              >导出</el-button
            >
          </vue-json-excel>
        </div>
        <!-- 图表 -->
        <div style="display: flex" v-if="show">
          <v-charts
            :option="realTimeChart"
            style="width: 60%; height: 450px"
            autoresize
          ></v-charts>
          <v-charts
            :option="pieChartOption"
            style="width: 40%; height: 400px"
            autoresize
          ></v-charts>
        </div>
        <div class="table-box">
          <!-- 时间选择器 -->
          <TimeRangeSelector
            :defaultValue="'yesterday'"
            :format="'yyyy-MM-dd'"
            :timeRangeOptions="timeRangeOptions"
            @change="onTimeRangeChange"
          />
          <el-table
            border
            ref="table"
            max-height="800"
            v-loading="loading"
            :data="tableData"
            element-loading-spinner="el-icon-loading"
            element-loading-background="rgba(255, 255, 255, 0.8)"
            @selection-change="onSelect"
            @expand-change="onExpandChange"
          >
            <el-table-column type="expand" >
              <template slot-scope="scope">
         
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
                      label="收款成功率"
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
                  </el-table>
                </div>
                       <div style="display: flex; margin-bottom: 20px">
                  <div style="flex: 1">
                    <v-charts
                      :option="getCollectionPieChart(scope.row)"
                      style="width: 100%; height: 200px"
                      autoresize
                    ></v-charts>
                  </div>
                  <div style="flex: 1">
                    <v-charts
                      :option="getPaymentPieChart(scope.row)"
                      style="width: 100%; height: 200px"
                      autoresize
                    ></v-charts>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="OrderDate" label="日期"></el-table-column>
            <el-table-column
              align="center"
              v-for="item in columns"
              :key="item.prop"
              :prop="item.prop"
              :label="item.label"
            >
              <template slot-scope="scope">
                <span>{{ scope.row[item.prop] }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div class="page-box">
          <el-pagination
            background
            :current-page="pageNo"
            :page-sizes="pageSizes"
            :page-size="pageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="totalSize"
            @size-change="changePageSize"
            @current-change="changePageNo"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>
<script>
import crud from "@/mixins/crud";
import { http } from "@/api";
import VueJsonExcel from "vue-json-excel";
import TimeRangeSelector from "@/components/TimeRangeSelector.vue"; // 引入组件
import Store from "../../../store";

export default {
  name: "index",
  mixins: [crud],
  components: {
    VueJsonExcel,
    TimeRangeSelector,
  },
  data() {
    return {
      show: true,
      form: {
billTime: [],
      },

      columns: [
        { prop: "PreviousDayEndBalance", label: "期初余额" },
        { prop: "SuccessAmountPayin", label: "当日收款总额" },
        { prop: "SuccessAmountPayout", label: "当日付款总额" },
        { prop: "Totalamountreceived", label: "收款总金额" },
        { prop: "CurrentDayEndBalance", label: "期末余额" },
  
      ],
     

      tableData: [],
      data: [],
      exportExcel: false,
      loading: false,
      timeRangeOptions: [
        { label: "昨天", value: "yesterday" },
        { label: "3天", value: "3days" },
        { label: "7天", value: "7days" },
      ],
    };
  },
  computed: {
    standardtime() {
      return +Store.state.user.merchantInfo.standardtime * 60 * 60 * 1000 || 0;
    },
    pickerOptions() {
      const _this = this;
      return {
        shortcuts: [
          {
            text: "昨天",
            onClick(picker) {  
              const timestamp = Date.now();
              const localDate = new Date(timestamp);
              const timezoneOffset = localDate.getTimezoneOffset();
              const utcDate = new Date(timestamp - 3600 * 1000 * 24 + timezoneOffset * 60 * 1000 + _this.standardtime);
              const start = new Date(utcDate.setHours(0, 0, 0, 0));
              const end = new Date(utcDate.setHours(23, 59, 59, 999));
              picker.$emit("pick", [start, end]);
            },
          },
          {
            text: "今天",
            onClick(picker) {
              const timestamp = Date.now();
              const localDate = new Date(timestamp);
              const timezoneOffset = localDate.getTimezoneOffset();
              const utcDate = new Date(timestamp + timezoneOffset * 60 * 1000 + _this.standardtime);
              const start = new Date(utcDate.setHours(0, 0, 0, 0));
              const end = new Date(utcDate.setHours(23, 59, 59, 999));
              picker.$emit("pick", [start, end]);
            },
          },
          {
            text: "近7天",
            onClick(picker) {
              const timestamp = Date.now();
              const localDate = new Date(timestamp);
              const timezoneOffset = localDate.getTimezoneOffset();
              const utcDateStart = new Date(timestamp - 3600 * 1000 * 24*7 + timezoneOffset * 60 * 1000 + _this.standardtime);
              const utcDateEnd = new Date(timestamp  + timezoneOffset * 60 * 1000 + _this.standardtime);
              const start = new Date(utcDateStart.setHours(0, 0, 0, 0));
              const end = new Date(utcDateEnd.setHours(23, 59, 59, 999));
              picker.$emit("pick", [start, end]);
            },
          },
        ],
      };
    },
    //     standardtime() {
    //   return +Store.state.user.merchantInfo.standardtime * 60 * 60 * 1000 || 0;
    // },

    excelFields() {
      let map = {
        日期: "OrderDate",
      };
      this.columns.forEach((item) => {
        map[item.label] = item.prop;
      });
      return map;
    },
    tableData2() {
      let total = {};
      this.tableData.forEach((item) => {
        for (let key in item) {
          if (key === "OrderDate") {
            continue;
          }
          if (total[key]) {
            total[key] += item[key];
          } else {
            total[key] = item[key];
          }
        }
      });
      total.OrderDate = "合计";
      return this.tableData.concat(total);
    },
    realTimeChart() {
      // 生成假数据用于展示收款金额和付款金额
      const dates = [];
      const collectionAmounts = [];
      const paymentAmounts = [];

      this.tableData.forEach((item) => {
        dates.push(item.OrderDate.split('T')[0]);
        collectionAmounts.push(item.SuccessAmountPayin);
        paymentAmounts.push(item.SuccessAmountPayout);
      });

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
                ": R$" +
                item.value +
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
    },
    pieChartOption() {
      // 计算收付款总金额
      let totalCollection = 0;
      let totalPayment = 0;

      this.tableData.forEach((item) => {
        totalCollection += item.SuccessAmountPayin || 0;
        totalPayment += item.SuccessAmountPayout || 0;
      });

      return {
        title: {
          text: "收付款金额占比",
          left: "center",
          top: 20,
          textStyle: {
            color: "#666",
            fontSize: 16,
          },
        },
        tooltip: {
          trigger: "item",
          backgroundColor: "rgba(0,0,0,0.8)",
          borderColor: "#2d8ef6",
          textStyle: {
            color: "#fff",
          },
          formatter: "{a} <br/>{b}: R${c} ({d}%)",
        },
        legend: {
          orient: "vertical",
          left: "right",
          textStyle: {
            color: "#666",
            fontSize: 13,
          },
        },
        series: [
          {
            name: "金额占比",
            type: "pie",
            radius: ["40%", "60%"], // 环形图，如果要圆形图则设置为 '50%'
            center: ["50%", "60%"],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 5,
              borderColor: "#fff",
              borderWidth: 2,
            },
            label: {
              show: true,
              formatter: "{b}: R${c} ({d}%)",
              fontSize: 12,
            },
            emphasis: {
              label: {
                show: true,
                fontSize: "14",
                fontWeight: "bold",
              },
            },
            labelLine: {
              show: true,
              length: 15,
              length2: 10,
            },
            data: [
              {
                value: totalCollection,
                name: "收款金额",
                itemStyle: { color: "#48bb78" },
              },
              {
                value: totalPayment,
                name: "付款金额",
                itemStyle: { color: "#db0011" },
              },
            ],
          },
        ],
      };
    },

  },
  mounted(){
    // 获取昨天的日期范围
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // 计算昨天的开始时间和结束时间
    const start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0);
    const end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
    
    // 安全地设置时间范围
    this.form.billTime = [
      this.formatDate(start, 'yyyy-MM-dd'),
      this.formatDate(end, 'yyyy-MM-dd')
    ];
    
    console.log('昨天的日期范围:', this.form.billTime);
    this.onSearch();
  },
  methods: {
        formatDate(date, format) {
      const pad = (num) => String(num).padStart(2, "0");
      const year = date.getFullYear();
      const month = pad(date.getMonth() + 1);
      const day = pad(date.getDate());
      const hours = pad(date.getHours());
      const minutes = pad(date.getMinutes());
      const seconds = pad(date.getSeconds());
      return format
        .replace("yyyy", year)
        .replace("MM", month)
        .replace("dd", day)
        .replace("HH", hours)
        .replace("mm", minutes)
        .replace("ss", seconds);
    },
    getCollectionPieChart(row) {
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
            if (typeof color === 'object' && color.colorStops) {
              color = color.colorStops[0].color;
            }
            return `${params.seriesName}<br/><span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${color};"></span>${params.name}: R$${params.value} (占比${params.percent}%)`;
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
    },

    getPaymentPieChart(row) {
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
            if (typeof color === 'object' && color.colorStops) {
              color = color.colorStops[0].color;
            }
            return `${params.seriesName}<br/><span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${color};"></span>${params.name}: R$${params.value} (占比${params.percent}%)`;
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
    },

    getSummaries(param) {
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
                return prev + curr;
              } else {
                return prev;
              }
            }, 0);
            sums[index] ;
          } else {
            sums[index] = 'N/A';
          }
        });

        return sums;
      },
    onExpandChange(row, expandedRows) {
      // 当有行展开时隐藏图表，没有展开行时显示图表
      this.show = expandedRows.length === 0;

      // 只在展开时添加数据（expandedRows包含当前展开的行）
      if (row && row.items && expandedRows.includes(row)) {
        // 检查是否已经添加过额外数据（避免重复添加）
        const hasExtraData = row.items.some(item =>
          item.typeName === '手续费' || item.typeName === '违规订单'
        );

        if (!hasExtraData) {
          // 使用map创建新数组并转换SuccessRatePayin为百分比
          row.items = row.items.map(item => ({
            ...item,
            SuccessRatePayin: this.toPercent(item.SuccessRatePayin)
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

          // 将额外数据添加到row.items
          row.items.push(...extraItems);
        }

        // 为每个行维护独立的图表数据，使用行的唯一标识作为key
        if (!row.chartData) {
          row.chartData = [...row.items];
        }
      }
    },
 
    onTimeRangeChange(data) {
      // 更新搜索参数中的时间范围
      this.form.billTime = data.timeRange;
      // 执行搜索
      this.onSearch();
    },
   async onSearch() {
      // 发起搜索请求
      if (!this.form.billTime || this.form.billTime.length !== 2) {
        this.$message.warning('请选择日期范围');
        return;
      }

      this.loading = true;
      try {
        let res = await http.financeReportByDay({
          startDate: this.form.billTime[0],
          endDate: this.form.billTime[1],
        });
        if (res.code === 200) {
          if (res.data.list && res.data.list.length > 0) {
            res.data.list.forEach((item) => {
              item.OrderDate = item.OrderDate ? item.OrderDate.split('T')[0] : '';
              item.Totalamountreceived = (item.SuccessAmountPayin || 0) - (item.SuccessAmountPayout || 0);
            });
            this.tableData = res.data.list;
          } else {
            this.tableData = [];
            this.$message.info('暂无数据');
          }
        } else {
          this.$message.error(res.message || '查询失败');
        }
      } catch (error) {
        console.error('查询失败:', error);
        this.$message.error('查询失败，请稍后重试');
        this.tableData = [];
      } finally {
        this.loading = false;
      }
    },

    onReset() {
      // 重置表单并重新查询
        const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // 计算昨天的开始时间和结束时间
    const start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0);
    const end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
    
    // 安全地设置时间范围
    this.form.billTime = [
      this.formatDate(start, 'yyyy-MM-dd'),
      this.formatDate(end, 'yyyy-MM-dd')
    ];
      this.tableData = [];
      this.data = [];
      this.show = true;
      this.$message.success('已刷新');
    },
   
   
    onExport() {
      // 前端导出表格
      this.$refs.table.exportCsv({
        filename: "统计报表",
      });
    },
    toPercent(num) {
      if (!num || num==0) return "0.00%";
      if (num > 1) {
        return num.toFixed(2) + "%";
      }
      return (num * 100).toFixed(2) + "%";
    },
  },
};
</script>

<style scoped lang="scss">
  // /* 隐藏 gutter 列 */
::v-deep(col[name="gutter"]) {
  display: none !important;
  width: 0 !important;
}

/* 隐藏 gutter th */
::v-deep(th.gutter) {
  display: none !important;
  width: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
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
