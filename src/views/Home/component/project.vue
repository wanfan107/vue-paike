<template>
  <el-row :gutter="20" class="project-container">
    <el-col
      :xs="24"
      :sm="8"
      :md="8"
      :lg="8"
      :xl="8"
      v-for="(item, index) in projectList"
      :key="item.nameKey"
    >
      <el-card :class="['project-card', 'project-card' + index]" shadow="hover">
        <div class="project-card-header">
          <div class="project-name">{{ t(item.nameKey) }}</div>
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
            <div class="stat-label">{{ t(item.descKey) }}</div>
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
import { useI18n } from 'vue-i18n';

// 接收父组件传递的showData属性
const props = defineProps({
  showData: {
    type: Boolean,
    default: true
  }
});

const { t } = useI18n();

// 初始化store
const userStore = useUserStore();
const currency = computed(() => userStore.merchantInfo?.currency);
const isBRL = computed(() => currency.value === 'BRL');
const currencySymbol = computed(() => getCurrencySymbol(userStore.merchantInfo?.currency));
const currencyConfig = computed(() => getCurrencyConfig(userStore.merchantInfo?.currency));

// 响应式项目列表
const projectList = reactive([
  {
    nameKey: "home.project.openingBalance",
    amount: 0,
    descKey: "home.project.openingBalanceDesc",
    count: ''
  },
  {
    nameKey: "home.project.receive",
    amount: 0,
    descKey: "home.project.receiveDesc",
    count: 0
  },
  {
    nameKey: "home.project.pay",
    amount: 0,
    descKey: "home.project.payDesc",
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
    if(!isBRL.value){
      // 获取商户信息
    const merchantRes = await http.merchant({
      id: userStore.merchantInfo.id,
    });
    if (merchantRes.code === 200 && merchantRes.data) {
      projectList[0].nameKey = "home.project.balance";
      projectList[0].amount = Number(merchantRes.data.Balance) || 0;
    }
    }else{
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
      projectList[0].amount = prevBalance !== 0 ? prevBalance : (userStore.merchantInfo?.Balance ? Number(userStore.merchantInfo.Balance) : 0);
    } else {
      projectList[0].amount = userStore.merchantInfo?.Balance ? Number(userStore.merchantInfo.Balance) : 0;
    }
    }
    // // 获取商户信息
    // const merchantRes = await http.merchant({
    //   id: userStore.merchantInfo.id,
    // });
    // console.log("merchantRes", merchantRes);
    
    // 获取期初金额（使用financeReportByDay接口）
    // const today = new Date();
    // const startDate = today.toISOString().split('T')[0] ;
    // const endDate = today.toISOString().split('T')[0] ;
    
    // const financeRes = await http.financeReportByDay({
    //   startDate,
    //   endDate,
    // });
    // console.log('financeRes:', financeRes);
    
    // if (financeRes.code === 200 && financeRes.data?.list?.length > 0) {
    //   const prevBalance = financeRes.data.list[0].PreviousDayEndBalance ? Number(financeRes.data.list[0].PreviousDayEndBalance) : 0;
    //   projectList[0].amount = prevBalance !== 0 ? prevBalance : (userStore.merchantInfo?.Balance ? Number(userStore.merchantInfo.Balance) : 0);
    // } else {
    //   projectList[0].amount = userStore.merchantInfo?.Balance ? Number(userStore.merchantInfo.Balance) : 0;
    // }
    
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
  transition: all 0.25s ease;
  border-radius: 16px;
  border: 1px solid var(--color-border-soft, #f0f1f3);
  background: var(--color-surface, #fff);
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.08));
  overflow: hidden;
}

.project-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08) !important;
}

.project-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.project-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-secondary, #6b7280);
}

.project-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

// 统一品牌绿色调图标背景
.project-card0 .project-icon,
.project-card1 .project-icon {
  background-color: var(--brand-primary-soft, rgba(22, 163, 74, 0.1));
  color: var(--brand-primary, #16a34a);
}
.project-card2 .project-icon {
  background-color: var(--color-send-bg, rgba(239, 68, 68, 0.1));
  color: var(--color-danger, #ef4444);
}

.project-icon :deep(.el-icon) {
  font-size: 20px;
}

.project-amount {
  display: flex;
  align-items: baseline;
  margin-bottom: 16px;
}

.amount-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary, #111827);
  letter-spacing: -0.5px;
  font-variant-numeric: tabular-nums;
}

.project-stats {
  background-color: var(--color-hover, #f8f9fb);
  padding: 12px 14px;
  border-radius: 10px;
  margin-top: 4px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 13px;
  color: var(--text-faint, #9ca3af);
}

.stat-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-regular, #374151);
  font-variant-numeric: tabular-nums;
}

/* 响应式设计 */
@media only screen and (max-width: 767px) {
  .project-card {
    margin-bottom: 12px;
  }
  .amount-value {
    font-size: 24px;
  }
}
</style>
