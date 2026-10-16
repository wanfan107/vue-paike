<template>
  <div class="filter-tabs">
    <button
      v-for="opt in options"
      :key="String(opt.value)"
      type="button"
      class="filter-tabs__item"
      :class="{ 'is-active': modelValue === opt.value }"
      @click="$emit('update:modelValue', opt.value)"
    >
      <i
        v-if="opt.dot"
        class="filter-tabs__dot"
        :class="`dot-${opt.dot}`"
      />
      {{ opt.label }}
    </button>
  </div>
</template>

<script setup>
/**
 * FilterTabs —— 药丸筛选组（NTX 风格）
 *
 * 用法：
 *   <FilterTabs v-model="status" :options="[
 *     { label: '全部', value: 'all' },
 *     { label: '已收', value: 'received', dot: 'success' },
 *     { label: '已发', value: 'sent', dot: 'danger' }
 *   ]" />
 */
defineProps({
  modelValue: { type: [String, Number], default: '' },
  // [{ label, value, dot?: 'success'|'danger'|'info'|'warning'|'primary' }]
  options: { type: Array, default: () => [] }
})

defineEmits(['update:modelValue'])
</script>

<style scoped lang="scss">
.filter-tabs {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-tabs__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background-color: var(--color-elevated);
  color: var(--text-regular);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;

  &:hover {
    border-color: var(--text-faint);
  }

  &.is-active {
    background-color: var(--brand-primary-soft);
    border-color: transparent;
    color: var(--brand-primary);
  }
}

.filter-tabs__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;

  &.dot-success { background-color: var(--color-receive); }
  &.dot-danger { background-color: var(--color-send); }
  &.dot-info { background-color: var(--color-status-info); }
  &.dot-warning { background-color: var(--color-status-warn); }
  &.dot-primary { background-color: var(--brand-primary); }
}
</style>
