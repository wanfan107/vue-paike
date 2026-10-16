<template>
  <span class="status-pill" :class="pillClass">
    <i v-if="dot" class="status-pill__dot" />
    <slot>{{ label }}</slot>
  </span>
</template>

<script setup>
import { computed } from 'vue'

/**
 * StatusPill —— 状态胶囊（NTX 风格：圆点 + 浅底 + 11px 胶囊）
 *
 * 用法 1（推荐，传业务状态码，自动映射类型与中文文案）：
 *   <StatusPill status="PENDING" />
 *
 * 用法 2（手动指定）：
 *   <StatusPill type="success" text="已结算" />
 *   <StatusPill type="danger" :dot="false">失败</StatusPill>
 */
const props = defineProps({
  // 业务原始状态码（不区分大小写）
  status: { type: String, default: '' },
  // 手动指定类型：success | warning | danger | info | neutral | primary
  type: { type: String, default: '' },
  // 手动指定文案
  text: { type: String, default: '' },
  // 是否显示圆点
  dot: { type: Boolean, default: true }
})

// 常见支付订单状态码 → 视觉类型 + 中文文案
const STATUS_MAP = {
  SUCCESS: { type: 'success', label: '成功' },
  PAID: { type: 'success', label: '已支付' },
  SETTLED: { type: 'success', label: '已结算' },
  COMPLETED: { type: 'success', label: '已完成' },
  DONE: { type: 'success', label: '完成' },
  PENDING: { type: 'warning', label: '处理中' },
  PROCESSING: { type: 'warning', label: '处理中' },
  WAITING: { type: 'warning', label: '待处理' },
  REVIEWING: { type: 'warning', label: '审核中' },
  FAILED: { type: 'danger', label: '失败' },
  FAIL: { type: 'danger', label: '失败' },
  ERROR: { type: 'danger', label: '失败' },
  REJECTED: { type: 'danger', label: '已拒绝' },
  CANCELLED: { type: 'danger', label: '已取消' },
  CANCELED: { type: 'danger', label: '已取消' },
  REFUNDED: { type: 'info', label: '已退款' }
}

const mapped = computed(() => {
  if (props.status) {
    const hit = STATUS_MAP[String(props.status).toUpperCase()]
    if (hit) return hit
    return { type: 'neutral', label: props.status }
  }
  return { type: 'neutral', label: '' }
})

const pillClass = computed(() => `is-${props.type || mapped.value.type}`)
const label = computed(() => props.text || mapped.value.label)
</script>

<style scoped lang="scss">
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  font-size: 11px;
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;
}

.status-pill__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

.is-success {
  background-color: var(--color-receive-bg);
  color: var(--color-receive);
}
.is-warning {
  background-color: var(--color-status-warn-bg);
  color: var(--color-status-warn);
}
.is-danger {
  background-color: var(--color-send-bg);
  color: var(--color-send);
}
.is-info {
  background-color: var(--color-status-info-bg);
  color: var(--color-status-info);
}
.is-neutral {
  background-color: var(--color-status-neutral-bg);
  color: var(--color-status-neutral);
}
.is-primary {
  background-color: var(--brand-primary-soft);
  color: var(--brand-primary);
}
</style>
