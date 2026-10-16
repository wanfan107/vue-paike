<template>
  <div class="side-menu" :class="{ 'is-collapsed': collapsed }">
    <!-- 品牌标识 -->
    <div class="menu-header">
      <img src="../assets/image/pix-payment-logo-lockup.png" alt="Pix Payment" v-show="!collapsed" />
      <img src="../assets/image/pix-payment-logo.png" alt="Pix" v-show="collapsed" class="logo-icon-only" />
    </div>

    <!-- 动态渲染菜单 -->
    <el-menu
      class="simple-menu"
      :default-active="currentRoute.path"
      mode="vertical"
      :collapse="collapsed"
      :collapse-transition="false"
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
          <template #title><span class="menu-text">{{ item.title }}</span></template>
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
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import router from '../router/index.js'
import useUserStore from '../stores/user.js'

const props = defineProps({
  collapsed: { type: Boolean, default: false },
})

const currentRoute = useRoute()
const userStore = useUserStore()
const { t, te } = useI18n()

// 菜单标题：优先取 i18n（menu.<name>），缺失时回退路由中文 title
const menuTitle = (route) => {
  const key = `menu.${route.name}`
  return te(key) ? t(key) : route.title
}

// 从路由配置中动态获取菜单数据
const getMenuItemsFromRoutes = () => {
  const mainLayoutRoute = router.options.routes.find(route => route.path === '/')
  if (!mainLayoutRoute || !mainLayoutRoute.children) return []

  const menuItems = mainLayoutRoute.children.map(route => {
    const menuItem = {
      path: route.path === '' ? '/' : `/${route.path}`,
      name: route.name,
      title: menuTitle(route),
      icon: route.icon,
      roles: route.meta?.roles,
      meta: route.meta,
    }
    if (route.children && route.children.length > 0) {
      menuItem.children = route.children.map(childRoute => ({
        path: `${menuItem.path}/${childRoute.path}`,
        name: childRoute.name,
        title: menuTitle(childRoute),
        roles: childRoute.meta?.roles,
        meta: childRoute.meta,
      }))
    }
    return menuItem
  })
  return filterMenuByPermission(menuItems)
}

const getUserRole = () => {
  const roleCode = userStore.roleCode
  if (!roleCode) return 'merchant'
  return roleCode || 'merchant'
}

const hasPermission = (roles) => {
  if (!roles || roles.length === 0) return true
  return roles.includes(getUserRole())
}

const hasCurrencyPermission = (meta) => {
  if (!meta || !meta.showForCurrency) return true
  return userStore.merchantInfo?.currency === meta.showForCurrency
}

const filterMenuByPermission = (menuItems) => {
  return menuItems.filter(item => {
    if (!hasPermission(item.roles)) return false
    if (!hasCurrencyPermission(item.meta)) return false
    if (item.children && item.children.length > 0) {
      const filteredChildren = item.children.filter(child =>
        hasPermission(child.roles) && hasCurrencyPermission(child.meta)
      )
      if (filteredChildren.length > 0) {
        item.children = filteredChildren
        return true
      }
      return false
    }
    return true
  })
}

const menuItems = getMenuItemsFromRoutes()

const handleOpen = (key, keyPath) => {}
const handleClose = (key, keyPath) => {}
</script>

<style lang="scss" scoped>
@use "../styles/index.scss" as *;

.side-menu {
  width: 250px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: var(--font-body, "Sora", "PingFang SC", "Microsoft YaHei", sans-serif);
  background-color: var(--color-sidebar, #ffffff);
  border-right: 1px solid var(--color-border-soft, #ececef);
  transition: width 0.25s ease;
  overflow: hidden;
}

// 折叠态：64px 宽，只显示图标
.side-menu.is-collapsed {
  width: 64px;
}

.menu-header {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 56px;
  padding: 0 16px;
  border-bottom: 1px solid var(--color-border-soft, #ececef);
  flex-shrink: 0;
}

.menu-header img {
  height: 36px;
  width: auto;
  max-width: 100%;
  object-fit: contain;
}

// 折叠态：只显示方形图标 logo
.logo-icon-only {
  width: 32px !important;
  height: 32px !important;
  border-radius: 8px;
}

.simple-menu {
  border-right: none;
  flex: 1;
  overflow-y: auto;
  background-color: transparent;
}

:deep(.el-menu) {
  background: var(--color-sidebar, var(--color-surface, #ffffff)) !important;
}

:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  background-color: transparent;
  position: relative;
  padding-right: 16px !important;
  height: 40px;
  line-height: 40px;
  font-size: 13px;
  font-weight: 500;
  margin: 2px 14px;
  border-radius: 10px;
  color: var(--text-regular, #52525b);
  transition: all 0.2s ease;
  overflow: hidden;
}

:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  background-color: var(--color-hover, #ececef);
  color: var(--text-primary, #18181b);
}

:deep(.el-menu-item.is-active),
:deep(.el-sub-menu.is-active > .el-sub-menu__title) {
  color: var(--brand-primary, #16a34a);
  background-color: var(--brand-primary-soft, rgba(22, 163, 74, 0.1));
  font-weight: 600;
  box-shadow: none;
}

:deep(.el-menu-item.is-active)::before,
:deep(.el-sub-menu.is-active > .el-sub-menu__title)::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background-color: var(--brand-primary, #16a34a);
  border-radius: 0 2px 2px 0;
}

:deep(.el-menu-item.is-active:hover),
:deep(.el-sub-menu.is-active > .el-sub-menu__title:hover) {
  background-color: var(--brand-primary-soft, rgba(22, 163, 74, 0.12));
}

.sub-menu-text {
  margin-left: 0.75rem;
  font-size: 13px;
}

:deep(.el-sub-menu__children) {
  padding: 4px 0;
}

:deep(.el-sub-menu__children .el-menu-item) {
  padding-left: 46px !important;
  margin: 2px 14px;
  height: 40px;
  line-height: 40px;
  font-size: 13px;
  border-radius: 8px;
}

:deep(.is-opened .el-menu--inline .el-menu-item.is-active) {
  background-color: var(--brand-primary-soft, rgba(22, 163, 74, 0.1)) !important;
  border-radius: 8px !important;
  box-shadow: none !important;
  margin: 2px 14px !important;
  padding: 0 16px 0 46px !important;
}

:deep(.is-opened .el-menu--inline .el-menu-item.is-active:before) {
  left: 26px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--brand-primary, #16a34a);
}

.fast-icon-wrapper {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  border-radius: 8px;
  background-color: var(--color-hover, #f3f4f6);
  transition: all 0.2s ease;
  flex-shrink: 0;
}

// 激活态图标：品牌色软底（NTX 风格，不刺眼）
:deep(.el-menu-item.is-active) .fast-icon-wrapper,
:deep(.el-sub-menu.is-active > .el-sub-menu__title) .fast-icon-wrapper {
  background-color: var(--brand-primary-soft, rgba(22, 163, 74, 0.12));
  color: var(--brand-primary, #16a34a);
}

// ==================== 折叠态专用样式 ====================
.side-menu.is-collapsed {
  // 菜单项：去掉外边距，内容居中
  :deep(.el-menu-item),
  :deep(.el-sub-menu__title) {
    margin: 4px 8px !important;
    padding: 0 !important;
    justify-content: center;
    border-radius: 10px;
  }

  // EP 的 tooltip trigger 有默认 padding 0 20px，会把图标推偏
  :deep(.el-menu-tooltip__trigger) {
    padding: 0 !important;
    justify-content: center;
  }

  // 去掉左侧激活条（空间不够）
  :deep(.el-menu-item.is-active)::before,
  :deep(.el-sub-menu.is-active > .el-sub-menu__title)::before {
    display: none;
  }

  // 子菜单项不显示（collapse 模式下由 tooltip 处理）
  :deep(.el-sub-menu__children) {
    display: none;
  }

  // 隐藏菜单文字（el-menu collapse 已处理，这里兜底）
  .menu-text,
  .sub-menu-text {
    display: none;
  }
}

// 折叠态：图标容器居中，无右边距
.side-menu.is-collapsed .fast-icon-wrapper {
  margin-right: 0;
}

.fast-icon {
  font-size: 16px;
  color: var(--text-secondary, #6b7280);
  transition: all 0.2s ease;
}

.menu-text {
  margin-left: 0;
}

:deep(.el-menu-item.is-active),
:deep(.el-sub-menu.is-active > .el-sub-menu__title) {
  .fast-icon-wrapper {
    background-color: var(--brand-primary, #16a34a);
  }
  .fast-icon {
    color: var(--text-inverse, #ffffff) !important;
  }
}

:deep(.el-icon) {
  margin-right: 0 !important;
}
</style>
