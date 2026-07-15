<template>
  <el-row :gutter="20" class="project-container">
    <el-col
      :xs="24"
      :sm="8"
      :md="8"
      :lg="8"
      :xl="8"
      v-for="(item, index) in projectList"
      :key="item.name"
    >
      <el-card :class="['project-card', 'project-card' + index]" shadow="hover">
        <div class="project-card-header">
          <div class="project-name">{{ item.name }}</div>
          <div class="project-icon" :class="['icon' + index]">
             <!-- 添加图标 --->
            <el-icon v-if="index === 0"><Coin /></el-icon>
            <el-icon v-if="index === 1"><Plus /></el-icon>
            <el-icon v-if="index === 2"><Minus /></el-icon>
          </div>
        </div>
        <div class="project-amount">
          <div class="amount-content">
            <!-- <span class="currency">{{ item.currency }} </span> -->
            <span class="amount-value">
              <template v-if="props.showData">
                <el-statistic 
                  :prefix="currencySymbol + ' '"
                  :value="animatedValues[index].value" 
                  :precision="currencyConfig.decimals"
                  :decimal-separator="currencyConfig.decimalSeparator"
                  :group-separator="currencyConfig.thousandsSeparator"
                />
              </template>
              <template v-else>
                {{  formatValue(animatedValues[index].value) }}
              </template>
            </span>
          </div>
        </div>
        <div class="project-stats">
          <div class="stat-item">
            <div class="stat-label">{{ item.desc }}</div>
            <div class="stat-value">
              <template v-if="props.showData">
                {{ item.count }}
              </template>
              <template v-else>
                {{ formatValue(item.count) }}
              </template>
            </div>
          </div>
        </div>
      </el-card>
    </el-col>
  </el-row>
</template>

<script setup>
import { ref, onMounted, reactive, computed, nextTick, watch } from 'vue';
import { TransitionPresets, useTransition } from '@vueuse/core';
import { http } from "@/api";
import useUserStore from "@/stores/user";
import { Plus, Coin, Minus, CreditCard } from "@element-plus/icons-vue";
import { getCurrencySymbol, getCurrencyConfig } from "@/utils/currency";

// 接收父组件传递的showData属性
const props = defineProps({
  showData: {
    type: Boolean,
    default: true
  }
});

// 初始化store
const userStore = useUserStore();

const currencySymbol = computed(() => getCurrencySymbol(userStore.merchantInfo?.currency));
const currencyConfig = computed(() => getCurrencyConfig(userStore.merchantInfo?.currency));

// 响应式项目列表
const projectList = reactive([
  {
    name: "期初金额",
    amount: 0,
    desc: "当日初始余额",
    count: ''
  },
  {
    name: "收款",
    amount: 0,
    desc: "成功收款数",
    count: 0
  },
  {
    name: "付款",
    amount: 0,
    desc: "成功付款数",
    count: 0
  },
]);

// 为每个金额创建独立的响应式ref，初始值为0
const sourceRefs = projectList.map(() => ref(0));

// 为每个ref应用useTransition
const animatedValues = sourceRefs.map(sourceRef => {
  return useTransition(sourceRef, { 
    duration: 1000, // 增加动画时长，使动画更平滑
  });
});

// 获取数据的函数
const getdata = async () => {
  try {
    // // 获取商户信息
    // const merchantRes = await http.merchant({
    //   id: userStore.merchantInfo.id,
    // });
    // console.log("merchantRes", merchantRes);
    
    // 获取期初金额（使用financeReportByDay接口）
    const today = new Date();
    const startDate = today.toISOString().split('T')[0] ;
    const endDate = today.toISOString().split('T')[0] ;
    
    const financeRes = await http.financeReportByDay({
      startDate,
      endDate,
    });
    console.log('financeRes:', financeRes);
    
    if (financeRes.code === 200 && financeRes.data?.list?.length > 0) {
      const prevBalance = financeRes.data.list[0].PreviousDayEndBalance ? Number(financeRes.data.list[0].PreviousDayEndBalance) : 0;
      projectList[0].amount = prevBalance !== 0 ? prevBalance : (userStore.merchantInfo?.balance ? Number(userStore.merchantInfo.balance) : 0);
    } else {
      projectList[0].amount = userStore.merchantInfo?.balance ? Number(userStore.merchantInfo.balance) : 0;
    }
    
    // 获取收款成功率数据
    const collectRes = await http.collectSuccessRate({
      daySpan: 1,
    });
    
    if (collectRes.data.list.length) {
      projectList[1].amount = Number(collectRes.data.list[0].SuccessAmount);
      projectList[1].count = collectRes.data.list[0].SuccessOrders;
    }
    
    // 获取总付款数据
    const payRes = await http.totalPay({});
    
    if (payRes.data.list.length) {
      projectList[2].amount = Number(payRes.data.list[0].SuccessAmount);
      projectList[2].count = payRes.data.list[0].SuccessOrders;
    }
    
  } catch (error) {
    console.error("获取数据失败:", error);
  }
};

// 格式化显示值
const formatValue = (value) => {
  // return '*'.repeat(value.toString().length);
  return '****';
};

watch(() => props.showData, (newVal) => {
  if (newVal) {
    nextTick(() => {
      projectList.forEach((item, index) => {
        sourceRefs[index].value = 0;
        setTimeout(() => {
          sourceRefs[index].value = item.amount;
        }, 50);
      });
    });
  }
});

// 暴露getdata方法给父组件
defineExpose({
  getdata
});

onMounted(() => {
  getdata().then(() => {
    nextTick(() => {
      projectList.forEach((item, index) => {
        sourceRefs[index].value = item.amount;
      });
    });
  });
});
</script>

<style lang="scss" scoped>
.project-container {
  width: 100%;
  margin: 0 auto;
}

.project-card {
  transition: all 0.3s ease;
  border-radius: 10px;
  border: none;
  background: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.project-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 20px 0 rgba(0, 0, 0, 0.1) !important;
}

.project-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.project-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.project-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.project-icon i {
  font-size: 28px;
  color: #fff;
  object-fit: cover;
}

/* 不同卡片的图标背景色 */
.project-card0 .project-icon {
  background-color: #fff;
}

.project-card2 .project-icon {
  background-color: #f56565;
}

.project-card1 .project-icon {
  background-color: #48bb78;
}
.project-card0 .project-icon i {
  color: #a5dc3d;
}

.project-card3 .project-icon {
  background-color: #63b3ed;
}
.project-card3 .project-icon i {
  color: #fff;
}

.project-amount {
  display: flex;
  align-items: baseline;
  margin-bottom: 20px;
}

.currency {
  font-size: 18px;
  color: #666;
  margin-right: 5px;
}

.amount-value {
  // font-size: 32px;
  font-weight: bold;
  color: #333;
  letter-spacing: -1px;
}

.project-stats {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-top: 10px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

/* 响应式设计 */
@media only screen and (max-width: 767px) {
  .project-card {
    margin-bottom: 15px;
  }

  .amount-value {
    font-size: 28px;
  }
}
</style>
