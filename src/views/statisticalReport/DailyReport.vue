<template>


    <div class="table-layout">
      <el-card shadow="never" >
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
  <el-button circle icon="el-icon-refresh" style="margin-right: 20px;" @click.stop="refreshData"></el-button>
                   </el-tooltip>
  </div>
</div>
        <!-- 动画金额图 -->
        <div style="flex-shrink: 0;">
          <ProjectBox :showAll="true" />
        </div>
        <!-- 图表 -->
        <div class="chart-wrapper">
          <v-charts
            :option="realTimeChart"
            style="width: 100%; height: 100%"
            autoresize
          ></v-charts>
        </div>
        
      </el-card>
    </div>
  
</template>

<script>
import crud from "@/mixins/crud";
import { http } from "@/api";
import VueJsonExcel from "vue-json-excel";
import TimeRangeSelector from "@/components/TimeRangeSelector.vue"; // 引入组件
import ProjectBox from "./component/project";
export default {
  name: "index",
  mixins: [crud],
  components: {
    VueJsonExcel,
    TimeRangeSelector,
    ProjectBox,
  },
  data() {
    return {

     selectedTime: new Date().toISOString().slice(0, 19).replace('T', ' '), // 默认为当前时间
    timeRange: 'last60min', // 默认值
    pickerOptions: {
      disabledDate(time) {
        const now = new Date();
        const maxDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000); // 15天前
        return time.getTime() < maxDate.getTime(); // 禁止选择15天前的日期
      },
    },
      request: {
        page: http.financeReport,
      },
      columns: [
        { prop: "CollectionSuccessOrderCount", label: "期初余额" },
        { prop: "CollectionSuccessOrderAmount", label: "当然收款总额" },
        { prop: "CollectionTotalOrderCount", label: "当日付款总额" },
        { prop: "CollectionTotalOrderAmount", label: "收款总金额" },
        { prop: "PaymentTotalCount", label: "期末余额" },
      ],
      tableData: [],
      data: [],
      exportExcel: false,
      timeRangeOptions: [
        { label: "昨天", value: "yesterday" },
        { label: "今天", value: "today" },
        { label: "7天", value: "7days" },
      ],
    };
  },
  computed: {
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
          if (key === "date") {
            continue;
          }
          if (total[key]) {
            total[key] += item[key];
          } else {
            total[key] = item[key];
          }
        }
      });
      total.date = "合计";
      console.log(this.tableData.concat(total));
      return this.tableData.concat(total);
    },

    realTimeChart() {
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
    },


  },
  mounted() {
    this.getdata();
  },
  methods: {
    async getdata() { 
      let res = await http.financeReportByDay({
startDate: this.selectedTime,
endDate: this.selectedTime,
      });
      console.log("每日数据",res);
      
    },
  onTimeRangeChange(data) {
      // 更新搜索参数中的时间范围
      this.searchParams.billTime = data.timeRange;
      // 执行搜索
      this.onSearch();
    },
    formatParams(params) {
      console.log("111//////", params);

      let startTime = "";
      let endTime = "";
      if (params.billTime && params.billTime.length) {
        startTime = params.billTime[0];
        endTime = params.billTime[1];
      }
      return {
        ...params,
        billStartTime: startTime,
        billEndTime: endTime,
        billTime: undefined,
        type: params.type || "",
        orderNo: params.orderNo || "",
        merchantOrderNo: params.merchantOrderNo || "",
      };
    },
    onExport() {
      // 前端导出表格
      this.$refs.table.exportCsv({
        filename: "统计报表",
      });
    },
    toPercent(num) {
      if (!num) return "0.00%";
      if (num > 1) {
        return num.toFixed(2) + "%";
      }
      return (num * 100).toFixed(2) + "%";
    },
  },
};
</script>

<style scoped lang="scss">
.table-layout {
  width: 100%;
  height: calc(100vh - 84px);
  margin: 0;
  padding: 0;

  ::v-deep .el-card {
    width: 100%;
    height: 95%;


    .el-card__body {
      width: 100%;
      height: 100%;
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
  }
}
</style>
