<template>
  <el-row :gutter="20" class="project-container">
    <el-col
      :xs="24"
      :sm="8"
      :md="8"
      :lg="8"
      :xl="8"
      v-for="(item, index) in displayList"
      :key="item.name"
    >
      <el-card :class="['project-card', 'project-card' + index]" >
        <div class="project-card-header">
          <div class="project-name">{{ item.name }}</div>
          <div class="project-icon" :class="['icon' + index]">
             <!-- 添加图标 --->
            <el-icon v-if="index === 0"><FolderAdd /></el-icon>
            <el-icon v-if="index === 1"><Select /></el-icon>
            <el-icon v-if="index === 2"><Histogram /></el-icon>
          </div>
        </div>
        <div class="project-amount">
          <el-statistic 
            :value="animatedValues[index].value" 
            class="amount-value"
            :formatter="(value) => {
              if (item.type === 'count') {
                return Math.round(value);
              } else if (item.type === 'rate') {
                return value.toFixed(1) + '%';
              }
              return value;
            }"
          />
        </div>

      </el-card>
    </el-col>
  </el-row>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { TransitionPresets, useTransition } from '@vueuse/core';
import { FolderAdd, Select, Histogram } from '@element-plus/icons-vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({
      orderCount: 0,
      successCount: 0,
      successRate: 0
    })
  }
});

// 根据props数据生成显示列表
const displayList = computed(() => [
  {
    name: "创建订单",
    amount: props.data.orderCount || 0,
    type: "count"
  },
  {
    name: "成功订单",
    amount: props.data.successCount || 0,
    type: "count"
  },
  {
    name: "成功率",
    amount: parseFloat(props.data.successRate || 0),
    type: "rate"
  },
]);

// 为每个金额创建独立的响应式ref，初始值为0
const sourceRefs = ref(displayList.value.map(() => ref(0)));

// 为每个ref应用useTransition
const animatedValues = computed(() => {
  return sourceRefs.value.map(sourceRef => {
    return useTransition(sourceRef, { 
      duration: 1000,
      easing: TransitionPresets.easeInOutCubic,  
    });
  });
});

// 更新动画值
const updateValues = () => {
  displayList.value.forEach((item, index) => {
    if (sourceRefs.value[index]) {
      sourceRefs.value[index].value = item.amount;
    }
  });
};

// 监听数据变化
watch(() => props.data, () => {
  sourceRefs.value = displayList.value.map((item, index) => {
    const currentValue = sourceRefs.value[index]?.value || 0;
    const newRef = ref(currentValue);
    setTimeout(() => {
      newRef.value = item.amount;
    }, 50);
    return newRef;
  });
}, { deep: true });

onMounted(() => {
  // 组件挂载后，将目标值赋给响应式ref，触发动画
  updateValues();
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
  border: 1px solid #eaeefb;
  background: #f9fafc;
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

.project-card0 .project-icon i{
  color: #4299e1;
}

.project-card1 .project-icon i{
  color: #48bb78;
}

.project-card2 .project-icon i{
  color: #9f7aea;
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
  font-size: 32px;
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
