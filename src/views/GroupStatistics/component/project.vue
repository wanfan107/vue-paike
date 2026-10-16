<template>
  <el-row :gutter="20" class="project-container">
    <el-col
      :xs="24"
      :sm="8"
      :md="8"
      :lg="8"
      :xl="8"
      v-for="(item, index) in displayList"
      :key="item.nameKey"
    >
      <el-card :class="['project-card', 'project-card' + index]" >
        <div class="project-card-header">
          <div class="project-name">{{ t(item.nameKey) }}</div>
          <div class="project-icon" :class="['icon' + index]">
             <!-- 添加图标 --->
            <el-icon v-if="index === 0"><FolderAdd /></el-icon>
            <el-icon v-if="index === 1"><Select /></el-icon>
            <el-icon v-if="index === 2"><Histogram /></el-icon>
          </div>
        </div>
        <div class="project-amount">
          <el-statistic 
            :value="animatedValues[index]" 
            class="amount-value"
            :formatter="(value) => {
              if (item.type === 'count') {
                return Math.round(value);
              } else if (item.type === 'rate') {
                return value.toFixed(2) + '%';
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
import { FolderAdd, Select, Histogram } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

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
    nameKey: "groupStatistics.overview.createdOrders",
    amount: parseInt(props.data.orderCount || '0'),
    type: "count"
  },
  {
    nameKey: "groupStatistics.overview.successOrders",
    amount: parseInt(props.data.successCount || '0'),
    type: "count"
  },
  {
    nameKey: "groupStatistics.overview.successRate",
    amount: parseFloat(props.data.successRate || '0'),
    type: "rate"
  },
]);

// 动画值
const animatedValues = ref([0, 0, 0]);

// 数字滚动动画
const animateValue = (index, start, end, duration = 1000) => {
  const startTime = performance.now();
  const diff = end - start;
  
  const animate = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // 使用缓动函数
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    
    animatedValues.value[index] = start + diff * easeProgress;
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  
  requestAnimationFrame(animate);
};

// 更新动画值
const updateValues = () => {
  displayList.value.forEach((item, index) => {
    animateValue(index, animatedValues.value[index] || 0, item.amount);
  });
};

// 监听数据变化
watch(() => props.data, () => {
  updateValues();
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
  border-radius: 14px;
  border: 1px solid var(--color-border-soft);
  background: var(--color-elevated, #fff);
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04), 0 2px 8px rgba(16, 24, 40, 0.06);
  overflow: hidden;
}

.project-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(16, 24, 40, 0.08) !important;
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
  color: var(--text-primary);
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
  color: var(--text-inverse, #fff);
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
  color: var(--text-secondary);
  margin-right: 5px;
}

.amount-value {
  font-size: 32px;
  font-weight: bold;
  color: var(--text-primary);
  letter-spacing: -1px;
  font-variant-numeric: tabular-nums;
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
