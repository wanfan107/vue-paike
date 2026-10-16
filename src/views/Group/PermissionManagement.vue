<template>
  <div class="app-page">
    <header class="app-page-header">
      <h1>{{ t('menu.permissionManagement') }}</h1>
    </header>

    <main>
        <!-- 操作列表和新增按钮 -->
        <div class="section">
          <div class="section-header">
            <h3 class="section-title">{{ t('order.groupPermission.title') }}</h3>
            <el-button type="primary" @click="showAddDialog = true">
              <el-icon><Plus /></el-icon>
              {{ t('order.groupPermission.addOperator') }}
            </el-button>
          </div>

          <!-- 操作员列表 -->
          <div class="operator-list">
            <el-table
              :data="operators" 
              border 
              stripe 
              style="width: 100%"
              @row-click="handleRowClick"
              highlight-current-row
            >
             
              <el-table-column prop="email" :label="t('order.groupPermission.table.email')" width="180" align="left" />
              <el-table-column prop="name" :label="t('order.groupPermission.table.alias')" width="100" align="center" />
              <el-table-column prop="roleName" :label="t('order.groupPermission.table.role')" width="120" align="center">
                <template  #default="{ row }">
                  <el-tooltip :content="getRoleDescription(row.roleCode)" placement="top">
                    <el-tag :type="getRoleTagType(row.roleCode)" size="small">
                      {{ row.roleName }}
                    </el-tag>
                  </el-tooltip>
                </template>
              </el-table-column>
              <el-table-column prop="merchantCodes" :label="t('order.groupPermission.table.operableMerchants')" width="260" align="left">
                <template #default="{ row }">
                  <div class="merchant-codes-wrapper">
                    <div v-if="row && row.merchantCodes && row.merchantCodes.length > 0">
                      <div class="merchant-count-label">{{ t('order.groupPermission.table.merchantCount', { count: row.merchantCodes.length }) }}</div>
                      <div class="merchant-codes-tags">
                        <el-tag
                          v-for="code in row.merchantCodes"
                          :key="code"
                          type="info"
                          size="small"
                          class="merchant-tag-item"
                        >
                          {{ code }}
                        </el-tag>
                      </div>
                    </div>
                    <span v-else class="merchant-empty">-</span>
                  </div>
                </template>
              </el-table-column>
                    <el-table-column prop="status" :label="t('order.groupPermission.table.status')" width="80" align="center">
                <template #default="{ row }">
                  <StatusPill :type="row.status === 0 ? 'success' : 'neutral'" :text="row.status === 0 ? t('order.groupPermission.statusText.enable') : t('order.groupPermission.statusText.disable')" />
                </template>
              </el-table-column>
              <el-table-column prop="isActivated" :label="t('order.groupPermission.table.emailActivated')" width="120" align="center">
                <template #default="{ row }">
                  <StatusPill :type="row.isActivated ? 'success' : 'neutral'" :text="row.isActivated ? t('order.groupPermission.statusText.yes') : t('order.groupPermission.statusText.no')" />
                </template>
              </el-table-column>
              <el-table-column prop="hasGoogleAuth" :label="t('order.groupPermission.table.mfaBound')" width="120" align="center">
                <template #default="{ row }">
                  <StatusPill :type="row.hasGoogleAuth ? 'success' : 'neutral'" :text="row.hasGoogleAuth ? t('order.groupPermission.statusText.yes') : t('order.groupPermission.statusText.no')" />
                </template>
              </el-table-column>
              <el-table-column prop="createdOn" :label="t('order.groupPermission.table.createTime')" width="170" align="center">
                <template #default="{ row }">
                  {{ formatDate(row.createdOn) }}
                </template>
              </el-table-column>
              <el-table-column :label="t('order.groupPermission.table.action')" width="340" fixed="right" align="center">
                <template #default="{ row }">
                  <div class="action-cell" @click.stop.prevent>
                    <el-button type="primary" plain size="small" @click.stop="editOperator(row)">
                      {{ t('order.groupPermission.action.edit') }}
                    </el-button>
                    <el-button type="primary" plain size="small" @click.stop="showResetPasswordDialog(row)">
                      {{ t('order.groupPermission.action.resetPassword') }}
                    </el-button>
                    <el-button v-if="row.roleCode !== 'admin'" type="danger" plain size="small" @click.stop="openChangeEmailDialog(row)">
                      {{ t('order.groupPermission.action.changeEmail') }}
                    </el-button>
                    <!-- 这里的删除是，逻辑删除 -->
                    <el-button v-if="row.roleCode !== 'admin'" type="danger" plain size="small" @click.stop="softDeleteOperator(row)">
                      {{ t('order.groupPermission.action.delete') }}
                    </el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <!-- 新增操作员对话框 -->
        <el-dialog
          v-model="showAddDialog"
          :title="t('order.groupPermission.dialog.addTitle')"
          width="600px"
          :close-on-click-modal="false"
          @close="resetForm"
        >
          <el-form :model="formData" :rules="formRules" ref="formRef" label-width="120px">
            <el-form-item :label="t('order.groupPermission.form.email')" prop="email">
              <el-input
                v-model="formData.email"
                :placeholder="t('order.groupPermission.form.emailPlaceholder')"
                clearable
                @keyup.enter="saveOperator"
              />
            </el-form-item>

            <el-form-item :label="t('order.groupPermission.form.alias')" prop="name">
              <el-input
                v-model="formData.name"
                :placeholder="t('order.groupPermission.form.aliasPlaceholder')"
                clearable
                maxlength="50"
                @keyup.enter="saveOperator"
              />
            </el-form-item>

            <el-form-item :label="t('order.groupPermission.form.accountType')" prop="roleCode">
              <el-radio-group v-model="formData.roleCode">
                <el-radio value="finance">
                  {{ t('order.groupPermission.form.financeAccount') }}
                </el-radio>
                <el-radio value="operator">
                  {{ t('order.groupPermission.form.operatorAccount') }}
                </el-radio>
              </el-radio-group>
              <el-tooltip :content="t('order.groupPermission.form.accountTypeTip')" placement="top">
                <span class="account-type-tip">?</span>
              </el-tooltip>
            </el-form-item>

            <el-form-item :label="t('order.groupPermission.form.accountStatus')" prop="status">
              <el-radio-group v-model="formData.status">
                <el-radio :value="0">
                  {{ t('order.groupPermission.statusText.enable') }}
                </el-radio>
                <el-radio :value="6">
                  {{ t('order.groupPermission.statusText.disable') }}
                </el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item :label="t('order.groupPermission.form.manageMerchants')" prop="merchantCodes">
              <el-select
                v-model="formData.merchantCodes"
                multiple
                filterable
                :placeholder="t('order.groupPermission.form.manageMerchantsPlaceholder')"
                style="width: 100%"
                collapse-tags
                collapse-tags-tooltip
              >
                <el-option
                  v-for="merchant in allMerchants"
                  :key="merchant.code"
                  :label="merchant.name"
                  :value="merchant.code"
                >
                  <div class="merchant-option">
                    <span class="merchant-name">{{ merchant.name }}</span>
                    <span class="merchant-code">{{ merchant.code }}</span>
                    <el-tag 
                       :type="merchant.isGroup ? 'warning' : 'danger'" 
                      size="small"
                      effect="plain"
                    >
                      {{ merchant.isGroup ? t('order.groupPermission.statusText.group') : t('order.groupPermission.statusText.merchant') }}
                    </el-tag>
                    <span v-if="merchant.qq" class="merchant-qq">{{ merchant.qq }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item :label="t('order.groupPermission.form.mfaCode')" prop="code">
              <el-input
                v-model="formData.code"
                :placeholder="t('order.groupPermission.form.mfaPlaceholder')"
                clearable
                @keyup.enter="saveOperator"
              />
            </el-form-item>
          </el-form>

          <template #footer>
            <el-button @click="showAddDialog = false">{{ t('order.groupPermission.button.cancel') }}</el-button>
            <el-button type="primary" @click="saveOperator" :loading="saving">
              {{ t('order.groupPermission.button.confirm') }}
            </el-button>
          </template>
        </el-dialog>

        <!-- 编辑操作员对话框 -->
        <el-dialog
          v-model="showEditDialog"
          :title="t('order.groupPermission.dialog.editTitle')"
          width="600px"
          :close-on-click-modal="false"
          @close="resetEditForm"
        >
          <el-form :model="editFormData" :rules="formRules" ref="editFormRef" label-width="120px" >
            <el-form-item :label="t('order.groupPermission.form.email')" prop="email">
              <el-input
                v-model="editFormData.email"
                :placeholder="t('order.groupPermission.form.emailPlaceholder')"
                clearable
                disabled
                @keyup.enter="updateOperator"
              />
            </el-form-item>

            <el-form-item :label="t('order.groupPermission.form.alias')" prop="name">
              <el-input
                v-model="editFormData.name"
                :placeholder="t('order.groupPermission.form.aliasPlaceholder')"
                clearable
                maxlength="50"
                @keyup.enter="updateOperator"
              />
            </el-form-item>

            <el-form-item :label="t('order.groupPermission.form.accountType')" prop="roleCode">
              <el-radio-group v-model="editFormData.roleCode" :disabled="editFormData.roleCode === 'admin'">
                <el-radio v-if="editFormData.roleCode === 'admin'" value="admin">
                  {{ t('order.groupPermission.form.admin') }}
                </el-radio>
                <template v-else>
                  <el-radio value="finance">
                    {{ t('order.groupPermission.form.financeAccount') }}
                  </el-radio>
                  <el-radio value="operator">
                    {{ t('order.groupPermission.form.operatorAccount') }}
                  </el-radio>
                </template>
              </el-radio-group>
              <el-tooltip :content="t('order.groupPermission.form.accountTypeTip')" placement="top">
                <span class="account-type-tip">?</span>
              </el-tooltip>
            </el-form-item>

            <el-form-item :label="t('order.groupPermission.form.accountStatus')" prop="status">
              <el-radio-group v-model="editFormData.status" :disabled="editFormData.roleCode === 'admin'">
                <el-radio :value="0">
                  {{ t('order.groupPermission.statusText.enable') }}
                </el-radio>
                <el-radio :value="6">
                  {{ t('order.groupPermission.statusText.disable') }}
                </el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item :label="t('order.groupPermission.form.manageMerchants')" prop="merchantCodes">
              <el-select
                v-model="editFormData.merchantCodes"
                multiple
                filterable
                :placeholder="t('order.groupPermission.form.manageMerchantsPlaceholder')"
                style="width: 100%"
                collapse-tags
                collapse-tags-tooltip
              >
                <el-option
                  v-for="merchant in allMerchants"
                  :key="merchant.code"
                  :label="merchant.name"
                  :value="merchant.code"
                >
                  <div class="merchant-option">
                    <span class="merchant-name">{{ merchant.name }}</span>
                    <span class="merchant-code">{{ merchant.code }}</span>
                    <!-- <el-tag 
                      :type="merchant.type === 'finance' ? 'success' : 'warning'" 
                      size="small"
                      effect="plain"
                    >
                      {{ merchant.type === 'finance' ? '财务' : '运营' }}
                    </el-tag> -->
                    <el-tag 
                       :type="merchant.isGroup ? 'warning' : 'danger'" 
                      size="small"
                      effect="plain"
                    >
                      {{ merchant.isGroup ? t('order.groupPermission.statusText.group') : t('order.groupPermission.statusText.merchant') }}
                    </el-tag>
                                        <span v-if="merchant.qq" class="merchant-qq">{{ merchant.qq }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item :label="t('order.groupPermission.form.createTime')">
              <div class="create-time-display">
                <el-icon><Clock /></el-icon>
                <span>{{ editFormData.createTime }}</span>
              </div>
            </el-form-item>

            <el-form-item :label="t('order.groupPermission.form.mfaCode')" prop="code">
              <el-input
                v-model="editFormData.code"
                :placeholder="t('order.groupPermission.form.mfaPlaceholder')"
                clearable
              />
            </el-form-item>
          </el-form>

          <template #footer>
            <el-button @click="showEditDialog = false">{{ t('order.groupPermission.button.cancel') }}</el-button>
            <el-button type="primary" @click="updateOperator" :loading="updating">
              {{ t('order.groupPermission.button.update') }}
            </el-button>
          </template>
        </el-dialog>

        <!-- 查看基本信息对话框（只读） -->
        <el-dialog
          v-model="showViewDialog"
          :title="t('order.groupPermission.dialog.viewTitle')"
          width="550px"
        >
          <div class="view-info">
            <div class="info-row">
              <div class="info-label">{{ t('order.groupPermission.view.email') }}</div>
              <div class="info-value">{{ viewingOperator.email }}</div>
            </div>
            <div class="info-row">
              <div class="info-label">{{ t('order.groupPermission.view.alias') }}</div>
              <div class="info-value">{{ viewingOperator.name || '-' }}</div>
            </div>
            <div class="info-row">
              <div class="info-label">{{ t('order.groupPermission.view.role') }}</div>
              <div class="info-value">
                <el-tag :type="getRoleTagType(viewingOperator.roleCode)" size="small">
                  {{ viewingOperator.roleName }}
                </el-tag>
              </div>
            </div>
            <div class="info-row">
              <div class="info-label">{{ t('order.groupPermission.view.status') }}</div>
              <div class="info-value">
                <StatusPill :type="viewingOperator.status === 0 ? 'success' : 'neutral'" :text="viewingOperator.status === 0 ? t('order.groupPermission.statusText.enable') : t('order.groupPermission.statusText.disable')" />
              </div>
            </div>
            <div class="info-row">
              <div class="info-label">{{ t('order.groupPermission.view.emailActivated') }}</div>
              <div class="info-value">
                <StatusPill :type="viewingOperator.isActivated ? 'success' : 'neutral'" :text="viewingOperator.isActivated ? t('order.groupPermission.statusText.yes') : t('order.groupPermission.statusText.no')" />
              </div>
            </div>
            <div class="info-row">
              <div class="info-label">{{ t('order.groupPermission.view.mfaBound') }}</div>
              <div class="info-value">
                <StatusPill :type="viewingOperator.hasGoogleAuth ? 'success' : 'neutral'" :text="viewingOperator.hasGoogleAuth ? t('order.groupPermission.statusText.yes') : t('order.groupPermission.statusText.no')" />
              </div>
            </div>
            <div class="info-row">
              <div class="info-label">{{ t('order.groupPermission.view.operableMerchants') }}</div>
              <div class="info-value">
                <div class="merchant-tags">
                  <span v-for="(code, idx) in viewingOperator.merchantCodes" :key="code" style="margin-left: 4px;">
                    <el-tag size="small" type="info">{{ code }}</el-tag>
                  </span>
                  <span v-if="(!viewingOperator.merchantCodes || viewingOperator.merchantCodes.length === 0)" class="no-data">{{ t('order.groupPermission.view.noMerchant') }}</span>
                </div>
              </div>
            </div>
            <div class="info-row">
              <div class="info-label">{{ t('order.groupPermission.view.createTime') }}</div>
              <div class="info-value">{{ formatDate(viewingOperator.createTime) }}</div>
            </div>
          </div>
          <template #footer>
            <el-button @click="showViewDialog = false">{{ t('order.groupPermission.button.close') }}</el-button>
          </template>
        </el-dialog>

        <!-- 重置密码对话框 -->
        <el-dialog
          v-model="showResetDialog"
          :title="t('order.groupPermission.dialog.resetTitle')"
          width="450px"
          :close-on-click-modal="false"
        >
          <div class="reset-password-content">
            <p class="confirm-text">{{ t('order.groupPermission.reset.confirmText', { email: resettingOperator.email }) }}</p>
            <p class="hint-text">{{ t('order.groupPermission.reset.hintText') }}</p>
          </div>



          <template #footer>
            <el-button @click="showResetDialog = false">{{ t('order.groupPermission.button.cancel') }}</el-button>
            <el-button type="primary" @click="resetPassword" :loading="resetting">
              {{ t('order.groupPermission.button.confirmSend') }}
            </el-button>
          </template>
        </el-dialog>

        <!-- 变更邮箱对话框 -->
        <el-dialog
          v-model="showChangeEmailDialog"
          :title="t('order.groupPermission.dialog.changeEmailTitle')"
          width="450px"
          :close-on-click-modal="false"
        >
          <el-form :model="changeEmailForm" :rules="changeEmailRules" ref="changeEmailFormRef" label-width="100px">
            <el-form-item :label="t('order.groupPermission.form.currentEmail')">
              <span>{{ changeEmailOperator.email }}</span>
            </el-form-item>
            <el-form-item :label="t('order.groupPermission.form.newEmail')" prop="newEmail">
              <el-input
                v-model="changeEmailForm.newEmail"
                :placeholder="t('order.groupPermission.form.newEmailPlaceholder')"
                clearable
                maxlength="80"
              />
            </el-form-item>
            <el-form-item :label="t('order.groupPermission.form.mfaCode')" prop="gcode">
              <el-input
                v-model="changeEmailForm.gcode"
                :placeholder="t('order.groupPermission.form.mfaPlaceholder')"
                clearable
                maxlength="6"
              />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="showChangeEmailDialog = false">{{ t('order.groupPermission.button.cancel') }}</el-button>
            <el-button type="primary" @click="changeEmail" :loading="changingEmail">
              {{ t('order.groupPermission.button.confirm') }}
            </el-button>
          </template>
        </el-dialog>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Plus, Clock } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { http } from '@/api';
import useUserStore from '@/stores/user';
import StatusPill from '@/components/StatusPill.vue';

defineProps({
  title: {
    type: String,
    default: "",
  },
});

const userStore = useUserStore();

// 假数据 - 完整的商户列表
const { t } = useI18n();

const allMerchants = ref([]);

// 假数据 - 操作员列表
const operators = ref([
  
]);

// 状态变量
const showAddDialog = ref(false);
const showEditDialog = ref(false);
const showViewDialog = ref(false);
const showResetDialog = ref(false);
const showChangeEmailDialog = ref(false);
const saving = ref(false);
const updating = ref(false);
const resetting = ref(false);
const changingEmail = ref(false);
const formRef = ref(null);
const editFormRef = ref(null);
const changeEmailFormRef = ref(null);
const viewingOperator = ref({});
const resettingOperator = ref({});
const changeEmailOperator = ref({});

// 表单数据
const formData = reactive({
  email: '',
  name: '',
  code: '',
  roleCode: 'operator',
  status: 0,
  googleAuth: false,
  merchantCodes: []
});



// 重置密码表单验证规则
const resetFormRules = computed(() => ({
  code: [
    { required: true, message: t('order.groupPermission.rules.mfaRequired'), trigger: 'blur' },
    { min: 6, max: 6, message: t('order.groupPermission.rules.mfaLength'), trigger: 'blur' }
  ]
}));

// 变更邮箱表单数据
const changeEmailForm = reactive({
  newEmail: '',
  gcode: ''
});

// 变更邮箱表单验证规则
const changeEmailRules = computed(() => ({
  newEmail: [
    { required: true, message: t('order.groupPermission.rules.newEmailRequired'), trigger: 'blur' },
    { type: 'email', message: t('order.groupPermission.rules.emailFormat'), trigger: 'blur' },
    { max: 80, message: t('order.groupPermission.rules.emailMax'), trigger: 'blur' }
  ],
  gcode: [
    { required: true, message: t('order.groupPermission.rules.mfaRequired'), trigger: 'blur' },
    { min: 6, max: 6, message: t('order.groupPermission.rules.mfaLength'), trigger: 'blur' }
  ]
}));

// 编辑表单数据
const editFormData = reactive({
  userId: null,
  email: '',
  name: '',
  code: '',
  roleCode: '',
  status: 0,
  merchantCodes: [],
  createTime: ''
});

// 表单验证规则
const formRules = computed(() => ({
  email: [
    { required: true, message: t('order.groupPermission.rules.emailRequired'), trigger: 'blur' },
    { type: 'email', message: t('order.groupPermission.rules.emailFormat'), trigger: 'blur' },
    { max: 80, message: t('order.groupPermission.rules.emailMax'), trigger: 'blur' },
  ],
  name: [
    { required: true, message: t('order.groupPermission.rules.aliasRequired'), trigger: 'blur' },
    { max: 50, message: t('order.groupPermission.rules.aliasMax'), trigger: 'blur' }
  ],
  code: [
    { required: true, message: t('order.groupPermission.rules.mfaRequired'), trigger: 'blur' },
    { min: 6, max: 6, message: t('order.groupPermission.rules.mfaLength'), trigger: 'blur' }
  ],
  roleCode: [
    { required: true, message: t('order.groupPermission.rules.accountTypeRequired'), trigger: 'change' }
  ],
  merchantCodes: [
    {
      required: true,
      message: t('order.groupPermission.rules.merchantRequired'),
      trigger: 'change',
      validator: (rule, value, callback) => {
        if (!value || value.length === 0) {
          callback(new Error(t('order.groupPermission.rules.merchantRequired')));
        } else {
          callback();
        }
      }
    }
  ]
}));

// 加载商户列表
const loadMerchants = async () => {
  try {
    const res = await http.getGroupMerchants();
    if (res.code==200) {
      allMerchants.value = res.data.filter(m => !m.code?.startsWith('G'));   // 过滤掉集团商户
    }
  } catch (error) {
    ElMessage.error(t('order.groupPermission.msg.loadMerchantsFailed'));
  }
};

// 加载操作员列表
const loadOperators = async () => {
  try {
    const res = await http.getGroupUsers();
      if (res.code==200) {
        // res.data.forEach(item => {
        //   if (item.roleCode == 'admin') {
        //     item.merchantCodes=userStore.merchants.filter(m => !m.code?.startsWith('G')).map(merchant => merchant.code);
        //   }
        // });
      operators.value = res.data;

    }
  } catch (error) {
    ElMessage.error(t('order.groupPermission.msg.loadOperatorsFailed'));
  }
};

onMounted(() => {
  loadMerchants();
  loadOperators();
});



// 获取角色标签类型
const getRoleTagType = (roleCode) => {
  // if (roleCode === 'admin') return 'danger';
  // if (roleCode === 'financial' || roleCode === 'finance') return 'warning';
  // return 'success';
  return 'danger';
};

const getRoleDescription = (roleCode) => {
  const descriptions = {
    admin: t('order.groupPermission.roleDesc.admin'),
    finance: t('order.groupPermission.roleDesc.finance'),
    operator: t('order.groupPermission.roleDesc.operator')
  };
  return descriptions[roleCode] || '';
};

// 将商户代码数组分成每组3个
const getMerchantGroups = (codes) => {
  if (!codes || codes.length === 0) return [];
  const groups = [];
  for (let i = 0; i < codes.length; i += 3) {
    groups.push(codes.slice(i, i + 3));
  }
  return groups;
};

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// 获取当前时间
const getCurrentTime = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// 点击行查看基本信息
const handleRowClick = (row, event) => {
  viewingOperator.value = {
    ...row,
    email: row.email || row.username || '',
    name: row.name || '',
    roleName: row.roleName || '',
    roleCode: row.roleCode || '',
    status: row.status || 0,
    isActivated: row.isActivated || false,
    hasGoogleAuth: row.hasGoogleAuth || false,
    merchantCodes: row.merchantCodes || [],
    createTime: row.createdOn || row.createTime || ''
  };
  showViewDialog.value = true;
};

// 重置表单
const resetForm = () => {
  formData.email = '';
  formData.name = '';
  formData.code = '';
  formData.roleCode = 'operator';
  formData.merchantCodes = [];
  if (formRef.value) {
    formRef.value.resetFields();
  }
};

// 重置编辑表单
const resetEditForm = () => {
  if (editFormRef.value) {
    editFormRef.value.resetFields();
  }
};

// 编辑操作员
const editOperator = (operator) => {
  editFormData.userId = operator.userId;
  editFormData.email = operator.email || '';
  editFormData.name = operator.name || '';
  editFormData.roleCode = operator.roleCode === 'admin' ? 'admin' : operator.roleCode === 'finance' ? 'finance' : 'operator';
  editFormData.status = operator.status ?? 0;
  editFormData.merchantCodes = operator.merchantCodes ? [...operator.merchantCodes] : [];
  editFormData.createTime = operator.createdOn || operator.createTime || '';
  showEditDialog.value = true;
};

// 更新操作员
const updateOperator = async () => {
  try {
    await editFormRef.value.validate();
    
    updating.value = true;
    
    const res = await http.updateGroupUser({
      userId: editFormData.userId,
      name: editFormData.name,
      roleCode: editFormData.roleCode,
      status: editFormData.status,
      merchantCodes: editFormData.merchantCodes,
      gcode: editFormData.code,
    });
    console.log(res);
    
    ElMessage.success(t('order.groupPermission.msg.updateSuccess'));
    showEditDialog.value = false;
    loadOperators();
  } catch (error) {
    ElMessage.error(error.response?.data?.msg || t('order.groupPermission.msg.updateFailed'));
  } finally {
    updating.value = false;
  }
};

// 删除操作员（物理删除，已隐藏，保留代码备用）
const deleteOperator = (operator) => {
  const currentUserEmail = userStore.roleCode || '';
  if (operator.roleCode === currentUserEmail) {
    ElMessage.warning(t('order.groupPermission.msg.deleteCurrentUser'));
    return;
  }

  ElMessageBox.confirm(
    t('order.groupPermission.msg.deleteConfirm', { email: operator.email || operator.email }),
    t('order.groupPermission.dialog.deleteTitle'),
    {
      confirmButtonText: t('order.groupPermission.button.confirm'),
      cancelButtonText: t('order.groupPermission.button.cancel'),
      type: 'warning'
    }
  ).then(async () => {
    try {
      await http.deleteGroupUser({ userId: operator.autoId || operator.userId });
      const index = operators.value.findIndex(op => op.autoId === (operator.autoId || operator.userId));
      if (index !== -1) {
        operators.value.splice(index, 1);
      }
      ElMessage.success(t('order.groupPermission.msg.deleteSuccess'));
    } catch (error) {
      ElMessage.error(error.response?.data?.msg || t('order.groupPermission.msg.deleteFailed'));
    }
  }).catch(() => {});
};

// 逻辑删除操作员
const softDeleteOperator = (operator) => {
  const currentUserEmail = userStore.roleCode || '';
  if (operator.roleCode === currentUserEmail) {
    ElMessage.warning(t('order.groupPermission.msg.deleteCurrentUser'));
    return;
  }

  ElMessageBox.confirm(
    t('order.groupPermission.msg.deleteConfirmMsg', { email: operator.email || operator.email }),
    t('order.groupPermission.dialog.deleteTitle'),
    {
      confirmButtonText: t('order.groupPermission.button.confirmDelete'),
      cancelButtonText: t('order.groupPermission.button.cancel'),
      type: 'warning'
    }
  ).then(async () => {
    try {
      await http.softDeleteGroupUser({ userId: operator.autoId || operator.userId });
      loadOperators();
      ElMessage.success(t('order.groupPermission.msg.deleteSuccess'));
    } catch (error) {
      ElMessage.error(error.response?.data?.msg || t('order.groupPermission.msg.deleteFailed'));
    }
  }).catch(() => {});
};

// 显示重置密码对话框
const showResetPasswordDialog = (operator) => {
  resettingOperator.value = operator;
  showResetDialog.value = true;
};

// 显示变更邮箱对话框
const openChangeEmailDialog = (operator) => {
  changeEmailOperator.value = operator;
  changeEmailForm.newEmail = '';
  changeEmailForm.gcode = '';
  if (changeEmailFormRef.value) {
    changeEmailFormRef.value.resetFields();
  }
  showChangeEmailDialog.value = true;
};

// 变更邮箱
const changeEmail = async () => {
  try {
    await changeEmailFormRef.value.validate();
    
    changingEmail.value = true;
    
    await http.updateGroupUserEmail({
      userId: changeEmailOperator.value.userId,
      newEmail: changeEmailForm.newEmail,
      gcode: changeEmailForm.gcode
    });
    
    ElMessage.success(t('order.groupPermission.msg.changeEmailSuccess'));
    showChangeEmailDialog.value = false;
    loadOperators();
  } catch (error) {
    ElMessage.error(error.response?.data?.msg || t('order.groupPermission.msg.changeEmailFailed'));
  } finally {
    changingEmail.value = false;
  }
};



// 重置密码
const resetPassword = async () => {
  try {
    resetting.value = true;
    
    await http.resetGroupUserPassword({
      userId: resettingOperator.value.userId,
    });
    
    ElMessage.success(t('order.groupPermission.msg.resetPasswordSuccess'));
    showResetDialog.value = false;
  } catch (error) {
    ElMessage.error(error.response?.data?.msg || t('order.groupPermission.msg.resetPasswordFailed'));
  } finally {
    resetting.value = false;
  }
};

// 保存操作员
const saveOperator = async () => {
  try {
    if (operators.value.length >= 50) {
      ElMessage.warning(t('order.groupPermission.msg.maxOperators'));
      return;
    }
    
    await formRef.value.validate();
    
    saving.value = true;
    
     const res = await http.createGroupUser({
      email: formData.email,
      name: formData.name,
      roleCode: formData.roleCode,
      status: formData.status,
      merchantCodes: formData.merchantCodes,
     gcode: formData.code
    });
    if (res.code === 200) {
      ElMessage.success(res.msg);
        showAddDialog.value = false;
            resetForm();
    } else {
      ElMessage.error(res.msg);
    }

    loadOperators();
  } catch (error) {
    ElMessage.error(error.response?.data?.msg || t('order.groupPermission.msg.addFailed'));
  } finally {
    saving.value = false;

    
  }
};
</script>

<style scoped lang="scss">
@use "../../styles/variables.scss" as *;

.section {
  margin-bottom: 32px;
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary, #18181b);
      margin: 0;
    }
  }
}

.operator-list {
  :deep(.el-table__row) {
    cursor: pointer;
  }
}

.merchant-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  
  .merchant-tag {
    font-size: 11px;
  }
  
  .no-data {
    color: var(--text-faint);
    font-size: 12px;
  }
}

.merchant-codes-wrapper {
  height: 100%;
  min-height: 48px;
}

.merchant-count-label {
  font-size: 12px;
  color: var(--text-faint);
  margin-bottom: 4px;
  font-weight: 500;
}

.merchant-codes-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-height: 130px;
  overflow-y: auto;
}

.merchant-tag-item {
  flex-shrink: 0;
}

.merchant-empty {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  height: 48px;
  color: var(--text-faint);
  font-size: 12px;
}

.action-cell {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  height: 100%;
  min-height: 48px;
}

.merchant-option {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  
  .merchant-name {
    font-weight: 500;
  }
  
  .merchant-code {
    font-size: 12px;
    color: var(--text-faint);
    font-family: monospace;
  }

  .merchant-qq {
    font-size: 12px;
    color: var(--text-primary, #000000);
    font-family: monospace;
  }
}

.account-type-tip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin-left: 8px;
  border-radius: 50%;
  background-color: var(--text-primary);
  color: var(--text-inverse, #fff);
  font-size: 12px;
  font-weight: bold;
  cursor: help;
  transition: all 0.2s;

  &:hover {
    background-color: var(--text-secondary);
    transform: scale(1.1);
  }
}

.create-time-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: var(--color-hover);
  border-radius: 6px;
  font-size: 13px;
  color: var(--text-secondary);
  font-family: monospace;
  
  .el-icon {
    font-size: 16px;
    color: var(--text-faint);
  }
}

.view-info {
  .info-row {
    display: flex;
    padding: 12px 0;
    border-bottom: 1px solid var(--color-border-soft);
    
    &:last-child {
      border-bottom: none;
    }
    
    .info-label {
      width: 100px;
      font-weight: 600;
      text-align: justify;
      text-align-last: justify;
      color: var(--text-secondary);
    }
    
    .info-value {
      flex: 1;
      color: var(--text-primary);
    }
  }
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start !important;
  }
  
  .operator-list {
    overflow-x: auto;
  }
  
  .info-row {
    flex-direction: column;
    gap: 8px;
    
    .info-label {
      width: auto !important;
    }
  }
}

:deep(.el-form-item__label) {
  display: inline;
  text-wrap: nowrap;
  text-align-last: justify;
  width: 80px !important;
}

:deep(.el-form-item.is-required .el-form-item__label:before) {
  content: none !important;
}

:deep(.el-form-item.is-required::before) {
  content: '*';
  color: var(--color-danger, red);
  position: relative;
  margin-right: 4px;
}

:deep(.el-form-item:not(.is-required)::before) {
  content: '*';
  visibility: hidden;
  margin-right: 4px;
}

:deep(.el-input__inner:-webkit-autofill),
:deep(.el-input__inner:-webkit-autofill:hover),
:deep(.el-input__inner:-webkit-autofill:focus),
:deep(.el-input__inner:-webkit-autofill:active) {
  -webkit-background-clip: text;
  -webkit-text-fill-color: var(--text-primary, #000);
  background-color: var(--color-surface, #fff) !important;
  background-clip: text;
  transition: background-color 5000s ease-in-out 0s;
}

.reset-password-content {
  margin-bottom: 20px;
  
  .confirm-text {
    font-size: 14px;
    color: var(--text-primary);
    margin-bottom: 12px;
    
    .email {
      color: var(--brand-primary);
      font-weight: 500;
    }
  }
  
  .hint-text {
    font-size: 13px;
    color: var(--text-faint);
    line-height: 1.6;
  }
}
</style>