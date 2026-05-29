<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    :show-close="false"
    width="400px"
    center
  >
    <div class="success-content">
      <div class="success-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <div class="success-text">{{ message }}</div>
      <div class="success-desc">{{ description }}</div>
    </div>
    <template #footer>
      <el-button type="primary" @click="handleConfirm">{{ confirmText }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '操作成功'
  },
  message: {
    type: String,
    default: '操作成功'
  },
  description: {
    type: String,
    default: ''
  },
  confirmText: {
    type: String,
    default: '确定'
  }
});

const emit = defineEmits(['update:modelValue', 'confirm']);

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const handleConfirm = () => {
  emit('confirm');
};
</script>

<style scoped lang="scss">
.success-content {
  text-align: center;
  padding: 20px;
}

.success-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 40px;

  svg {
    width: 40px;
    height: 40px;
  }
}

.success-text {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.success-desc {
  font-size: 14px;
  color: #666;
}
</style>