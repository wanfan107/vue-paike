<template>
  <div class="page-container">
    <header class="page-header">
      <h1>{{ title }}</h1>
      <hr />
    </header>

    <main class="page-content">
      <div class="content-wrapper">
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="120px"
          class="whitelist-form"
        >
          <el-form-item label="商户号" prop="merchantCode">
            <el-select
              v-model="form.merchantCode"
              placeholder="请选择商户号"
              style="width: 280px;"
              clearable
            >
              <el-option
                v-for="merchant in merchants"
                :key="merchant.code"
                :label="merchant.code"
                :value="merchant.code"
              />
            </el-select>
          </el-form-item>

          <el-divider />

          <div class="section-block">
            <div class="section-title">登录IP白名单</div>
            <el-form-item label="IP地址" prop="loginIp">
              <el-input
                v-model="form.loginIp"
                type="textarea"
                placeholder="请输入登录IP地址，多个IP用#号分隔"
                :rows="3"
                clearable
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="submitForm('3')">保存登录IP</el-button>
            </el-form-item>
          </div>

          <div class="section-block">
            <div class="section-title">代付IP白名单</div>
            <el-form-item label="IP地址" prop="payIp">
              <el-input
                v-model="form.payIp"
                type="textarea"
                placeholder="请输入代付IP地址，多个IP用#号分隔"
                :rows="3"
                clearable
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="submitForm('1')">保存代付IP</el-button>
            </el-form-item>
          </div>
        </el-form>

        <!-- IP白名单查询 -->
        <div class="query-section">
          <div class="section-title">IP白名单查询</div>
          <el-form
            ref="queryFormRef"
            :model="queryForm"
            class="query-form"
            label-width="100px"
          >
            <el-form-item label="商户号">
              <el-select
                v-model="queryForm.merchantCode"
                placeholder="请选择商户号"
                style="width: 200px;"
                clearable
              >
                <el-option
                  v-for="merchant in merchants"
                  :key="merchant.code"
                  :label="merchant.code"
                  :value="merchant.code"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="类型">
              <el-select
                v-model="queryForm.useFor"
                placeholder="请选择类型登录或代付IP"
                style="width: 200px;"
                clearable
              >
                <el-option label="登录" value="3" />
                <el-option label="代付" value="1" />
              </el-select>
            </el-form-item>

            <!-- <el-form-item label="谷歌验证码">
              <el-input
                v-model="queryForm.code"
                placeholder="请输入谷歌验证码"
                style="width: 150px;"
                clearable
              />
            </el-form-item> -->

            <el-form-item>
              <el-button type="primary" @click="queryIpWhiteList">查询</el-button>
              <el-button @click="resetQueryForm">重置</el-button>
            </el-form-item>
          </el-form>

          <!-- 批量删除按钮 -->
          <div style="display: flex; justify-content: flex-end; margin-bottom: 12px;">
            <el-button
              type="danger"
              size="small"
              :disabled="selectedIps.length === 0"
              @click="handleBatchDelete"
            >
              批量删除 ({{ selectedIps.length }})
            </el-button>
          </div>

          <el-table
            v-loading="queryLoading"
            :data="ipList"
            style="width: 100%"
            max-height="500"
            stripe
            border
            :selectable="row => row.enabled"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="merchantCode" label="商户号" width="120" />
            <el-table-column prop="ip" label="IP地址" min-width="200" />
            <el-table-column prop="useForDisplay" label="用途" width="100" />
            <el-table-column prop="enabled" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.enabled ? 'success' : 'danger'">
                  {{ scope.row.enabled ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="scope">
                <el-button
                  type="danger"
                  size="small"
                  :disabled="!scope.row.enabled"
                  @click="handleDelete(scope.row)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { Search } from "@element-plus/icons-vue";
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { http } from "@/api";

const props = defineProps({
  title: {
    type: String,
    default: "集团IP白名单",
  },
});

const formRef = ref(null);
const merchants = ref([]);

const form = reactive({
  merchantCode: '',
  googleCode: '',
  loginIp: '',
  payIp: ''
});

const rules = reactive({
  merchantCode: [
    { required: true, message: '请选择商户号', trigger: 'change' }
  ]
});

// 查询表单
const queryFormRef = ref(null);
const queryLoading = ref(false);
const ipList = ref([]);

const queryForm = reactive({
  merchantCode: '',
  useFor: '',
  code: ''
});

// 选中的IP列表（用于批量删除）
const selectedIps = ref([]);

// 选择变化处理
const handleSelectionChange = (val) => {
  selectedIps.value = val;
};

// 单独删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除IP地址 ${row.ip} 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(async () => {
      await doDelete([row]);
    }).catch(() => {});
  } catch (error) {
    // 用户取消
  }
};

// 批量删除
const handleBatchDelete = async () => {
  if (selectedIps.value.length === 0) {
    ElMessage.warning('请先选择要删除的IP');
    return;
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedIps.value.length} 个IP地址吗？`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(async () => {
      await doDelete(selectedIps.value);
    }).catch(() => {});
  } catch (error) {
    // 用户取消
  }
};

// 执行删除操作
const doDelete = async (deleteList) => {
  if (!deleteList || deleteList.length === 0) return;
  
  const merchantCode = deleteList[0].merchantCode;
  
  const items = deleteList.map(item => ({
    merchantCode: item.merchantCode,
    ipAddress: item.ip,
    useFor: item.useFor
  }));
  
  try {
    const res = await http.deleteIpWhiteList({
      items: items,
      merchantCode: merchantCode,
      code: ''
    });
    
    if (res.Success) {
      ElMessage.success(res.Data?.Message || '删除成功');
      // 重新查询刷新列表
      if (queryForm.merchantCode) {
        await queryIpWhiteList();
      }
      selectedIps.value = [];
    } else {
      ElMessage.error(res.ErrorMessage || '删除失败');
    }
  } catch (error) {
    ElMessage.error('删除失败');
  }
};

const loadMerchants = async () => {
  try {
    const res = await http.getGroupMerchants();
    if (res.code === 200 && res.data) {
      merchants.value = res.data.filter(m => !m.code?.startsWith('G')).map(item => ({
        code: item.code,
        name: item.name,
      }));
    }
  } catch (error) {
    ElMessage.error('加载商户列表失败');
  }
};

const submitForm = async (useFor) => {
  if (!formRef.value) return;
  
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  
  const ipInput = useFor === '3' ? form.loginIp : form.payIp;
  const ipList = ipInput.split('#').map(ip => ip.trim()).filter(ip => ip);
  
  if (ipList.length === 0) {
    ElMessage.warning( useFor === '3' ? '请输入登录IP地址' : '请输入代付IP地址');
    return;
  }
  
  const items = ipList.map(ip => ({
    merchantCode: form.merchantCode,
    ipAddress: ip,
    useFor: parseInt(useFor)
  }));
  
  try {
    const googleCode = await ElMessageBox.prompt(
      '请输入谷歌验证码',
      '验证',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /^\d{6}$/,
        inputErrorMessage: '请输入6位数字验证码'
      }
    ).catch(() => null);
    
    if (!googleCode) {
      return;
    }
    
    const res = await http.addLoginIp({
      items: items,
      merchantCode: form.merchantCode,
      applicantCode: '',
      applicantName: '',
      code: googleCode.value
    });
    if (res.Success) {
      ElMessage.success(res.Data?.Message || '保存成功');
      if (useFor === '3') {
        form.loginIp = '';
      } else {
        form.payIp = '';
      }
    } else {
      ElMessage.error(res.ErrorMessage || '保存失败');
    }
  } catch (error) {
    ElMessage.error('保存失败');
  }
};

// 查询IP白名单
const queryIpWhiteList = async () => {
  if (!queryForm.merchantCode) {
    ElMessage.warning('请选择商户号');
    return;
  }
  // if (!queryForm.code) {
  //   ElMessage.warning('请输入谷歌验证码');
  //   return;
  // }

  queryLoading.value = true;
  try {
    const params = {
      merchantcode: queryForm.merchantCode,
      code: queryForm.code,
      useFor: queryForm.useFor || ''
    };

    const res = await http.queryIpWhiteList(params);
    if (res.Success && res.Data && res.Data.merchants) {
      const allIps = [];
      res.Data.merchants.forEach(merchant => {
        if (merchant.ips && merchant.ips.length > 0) {
          merchant.ips.forEach(ipItem => {
            allIps.push({
              merchantCode: merchant.merchantCode,
              ip: ipItem.ip,
              useFor: ipItem.useFor,
              useForDisplay: ipItem.useForDisplay,
              enabled: ipItem.enabled
            });
          });
        }
      });
      ipList.value = allIps;
    } else {
      ipList.value = [];
      ElMessage.warning(res.ErrorMessage || '暂无数据');
    }
  } catch (error) {
    ElMessage.error('查询失败');
    ipList.value = [];
  } finally {
    queryLoading.value = false;
  }
};

// 重置查询表单
const resetQueryForm = () => {
  queryForm.merchantCode = '';
  queryForm.useFor = '';
  queryForm.code = '';
  ipList.value = [];
};

onMounted(() => {
  loadMerchants();
});
</script>
<style scoped lang="scss">
@use "../../styles/variables.scss" as *;

.page-container {
  background-color: #fff;
  border-radius: 24px;
  margin: $spacing-lg;
}

.page-header {
  padding: $spacing-lg;
  h1 {
    margin: 0;
    font-size: $font-size-xl;
    color: $text-color;
  }
  hr {
    text-size-adjust: 100%;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizelegibility;
    color-scheme: light;
    font-feature-settings: "kern";
    font-family: "Geist Sans", sans-serif;
    line-height: 1.5;
    overflow-wrap: break-word;
    margin: 0px;
    box-sizing: content-box;
    height: 0px;
    overflow: visible;
    opacity: 0.2;
    border-width: 0px 0px 1px;
    border-image: initial;
    border-color: inherit;
    border-style: solid;
    width: 100%;
  }
}

.balance-info {
  font-weight: 500;
  color: $primary-color;
}

.notification-icon {
  font-size: $font-size-large;
  cursor: pointer;
  position: relative;
}

.page-content {
  padding: $spacing-lg;
}

.content-wrapper {
  background-color: white;
  padding: $spacing-xl;
  border-radius: $border-radius-md;
}

.whitelist-form {
  padding: $spacing-lg;
  background-color: #fafafa;
  border-radius: $border-radius-md;
  border: 1px solid #e8e8e8;

  :deep(.el-form-item) {
    margin-bottom: $spacing-lg;
  }

  :deep(.el-divider) {
    margin: $spacing-lg 0;
  }

  :deep(.el-input__wrapper),
  :deep(.el-textarea__inner) {
    border-radius: 15px;
  }

  :deep(.el-select) {
    width: 100%;
  }

  :deep(.el-button) {
    min-width: 120px;
    border-radius: 8px;
  }
}

.section-block {
  background-color: white;
  border-radius: $border-radius-md;
  padding: $spacing-lg;
  margin-bottom: $spacing-lg;
  border: 1px solid #e8e8e8;

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: $text-color;
    margin-bottom: $spacing-md;
    padding-bottom: $spacing-sm;
    border-bottom: 2px solid $primary-color;
  }
}

.query-section {
  margin-top: $spacing-xl;
  padding: $spacing-lg;
  background-color: #fafafa;
  border-radius: $border-radius-md;
  border: 1px solid #e8e8e8;

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: $text-color;
    margin-bottom: $spacing-lg;
    padding-bottom: $spacing-sm;
    border-bottom: 2px solid $primary-color;
  }

  .query-form {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: $spacing-md;
    margin-bottom: $spacing-lg;
    padding: $spacing-md;
    background-color: white;
    border-radius: $border-radius-md;

    :deep(.el-form-item) {
      margin-bottom: 0;
    }
  }
}
</style>
