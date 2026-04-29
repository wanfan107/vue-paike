<template>
  <svg :class="classList" aria-hidden="true">
    <use :xlink:href="iconName" :fill="color" />
  </svg>
</template>
<script setup>
import { computed } from 'vue';
const props = defineProps({
  className: {
    type: String,
    default: ''
  },
  iconClass: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: '#db0011'
  },
  size: {
    type: String,
    default: '20px'
  }
})
const classList = computed(() => {
  return ['icon', props.className || '']
})
const iconName = computed(() => {
  return `#icon-${props.iconClass}`
})
</script>
<style scoped>
.icon {
  /* v-bind是Vue3才支持的功能，可以将CSS的值与js的值绑定 */
  width: v-bind('props.size');
  height: v-bind('props.size');
  position: relative;
  vertical-align: -2px;
  fill: currentColor;
}
</style>