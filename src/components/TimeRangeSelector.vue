<template>
  <div class="time-range-buttons">
    <button
      v-for="item in timeRangeOptions"
      :key="item.value"
      :class="['time-btn', { active: activeRange == item.value }]"
      @click="selectRange(item.value)"
    >
      {{ item.label }}
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import useUserStore from "@/stores/user";
import { getNow, getYesterday, getDateRange } from "@/utils/brazilTime";

const userStore = useUserStore();
const currency = computed(() => userStore.merchantInfo?.currency);

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

// 选择时间范围（使用巴西时间）
const selectRange = (range) => {
  activeRange.value = range;

  let startDate, endDate;

  switch (range) {
    case "today":
      const now = getNow(currency.value);
      startDate = now.startOf('day');
      endDate = now.endOf('day');
      break;
    case "yesterday":
      const yesterday = getYesterday(currency.value);
      startDate = yesterday.startOf('day');
      endDate = yesterday.endOf('day');
      break;
    case "3days":
      startDate = getNow(currency.value).subtract(3, 'day').startOf('day');
      endDate = getNow(currency.value).endOf('day');
      break;
    case "7days":
      startDate = getNow(currency.value).subtract(7, 'day').startOf('day');
      endDate = getNow(currency.value).endOf('day');
      break;
    default:
      const defaultNow = getNow(currency.value);
      startDate = defaultNow.startOf('day');
      endDate = defaultNow.endOf('day');
  }

  // 触发事件，传递时间范围
  const timeRange = [
    startDate.format("YYYY-MM-DD HH:mm:ss"),
    endDate.format("YYYY-MM-DD HH:mm:ss"),
  ];

  emit("change", {
    range: range,
    timeRange: timeRange,
    activeRange: activeRange.value,
  });
};

// 监听defaultValue变化
watch(() => props.defaultValue, (newValue) => {
  activeRange.value = newValue || '';
});

onMounted(() => {
});
</script>

<style lang="scss" scoped>
.time-range-buttons {
  float: right;
  margin-bottom: 15px;

  .time-btn {
    padding: 6px 15px;
    border: 1px solid var(--color-border, #dcdfe6);
    background-color: var(--color-surface, #fff);
    color: var(--text-regular, #606266);
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
      border-color: var(--color-border, #c0c4cc);
      color: var(--text-regular, #606266);
      position: relative;
      z-index: 1;
    }

    &.active {
      border-color: var(--brand-primary, #16a34a);
      background-color: var(--brand-primary, #16a34a);
      color: var(--text-inverse, #fff);
      position: relative;
      z-index: 2;
    }
  }
}
</style>