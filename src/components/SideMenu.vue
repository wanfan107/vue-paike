<template>
  <div class="side-menu">
    <!-- 品牌标识 -->
    <div class="menu-header">
      <img src="../assets/image/logo.png" alt="" />
      <p>FINANCE v1.2</p>
    </div>

    <!-- 动态渲染菜单 -->
    <el-menu
      class="simple-menu"
      :default-active="currentRoute.path"
      mode="vertical"
      router
      @open="handleOpen"
      @close="handleClose"
    >
      <template v-for="(item, index) in menuItems" :key="item.path">
        <!-- 无子菜单的菜单项 -->
        <el-menu-item v-if="!item.children" :index="item.path">
          <div class="fast-icon-wrapper">
            <el-icon class="fast-icon" :size="20">
              <component :is="item.icon"></component>
            </el-icon>
          </div>
          <span class="menu-text">{{ item.title }}</span>
        </el-menu-item>

        <!-- 有子菜单的菜单项 -->
        <el-sub-menu v-else :index="item.path">
          <template #title>
            <div class="fast-icon-wrapper">
              <el-icon class="fast-icon" :size="20">
                <component :is="item.icon"></component>
              </el-icon>
            </div>
            <span class="menu-text">{{ item.title }}</span>
          </template>
          <el-menu-item
            v-for="child in item.children"
            :key="child.path"
            :index="child.path"
          >
            <span class="sub-menu-text">{{ child.title }}</span>
          </el-menu-item>
        </el-sub-menu>
      </template>

    </el-menu>

    <!-- 用户信息区域 -->
    <div class="user-info-container">
      <el-dropdown @command="handleUserCommand">
        <div class="user-info">
          <div class="user-avatar" v-if=" isGroupLogin && userStore.roleName==='管理员'">管理</div>
          <div class="user-avatar" v-else-if=" isGroupLogin && userStore.roleName==='运营'">运营</div>
          <div class="user-avatar" v-else-if=" isGroupLogin && userStore.roleName==='财务'">财务</div> 
          <div class="user-avatar" v-else style="background-color: #ff4949;">商户</div> 

          <div class="user-details">
            <div class="user-name">{{ userStore.merchantId || userStore.userInfo?.username }}</div>
            <!-- <div class="user-company">Zir 有限公司</div> -->
            <!-- <div class="user-account">账户 11525 </div> -->
          </div>
          <div class="user-dropdown-icon">
            <el-icon><Switch /></el-icon>
          </div>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="account" v-if="isGroupLogin">切换账户</el-dropdown-item>
            <el-dropdown-item command="logout">退出</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>

    <!-- 多用户选择 -->
    <el-dialog
      :z-index="1001"
      top="10vh"
      width="500px"
      v-model="dialogValue1"
      :close-on-click-modal="false"
      append-to-body
      custom-class="account-dialog"
      :show-close="false"
    >
      <div class="dialog-close" @click="dialogValue1 = false,searchKey = ''">×</div>
      <div class="dialog-header">
        <div class="logo-container">
          <img
            src="../assets/image/logo.png"
            alt="Logo"
            class="dialog-logo"
          />
        </div>
        <div class="dialog-title">Selecione a conta</div>
        <div class="dialog-title">
          <el-select
            v-model="searchKey"
            filterable
            placeholder="请选择"
            clearable
          >
            <el-option
              v-for="item in accounts"
              :key="item.id"
              :label="item.id"
              :value="item.id"
            >
            </el-option>
          </el-select>
        </div>
      </div>
      <div class="account-list">
        <div
          v-for="(account, index) in filteredAccounts"
          :key="index"
          class="account-item"
          :class="{ 'current-account': account.id === userStore.currentMerchantCode }"
          @click="confirmBind(account)"
        >
          <div class="left-column">
            <div class="account-id">
              {{ account.id }}
              <el-tag v-if="account.id === userStore.currentMerchantCode " type="info" size="small">当前</el-tag>
            </div>
            <div class="account-type">{{ account.type }}</div>
          </div>
          <div class="right-column">
            <!-- <div class="account-company"><span>余额：</span>{{ account.balance || ' ' }}</div> -->
             <!-- // 修改后 -->
<div class="account-company"><span>余额：</span><span class="balance-value">{{ account.balance || ' ' }}</span></div>
            <div class="account-number">创建时间：{{ account.createdOn }}</div>
          </div>
        </div>
      </div>
    </el-dialog>
</template>
<script setup>
  // 导入必要的图标组件
  import { HomeFilled, Search, Operation, FolderOpened, ArrowDown, Switch } from '@element-plus/icons-vue'
  import { ref, computed, onMounted } from 'vue'
  import { useRoute } from 'vue-router'
  import router from '../router/index.js'
  import useUserStore from '../stores/user.js'
  import { ElMessage,ElMessageBox } from 'element-plus'
  import { http } from "@/api";

  
  // 获取当前路由
  const currentRoute = useRoute()
  
  // 获取用户store
  const userStore = useUserStore()
  
  // 弹窗状态
  const dialogValue1 = ref(false)
  
  // 搜索关键词
  const searchKey = ref('')
  
  // 账户列表
  const accounts = ref([])

  // 获取用户列表（集团用户的商户列表）
 const getUserList = async () => {
  try {
    const res = await http.getGroupMerchants();
    if (res.code === 200) {
      const filteredMerchants = res.data.filter(m => !m.code?.startsWith('G'));
      accounts.value = filteredMerchants.map(m => ({
        id: m.code,
        code: m.code,
        siteUrl: m.siteUrl || '',
        type: m.isGroup ? '集团' : '商户',
        balance: m.balance || '0.00',
        createdOn: formatDateTime(m.createdOn) || '',
      }));
    } else {
      accounts.value = [];
    }
  } catch (error) {
    console.error('获取商户列表失败:', error);
    accounts.value = [];
  }
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  // 如果是字符串，先转换为 Date 对象
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  const pad = (n) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};
// 计算属性
const isGroupLogin = computed(() => {
  return !!userStore.groupToken && (userStore.merchants?.length || 0) > 0;
});

const roleTagType = computed(() => {
  switch (userStore.roleCode) {
    case "admin": return "danger";
    case "finance": return "warning";
    case "operator": return "info";
    default: return "";
  }
});
// 组件挂载时初始化账户列表
onMounted(() => {
  // 如果是集团用户，获取商户列表
  if (userStore.groupToken) {
    getUserList();
  }
});

  
  // 过滤后的账户列表
  const filteredAccounts = computed(() => {
    const keyword = (searchKey.value || '').trim().toLowerCase()
    if (!keyword) {
      return accounts.value
    }
    return accounts.value.filter(
      (account) =>
        (account.id || '').toLowerCase().includes(keyword) ||
        (account.company || '').toLowerCase().includes(keyword) ||
        (account.accountNumber || '').toLowerCase().includes(keyword)
    )
  })


  // admin 管理员角色    
  // merchant 商户角色    
  // operator 操作员    
  // finance 财务角色    


  // 获取当前用户角色
  const getUserRole = () => {
    const roleCode = userStore.roleCode
    console.log(roleCode);
    
    if (!roleCode) return 'merchant'
    return roleCode || 'merchant'
  }
  
  // 检查用户是否有权限访问菜单项
  const hasPermission = (roles) => {
    if (!roles || roles.length === 0) return true
    const userRole = getUserRole()
    return roles.includes(userRole)
  }
  
  // 过滤菜单项，只保留用户有权限访问的
  const filterMenuByPermission = (menuItems) => {
    return menuItems.filter(item => {
      // 检查当前菜单项是否有权限
      if (!hasPermission(item.roles)) {
        return false
      }
      
      // 如果有子菜单，过滤子菜单
      if (item.children && item.children.length > 0) {
        const filteredChildren = item.children.filter(child => hasPermission(child.roles))
        if (filteredChildren.length > 0) {
          item.children = filteredChildren
          return true
        }
        return false
      }
      
      return true
    })
  }
  
  // 从路由配置中动态获取菜单数据
  const getMenuItemsFromRoutes = () => {
    const mainLayoutRoute = router.options.routes.find(route => route.path === '/')
    if (!mainLayoutRoute || !mainLayoutRoute.children) {
      return []
    }
    
    // 处理菜单数据，确保格式正确
    const menuItems = mainLayoutRoute.children.map(route => {
      // 创建基础菜单项
      const menuItem = {
        path: route.path === '' ? '/' : `/${route.path}`,
        name: route.name,
        title: route.title,
        icon: route.icon,
        roles: route.meta?.roles
      }
      
      // 如果有子菜单，处理子菜单
      if (route.children && route.children.length > 0) {
        menuItem.children = route.children.map(childRoute => ({
          path: `${menuItem.path}/${childRoute.path}`,
          name: childRoute.name,
          title: childRoute.title,
          roles: childRoute.meta?.roles
        }))
      }
      
      return menuItem
    })
    
    // 根据用户权限过滤菜单
    return filterMenuByPermission(menuItems)
  }
  
  // 调用函数获取菜单数据
  const menuItems = getMenuItemsFromRoutes()


// 定义 handleOpen 方法
const handleOpen = (key, keyPath) => {
  console.log("Menu aberto:", key, keyPath);
  // 你可以在这里添加打开菜单的逻辑
};
// 定义 handleClose 方法
const handleClose = (key, keyPath) => {
  console.log("Menu fechado:", key, keyPath);
  // 你可以在这里添加关闭菜单的逻辑
};

// 处理用户下拉菜单命令
const handleUserCommand = async (command) => {
  if (command === 'account') {
    // 显示账户选择弹窗
    dialogValue1.value = true;
      getUserList();
    console.log('Dados da Conta clicked');
  } else if (command === 'logout') {
    try {
      await userStore.logout();
      ElMessage.success('退出登录成功');
      
      // 兜底：1.5秒后如果还没跳走，强制刷新跳转
      const fallbackTimer = setTimeout(() => {
        window.location.href = '/Login?t=' + Date.now();
      }, 1500);
      
      await router.replace({
        path: '/Login',
        query: { t: Date.now() }
      });
      
      // 跳转成功，清除兜底定时器
      clearTimeout(fallbackTimer);
    } catch (error) {
      console.error('退出登录失败:', error);
      // 出错直接强制跳转
      window.location.href = '/Login';
    }
  }
};

// 确认绑定账户

function confirmBind(account) {
  if (account) {
    const merchantCode = account.code || account.id;
    
    ElMessageBox.confirm(
      `确定切换到商户 ${merchantCode} 吗?`,
      '切换商户',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    ).then(async () => {
      try {
        await userStore.selectMerchant(merchantCode);
        ElMessage.success(`已切换到商户 ${merchantCode}`);
        window.location.reload();
      } catch (err) {
        ElMessage.error('切换失败');
      }
    }).catch(() => {
      // 用户取消操作
    });
    
    dialogValue1.value = false;
  }
};
</script>

<style lang="scss" scoped>
@use "../styles/index.scss" as *;
.side-menu {
  width: 230px;
  height: 100vh;
  // background: black;
  /* border-right: 1px solid #e0e0e0; */
  display: flex;
  flex-direction: column;
  // font-family: Arial, sans-serif;
 font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
  font-weight: 700;
}
.menu-header {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}

.menu-header img {
  width: 180px;
  height: 50px;
}

.menu-header p {
  font-size: 12px;
  // font-weight: 700;
  color: #db0011;
}

.simple-menu {
  border-right: none;
  flex: 1;
  overflow-y: auto;
  background-color: #f5f7fa;
}

/* 设置菜单背景色 */
:deep(.el-menu) {
  background: $background-color !important;
}

/* 默认样式 */
:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  // color: #606266; /* 黑灰色 */
  background-color: transparent;
  position: relative;
  // padding-left: 20px !important;
  padding-right: 20px !important;
  height: 50px; /* 调整菜单项高度 */
  line-height: 50px; /* 垂直居中 */
  font-size: 14px; /* 调整字体大小 */
  font-weight: 300;
  margin: 2px 10px; /* 调整菜单项间距 */
  transition: all 0.3s ease;
}

/* 父菜单选中效果 - 半圆 (仅当父菜单本身被选中时生效，子菜单选中时不会触发) */
/* 由于父菜单使用数字索引，而子菜单使用路由路径，所以子菜单选中时父菜单不会被激活 */
:deep(.el-sub-menu.is-active > .el-sub-menu__title) {
  color: #db0011; /* 黑色字体 */
  background-color: #ffffff; /* 白色背景 */
  border-radius: 24px; /* 右边半圆 */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
// -hover 效果
:deep(.el-sub-menu.is-active > .el-sub-menu__title:hover) {
  color: #db0011; /* 黑色字体 */
  background-color: #ffffff; /* 白色背景 */
  border-radius: 24px; /* 右边半圆 */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 单级菜单选中效果 - 半圆 */
:deep(.el-menu-item.is-active) {
  color: #db0011; /* 黑色字体 */
  background-color: #ffffff; /* 白色背景 */
  border-radius: 24px; /* 右边半圆 */
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* 阴影 */
}

// -hover 效果
/* 单级菜单选中效果 - 半圆 */    
:deep(.el-menu-item:hover) {
  color: #db0011; /* 黑色字体 */
  background-color: #ffffff; /* 白色背景 */
  border-radius: 24px; /* 右边半圆 */
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* 阴影 */
}

/* 单级菜单选中时没有前面的点 */
:deep(.el-menu-item.is-active:before) {
  display: none;
}




.sub-menu-text {
  margin-left: 0.75rem;
  font-size: 13px; /* 调整子菜单字体大小 */
}

/* 调整子菜单的内边距和间距 */
:deep(.el-sub-menu__children) {
  padding: 5px 0;
}

:deep(.el-sub-menu__children .el-menu-item) {
  padding-left: 40px !important; /* 子菜单缩进 */
  margin: 1px 15px; /* 子菜单间距 */
  height: 45px; /* 子菜单高度 */
  line-height: 45px; /* 子菜单垂直居中 */
}

:deep(.is-opened .el-menu--inline .el-menu-item.is-active) {
  // color: #606266 !important; /* 保持黑灰色字体 */
  background-color: transparent !important; /* 完全透明背景 */
  border-radius: 0 !important; /* 没有任何圆角或半圆 */
  box-shadow: none !important; /* 没有阴影 */
  margin: 1px 15px !important; /* 保持与普通子菜单相同的边距 */
  padding: 0 20px 0 40px !important; /* 保持与普通子菜单相同的内边距 */
}

/* 子菜单选中时前面的点 */
:deep(.is-opened .el-menu--inline .el-menu-item.is-active:before) {
  display: block;
  content: "";
  position: absolute;
  left: 30px;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  background-color: #db0011; /* 主题色点 */
  border-radius: 50%; /* 圆形 */
  z-index: 1;
}


.fast-icon-wrapper {
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.menu-text{
  margin-left: 10px;
}

:deep(.el-menu-item.is-active) {
  .fast-icon-wrapper {
    width: 35px;
    height: 35px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background-color: #db0011;
  }
  
  .fast-icon {
    color: #f0f0f0 !important;
    font-weight: 900;
  }
.el-icon{
    margin-right: 0 !important;
  }
}
// .fast-icon{
//   // color: #db0011 !important;
// }

:deep(.el-sub-menu.is-active > .el-sub-menu__title) {
 .fast-icon-wrapper {
    width: 35px;
    height: 35px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background-color: #db0011;
  }
  
  .fast-icon {
    color: #f0f0f0 !important;
    font-weight: 900;
  }
.el-icon{
    margin-right: 0 !important;
  }
}

/* 用户信息区域样式 */
.user-info-container {
  padding: 0px 15px;
  text-align: center;
  border-top: 1px solid #e0e0e0;
}

:deep(.el-dropdown:focus),
:deep(.el-dropdown:focus-visible),
:deep(.el-dropdown-item:focus),
:deep(.el-dropdown-item:focus-visible) {
  outline: none;
  box-shadow: none;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 10px;
  border-radius: 12px;
  outline: none;
  box-shadow: none;
}

.user-dropdown-icon {
  margin-left: 10px;
  color: #666;
  transition: transform 0.3s ease;
}

.user-info:hover .user-dropdown-icon {
  transform: rotate(180deg);
  color: #db0011;
}

// .user-info:hover {
//   background-color: rgba(175, 76, 76, 0.1);
// }

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #db0011;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
  margin-right: 15px;
}

.user-details {
  flex: 1;
}

.user-name {
  font-weight: bold;
  color: #333;
  font-size: 14px;
  margin-bottom: 3px;
}

.user-company {
  color: #666;
  font-size: 13px;
  margin-bottom: 2px;
}

.user-account {
  color: #999;
  font-size: 12px;
}

/* 下拉菜单样式 */
:deep(.el-dropdown-menu) {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

:deep(.el-dropdown-item) {
  padding: 10px 20px;
  font-size: 14px;
}

:deep(.el-dropdown-item:hover) {
  background-color: rgba(76, 175, 80, 0.1);
  color: #af4c4c;
}

/* 账户选择弹窗样式 */
.account-dialog {
  border-radius: 16px;
  background-color: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: none;
  padding-bottom: 20px;
}

.dialog-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0;
  margin-bottom: 20px;
}

.logo-container {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.dialog-logo {
  width: 120px;
  border-radius: 8px;
}

.dialog-title {
  font-size: 16px;
  color: #666;
  font-weight: 500;
  text-align: center;
}

.account-list {
  padding: 0;
  margin: 0;
  max-height: 220px; /* 大约3个账户的高度 */
  overflow-y: auto; /* 超出部分滚动 */
}

.account-item {
  display: flex;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e8e8e8;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #f9f9f9;
  }
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
}

.account-id {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.account-type {
  font-size: 14px;
  color: #888;
}

.account-company {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.account-number {
  font-size: 14px;
  color: #888;
}

.dialog-close {
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 30px;
  cursor: pointer;
  color: #999;
}

:deep(.el-dialog__body) {
  padding: 0 20px;
}

:deep(.el-dialog__footer) {
  padding: 0;
  padding-right: 40px;
  padding-bottom: 20px;
}

.balance-value {
  // color: #67c23a;  // Element Plus 绿色主题色
  font-weight: 600;
}
</style>
