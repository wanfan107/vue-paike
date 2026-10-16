<template>
  <div >
    <el-form
      ref="submitFormRef"
      class="submit-form"
      :model="ruleForm"
      :rules="rules"
      :label-width="labelWidth"
      :label-position="labelPosition"
      @keyup.enter.native="onSave"
    >
      <el-row :gutter="10">
        <el-col
          v-for="(item, index) in formList"
          :key="index"
          :span="item.colSpan || 24"
        >
          <el-form-item
            v-if="item.slot"
            :style="formStyle"
            :rules="item.rules"
            :prop="item.prop"
            :label="item.label"
          >
            <slot :name="item.prop" />
          </el-form-item>
          <template v-else>
            <el-divider v-if="item.name === 'title'" content-position="left">{{
              item.label
            }}</el-divider>
            <el-form-item
              :style="formStyle"
              :rules="item.rules"
              v-else-if="
                item.name !== 'title' && (item.show ? item.show() : true)
              "
              :prop="item.prop"
              :label="item.label"
            >
              <el-select
                :placeholder="item.placeholder"
                v-if="item.name === 'select'"
                v-model="ruleForm[item.prop]"
                :disabled="disabled || formatDisabled(item.disabled)"
                :multiple="item.multiple"
                clearable
                @change="(val) => defaultChange(item.prop, val)"
              >
                <el-option
                  v-for="optionItem in item.options"
                  :key="optionItem.value"
                  :value="optionItem.value"
                  :label="optionItem.name"
                >
                  <span style="float: left">{{ optionItem.name }}</span>
                  <span
                    v-if="optionItem.subLabel"
                    style="float: right; color: var(--text-secondary); font-size: 13px"
                    >{{ optionItem.subLabel }}</span
                  >
                </el-option>
              </el-select>

              <EditableSelect
                v-else-if="item.name === 'select1'"
                v-model="ruleForm[item.prop]"
                :placeholder="item.placeholder || t('common.pleaseSelect')"
                :options="item.options"
                :disabled="disabled || formatDisabled(item.disabled)"
                @change="(val) => defaultChange(item.prop, val)"
              />

              <!-- <el-select-tree
                v-else-if="item.name === 'selectTree'"
                v-model="ruleForm[item.prop]"
                :disabled="disabled || formatDisabled(item.disabled)"
                :multiple="item.multiple"
                clearable
                :check-strictly="item.checkStrictly"
                :node-key="item.nodeKey || 'code'"
                :props="item.props"
                :data="item.options"
                @change="(val) => defaultChange(item.prop, val)"
              /> -->
              <el-radio-group
                v-else-if="item.name === 'radio'"
                v-model="ruleForm[item.prop]"
                :disabled="disabled || formatDisabled(item.disabled)"
                clearable
                @change="(val) => defaultChange(item.prop, val)"
              >
                <el-radio-button
                  v-for="optionItem in item.options"
                  :key="optionItem.value"
                  :label="optionItem.value"
                  >{{ optionItem.name }}</el-radio-button
                >
              </el-radio-group>
              <el-switch
                v-else-if="item.name === 'switch'"
                v-model="ruleForm[item.prop]"
                :disabled="disabled || formatDisabled(item.disabled)"
                :active-value="item.activeValue"
                :inactive-value="item.inactiveValue"
                :active-text="item.activeText"
                :inactive-text="item.inactiveText"
                @change="(val) => defaultChange(item.prop, val)"
              />

              <el-input
                v-else-if="item.name === 'input'"
                v-model="ruleForm[item.prop]"
                :min="item.mim || 0"
                :max="item.max"
                :disabled="disabled || formatDisabled(item.disabled)"
                :rows="item.rows || 5"
                :type="item.type || 'text'"
                :placeholder="item.placeholder"
                :show-password="item.showPassword || false"
                @blur="() => defaultBlur(item.prop, ruleForm[item.prop])"
                @change="(val) => defaultChange(item.prop, val)"
                @input="(val) => handleInput(item.prop, val)"
              />
              <el-input-number
                v-else-if="item.name === 'el-input-number'"
                v-model="ruleForm[item.prop]"
                :step="1"
                :precision="0"
                :disabled="disabled || formatDisabled(item.disabled)"
                :rows="item.rows || 5"
                :placeholder="t('common.pleaseInput')"
                @change="(val) => defaultChange(item.prop, val)"
              />

              <el-date-picker
                v-else-if="item.name === 'datetime'"
                v-model="ruleForm[item.prop]"
                :disabled="disabled || formatDisabled(item.disabled)"
                :type="item.dateType"
                :start-placeholder="t('common.startDate')"
                :end-placeholder="t('common.endDate')"
                :value-format="item.valueFormat || 'yyyy-MM-dd HH:mm:ss'"
                @change="(val) => defaultChange(item.prop, val)"
              />

                 <!-- 支持自定义渲染函数 -->
              <component 
                v-else-if="item.name === 'custom' && item.render" 
                :is="renderCustomComponent(item)"
              />
              <div
                v-else
                :style="{
                  ...formStyle,
                  color: 'var(--text-faint, #00000040)',
                  width: '100%',
                  wordBreak: 'break-all',
                  whiteSpace: 'normal',
                  overflow: 'hidden',
                  lineHeight: '24px',
                }"
              >
               {{ ruleForm[item.prop] }}
              </div>
            </el-form-item>
          </template>
        </el-col>
        <slot />
      </el-row>
    </el-form>
    <slot name="footer" v-if="footer">
      <div
        :style="{
          ...formStyle,
          textAlign: 'center',
          width: '100%',
          paddingBottom: '20px',
          marginTop: '10px',
        }"
      >
        <el-button v-if="showClose" @click="onClose" >{{
          cancelText || t('common.reset')
        }}</el-button>
        <el-button
          :loading="loading"
          :disabled="loading"
          type="primary"
          @click="onSave"
          >{{ t('common.submit') }}</el-button
        >
      </div>
    </slot>
    <slot name="footer" v-if="footer1">
      <div
        :style="{
          ...formStyle,
          textAlign: 'center',
          width: '100%',
          paddingBottom: '20px',
          marginTop: '10px',
        }"
      >
        {{ t('common.mfaNotSupported') }}
      </div>
    </slot>
    <slot name="footer" v-if="footer2">
      <div
        :style="{
          ...formStyle,
          textAlign: 'center',
          width: '100%',
          paddingBottom: '20px',
          marginTop: '10px',
        }"
      >
        {{ t('common.ipWhitelistNotSupported') }}
      </div>
    </slot>
  </div>
</template>
<script setup>
import { ref, onMounted, h } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import EditableSelect from './EditableSelect.vue';

const { t } = useI18n();

// 定义组件属性
const props = defineProps({
  cancelText: {
    type: String,
    default: "",
  },
  labelWidth: {
    type: String,
    default: "100px",
  },
  labelPosition: {
    type: String,
    default: "top",
  },
  formStyle: {
    type: Object,
    default: () => ({
      marginLeft: "20px",
    }),
  },
  footer: {
    type: Boolean,
    default: true,
  },
  footer1: {     // 基本信息
    type: Boolean,
    default: false,
  },
  footer2: {     // 应用配置
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  formList: {
    type: Array,
    default: () => [],
  },
  ruleForm: {
    type: Object,
    default: () => {},
  },
  rules: {
    type: Object,
    default: () => {},
  },
  showClose: {
    type: Boolean,
    default: true,
  },
});

// 定义组件事件
const emit = defineEmits(['save', 'close', 'error', 'change', 'blur']);

// 定义组件状态
const submitFormRef = ref(null);

// 渲染自定义组件的方法
const renderCustomComponent = (item) => {
  const { ruleForm } = props;
  return {
    functional: true,
    render: (_, context) => {
      return item.render(h, context, ruleForm);
    }
  };
};

// 表单保存
const onSave = () => {
  submitFormRef.value.validate((valid) => {
    if (valid) {
      emit('save', props.ruleForm);
    } else {
      emit('error');
    }
  });
};

// 表单关闭
const onClose = () => {
  emit('close');
};

// 默认值改变处理
const defaultChange = (key, val) => {
  emit('change', { key, val });
};

// 默认失去焦点处理
const defaultBlur = (key, val) => {
  emit('blur', { key, val });
};

// 格式化禁用状态
const formatDisabled = (disabled) => {
  if (typeof disabled === "function") {
    return disabled();
  } else {
    return disabled;
  }
};

// 处理输入事件，去除所有空格
const handleInput = (prop, val) => {
  if (val) {
    props.ruleForm[prop] = val.replace(/\s/g, '');
  }
};
</script>
<style lang="scss" scoped>
.submit-form {
  .el-form-item__content {
    .el-select {
      width: 100%;
    }
  }
  .el-form-item {
    line-height: 24px !important;
    margin-bottom: 14px !important;
  }
  .el-form-item__label {
    font-size: 12px !important;
    color: var(--text-primary) !important;
    padding-bottom: 0 !important;
  }
}
:deep(.el-input__inner) {
  border:0 !important;
}
.container {
  max-width: 600px;
  margin: 0 auto;
  background-color: var(--color-surface, #fff);
  padding: 30px;
  border-radius: 8px;
  box-shadow: var(--shadow-md, 0 2px 12px 0 rgba(0, 0, 0, 0.1));
}

h2 {
  text-align: center;
  color: #409eff;
  margin-bottom: 30px;
  font-weight: 500;
}

// .editable-select {
//   margin-bottom: 25px;
// }

.info-section {
  background-color: var(--color-success-bg, #f0f9eb);
  border: 1px solid #c2e7b0;
  border-radius: 4px;
  padding: 15px;
  margin-top: 25px;
}

.info-section p {
  margin: 8px 0;
  font-size: 14px;
  color: var(--color-success, #67c23a);
}

// :deep(.password-strength-container) {
//   margin-top: 10px;
//   padding: 10px;
//   background-color: #f8f9fa;
//   border-radius: 6px;
// }

:deep(.password-strength-header) {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-regular);
  margin-bottom: 8px;
}

:deep(.password-strength-bar) {
  height: 10px;
  background-color: var(--color-border-soft, #e4e7ed);
  border-radius: 5px;
  overflow: hidden;
}

:deep(.password-strength-fill) {
  height: 100%;
  width: 0%;
  transition: width 0.3s, background-color 0.3s;
}

:deep(.password-strength-text) {
  margin-top: 5px;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
}
:deep(.el-input__inner:-webkit-autofill),
:deep(.el-input__inner:-webkit-autofill:hover),
:deep(.el-input__inner:-webkit-autofill:focus),
:deep(.el-input__inner:-webkit-autofill:active) {
  -webkit-background-clip: text;
  background-color: var(--color-surface, #fff) !important;
  background-clip: text;
  transition: background-color 5000s ease-in-out 0s;
}
</style>
