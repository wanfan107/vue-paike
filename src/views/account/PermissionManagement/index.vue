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
            <el-table 
              :data="operators" 
              border 
              stripe 
              style="width: 100%"
              @row-click="handleRowClick"
              highlight-current-row
            >
              <el-table-column prop="username" label="邮箱名" width="150" />
              <el-table-column prop="accountType" label="账户类型" width="120">
                <template #default="{ row }">
                  <el-tag :type="row.accountType === 'financial' ? 'success' : 'warning'">
                    {{ row.accountType === 'financial' ? '财务账户' : '运营账户' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="googleAuth" label="谷歌验证码" width="120">
                <template #default="{ row }">
                  <el-tag :type="row.googleAuth ? 'success' : 'info'">
                    {{ row.googleAuth ? '已开启' : '未开启' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="merchants" label="管理商户" min-width="200">
                <template #default="{ row }">
                  <div class="merchant-tags">
                    <el-tag 
                      v-for="merchant in row.merchants" 
                      :key="merchant.id"
                      size="small"
                      type="info"
                      class="merchant-tag"
                    >
                      {{getMerchantInfo(merchant,"name")  }}
                    </el-tag>
                    <span v-if="row.merchants.length === 0" class="no-data">未分配商户</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="createTime" label="创建时间" width="180" />
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }" width="280">
                  <el-button   type="primary" size="small" @click.stop="editOperator(row)">
                    编辑
                  </el-button>
                  <el-button   type="danger" size="small" @click.stop="deleteOperator(row)">
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
            <el-form-item label="邮箱名" prop="username">
              <el-input 
                v-model="formData.username" 
                placeholder="请输入邮箱名"
                clearable
              />
            </el-form-item>

            <el-form-item label="账户类型" prop="accountType">
              <el-radio-group v-model="formData.accountType">
                <el-radio value="financial" disabled>
                  财务账户
                </el-radio>
                <el-radio value="ops">
                  运营账户
                </el-radio>
              </el-radio-group>
              <span class="account-type-tip">运营账户只能查看订单和下载流水，其他不可以查看，财务暂时禁用</span>
            </el-form-item>

            <el-form-item label="谷歌验证码" prop="googleAuth">
              <el-switch
                v-model="formData.googleAuth"
                active-text="已开启"
                inactive-text="未开启"
              />
              <span class="switch-tip">开启后登录需输入谷歌验证码</span>
            </el-form-item>

            <el-form-item label="管理商户" prop="merchants">
              <el-select
                v-model="formData.merchants"
                multiple
                filterable
                placeholder="请选择管理的商户"
                style="width: 100%"
                collapse-tags
                collapse-tags-tooltip
              >
                <el-option
                  v-for="merchant in allMerchants"
                  :key="merchant.id"
                  :label="merchant.name"
                  :value="merchant.id"
                >
                  <div class="merchant-option">
                    <span class="merchant-name">{{ merchant.name }}</span>
                    <span class="merchant-code">{{ merchant.code }}</span>
                    <el-tag 
                      :type="merchant.type === 'financial' ? 'success' : 'warning'" 
                      size="small"
                      effect="plain"
                    >
                      {{ merchant.type === 'financial' ? '财务' : '运营' }}
                    </el-tag>
                  </div>
                </el-option>   
              </el-select>
            </el-form-item>

            <el-form-item label="谷歌验证码" prop="googleCode">
              <el-input 
                v-model="formData.googleCode" 
                placeholder="请输入谷歌验证码"
                clearable
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
          <el-form :model="editFormData" :rules="formRules" ref="editFormRef" label-width="120px">
            <el-form-item label="邮箱名" prop="username">
              <el-input 
                v-model="editFormData.username" 
                placeholder="请输入邮箱名"
                clearable
              />
            </el-form-item>

            <el-form-item label="账户类型" prop="accountType">
              <el-radio-group v-model="editFormData.accountType">
                <el-radio value="financial" disabled>
                  财务账户
                </el-radio>
                <el-radio value="ops">
                  运营账户
                </el-radio>
              </el-radio-group>
              <span class="account-type-tip">运营账户只能查看订单和下载流水，其他不可以查看，财务暂时禁用</span>
            </el-form-item>

            <el-form-item label="谷歌验证码" prop="googleAuth">
              <el-switch
                v-model="editFormData.googleAuth"
                active-text="已开启"
                inactive-text="未开启"
              />
              <span class="switch-tip">开启后登录需输入谷歌验证码</span>
            </el-form-item>

            <el-form-item label="管理商户" prop="merchants">
              <el-select
                v-model="editFormData.merchants"
                multiple
                filterable
                placeholder="请选择管理的商户"
                style="width: 100%"
                collapse-tags
                collapse-tags-tooltip
              >
                <el-option
                  v-for="merchant in allMerchants"
                  :key="merchant.id"
                  :label="merchant.name"
                  :value="merchant.id"
                >
                  <div class="merchant-option">
                    <span class="merchant-name">{{ merchant.name }}</span>
                    <span class="merchant-code">{{ merchant.code }}</span>
                    <el-tag 
                      :type="merchant.type === 'financial' ? 'success' : 'warning'" 
                      size="small"
                      effect="plain"
                    >
                      {{ merchant.type === 'financial' ? '财务' : '运营' }}
                    </el-tag>
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

            <el-form-item label="谷歌验证码" prop="googleCode">
              <el-input 
                v-model="editFormData.googleCode" 
                placeholder="请输入谷歌验证码"
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
              <div class="info-label">邮箱名：</div>
              <div class="info-value">{{ viewingOperator.username }}</div>
            </div>
            <div class="info-row">
              <div class="info-label">账户类型：</div>
              <div class="info-value">
                <el-tag :type="viewingOperator.accountType === 'financial' ? 'success' : 'warning'">
                  {{ viewingOperator.accountType === 'financial' ? '财务账户' : '运营账户' }}
                </el-tag>
              </div>
            </div>
            <div class="info-row">
              <div class="info-label">谷歌验证码：</div>
              <div class="info-value">
                <el-tag :type="viewingOperator.googleAuth ? 'success' : 'info'">
                  {{ viewingOperator.googleAuth ? '已开启' : '未开启' }}
                </el-tag>
              </div>
            </div>
            <div class="info-row">
              <div class="info-label">管理商户：</div>
              <div class="info-value">
                <div class="merchant-tags">
                  <el-tag 
                    v-for="merchant in viewingOperator.merchants" 
                    :key="merchant.id"
                    size="small"
                    type="info"
                    class="merchant-tag"
                  >
                    {{ merchant.name }}
                  </el-tag>
                  <span v-if="viewingOperator.merchants.length === 0" class="no-data">未分配商户</span>
                </div>
              </div>
            </div>
            <div class="info-row">
              <div class="info-label">创建时间：</div>
              <div class="info-value">{{ viewingOperator.createTime }}</div>
            </div>
          </div>
          <template #footer>
            <el-button @click="showViewDialog = false">关闭</el-button>
          </template>
        </el-dialog>

        <!-- 谷歌验证码输入对话框 -->
        <el-dialog
          v-model="showGoogleCodeDialog"
          title="输入谷歌验证码"
          width="400px"
          :close-on-click-modal="false"
        >
          <el-form :model="googleCodeForm" :rules="googleCodeRules" ref="googleCodeFormRef" label-width="100px">
            <el-form-item label="谷歌验证码" prop="code">
              <el-input 
                v-model="googleCodeForm.code" 
                placeholder="请输入6位谷歌验证码"
                clearable
              />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="showGoogleCodeDialog = false">取消</el-button>
            <el-button type="primary" @click="verifyGoogleCode" :loading="verifying">
              验证
            </el-button>
          </template>
        </el-dialog>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { Plus, Clock } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const props = defineProps({
  title: {
    type: String,
    default: "操作员管理",
  },
});

// 假数据 - 完整的商户列表
const allMerchants = ref([
  { id: 1, name: '华东分公司', code: 'HD001', type: 'financial' },
  { id: 2, name: '华南分公司', code: 'HN001', type: 'financial' },
  { id: 3, name: '华北分公司', code: 'HB001', type: 'financial' },
  { id: 4, name: '技术运营中心', code: 'YW001', type: 'ops' },
  { id: 5, name: '网络运营部', code: 'YW002', type: 'ops' },
  { id: 6, name: '数据中心', code: 'DS001', type: 'ops' },
  { id: 7, name: '财务共享中心', code: 'CW001', type: 'financial' },
  { id: 8, name: '西部运营中心', code: 'XBYW001', type: 'ops' },
  { id: 9, name: '东北分公司', code: 'DB001', type: 'financial' }
]);

// 假数据 - 操作员列表
const operators = ref([
  {
    id: 1,
    username: '张三',
    email: 'zhangsan@company.com',
    accountType: 'financial',
    googleAuth: true,
    merchants: [1, 2, 3, 7],
    createTime: '2024-03-21 10:30:00'
  },
  {
    id: 2,
    username: '李四',
    email: 'lisi@company.com',
    accountType: 'financial',
    googleAuth: false,
    merchants: [1, 7],
    createTime: '2024-03-21 11:15:00'
  },
  {
    id: 3,
    username: '王五',
    email: 'wangwu@company.com',
    accountType: 'ops',
    googleAuth: true,
    merchants: [4, 5, 6, 8],
    createTime: '2024-03-22 09:45:00'
  },
  {
    id: 4,
    username: '赵六',
    email: 'zhaoliu@company.com',
    accountType: 'ops',
    googleAuth: false,
    merchants: [4, 8],
    createTime: '2024-03-22 14:20:00'
  },
  {
    id: 5,
    username: '孙七',
    email: 'sunqi@company.com',
    accountType: 'financial',
    googleAuth: false,
    merchants: [2, 3],
    createTime: '2024-03-23 16:10:00'
  }
]);

// 状态变量
const showAddDialog = ref(false);
const showEditDialog = ref(false);
const showViewDialog = ref(false);
const showGoogleCodeDialog = ref(false);
const saving = ref(false);
const updating = ref(false);
const verifying = ref(false);
const formRef = ref(null);
const editFormRef = ref(null);
const googleCodeFormRef = ref(null);
const viewingOperator = ref({});
const operatorToDelete = ref(null);

// 谷歌验证码表单数据
const googleCodeForm = reactive({
  code: ''
});

// 谷歌验证码验证规则
const googleCodeRules = {
  code: [
    { required: true, message: '请输入谷歌验证码', trigger: 'blur' },
    { min: 6, max: 6, message: '验证码长度为 6 个字符', trigger: 'blur' }
  ]
};

// 表单数据
const formData = reactive({
  username: '',
  googleCode: '',
  accountType: 'ops',
  googleAuth: false,
  merchants: []
});

// 编辑表单数据
const editFormData = reactive({
  id: null,
  username: '',
  googleCode: '',
  accountType: '',
  googleAuth: false,
  merchants: [],
  createTime: ''
});

// 表单验证规则
const formRules = {
  username: [
    { required: true, message: '请输入邮箱名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  googleCode: [
    { required: true, message: '请输入谷歌验证码', trigger: 'blur' },
    { min: 6, max: 6, message: '验证码长度为 6 个字符', trigger: 'blur' }
  ],
  accountType: [
    { required: true, message: '请选择账户类型', trigger: 'change' }
  ]
};

// 获取商户信息
const getMerchantInfo = (merchantId,type) => {
  if(type == "name"){
    console.log("0000000000",merchantId);
    
    const merchant = allMerchants.value.find(m => m.id === merchantId);
    return merchant.name || '未知商户';
  }else{
    const merchant = allMerchants.value.find(m => m.id === merchantId);
    return merchant || { id: merchantId, name: '未知商户', code: '未知' };
  }
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
  // 获取完整的商户信息
  const merchantsWithInfo = row.merchants.map(id => getMerchantInfo(id));
  viewingOperator.value = {
    ...row,
    merchants: merchantsWithInfo
  };
  showViewDialog.value = true;
};

// 重置表单
const resetForm = () => {
  formData.username = '';
  formData.googleCode = '';
  formData.accountType = 'financial';
  formData.googleAuth = false;
  formData.merchants = [];
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
  editFormData.id = operator.id;
  editFormData.username = operator.username;
  editFormData.googleCode = '';
  editFormData.accountType = operator.accountType;
  editFormData.googleAuth = operator.googleAuth;
  editFormData.merchants = [...operator.merchants];
  editFormData.createTime = operator.createTime;
  showEditDialog.value = true;
};

// 更新操作员
const updateOperator = async () => {
  try {
    await editFormRef.value.validate();
    
    updating.value = true;
    
    // 模拟后端API调用延迟
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 更新操作员信息
    const index = operators.value.findIndex(op => op.id === editFormData.id);
    if (index !== -1) {
      operators.value[index] = {
        ...operators.value[index],
        username: editFormData.username,
        accountType: editFormData.accountType,
        googleAuth: editFormData.googleAuth,
        merchants: [...editFormData.merchants]
      };
    }
    
    ElMessage.success('操作员信息更新成功');
    showEditDialog.value = false;
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('请填写完整信息');
    }
  } finally {
    updating.value = false;
  }
};

// 删除操作员
const deleteOperator = (operator) => {
  ElMessageBox.confirm(
    `确定要删除操作员 "${operator.username}" 吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 保存要删除的操作员信息
    operatorToDelete.value = operator;
    // 打开谷歌验证码输入对话框
    showGoogleCodeDialog.value = true;
  }).catch(() => {});
};

// 验证谷歌验证码
const verifyGoogleCode = async () => {
  try {
    await googleCodeFormRef.value.validate();
    
    verifying.value = true;
    
    // 模拟后端API调用延迟
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 验证通过，执行删除操作
    if (operatorToDelete.value) {
      const index = operators.value.findIndex(op => op.id === operatorToDelete.value.id);
      if (index !== -1) {
        operators.value.splice(index, 1);
      }
      ElMessage.success('删除成功');
    }
    
    // 关闭对话框并重置表单
    showGoogleCodeDialog.value = false;
    googleCodeForm.code = '';
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('请填写完整信息');
    }
  } finally {
    verifying.value = false;
  }
};

// 保存操作员
const saveOperator = async () => {
  try {
    await formRef.value.validate();
    
    saving.value = true;
    
    // 模拟后端API调用延迟
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const createTime = getCurrentTime();
    
    // 新增操作员
    const newId = Math.max(...operators.value.map(op => op.id), 0) + 1;
    const newOperator = {
      id: newId,
      username: formData.username,
      accountType: formData.accountType,
      googleAuth: formData.googleAuth,
      merchants: [...formData.merchants],
      createTime: createTime
    };
    
    operators.value.push(newOperator);
    
    ElMessage.success('操作员添加成功！');
    
    showAddDialog.value = false;
    resetForm();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('请填写完整信息');
    }
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped lang="scss">
@use "../../../styles/variables.scss" as *;

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

.switch-tip {
  margin-left: 12px;
  font-size: 12px;
  color: #909399;
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
      // width: 1px !important;
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
// 表单标签两端对齐样式
:deep(.el-form-item__label) {
  display: inline;
  text-wrap: nowrap;
  text-align-last: justify;
  width: 80px !important;
}

// 必填属性的*是label的伪元素, 在两端对齐时会占用label的空间, 这里把默认的label中的*去掉
:deep(.el-form-item.is-required .el-form-item__label:before) {
  content: none !important;
}

// 把*加在.el-form-item中就不会占用空间了
:deep(.el-form-item.is-required::before) {
  content: '*';
  color: red;
  position: relative;
  margin-right: 4px;
}

// 为了保持对齐, 给非必填的也加一个不可见的*
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
</style>