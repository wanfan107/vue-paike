<template>
  <div 
    class="copy-cell" 
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <span class="copy-text">{{ displayText || text }}</span>
    <el-icon 
      class="copy-icon" 
      :class="{ 'is-copied': isCopied, 'is-visible': isHovered }"
      @click.stop="handleCopy"
      role="button"
      tabindex="0"
      @keydown.enter="handleCopy"
      @keydown.space="handleCopy"
      :title="title"
    >
      <Check v-if="isCopied" />
      <CopyDocument v-else />
    </el-icon>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';

const props = defineProps({
  text: {
    type: String,
    required: true
  },
  displayText: {
    type: String,
    default: ''
  },
  id: {
    type: [String, Number],
    default: ''
  },
  title: {
    type: String,
    default: '点击复制'
  },
  maxWidth: {
    type: String,
    default: '170px'
  }
});

const isCopied = ref(false);
const isHovered = ref(false);

const copyId = computed(() => {
  return props.id || props.text;
});

const handleCopy = async () => {
  if (!props.text) return;
  try {
    await navigator.clipboard.writeText(props.text);
    isCopied.value = true;
    ElMessage.success('复制成功');
    setTimeout(() => {
      isCopied.value = false;
    }, 2000);
  } catch (err) {
    ElMessage.error('复制失败');
  }
};
</script>

<style scoped lang="scss">
.copy-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  border-radius: 4px;
  
  &:hover {
    background-color: rgba(64, 158, 255, 0.06);
  }
}

.copy-text {
  font-size: 13px;
  color: #303133;
  font-family: monospace;
  word-break: break-all;
  max-width: v-bind(maxWidth);
}

.copy-icon {
  opacity: 0;
  cursor: pointer;
  transition: opacity 0.2s ease, color 0.2s ease, transform 0.15s ease;
  font-size: 14px;
  color: #909399;
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #409EFF;
    transform: scale(1.1);
  }
  
  &.is-copied {
    opacity: 1;
    color: #67c23a;
    animation: copySuccess 0.3s ease;
  }
  
  &.is-visible {
    opacity: 1;
  }
}

@keyframes copySuccess {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1);
  }
}
</style>