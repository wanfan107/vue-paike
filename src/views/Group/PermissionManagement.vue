<template>
  <div class="app-page">
    <header class="app-page-header">
      <h1>{{ t('menu.permissionManagement') }}</h1>
    </header>

    <main>
        <!-- 操作列表和新增按钮 -->
        <div class="section">
          <div class="section-header">
            <h3 class="section-title">操作员列表</h3>
            <el-button type="primary" @click="showAddDialog = true">
              <el-icon><Plus /></el-icon>
              新增操作员
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
             
              <el-table-column prop="email" label="邮箱名" width="180" align="left" />
              <el-table-column prop="name" label="别名" width="100" align="center" />
              <el-table-column prop="roleName" label="角色" width="120" align="center">
                <template  #default="{ row }">
                  <el-tooltip :content="getRoleDescription(row.roleCode)" placement="top">
                    <el-tag :type="getRoleTagType(row.roleCode)" size="small">
                      {{ row.roleName }}
                    </el-tag>
                  </el-tooltip>
                </template>
              </el-table-column>
              <el-table-column prop="merchantCodes" label="可操作商户" width="260" align="left">
                <template #default="{ row }">
                  <div class="merchant-codes-wrapper">
                    <div v-if="row && row.merchantCodes && row.merchantCodes.length > 0">
                      <div class="merchant-count-label">共 {{ row.merchantCodes.length }} 个</div>
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
                    <el-table-column prop="status" label="状态" width="80" align="center">
                <template #default="{ row }">
                  <StatusPill :type="row.status === 0 ? 'success' : 'neutral'" :text="row.status === 0 ? '启用' : '禁用'" />
                </template>
              </el-table-column>
              <el-table-column prop="isActivated" label="邮箱已激活" width="120" align="center">
                <template #default="{ row }">
                  <StatusPill :type="row.isActivated ? 'success' : 'neutral'" :text="row.isActivated ? '是' : '否'" />
                </template>
              </el-table-column>
              <el-table-column prop="hasGoogleAuth" label="MFA2已绑定" width="120" align="center">
                <template #default="{ row }">
                  <StatusPill :type="row.hasGoogleAuth ? 'success' : 'neutral'" :text="row.hasGoogleAuth ? '是' : '否'" />
                </template>
              </el-table-column>
              <el-table-column prop="createdOn" label="创建时间" width="170" align="center">
                <template #default="{ row }">
                  {{ formatDate(row.createdOn) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="340" fixed="right" align="center">
                <template #default="{ row }">
                  <div class="action-cell" @click.stop.prevent>
                    <el-button type="primary" plain size="small" @click.stop="editOperator(row)">
                      编辑
                    </el-button>
                    <el-button type="primary" plain size="small" @click.stop="showResetPasswordDialog(row)">
                      重置密码
                    </el-button>
                    <el-button v-if="row.roleCode !== 'admin'" type="danger" plain size="small" @click.stop="openChangeEmailDialog(row)">
                      变更邮箱
                    </el-button>
                    <!-- 这里的删除是，逻辑删除 -->
                    <el-button v-if="row.roleCode !== 'admin'" type="danger" plain size="small" @click.stop="softDeleteOperator(row)">
                      删除
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
          title="新增操作员"
          width="600px"
          :close-on-click-modal="false"
          @close="resetForm"
        >
          <el-form :model="formData" :rules="formRules" ref="formRef" label-width="120px">
            <el-form-item label="邮箱名" prop="email">
              <el-input 
                v-model="formData.email" 
                placeholder="请输入邮箱名"
                clearable
                @keyup.enter="saveOperator"
              />
            </el-form-item>

            <el-form-item label="别名" prop="name">
              <el-input 
                v-model="formData.name" 
                placeholder="请输入别名"
                clearable
                maxlength="50"
                @keyup.enter="saveOperator"
              />
            </el-form-item>

            <el-form-item label="账户类型" prop="roleCode">
              <el-radio-group v-model="formData.roleCode">
                <el-radio value="finance">
                  财务账户
                </el-radio>
                <el-radio value="operator">
                  运营账户
                </el-radio>
              </el-radio-group>
              <el-tooltip content="财务账户：可进行下发、互转、查询、导出报表对账等操作。运营账户：仅能查询订单和导出报表对账，无法进行下发和互转" placement="top">
                <span class="account-type-tip">?</span>
              </el-tooltip>
            </el-form-item>

            <el-form-item label="账户状态" prop="status">
              <el-radio-group v-model="formData.status">
                <el-radio :value="0">
                  启用
                </el-radio>
                <el-radio :value="6">
                  禁用
                </el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="管理商户" prop="merchantCodes">
              <el-select
                v-model="formData.merchantCodes"
                multiple
                filterable
                placeholder="请选择管理的商户"
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
                      {{ merchant.isGroup ? '集团' : '商户'}}
                    </el-tag>
                    <span v-if="merchant.qq" class="merchant-qq">{{ merchant.qq }}</span>
                  </div>
                </el-option>   
              </el-select>
            </el-form-item>

            <el-form-item label="MFA2验证码" prop="code">
              <el-input 
                v-model="formData.code" 
                placeholder="请输入MFA2验证码"
                clearable
                @keyup.enter="saveOperator"
              />
            </el-form-item>
          </el-form>

          <template #footer>
            <el-button @click="showAddDialog = false">取消</el-button>
            <el-button type="primary" @click="saveOperator" :loading="saving">
              确定
            </el-button>
          </template>
        </el-dialog>

        <!-- 编辑操作员对话框 -->
        <el-dialog
          v-model="showEditDialog"
          title="编辑操作员"
          width="600px"
          :close-on-click-modal="false"
          @close="resetEditForm"
        >
          <el-form :model="editFormData" :rules="formRules" ref="editFormRef" label-width="120px" >
            <el-form-item label="邮箱名" prop="email">
              <el-input 
                v-model="editFormData.email" 
                placeholder="请输入邮箱名"
                clearable
                disabled
                @keyup.enter="updateOperator"
              />
            </el-form-item>

            <el-form-item label="别名" prop="name">
              <el-input 
                v-model="editFormData.name" 
                placeholder="请输入别名"
                clearable
                maxlength="50"
                @keyup.enter="updateOperator"
              />
            </el-form-item>

            <el-form-item label="账户类型" prop="roleCode">
              <el-radio-group v-model="editFormData.roleCode" :disabled="editFormData.roleCode === 'admin'">
                <el-radio v-if="editFormData.roleCode === 'admin'" value="admin">
                  管理员
                </el-radio>
                <template v-else>
                  <el-radio value="finance">
                    财务账户
                  </el-radio>
                  <el-radio value="operator">
                    运营账户
                  </el-radio>
                </template>
              </el-radio-group>
              <el-tooltip content="财务账户：可进行下发、互转、查询、导出报表对账等操作。运营账户：仅能查询订单和导出报表对账，无法进行下发和互转" placement="top">
                <span class="account-type-tip">?</span>
              </el-tooltip>
            </el-form-item>

            <el-form-item label="账户状态" prop="status">
              <el-radio-group v-model="editFormData.status" :disabled="editFormData.roleCode === 'admin'">
                <el-radio :value="0">
                  启用
                </el-radio>
                <el-radio :value="6">
                  禁用
                </el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="管理商户" prop="merchantCodes">
              <el-select
                v-model="editFormData.merchantCodes"
                multiple
                filterable
                placeholder="请选择管理的商户"
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
                      {{ merchant.isGroup ? '集团' : '商户'}}
                    </el-tag>
                                        <span v-if="merchant.qq" class="merchant-qq">{{ merchant.qq }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="创建时间">
              <div class="create-time-display">
                <el-icon><Clock /></el-icon>
                <span>{{ editFormData.createTime }}</span>
              </div>
            </el-form-item>

            <el-form-item label="MFA2验证码" prop="code">
              <el-input 
                v-model="editFormData.code" 
                placeholder="请输入MFA2验证码"
                clearable
              />
            </el-form-item>
          </el-form>

          <template #footer>
            <el-button @click="showEditDialog = false">取消</el-button>
            <el-button type="primary" @click="updateOperator" :loading="updating">
              更新
            </el-button>
          </template>
        </el-dialog>

        <!-- 查看基本信息对话框（只读） -->
        <el-dialog
          v-model="showViewDialog"
          title="操作员基本信息"
          width="550px"
        >
          <div class="view-info">
            <div class="info-row">
              <div class="info-label">邮箱：</div>
              <div class="info-value">{{ viewingOperator.email }}</div>
            </div>
            <div class="info-row">
              <div class="info-label">别名：</div>
              <div class="info-value">{{ viewingOperator.name || '-' }}</div>
            </div>
            <div class="info-row">
              <div class="info-label">角色：</div>
              <div class="info-value">
                <el-tag :type="getRoleTagType(viewingOperator.roleCode)" size="small">
                  {{ viewingOperator.roleName }}
                </el-tag>
              </div>
            </div>
            <div class="info-row">
              <div class="info-label">状态：</div>
              <div class="info-value">
                <StatusPill :type="viewingOperator.status === 0 ? 'success' : 'neutral'" :text="viewingOperator.status === 0 ? '启用' : '禁用'" />
              </div>
            </div>
            <div class="info-row">
              <div class="info-label">邮箱已激活：</div>
              <div class="info-value">
                <StatusPill :type="viewingOperator.isActivated ? 'success' : 'neutral'" :text="viewingOperator.isActivated ? '是' : '否'" />
              </div>
            </div>
            <div class="info-row">
              <div class="info-label">MFA2已绑定：</div>
              <div class="info-value">
                <StatusPill :type="viewingOperator.hasGoogleAuth ? 'success' : 'neutral'" :text="viewingOperator.hasGoogleAuth ? '是' : '否'" />
              </div>
            </div>
            <div class="info-row">
              <div class="info-label">可操作商户：</div>
              <div class="info-value">
                <div class="merchant-tags">
                  <span v-for="(code, idx) in viewingOperator.merchantCodes" :key="code" style="margin-left: 4px;">
                    <el-tag size="small" type="info">{{ code }}</el-tag>
                  </span>
                  <span v-if="(!viewingOperator.merchantCodes || viewingOperator.merchantCodes.length === 0)" class="no-data">未分配商户</span>
                </div>
              </div>
            </div>
            <div class="info-row">
              <div class="info-label">创建时间：</div>
              <div class="info-value">{{ formatDate(viewingOperator.createTime) }}</div>
            </div>
          </div>
          <template #footer>
            <el-button @click="showViewDialog = false">关闭</el-button>
          </template>
        </el-dialog>

        <!-- 重置密码对话框 -->
        <el-dialog
          v-model="showResetDialog"
          title="重置密码"
          width="450px"
          :close-on-click-modal="false"
        >
          <div class="reset-password-content">
            <p class="confirm-text">确定向 <span class="email">{{ resettingOperator.email }}</span> 发送密码重置邮件？</p>
            <p class="hint-text">用户将通过邮件中的链接自行设置新密码，链接有效期为24小时。</p>
          </div>



          <template #footer>
            <el-button @click="showResetDialog = false">取消</el-button>
            <el-button type="primary" @click="resetPassword" :loading="resetting">
              确定发送
            </el-button>
          </template>
        </el-dialog>

        <!-- 变更邮箱对话框 -->
        <el-dialog
          v-model="showChangeEmailDialog"
          title="变更邮箱"
          width="450px"
          :close-on-click-modal="false"
        >
          <el-form :model="changeEmailForm" :rules="changeEmailRules" ref="changeEmailFormRef" label-width="100px">
            <el-form-item label="当前邮箱">
              <span>{{ changeEmailOperator.email }}</span>
            </el-form-item>
            <el-form-item label="新邮箱" prop="newEmail">
              <el-input 
                v-model="changeEmailForm.newEmail" 
                placeholder="请输入新邮箱"
                clearable
                maxlength="80"
              />
            </el-form-item>
            <el-form-item label="MFA2验证码" prop="gcode">
              <el-input 
                v-model="changeEmailForm.gcode" 
                placeholder="请输入MFA2验证码"
                clearable
                maxlength="6"
              />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="showChangeEmailDialog = false">取消</el-button>
            <el-button type="primary" @click="changeEmail" :loading="changingEmail">
              确定
            </el-button>
          </template>
        </el-dialog>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
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
const resetFormRules = {
  code: [
    { required: true, message: '请输入MFA2验证码', trigger: 'blur' },
    { min: 6, max: 6, message: '验证码长度为 6 个字符', trigger: 'blur' }
  ]
};

// 变更邮箱表单数据
const changeEmailForm = reactive({
  newEmail: '',
  gcode: ''
});

// 变更邮箱表单验证规则
const changeEmailRules = {
  newEmail: [
    { required: true, message: '请输入新邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
    { max: 80, message: '邮箱长度不能超过80个字符', trigger: 'blur' }
  ],
  gcode: [
    { required: true, message: '请输入MFA2验证码', trigger: 'blur' },
    { min: 6, max: 6, message: '验证码长度为 6 个字符', trigger: 'blur' }
  ]
};

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
const formRules = {
  email: [
    { required: true, message: '请输入邮箱名', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
    { max: 80, message: '邮箱长度不能超过80个字符', trigger: 'blur' },
  ],
  name: [
    { required: true, message: '请输入别名', trigger: 'blur' },
    { max: 50, message: '别名最大长度为50个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入MFA2验证码', trigger: 'blur' },
    { min: 6, max: 6, message: '验证码长度为 6 个字符', trigger: 'blur' }
  ],
  roleCode: [
    { required: true, message: '请选择账户类型', trigger: 'change' }
  ],
  merchantCodes: [
    { 
      required: true, 
      message: '请至少选择一个管理商户', 
      trigger: 'change',
      validator: (rule, value, callback) => {
        if (!value || value.length === 0) {
          callback(new Error('请至少选择一个管理商户'));
        } else {
          callback();
        }
      }
    }
  ]
};

// 加载商户列表
const loadMerchants = async () => {
  try {
    const res = await http.getGroupMerchants();
    if (res.code==200) {
      allMerchants.value = res.data.filter(m => !m.code?.startsWith('G'));   // 过滤掉集团商户
    }
  } catch (error) {
    ElMessage.error('加载商户列表失败');
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
    ElMessage.error('加载操作员列表失败');
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
    admin: '超级管理员：拥有系统最高权限，可管理所有商户和操作员',
    finance: '财务账户：可进行下发、互转、查询、导出报表对账等操作',
    operator: '运营账户：仅能查询订单和导出报表对账，无法进行下发和互转'
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
    
    ElMessage.success('操作员信息更新成功');
    showEditDialog.value = false;
    loadOperators();
  } catch (error) {
    ElMessage.error(error.response?.data?.msg || '更新失败');
  } finally {
    updating.value = false;
  }
};

// 删除操作员（物理删除，已隐藏，保留代码备用）
const deleteOperator = (operator) => {
  const currentUserEmail = userStore.roleCode || '';
  if (operator.roleCode === currentUserEmail) {
    ElMessage.warning('不允许删除当前登录用户！');
    return;
  }
  
  ElMessageBox.confirm(
    `确定要删除操作员 "${operator.email || operator.email}" 吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await http.deleteGroupUser({ userId: operator.autoId || operator.userId });
      const index = operators.value.findIndex(op => op.autoId === (operator.autoId || operator.userId));
      if (index !== -1) {
        operators.value.splice(index, 1);
      }
      ElMessage.success('删除成功');
    } catch (error) {
      ElMessage.error(error.response?.data?.msg || '删除失败');
    }
  }).catch(() => {});
};

// 逻辑删除操作员
const softDeleteOperator = (operator) => {
  const currentUserEmail = userStore.roleCode || '';
  if (operator.roleCode === currentUserEmail) {
    ElMessage.warning('不允许删除当前登录用户！');
    return;
  }
  
  ElMessageBox.confirm(
    `确定要删除操作员 "${operator.email || operator.email}" 吗？\n删除后该账号将无法登录，邮箱将被释放。`,
    '提示',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await http.softDeleteGroupUser({ userId: operator.autoId || operator.userId });
      loadOperators();
      ElMessage.success('删除成功');
    } catch (error) {
      ElMessage.error(error.response?.data?.msg || '删除失败');
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
    
    ElMessage.success('变更邮箱成功');
    showChangeEmailDialog.value = false;
    loadOperators();
  } catch (error) {
    ElMessage.error(error.response?.data?.msg || '变更邮箱失败');
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
    
    ElMessage.success('密码重置邮件已发送');
    showResetDialog.value = false;
  } catch (error) {
    ElMessage.error(error.response?.data?.msg || '密码重置邮件发送失败');
  } finally {
    resetting.value = false;
  }
};

// 保存操作员
const saveOperator = async () => {
  try {
    if (operators.value.length >= 50) {
      ElMessage.warning('最多只能添加50个操作员账户！');
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
    ElMessage.error(error.response?.data?.msg || '添加失败');
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