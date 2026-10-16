<template>
  <div 
    v-if="text !== null && text !== undefined && text !== ''"
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
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

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
    default: '240px'
  }
});

const isCopied = ref(false);
const isHovered = ref(false);

const copyId = computed(() => {
  return props.id || props.text;
});

const handleCopy = () => {
  if (!props.text) return;
  
  const copySuccess = () => {
    isCopied.value = true;
    ElMessage.success(t('common.copySuccess'));
    setTimeout(() => {
      isCopied.value = false;
    }, 2000);
  };
  
  const copyFail = () => {
    ElMessage.error(t('common.copyFailed'));
  };
  
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(props.text).then(copySuccess).catch(() => {
      fallbackCopy(props.text, copySuccess, copyFail);
    });
  } else {
    fallbackCopy(props.text, copySuccess, copyFail);
  }
};

const fallbackCopy = (text, success, fail) => {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '-9999px';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  
  textarea.select();
  textarea.setSelectionRange(0, text.length);
  
  try {
    const successful = document.execCommand('copy');
    if (successful) {
      success();
    } else {
      fail();
    }
  } catch (err) {
    fail();
  } finally {
    document.body.removeChild(textarea);
  }
};
</script>

<style scoped lang="scss">
.copy-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  border-radius: var(--radius-xs);

  &:hover {
    background-color: var(--color-hover);
  }
}

.copy-text {
  font-size: 13px;
  color: var(--text-primary);
  font-family: monospace;
  word-break: break-all;
  max-width: v-bind(maxWidth);
}

.copy-icon {
  opacity: 0;
  cursor: pointer;
  transition: opacity 0.2s ease, color 0.2s ease, transform 0.15s ease;
  font-size: 14px;
  color: var(--text-faint);
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: var(--brand-primary);
    transform: scale(1.1);
  }
  
  &.is-copied {
    opacity: 1;
    color: var(--color-receive);
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