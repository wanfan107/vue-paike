<template>
  <div class="page-container">
    <header class="page-header">
      <h1>{{ title }}</h1>
      <hr />
    </header>

    <main class="page-content">
      <div class="content-wrapper">
        <div class="search-container">
          <el-select
            v-model="selectedMerchant"
            placeholder="请选择商户号"
            style="width: 200px;"
          >
            <el-option
              v-for="merchant in merchants"
              :key="merchant.code"
              :label="merchant.code"
              :value="merchant.code"
            />
          </el-select>
 
        </div>

        <!-- IP白名单管理 -->
        <div class="whitelist-section">
          <div class="section-title">登录IP白名单</div>
          <div class="whitelist-content">
            <div class="whitelist-input">
              <el-input
                v-model="loginIpInput"
                type="textarea"
                placeholder="请输入登录IP地址"
                clearable
              />
              <el-button type="primary" @click="addLoginIp">添加</el-button>
            </div>
            <div class="ip-list">
              <el-tag
                v-for="(ip, index) in loginIpList"
                :key="index"
                closable
                @close="removeLoginIp(index)"
              >
                {{ ip }}
              </el-tag>
            </div>
          </div>

          <div class="section-title">代付IP白名单</div>
          <div class="whitelist-content">
            <div class="whitelist-input">
              <el-input
                v-model="payIpInput"
                type="textarea"
                placeholder="请输入代付IP地址"
                clearable
              />
              <el-button type="primary" @click="addPayIp">添加</el-button>
            </div>
            <div class="ip-list">
              <el-tag
                v-for="(ip, index) in payIpList"
                :key="index"
                closable
                @close="removePayIp(index)"
              >
                {{ ip }}
              </el-tag>
            </div>
          </div>

          <div class="save-button">
            <el-button type="primary" @click="saveWhitelist">保存白名单</el-button>
          </div>
        </div>

      </div>
    </main>
  </div>
</template>

<script setup>
import { Search } from "@element-plus/icons-vue";
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { http } from "@/api";

// 银行页面
const props = defineProps({
  title: {
    type: String,
    default: "集团IP白名单",
  },
});

let datalist = [];
const selectedMerchant = ref('');
const merchants = ref([]);

// IP白名单列表
const loginIpInput = ref('');
const loginIpList = ref([]);
const payIpInput = ref('');
const payIpList = ref([]);

// 加载商户列表
const loadMerchants = async () => {
  try {
    const res = await http.getGroupMerchants();
    if (res.code === 200 && res.data) {
      merchants.value = res.data;
    }
  } catch (error) {
    ElMessage.error('加载商户列表失败');
  }
};

// 添加登录IP
const addLoginIp = () => {
  const ip = loginIpInput.value.trim();
  if (!ip) {
    ElMessage.warning('请输入IP地址');
    return;
  }
  if (!isValidIp(ip)) {
    ElMessage.error('请输入有效的IP地址');
    return;
  }
  if (loginIpList.value.includes(ip)) {
    ElMessage.warning('该IP已存在');
    return;
  }
  loginIpList.value.push(ip);
  loginIpInput.value = '';
};

// 删除登录IP
const removeLoginIp = (index) => {
  loginIpList.value.splice(index, 1);
};

// 添加代付IP
const addPayIp = () => {
  const ip = payIpInput.value.trim();
  if (!ip) {
    ElMessage.warning('请输入IP地址');
    return;
  }
  if (!isValidIp(ip)) {
    ElMessage.error('请输入有效的IP地址');
    return;
  }
  if (payIpList.value.includes(ip)) {
    ElMessage.warning('该IP已存在');
    return;
  }
  payIpList.value.push(ip);
  payIpInput.value = '';
};

// 删除代付IP
const removePayIp = (index) => {
  payIpList.value.splice(index, 1);
};

// IP地址验证
const isValidIp = (ip) => {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
};

// 保存白名单
const saveWhitelist = async () => {
  if (!selectedMerchant.value) {
    ElMessage.warning('请先选择商户号');
    return;
  }
  try {
    const res = await http.saveIpWhitelist({
      merchantCode: selectedMerchant.value,
      loginIpList: loginIpList.value,
      payIpList: payIpList.value,
    });
    if (res.code === 200) {
      ElMessage.success('保存成功');
    }
  } catch (error) {
    ElMessage.error('保存失败');
  }
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
  padding:0 $spacing-xl;
  border-radius: $border-radius-md;
  // box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.empty-state {
  text-align: center;
  padding: $spacing-xl;
  color: #666;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: $spacing-lg;
  opacity: 0.5;
}

.empty-state h2 {
  margin: 0 0 $spacing-sm 0;
  font-size: $font-size-xl;
  color: $text-color;
}

.empty-state p {
  margin: 0;
  font-size: $font-size-base;
}
.search-container {
  display: flex; 
  align-items: center; 
  justify-content: center; 
  gap: 12px;
  margin-bottom: $spacing-lg;
  input{
    border-radius: 24px !important;
  }
  select {
    border-radius: 24px !important;
  }
}

.whitelist-section {
  background-color: #f8f9fa;
  border-radius: $border-radius-md;
  padding: $spacing-lg;
  margin-bottom: $spacing-lg;
}

.section-title {
  font-size: $font-size-xl;
  font-weight: 600;
  color: $text-color;
  margin-bottom: $spacing-md;
  padding-bottom: $spacing-sm;
  border-bottom: 1px solid #e9ecef;
}

.whitelist-content {
  margin-bottom: $spacing-lg;
  
  &:last-of-type {
    margin-bottom: $spacing-md;
  }
}

.whitelist-input {
  display: flex;
  gap: $spacing-sm;
  margin-bottom: $spacing-md;
  
  input {
    flex: 1;
    max-width: 300px;
  }
}

.ip-list {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
}

.save-button {
  display: flex;
  justify-content: flex-end;
  margin-top: $spacing-lg;
  padding-top: $spacing-md;
  border-top: 1px solid #e9ecef;
}
</style>
