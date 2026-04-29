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
              <div class="original-name">钱包地址: {{ option.original }}</div>
            </div>
            <div class="option-actions">
              <el-button class="edit-btn"  size="small" @click.stop="startEdit(index)">编辑别名</el-button>
              <el-button class="save-btn" type="success"  size="small" @click.stop="saveAlias(index)">保存</el-button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>
<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';

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
    default: 'editable_select_aliases'
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

// 加载本地存储并合并选项
const loadAndMergeOptions = (defaultOptions) => {
  try {
    const stored = localStorage.getItem(props.storageKey);
    Object.assign(storedAliases, stored ? JSON.parse(stored) : {});
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
        aliasesToSave[option.value] = option.alias;
      }
    });
    
    localStorage.setItem(props.storageKey, JSON.stringify(aliasesToSave));
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
  localStorage.removeItem(props.storageKey);
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
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
  margin-bottom: 0;
}

.select-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  border: 1px solid #dcdfe6;
  border-radius: 15px;
  background: #fff;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.select-header:hover {
  border-color: #c0c4cc;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* .select-header.active {
  border-color: #63ff40;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
} */

.select-value {
  flex: 1;
  font-size: 14px;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.3s;
}

.select-value.placeholder {
  color: #c0c4cc;
}

.select-arrow {
  font-size: 12px;
  color: #909399;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-left: 5px;
}

.select-arrow.active {
  transform: rotate(180deg);
}

/* 下拉框过渡动画 */
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-fade-enter,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.select-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  margin-top: 4px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, .1);
  z-index: 1000 !important;
  overflow: hidden;
}

.select-options {
  max-height: 250px;
  overflow-y: auto;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.option-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: auto;
  padding: 0px 15px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.2s ease;
}

.option-item:last-child {
  border-bottom: none;
}

.option-item.editing {
  background-color: #f0f9ff;
  /* transform: translateX(4px); */
}

.option-item:hover {
  background: #f5f7fa;
  /* transform: translateX(4px); */
}

.option-item.selected {
  background: #ecf5ff;
}

.option-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  margin-right: 10px;
  min-width: 0;
}

.alias-name {
  font-size: 14px;
  color: #606266;
  /* margin-bottom: 4px; */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.3s;
}

.option-item:hover .alias-name {
  color: #409EFF;
}

.original-name {
  font-size: 12px;
  color: #909399;
  font-style: italic;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.option-edit-input {
  width: 85%;
  padding: 6px 10px;
  border: 1px solid #409EFF;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.option-edit-input:focus {
  border-color: #ff6666;
  box-shadow: 0 0 0 3px rgba(255, 117, 102, 0.2);
}

.clear-btn {
  font-size: 18px;
  color: #909399;
  cursor: pointer;
  margin-right: 8px;
  transition: all 0.3s;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  line-height: 1;
}

.clear-btn:hover {
  color: #fff;
  background-color: #f56c6c;
  transform: scale(1.1);
}

.option-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  margin-top: 18px;
   /* align-items: center;  */
}

.edit-btn, .reset-btn {
  font-size: 12px;
  padding: 4px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
}

.edit-btn:hover {
  color: #fff;
  background-color: #db0011;
  border-color: #db0011;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(255, 64, 64, 0.3);
}

.save-btn:hover {
  color: #fff;
  background-color: #67C23A;
  border-color: #67C23A;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(103, 194, 58, 0.3);
}

/* 滚动条样式 */
.select-options::-webkit-scrollbar {
  width: 6px;
}

.select-options::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.select-options::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
  transition: background 0.3s;
}

.select-options::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 编辑按钮的脉冲动画 */
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 64, 64, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(255, 83, 64, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 64, 64, 0);
  }
}

.option-item.editing {
  animation: pulse 2s infinite;
}

</style>