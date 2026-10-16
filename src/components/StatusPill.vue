<template>
  <span class="status-pill" :class="pillClass">
    <i v-if="dot" class="status-pill__dot" />
    <slot>{{ label }}</slot>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

/**
 * StatusPill —— 状态胶囊（NTX 风格）
 * 用法：<StatusPill status="PENDING" /> 自动映射类型 + 翻译文案
 */
const props = defineProps({
  status: { type: String, default: '' },
  type: { type: String, default: '' },
  text: { type: String, default: '' },
  dot: { type: Boolean, default: true }
})

// 状态码 → 视觉类型 + i18n key
const STATUS_MAP = {
  SUCCESS: { type: 'success', labelKey: 'status.success' },
  PAID: { type: 'success', labelKey: 'status.paid' },
  SETTLED: { type: 'success', labelKey: 'status.settled' },
  COMPLETED: { type: 'success', labelKey: 'status.completed' },
  DONE: { type: 'success', labelKey: 'status.completed' },
  PENDING: { type: 'warning', labelKey: 'status.pending' },
  PROCESSING: { type: 'warning', labelKey: 'status.processing' },
  WAITING: { type: 'warning', labelKey: 'status.pending' },
  REVIEWING: { type: 'warning', labelKey: 'status.reviewing' },
  FAILED: { type: 'danger', labelKey: 'status.failed' },
  FAIL: { type: 'danger', labelKey: 'status.failed' },
  ERROR: { type: 'danger', labelKey: 'status.failed' },
  REJECTED: { type: 'danger', labelKey: 'status.rejected' },
  CANCELLED: { type: 'danger', labelKey: 'status.cancelled' },
  CANCELED: { type: 'danger', labelKey: 'status.cancelled' },
  REFUNDED: { type: 'info', labelKey: 'status.refunded' }
}

const mapped = computed(() => {
  if (props.status) {
    const hit = STATUS_MAP[String(props.status).toUpperCase()]
    if (hit) return { type: hit.type, label: t(hit.labelKey) }
  }
  if (props.type && props.text) {
    return { type: props.type, label: props.text }
  }
  return { type: props.type || 'info', label: props.text || t('status.unknown') }
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
