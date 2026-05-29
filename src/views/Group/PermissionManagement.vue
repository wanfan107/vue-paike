<template>
  <div class="page-container">
    <header class="page-header">
      <h1>{{ title }}</h1>
      <hr />
    </header>

    <main class="page-content">
      <div class="content-wrapper">
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
            <el-table 74734
              :data="operators" 
              border 
              stripe 
              style="width: 100%"
              @row-click="handleRowClick"
              highlight-current-row
            >
              <el-table-column prop="email" label="邮箱名" width="180" />
              <el-table-column prop="roleName" label="角色" width="120">
                <template  #default="{ row }">
                  <el-tag :type="getRoleTagType(row.roleCode)" size="small">
                    {{ row.roleName }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="merchantCodes" label="可操作商户" min-width="180">
                <template #default="{ row }">
                  <el-tag v-if="row && row.merchantCodes" size="small" type="info">{{ row.merchantCodes.length }}</el-tag>
                  <span v-else><el-tag size="small" type="info">0</el-tag></span>
                  <span v-if="row && row.merchantCodes" v-for="(code, idx) in row.merchantCodes" :key="code" style="margin-left: 4px;">
                    <el-tag size="small">{{ code }}</el-tag>
                  </span>
                </template>
              </el-table-column>
                    <el-table-column prop="status" label="状态" width="80">
                <template #default="{ row }">
                  <el-tag :type="row.status === 0 ? 'success' : 'danger'" size="small">
                    {{ row.status === 0 ? '正常' : '禁用' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="isSuspended" label="冻结" width="80">
                <template #default="{ row }">
                  <el-tag :type="row.isSuspended ? 'danger' : 'success'" size="small">
                    {{ row.isSuspended ? '已冻结' : '正常' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="isActivated" label="已激活" width="80">
                <template #default="{ row }">
                  <el-tag :type="row.isActivated ? 'success' : 'warning'" size="small">
                    {{ row.isActivated ? '是' : '否' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="hasGoogleAuth" label="MFA2" width="80">
                <template #default="{ row }">
                  <el-tag :type="row.hasGoogleAuth ? 'success' : 'info'" size="small">
                    {{ row.hasGoogleAuth ? '是' : '否' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="createdOn" label="创建时间" width="170">
                <template #default="{ row }">
                  {{ formatDate(row.createdOn) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="220" fixed="right">
                <template #default="{ row }" width="280" >
                  <el-button v-if="row.roleCode !== 'admin'" type="primary" size="small" @click.stop="editOperator(row)">
                    编辑
                  </el-button>
                  <el-button v-if="row.roleCode !== 'admin'" type="warning" size="small" @click.stop="showResetPasswordDialog(row)">
                    重置密码
                  </el-button>
                  <el-button v-if="row.roleCode !== 'admin'" type="danger" size="small" @click.stop="deleteOperator(row)">
                    删除
                  </el-button>
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

            <el-form-item label="账户类型" prop="roleCode">
              <el-radio-group v-model="formData.roleCode">
                <el-radio value="finance">
                  财务账户
                </el-radio>
                <el-radio value="operator">
                  运营账户
                </el-radio>
              </el-radio-group>
              <!-- <span class="account-type-tip">运营账户只能查看订单和下载流水，其他不可以查看，财务暂时禁用</span> -->
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

            <el-form-item label="账户类型" prop="roleCode">
              <el-radio-group v-model="editFormData.roleCode">
                <el-radio value="finance" >
                  财务账户
                </el-radio>
                <el-radio value="operator">
                  运营账户
                </el-radio>
              </el-radio-group>
              <!-- <span class="account-type-tip">运营账户只能查看订单和下载流水，其他不可以查看，财务暂时禁用</span> -->
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
                  </div>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="是否冻结">
              <el-switch 
                v-model="editFormData.isSuspended" 
                active-text="已冻结" 
                inactive-text="正常"
                active-color="#F56C6C"
                inactive-color="#67C23A"
              />
            </el-form-item>

            <el-form-item label="创建时间">
              <div class="create-time-display">
                <el-icon><Clock /></el-icon>
                <span>{{ editFormData.createTime }}</span>
              </div>
            </el-form-item>

            <!-- <el-form-item label="MFA2验证码" prop="code">
              <el-input 
                v-model="editFormData.code" 
                placeholder="请输入MFA2验证码"
                clearable
              />
            </el-form-item> -->
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
                <el-tag :type="viewingOperator.status === 0 ? 'success' : 'danger'" size="small">
                  {{ viewingOperator.status === 0 ? '正常' : '禁用' }}
                </el-tag>
              </div>
            </div>
            <div class="info-row">
              <div class="info-label">冻结：</div>
              <div class="info-value">
                <el-tag :type="viewingOperator.isSuspended ? 'danger' : 'success'" size="small">
                  {{ viewingOperator.isSuspended ? '已冻结' : '正常' }}
                </el-tag>
              </div>
            </div>
            <div class="info-row">
              <div class="info-label">已激活：</div>
              <div class="info-value">
                <el-tag :type="viewingOperator.isActivated ? 'success' : 'warning'" size="small">
                  {{ viewingOperator.isActivated ? '是' : '否' }}
                </el-tag>
              </div>
            </div>
            <div class="info-row">
              <div class="info-label">MFA2：</div>
              <div class="info-value">
                <el-tag :type="viewingOperator.hasGoogleAuth ? 'success' : 'info'" size="small">
                  {{ viewingOperator.hasGoogleAuth ? '是' : '否' }}
                </el-tag>
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

      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { Plus, Clock } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { http } from '@/api';
import useUserStore from '@/stores/user';

defineProps({
  title: {
    type: String,
    default: "操作员管理",
  },
});

const userStore = useUserStore();

// 假数据 - 完整的商户列表
const allMerchants = ref([]);

// 假数据 - 操作员列表
const operators = ref([
  
]);

// 状态变量
const showAddDialog = ref(false);
const showEditDialog = ref(false);
const showViewDialog = ref(false);
const showResetDialog = ref(false);
const saving = ref(false);
const updating = ref(false);
const resetting = ref(false);
const formRef = ref(null);
const editFormRef = ref(null);
const viewingOperator = ref({});
const resettingOperator = ref({});

// 表单数据
const formData = reactive({
  email: '',
  code: '',
  roleCode: 'operator',
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

// 编辑表单数据
const editFormData = reactive({
  // id: null,
  email: '',
  // code: '',
  roleCode: '',
  isSuspended: false,
  merchantCodes: [],
  createTime: ''
});

// 表单验证规则
const formRules = {
  email: [
    { required: true, message: '请输入邮箱名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
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
        res.data.forEach(item => {
          if (item.roleCode == 'admin') {
            item.merchantCodes=userStore.merchants.filter(m => !m.code?.startsWith('G')).map(merchant => merchant.code);
          }
        });
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
  if (roleCode === 'admin') return 'danger';
  if (roleCode === 'financial' || roleCode === 'finance') return 'warning';
  return 'success';
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
const handleRowClick = (row) => {
  viewingOperator.value = {
    ...row,
    email: row.email || row.username || '',
    roleName: row.roleName || '',
    roleCode: row.roleCode || '',
    status: row.status || 0,
    isSuspended: row.isSuspended || false,
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
  editFormData.email = operator.email || operator.email || '';
  editFormData.roleCode = operator.roleCode === 'admin' ? 'operator' : operator.roleCode === 'finance' ? 'finance' : 'operator';
  editFormData.isSuspended = operator.isSuspended || false;
  editFormData.merchantCodes = operator.merchantCodes ? [...operator.merchantCodes] : [];
  editFormData.createTime = operator.createdOn || operator.createTime || '';
  showEditDialog.value = true;
};

// 更新操作员
const updateOperator = async () => {
  try {
    await editFormRef.value.validate();
    
    updating.value = true;
    
    await http.updateGroupUser({
      email: editFormData.email,
      roleCode: editFormData.roleCode,
      isSuspended: editFormData.isSuspended,
      merchantCodes: editFormData.merchantCodes,
    });
    
    ElMessage.success('操作员信息更新成功');
    showEditDialog.value = false;
    loadOperators();
  } catch (error) {
    ElMessage.error(error.response?.data?.msg || '更新失败');
  } finally {
    updating.value = false;
  }
};

// 删除操作员
const deleteOperator = (operator) => {
  const currentUserEmail = localStorage.getItem('roleCode') || '';
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
      await http.deleteGroupUser({ email: operator.email });
      const index = operators.value.findIndex(op => op.email === operator.email);
      if (index !== -1) {
        operators.value.splice(index, 1);
      }
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



// 重置密码
const resetPassword = async () => {
  try {
    resetting.value = true;
    
    await http.resetGroupUserPassword({
      email: resettingOperator.value.email,
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
      roleCode: formData.roleCode,
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

.page-container {
  background-color: #fff;
  border-radius: 24px;
  margin: $spacing-lg;
  min-height: calc(100vh - 32px);
}

.page-header {
  padding: $spacing-lg;
  h1 {
    margin: 0;
    font-size: $font-size-xl;
    color: $text-color;
  }
  hr {
    margin: 12px 0 0 0;
    opacity: 0.2;
    border: none;
    border-top: 1px solid;
  }
}

.page-content {
  padding: $spacing-lg;
}

.content-wrapper {
  background-color: white;
  border-radius: $border-radius-md;
}

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
      color: $text-color;
      margin: 0;
    }
  }
}

.operator-list {
  :deep(.el-table) {
    border-radius: 8px;
    overflow: hidden;
    
    .el-table__row {
      cursor: pointer;
      
      &:hover {
        background-color: #f5f7fa;
      }
    }
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
    color: #c0c4cc;
    font-size: 12px;
  }
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
    color: #909399;
    font-family: monospace;
  }
}

.account-type-tip {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.create-time-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: #f5f7fa;
  border-radius: 6px;
  font-size: 13px;
  color: #606266;
  font-family: monospace;
  
  .el-icon {
    font-size: 16px;
    color: #909399;
  }
}

.view-info {
  .info-row {
    display: flex;
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;
    
    &:last-child {
      border-bottom: none;
    }
    
    .info-label {
      width: 100px;
      font-weight: 600;
      text-align: justify;
      text-align-last: justify;
      color: #606266;
    }
    
    .info-value {
      flex: 1;
      color: #303133;
    }
  }
}

@media (max-width: 768px) {
  .page-container {
    margin: $spacing-md;
  }
  
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
  color: red;
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
  -webkit-text-fill-color: #000;
  background-color: #fff !important;
  background-clip: text;
  transition: background-color 5000s ease-in-out 0s;
}

.reset-password-content {
  margin-bottom: 20px;
  
  .confirm-text {
    font-size: 14px;
    color: #303133;
    margin-bottom: 12px;
    
    .email {
      color: #409EFF;
      font-weight: 500;
    }
  }
  
  .hint-text {
    font-size: 13px;
    color: #909399;
    line-height: 1.6;
  }
}
</style>