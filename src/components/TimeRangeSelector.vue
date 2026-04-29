<template>
  <div class="time-range-buttons">
    <button
      v-for="item in timeRangeOptions"
      :key="item.value"
      :class="['time-btn', { active: activeRange === item.value }]"
      @click="selectRange(item.value)"
    >
      {{ item.label }}
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import useUserStore from '@/stores/user';

// 定义组件属性
const props = defineProps({
  defaultValue: {
    type: String,
    default: "today",
  },
  timeRangeOptions: {
    type: Array,
    default: () => [
      { label: "今天", value: "today" },
      { label: "3天", value: "3days" },
      { label: "7天", value: "7days" },
    ],
  },
});

// 定义组件事件
const emit = defineEmits(['change']);

// 响应式数据
const activeRange = ref(props.defaultValue);

// 使用 Pinia Store
const userStore = useUserStore();
  // console.log("------------------------",userStore.userInfo);
  // console.log("------------------------",userStore.merchantInfo);
const standardtime = computed(() => {
  return +userStore.merchantInfo.standardtime * 60 * 60 * 1000 || 0;
});

// 选择时间范围
const selectRange = (range) => {
  activeRange.value = range;

  // 根据选择的时间范围设置时间参数
  const timestamp = Date.now(); // 当前时间
  const localDate = new Date(timestamp);
  const timezoneOffset = localDate.getTimezoneOffset() * 60 * 1000; // 本地时区偏移
  const adjustedDate = new Date(
    timestamp + timezoneOffset + standardtime.value
  );

  let startDate = new Date(adjustedDate);
  let endDate = new Date(adjustedDate);

  switch (range) {
    case "today":
      // 今天：从当天0点到当天23:59:59
      startDate = new Date(adjustedDate.setHours(0, 0, 0, 0));
      endDate = new Date(adjustedDate.setHours(23, 59, 59, 999));
      break;
    case "yesterday":
      // 昨天：从昨天0点到昨天23:59:59
      endDate = new Date(adjustedDate);
      endDate.setDate(adjustedDate.getDate() - 1);
      endDate = new Date(endDate.setHours(23, 59, 59, 999));
      startDate = new Date(endDate);
      startDate.setDate(endDate.getDate());
      startDate = new Date(startDate.setHours(0, 0, 0, 0));
      break;
    case "3days":
      startDate = new Date(adjustedDate);
      startDate.setDate(adjustedDate.getDate() - 3);
      startDate = new Date(startDate.setHours(0, 0, 0, 0));
      endDate = new Date(adjustedDate.setHours(0, 0, 0, 0));
      break;
    case "7days":
      startDate = new Date(adjustedDate);
      startDate.setDate(adjustedDate.getDate() - 7);
      startDate = new Date(startDate.setHours(0, 0, 0, 0));
      endDate = new Date(adjustedDate.setHours(0, 0, 0, 0));
      break;
    default:
      startDate = new Date(adjustedDate.setHours(0, 0, 0, 0));
      endDate = new Date(adjustedDate.setHours(23, 59, 59, 999));
  }

  // 触发事件，传递时间范围
  const timeRange = [
    formatDate(startDate, "yyyy-MM-dd HH:mm:ss"),
    formatDate(endDate, "yyyy-MM-dd HH:mm:ss"),
  ];

  emit("change", {
    range: range,
    timeRange: timeRange,
    activeRange: activeRange.value,
  });
};

// 格式化日期
const formatDate = (date, format) => {
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
};

// 如果需要在组件挂载时执行某些逻辑，可以使用
onMounted(() => {
  // 组件挂载后执行的逻辑
  // 例如，触发一次初始的 change 事件
  selectRange(activeRange.value);
});
</script>

<style lang="scss" scoped>
.time-range-buttons {
  float: right;
  margin-bottom: 15px;

  .time-btn {
    padding: 6px 15px;
    border: 1px solid #dcdfe6;
    background-color: #fff;
    color: #606266;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s;
    border-radius: 0;

    // 第一个按钮左边是半圆
    &:first-child {
      border-radius: 20px 0 0 20px;
      border-right: none;
    }

    // 最后一个按钮右边是半圆
    &:last-child {
      border-radius: 0 20px 20px 0;
    }

    // 中间按钮没有圆角
    &:not(:first-child):not(:last-child) {
      border-radius: 0;
      border-right: none;
    }

    &:hover {
      border-color: #c0c4cc;
      color: #606266;
      position: relative;
      z-index: 1;
    }

    &.active {
      border-color: #db0011;
      background-color: #db0011;
      color: #fff;
      position: relative;
      z-index: 2;
    }
  }
}
</style>