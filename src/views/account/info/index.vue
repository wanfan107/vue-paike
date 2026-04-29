<template>
  <div class="account-info-container">
    <div class="account-card" >
      <div class="card-header">
        <div class="header-title">账户层级管理</div>
        <div class="header-subtitle">查看账户层级结构和详细信息</div>
      </div>
      <div class="account-tree-container">
        <el-tree
          :data="accountTree"
          :props="defaultProps"
          node-key="id"
          default-expand-all
          @node-click="handleNodeClick"
        >
          <template #default="{ node, data }">
            <div class="tree-node">
              <span class="node-name">{{ data.name }}</span>
              <span v-if="data.type === 'group'" class="node-type group-type">集团账户</span>
              <span v-else-if="data.type === 'sub'" class="node-type sub-type">子账户</span>
              <span v-else-if="data.type === 'personal'" class="node-type personal-type">个人账户</span>
            </div>
          </template>
        </el-tree>
      </div>
      <div v-if="selectedAccount" class="account-detail">
        <div class="detail-header">
          <h3>{{ selectedAccount.name }} - 详细信息</h3>
        </div>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="账户类型">
            {{ getAccountTypeText(selectedAccount.type) }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedAccount.id" label="账户ID">
            {{ selectedAccount.id }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedAccount.company" label="公司名称">
            {{ selectedAccount.company }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedAccount.owner" label="账户所有者">
            {{ selectedAccount.owner }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedAccount.email" label="联系方式">
            {{ selectedAccount.email }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedAccount.status" label="账户状态">
            <el-tag :type="selectedAccount.status === 'active' ? 'success' : 'warning'">
              {{ selectedAccount.status === 'active' ? '活跃' : '非活跃' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';

// 账户树数据
const accountTree = ref([
  {
    id: 'group1',
    name: '集团账户',
    type: 'group',
    company: 'Zir 有限公司',
    status: 'active',
    children: [
      {
        id: 'sub1',
        name: 'C907865',
        type: 'sub',
        company: 'Zir 有限公司',
        status: 'active',
        children: [
          {
            id: 'personal1',
            name: '运营账户1',
            type: 'personal',
            owner: '卡琳娜',
            email: 'karina@zir.com',
            status: 'active'
          },
          {
            id: 'personal2',
            name: '运营账户2',
            type: 'personal',
            owner: '张三',
            email: 'zhangsan@zir.com',
            status: 'active'
          }
        ]
      },
      {
        id: 'sub2',
        name: 'C907865',
        type: 'sub',
        company: 'Zir 有限公司',
        status: 'active',
        children: [
          {
            id: 'personal3',
            name: '运营账户3',
            type: 'personal',
            owner: '李四',
            email: 'lisi@zir.com',
            status: 'active'
          }
        ]
      }
    ]
  }
]);

// 树节点配置
const defaultProps = {
  children: 'children',
  label: 'name'
};

// 选中的账户
const selectedAccount = ref(null);

// 处理节点点击
const handleNodeClick = (data) => {
  selectedAccount.value = data;
};

// 页面加载时默认显示第一个个人账户的信息
onMounted(() => {
  // 找到第一个个人账户并选中它
  const findFirstPersonalAccount = (nodes) => {
    for (const node of nodes) {
      if (node.type === 'personal') {
        return node;
      }
      if (node.children && node.children.length > 0) {
        const found = findFirstPersonalAccount(node.children);
        if (found) {
          return found;
        }
      }
    }
    return null;
  };
  
  const firstPersonalAccount = findFirstPersonalAccount(accountTree.value);
  if (firstPersonalAccount) {
    selectedAccount.value = firstPersonalAccount;
  }
});

// 获取账户类型文本
const getAccountTypeText = (type) => {
  switch (type) {
    case 'group':
      return '集团账户';
    case 'sub':
      return '子账户';
    case 'personal':
      return '个人账户';
    default:
      return '未知类型';
  }
};
</script>
<style scoped lang="scss">
// 容器样式
.account-info-container {
  min-height: calc(100vh - 200px);
  padding: 40px 20px;
}

// 卡片样式
.account-card {
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  background: white;
}

// 卡片头部
.card-header {
  padding: 24px;
  border-bottom: 1px solid #e9ecef;
}

.header-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
  color: #2c3e50;
}

.header-subtitle {
  font-size: 14px;
  opacity: 0.9;
  font-weight: 400;
  color: #6c757d;
}

// 账户树容器
.account-tree-container {
  padding: 24px;
  border-bottom: 1px solid #e9ecef;
  max-height: 400px;
  overflow-y: auto;
}

// 树节点样式
.tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.node-name {
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
}

.node-type {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.group-type {
  background-color: #e3f2fd;
  color: #1976d2;
}

.sub-type {
  background-color: #e8f5e8;
  color: #388e3c;
}

.personal-type {
  background-color: #fff3e0;
  color: #f57c00;
}

// 账户详情
.account-detail {
  padding: 24px;
}

.detail-header {
  margin-bottom: 20px;
}

.detail-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

// 响应式设计
@media (max-width: 768px) {
  .account-info-container {
    padding: 20px;
  }

  .account-card {
    margin: 0;
  }

  .card-header {
    padding: 20px;
  }

  .header-title {
    font-size: 20px;
  }

  .account-tree-container {
    padding: 20px;
  }

  .account-detail {
    padding: 20px;
  }
}
</style>
