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
          <div class="user-avatar">ZL</div>
          <div class="user-details">
            <div class="user-name">卡琳娜</div>
            <div class="user-company">Zir 有限公司</div>
            <div class="user-account">账户 11525 分行 0001</div>
          </div>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="account">账户数据</el-dropdown-item>
            <el-dropdown-item command="logout">退出</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>
<script setup>
  // 导入必要的图标组件
  import { HomeFilled, Search, Operation, FolderOpened } from '@element-plus/icons-vue'
  import { useRoute } from 'vue-router'
  import router from '../router/index.js'
  
  // 获取当前路由
  const currentRoute = useRoute()
  
  // 从路由配置中动态获取菜单数据
  const getMenuItemsFromRoutes = () => {
    const mainLayoutRoute = router.options.routes.find(route => route.path === '/')
    if (!mainLayoutRoute || !mainLayoutRoute.children) {
      return []
    }
    
    // 处理菜单数据，确保格式正确
    return mainLayoutRoute.children.map(route => {
      // 创建基础菜单项
      const menuItem = {
        path: route.path === '' ? '/' : `/${route.path}`,
        name: route.name,
        title: route.title,
        icon: route.icon
      }
      
      // 如果有子菜单，处理子菜单
      if (route.children && route.children.length > 0) {
        menuItem.children = route.children.map(childRoute => ({
          path: `${menuItem.path}/${childRoute.path}`, // 子菜单路径需要包含父路径
          name: childRoute.name,
          title: childRoute.title
        }))
      }
      
      return menuItem
    })
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
const handleUserCommand = (command) => {
  if (command === 'account') {
    // 跳转到账户信息页面
    console.log('Dados da Conta clicked');
  } else if (command === 'logout') {
    // 执行退出登录逻辑
    console.log('Sair clicked');
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
  color: #f10808; /* 黑色字体 */
  background-color: #ffffff; /* 白色背景 */
  border-radius: 24px; /* 右边半圆 */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
// -hover 效果
:deep(.el-sub-menu.is-active > .el-sub-menu__title:hover) {
  color: #f10808; /* 黑色字体 */
  background-color: #ffffff; /* 白色背景 */
  border-radius: 24px; /* 右边半圆 */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 单级菜单选中效果 - 半圆 */
:deep(.el-menu-item.is-active) {
  color: #f10808; /* 黑色字体 */
  background-color: #ffffff; /* 白色背景 */
  border-radius: 24px; /* 右边半圆 */
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* 阴影 */
}

// -hover 效果
/* 单级菜单选中效果 - 半圆 */    
:deep(.el-menu-item:hover) {
  color: #f10808; /* 黑色字体 */
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
  background-color: #ff0000; /* 主题色点 */
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
    background-color: #ff0000;
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
//   // color: #ff0000 !important;
// }

:deep(.el-sub-menu.is-active > .el-sub-menu__title) {
 .fast-icon-wrapper {
    width: 35px;
    height: 35px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background-color: #ff0000;
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
  padding: 15px;
  border-top: 1px solid #e0e0e0;
  // background-color: #ffffff;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 10px;
  border-radius: 12px;
}

.user-info:hover {
  background-color: rgba(175, 76, 76, 0.1);
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #ff0000;
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
</style>
