<template>
  <div class="editable-select" ref="selectContainer">
    <div class="select-header" :class="{active: dropdownOpen}" @click="toggleDropdown">
      <span class="select-value" :class="{placeholder: !selected}">
        {{ selected ? selected.name : placeholder }}
      </span>
      <div style="display:flex;align-items:center;">
        <span class="clear-btn" @click.stop="clearSelection" v-show="selected">×</span>
        <span class="select-arrow" :class="{active: dropdownOpen}">▼</span>
      </div>
    </div>

    <transition name="dropdown-fade">
      <div class="select-dropdown" v-show="dropdownOpen" @click.stop>
        <div class="select-options">
          <template v-if="mergedOptions.length > 0">
            <div v-for="(option, index) in mergedOptions" :key="index" 
                 class="option-item"
                 :class="{selected: selected && selected.value === option.value, editing: editing.index === index}"
                 @click="handleOptionClick(option, index)">
              <div class="option-content">
                <div v-if="editing.index !== index" class="alias-name" 
                     @dblclick.stop="startEdit(index)">
                  {{ option.alias }}
                </div>
                <div v-else>
                  <input type="text" class="option-edit-input" 
                         v-model="editing.value" 
                         @blur="saveEdit"
                         @keydown.enter="handleEnterKey"
                         @keyup.esc="cancelEdit" 
                         ref="editInput">
                </div>
                <div class="original-name">{{ t('editableSelect.walletLabel') }}: {{ option.original }}</div>
              </div>
              <div class="option-actions">
                <el-button class="edit-btn"  size="small" @click.stop="startEdit(index)">{{ t('editableSelect.editAlias') }}</el-button>
                <el-button class="save-btn" type="success"  size="small" @click.stop="saveAlias(index)">{{ t('common.save') }}</el-button>
              </div>
            </div>
          </template>
          <div v-else class="empty-tip">
            <el-icon class="empty-icon"><CircleClose /></el-icon>
            <span>{{ t('editableSelect.empty') }}</span>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>
<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { CircleClose } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// 定义props和emit
const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  options: {
    type: Array,
    required: true,
    validator: (options) => {
      return options.every(opt => {
        return opt.value !== undefined && opt.original !== undefined;
      });
    }
  },
  storageKey: {
    type: String,
    default: 'wallet_aliases'
  },
  merchantId: {
    type: [String, Number],
    default: ''
  },
  placeholder: {
    type: String,
    default: '请选择'
  },
  autoSave: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits([
  'update:modelValue', 
  'change', 
  'edit-error', 
  'edit-success', 
  'save-alias',
  'save-to-storage',
  'load-from-storage',
  'clear-storage'
]);

// 响应式数据
const dropdownOpen = ref(false);
const editing = reactive({ index: -1, value: '' });
const mergedOptions = ref([]);
const storedAliases = reactive({});
const selectContainer = ref(null);
const editInput = ref(null);

// 计算属性
const selected = computed(() => {
  if (!props.modelValue) return null;
  return mergedOptions.value.find(opt => opt.value === props.modelValue) || null;
});

const actualStorageKey = computed(() => {
  if (props.merchantId) {
    return `${props.storageKey}_${props.merchantId}`;
  }
  return props.storageKey;
});

// 编码存储的 key（钱包地址）
const encodeKey = (key) => {
  try {
    return btoa(encodeURIComponent(key));
  } catch (e) {
    return key;
  }
};

// 解码存储的 key
const decodeKey = (encodedKey) => {
  try {
    return decodeURIComponent(atob(encodedKey));
  } catch (e) {
    return encodedKey;
  }
};

// 加载本地存储并合并选项
const loadAndMergeOptions = (defaultOptions) => {
  try {
    const stored = localStorage.getItem(actualStorageKey.value);
    const parsed = stored ? JSON.parse(stored) : {};
    
    Object.keys(parsed).forEach(encodedKey => {
      const decodedKey = decodeKey(encodedKey);
      storedAliases[decodedKey] = parsed[encodedKey];
    });
  } catch (e) {
    console.error('读取本地存储失败:', e);
    Object.assign(storedAliases, {});
  }
  
  mergedOptions.value = defaultOptions.map(option => {
    const storedAlias = storedAliases[option.value];
    
    return {
      ...option,
      alias: storedAlias ? 
             storedAlias : '自定义钱包别名'
    };
  });
};

// 保存别名到本地存储
const saveAliasesToStorage = () => {
  if (!props.autoSave) return;
  
  try {
    const aliasesToSave = {};
    mergedOptions.value.forEach(option => {
      if (option.alias !== option.original) {
        const encodedKey = encodeKey(option.value);
        aliasesToSave[encodedKey] = option.alias;
      }
    });
    
    localStorage.setItem(actualStorageKey.value, JSON.stringify(aliasesToSave));
  } catch (e) {
    console.error('保存到本地存储失败:', e);
  }
};

// 手动保存当前别名到本地存储
const saveToStorage = () => {
  saveAliasesToStorage();
  emit('save-to-storage');
};

// 手动从本地存储加载别名
const loadFromStorage = () => {
  loadAndMergeOptions(props.options);
  emit('load-from-storage');
};

// 清除本地存储
const clearStorage = () => {
  localStorage.removeItem(actualStorageKey.value);
  loadAndMergeOptions(props.options);
  emit('clear-storage');
};

// 事件监听器处理
let documentClickHandler = null;
let keydownHandler = null;

// 设置事件监听器
const setupEventListeners = () => {
  documentClickHandler = (e) => {
    const container = selectContainer.value;
    
    if (!container) return;
    
    if (!container.contains(e.target)) {
      closeDropdown();
      saveEdit(); // 点击外部时保存编辑
    }
  };
  
  document.addEventListener('click', documentClickHandler);
  
  // 添加键盘事件监听
  keydownHandler = (e) => {
    if (e.key === 'Escape') {
      cancelEdit();
      closeDropdown();
    }
  };
  
  document.addEventListener('keydown', keydownHandler);
};

// 移除事件监听器
const removeEventListeners = () => {
  if (documentClickHandler) {
    document.removeEventListener('click', documentClickHandler);
  }
  if (keydownHandler) {
    document.removeEventListener('keydown', keydownHandler);
  }
};

// 切换下拉框
const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value;
};

// 关闭下拉框
const closeDropdown = () => {
  dropdownOpen.value = false;
};

// 处理选项点击
const handleOptionClick = (option, index) => {
  if (editing.index === index) return;
  selectOption(option);
};

// 选择选项
const selectOption = (option) => {
  emit('update:modelValue', option.value);
  emit('change', option.value, option);
  closeDropdown();
};

// 清除选择
const clearSelection = () => {
  emit('update:modelValue', '');
  emit('change', '', null);
};

// 开始编辑
const startEdit = (index) => {
  editing.index = index;
  editing.value = mergedOptions.value[index].alias;
  
  nextTick(() => {
    if (editInput.value) {
      editInput.value.focus();
      editInput.value.select();
    }
  });
};

// 处理回车键
const handleEnterKey = (e) => {
  e.preventDefault(); // 阻止默认行为
  saveEdit();
};

// 保存编辑
const saveEdit = () => {
  const { index, value } = editing;
  if (index === -1) return;
  
  const trimmed = value.trim();
  
  // 验证输入
  if (!trimmed) {
    emit('edit-error', '别名不能为空');
    // 恢复原来的值
    editing.value = mergedOptions.value[index].alias;
    return;
  }
  
  // 检查别名是否与其他选项重复
  const hasDuplicate = mergedOptions.value.some((item, i) => {
    return i !== index && item.alias === trimmed;
  });
  
  if (hasDuplicate) {
    emit('edit-error', '选项别名已存在，请使用其他名称');
    // 恢复原来的值
    editing.value = mergedOptions.value[index].alias;
    return;
  }
  
  // 如果没有变化，直接退出编辑
  if (trimmed === mergedOptions.value[index].alias) {
    cancelEdit();
    return;
  }
  
  // 更新别名
  const oldAlias = mergedOptions.value[index].alias;
  mergedOptions.value[index].alias = trimmed;
  
  // 触发编辑成功事件
  emit('edit-success', {
    index: index,
    value: mergedOptions.value[index].value,
    oldAlias: oldAlias,
    newAlias: trimmed
  });
  
  // 如果当前选中的选项被编辑，同步更新
  if (selected.value && selected.value.value === mergedOptions.value[index].value) {
    emit('update:modelValue', mergedOptions.value[index].value);
  }
  
  // 保存到本地存储
  saveAliasesToStorage();
  
  // 重置编辑状态
  editing.index = -1;
  editing.value = '';
};

// 取消编辑
const cancelEdit = () => {
  editing.index = -1;
  editing.value = '';
};

// 保存别名
const saveAlias = (index) => {
  // 触发保存事件
  emit('save-alias', {
    index: index,
    value: mergedOptions.value[index].value,
    alias: mergedOptions.value[index].alias
  });
  
  // 更新本地存储
  saveAliasesToStorage();
  
  // 如果当前选中的选项被保存，同步更新
  if (selected.value && selected.value.value === mergedOptions.value[index].value) {
    emit('update:modelValue', mergedOptions.value[index].value);
  }
};

// 监听options变化
watch(
  () => props.options,
  (newOptions) => {
    loadAndMergeOptions(newOptions);
  },
  { immediate: true, deep: true }
);

// 监听merchantId变化，切换商户时重新加载别名
watch(
  () => props.merchantId,
  () => {
    loadAndMergeOptions(props.options);
  }
);

// 生命周期钩子
onMounted(() => {
  setupEventListeners();
});

onBeforeUnmount(() => {
  removeEventListeners();
});

// 暴露方法给父组件
defineExpose({
  saveToStorage,
  loadFromStorage,
  clearStorage,
  getCurrentOptions: () => [...mergedOptions.value],
  getStoredAliases: () => ({ ...storedAliases })
});
</script>

<style scoped>
.editable-select {
  position: relative;
  width: 100%;
  font-family: Arial, sans-serif;
  margin-bottom: 0;
}

.select-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 15px;
  height: 40px;
  border: 1px solid var(--color-border, #dcdfe6);
  border-radius: 6px;
  background: var(--color-surface, #fff);
  cursor: pointer;
  transition: all 0.3s ease;
}

.select-header:hover {
  border-color: var(--color-border, #c0c4cc);
}

.select-header.active {
  border-color: var(--brand-primary, #16a34a);
}

.select-value {
  flex: 1;
  font-size: 14px;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select-value.placeholder {
  color: var(--text-faint, #c0c4cc);
}

.select-arrow {
  font-size: 12px;
  color: var(--text-faint, #c0c4cc);
  transition: transform 0.3s ease;
  margin-left: 8px;
}

.select-arrow.active {
  transform: rotate(180deg);
  color: var(--text-secondary, #909399);
}

.clear-btn {
  font-size: 16px;
  color: var(--text-faint, #c0c4cc);
  cursor: pointer;
  margin-right: 4px;
  transition: all 0.2s ease;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  line-height: 1;
}

.clear-btn:hover {
  color: var(--text-faint, #909399);
  background-color: var(--color-hover, #f5f7fa);
}

/* 下拉框过渡动画 */
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: all 0.2s ease;
}

.dropdown-fade-enter,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.select-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 100%;
  border: 1px solid var(--color-border-soft, #e4e7ed);
  border-radius: 6px;
  background: var(--color-elevated, #fff);
  box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.08));
  z-index: 1000 !important;
  overflow: hidden;
}

.select-options {
  max-height: 280px;
  overflow-y: auto;
  padding: 4px 0;
}

.option-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.option-item:hover {
  background-color: var(--color-hover, #f5f7fa);
}

.option-item.selected {
  background-color: var(--color-danger-bg, #fff0f0);
}

.option-item.selected .alias-name {
  color: var(--brand-primary, #16a34a);
  font-weight: 500;
}

.option-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  margin-right: 12px;
  min-width: 0;
}

.alias-name {
  font-size: 14px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.original-name {
  font-size: 12px;
  color: var(--text-secondary, #909399);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: 'Courier New', monospace;
}

.option-edit-input {
  width: 100%;
  max-width: 300px;
  padding: 6px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  color: #303133;
  outline: none;
  transition: all 0.2s ease;
}

.option-edit-input:focus {
  border-color: var(--brand-primary, #16a34a);
  box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.15);
}

.option-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.edit-btn,
.save-btn {
  font-size: 12px;
  padding: 4px 12px;
  border: 1px solid var(--color-border, #dcdfe6);
  border-radius: 4px;
  background: var(--color-surface, #fff);
  color: var(--text-regular, #606266);
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  white-space: nowrap;
}

.edit-btn:hover {
  color: var(--brand-primary, #16a34a);
  border-color: var(--color-danger, #f5b7b7);
  background-color: var(--color-danger-bg, #fef0f0);
}

.save-btn:hover {
  color: var(--color-success, #67c23a);
  border-color: var(--color-success, #c2e7b0);
  background-color: var(--color-success-bg, #f0f9eb);
}

.option-item.editing {
  background-color: var(--color-hover, #fafafa);
}

/* 滚动条样式 */
.select-options::-webkit-scrollbar {
  width: 6px;
}

.select-options::-webkit-scrollbar-track {
  background: transparent;
}

.select-options::-webkit-scrollbar-thumb {
  background: var(--color-border, #dcdfe6);
  border-radius: 3px;
  transition: background 0.2s ease;
}

.select-options::-webkit-scrollbar-thumb:hover {
  background: var(--text-faint, #c0c4cc);
}

/* 空状态样式 */
.empty-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--text-secondary, #909399);
  font-size: 14px;
}

.empty-icon {
  font-size: 32px;
  margin-bottom: 10px;
  color: var(--text-faint, #c0c4cc);
}
</style>