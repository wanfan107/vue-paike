<template>
  <header class="app-header">
    <!-- 左侧：侧栏折叠开关 -->
    <div class="header-left">
      <button class="collapse-btn" @click="$emit('toggle-sidebar')" :title="collapsed ? t('header.expandMenu') : t('header.collapseMenu')">
        <el-icon :size="20">
          <!-- 折叠态：点击可展开（面板在右，箭头朝右） -->
          <svg
            v-if="collapsed"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
            <path d="M14.5 4.5v15" />
            <path d="M7.5 9.5 10.5 12l-3 2.5" />
          </svg>
          <!-- 展开态：点击可收起（面板在左，箭头朝左） -->
          <svg
            v-else
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
            <path d="M9.5 4.5v15" />
            <path d="M16.5 9.5 13.5 12l3 2.5" />
          </svg>
        </el-icon>
      </button>
    </div>

    <!-- 右侧：主题切换 + 语言切换 + 商户切换 -->
    <div class="header-right">
      <button class="icon-btn" :title="t('header.themeToggle')" @click="toggleTheme">
        <el-icon :size="18">
          <Sunny v-if="isDark" />
          <Moon v-else />
        </el-icon>
      </button>

      <el-dropdown class="lang-switcher" trigger="click" @command="handleLocaleCommand">
        <button class="icon-btn lang-btn" :title="t('header.language')">
          <el-icon :size="18"><GlobeIcon /></el-icon>
          <span class="lang-label">{{ currentLocaleLabel }}</span>
          <el-icon class="lang-arrow" :size="12"><ArrowDown /></el-icon>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-for="item in LOCALES"
              :key="item.value"
              :command="item.value"
              :class="{ 'is-current': item.value === locale }"
            >
              {{ item.label }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-dropdown @command="handleUserCommand" trigger="click">
        <div class="merchant-switcher">
          <div class="merchant-avatar">{{ avatarText }}</div>
          <div class="merchant-info">
            <span class="merchant-label">{{ t('header.currentMerchant') }}</span>
            <span class="merchant-code">{{ userStore.merchantId || userStore.userInfo?.username }}</span>
          </div>
          <el-icon class="switcher-arrow"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="account" v-if="isGroupLogin">
              <el-icon><Switch /></el-icon>{{ t('header.switchMerchant') }}
            </el-dropdown-item>
            <el-dropdown-item command="logout" divided>
              <el-icon><SwitchButton /></el-icon>{{ t('header.logout') }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 多商户选择弹窗 -->
    <el-dialog
      :z-index="1001"
      top="10vh"
      width="500px"
      v-model="dialogValue1"
      :close-on-click-modal="false"
      append-to-body
      class="account-dialog"
      :show-close="false"
    >
      <div class="dialog-close" @click="dialogValue1 = false; searchKey = ''">×</div>
      <div class="dialog-header">
        <div class="logo-container">
          <img src="@/assets/image/pix-payment-logo.png" alt="Logo" class="dialog-logo" />
        </div>
        <div class="dialog-title">{{ t('header.selectPlaceholder') }}</div>
        <el-select
          class="dialog-search"
          v-model="searchKey"
          filterable
          :placeholder="t('header.selectAccount')"
          clearable
        >
          <el-option
            v-for="item in accounts"
            :key="item.id"
            :label="item.id"
            :value="item.id"
          />
        </el-select>
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
              <el-tag v-if="account.id === userStore.currentMerchantCode" type="success" size="small" effect="light">{{ t('header.current') }}</el-tag>
            </div>
            <el-tooltip :content="account.type || t('header.unconfiguredSite')" placement="left">
              <div class="account-type">{{ account.type || t('header.unconfiguredSite') }}</div>
            </el-tooltip>
          </div>
          <div class="right-column">
            <div class="account-company"><span class="balance-label">{{ t('header.balance') }}：</span><span class="balance-value">{{ account.balance || ' ' }}</span></div>
            <div class="account-number">{{ t('header.createdAt') }}：{{ account.createdOn }}</div>
          </div>
        </div>
      </div>
    </el-dialog>
  </header>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import router from '../router/index.js'
import useUserStore from '../stores/user.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, Switch, SwitchButton, Sunny, Moon } from '@element-plus/icons-vue'
import GlobeIcon from './GlobeIcon.vue'
import { http } from '@/api'
import { useTheme } from '@/composables/useTheme'
import { LOCALES, setLocale } from '@/i18n'

const { t, locale } = useI18n()
const { isDark, toggleTheme } = useTheme()

const currentLocaleLabel = computed(
  () => LOCALES.find((item) => item.value === locale.value)?.label || t('common.zh'),
)

const handleLocaleCommand = (value) => setLocale(value)

const props = defineProps({
  collapsed: { type: Boolean, default: false },
})
defineEmits(['toggle-sidebar'])

const route = useRoute()
const userStore = useUserStore()

// ---------- 商户切换 ----------
const avatarText = computed(() => {
  if (isGroupLogin.value) {
    const role = userStore.roleName
    if (role === '管理员') return t('header.admin')
    if (role === '运营') return t('header.operator')
    if (role === '财务') return t('header.finance')
  }
  return t('header.merchant')
})

const isGroupLogin = computed(() => {
  return !!userStore.groupToken && (userStore.merchants?.length || 0) > 0
})

const dialogValue1 = ref(false)
const searchKey = ref('')
const accounts = ref([])

const getUserList = async () => {
  try {
    const res = await http.getGroupMerchants()
    if (res.code === 200) {
      const filteredMerchants = res.data.filter(m => !m.code?.startsWith('G'))
      accounts.value = filteredMerchants.map(m => ({
        id: m.code,
        code: m.code,
        siteUrl: m.siteUrl || '',
        type: m.qq || '',
        balance: m.balance || '0.00',
        createdOn: formatDateTime(m.createdOn) || '',
      }))
    } else {
      accounts.value = []
    }
  } catch (error) {
    console.error('获取商户列表失败:', error)
    accounts.value = []
  }
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const filteredAccounts = computed(() => {
  const keyword = (searchKey.value || '').trim().toLowerCase()
  if (!keyword) return accounts.value
  return accounts.value.filter(a =>
    (a.id || '').toLowerCase().includes(keyword) ||
    (a.company || '').toLowerCase().includes(keyword) ||
    (a.accountNumber || '').toLowerCase().includes(keyword)
  )
})

onMounted(() => {
  if (userStore.groupToken) getUserList()
})

const handleUserCommand = async (command) => {
  if (command === 'account') {
    dialogValue1.value = true
    getUserList()
  } else if (command === 'logout') {
    ElMessageBox.confirm(t('header.logoutMessage'), t('header.logoutTitle'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
    }).then(async () => {
      try {
        await userStore.logout()
        ElMessage.success(t('header.logoutSuccess'))
        const fallbackTimer = setTimeout(() => {
          window.location.href = '/Login?t=' + Date.now()
        }, 1500)
        await router.replace({ path: '/Login', query: { t: Date.now() } })
        clearTimeout(fallbackTimer)
      } catch (error) {
        console.error('退出登录失败:', error)
        window.location.href = '/Login'
      }
    }).catch(() => {})
  }
}

function confirmBind(account) {
  if (!account) return
  const merchantCode = account.code || account.id
  if (merchantCode === userStore.currentMerchantCode) {
    ElMessage.info(t('header.switchSame'))
    return
  }
  ElMessageBox.confirm(t('header.switchMessage', { merchant: merchantCode }), t('header.switchTitle'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    type: 'info',
  }).then(async () => {
    try {
      await userStore.selectMerchant(merchantCode)
      ElMessage.success(t('header.switchSuccess', { merchant: merchantCode }))
      window.location.reload()
    } catch (err) {
      ElMessage.error(t('header.switchFailed'))
    }
  }).catch(() => {})
  dialogValue1.value = false
}
</script>

<style lang="scss" scoped>
@use '../styles/variables.scss' as *;

.app-header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background-color: var(--color-topbar, #ffffff);
  border-bottom: 1px solid var(--color-border, #eef0f3);
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 10;
}

/* ---------- 侧栏折叠开关 ---------- */
.header-left {
  flex-shrink: 0;
}
.collapse-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 8px;
  color: var(--text-secondary, #6b7280);
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    background-color: var(--color-hover, #f3f4f6);
    color: var(--brand-primary, #16a34a);
  }
}

/* ---------- 主题/语言切换按钮 ---------- */
.icon-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 8px;
  color: var(--text-secondary, #6b7280);
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    background-color: var(--color-hover, #f3f4f6);
    color: var(--brand-primary, #16a34a);
  }
}
.lang-switcher {
  margin: 0 4px;
}
.lang-btn {
  width: auto;
  padding: 0 10px;
  gap: 5px;
}
.lang-label {
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
}
.lang-arrow {
  transition: transform 0.2s ease;
}
.lang-btn:hover .lang-arrow {
  transform: rotate(180deg);
}
:deep(.el-dropdown-menu__item.is-current) {
  color: var(--brand-primary, #16a34a);
  background-color: var(--brand-primary-soft, rgba(22, 163, 74, 0.1));
  font-weight: 600;
}

/* ---------- 商户切换器 ---------- */
.header-right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}
.merchant-switcher {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 14px 6px 6px;
  border-radius: 10px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  outline: none;
  &:hover {
    background-color: var(--color-hover, #f3f4f6);
  }
}
.merchant-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--brand-primary, #16a34a), #22c55e);
  color: var(--text-inverse, #fff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;
  flex-shrink: 0;
}
.merchant-info {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}
.merchant-label {
  font-size: 11px;
  color: var(--text-faint, #9ca3af);
}
.merchant-code {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
}
.switcher-arrow {
  color: var(--text-faint, #9ca3af);
  font-size: 12px;
  margin-left: 2px;
  transition: transform 0.2s ease, color 0.2s ease;
}
.merchant-switcher:hover .switcher-arrow {
  transform: rotate(180deg);
  color: var(--brand-primary, #16a34a);
}

/* ---------- 下拉菜单 ---------- */
:deep(.el-dropdown-menu) {
  border-radius: 10px;
  box-shadow: var(--shadow-lg, 0 8px 24px rgba(0, 0, 0, 0.12));
  border: 1px solid var(--color-border-soft, #eef0f3);
  padding: 6px;
}
:deep(.el-dropdown-menu__item) {
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  color: var(--text-regular, #4b5563);
  display: flex;
  align-items: center;
  gap: 8px;
  &:hover {
    background-color: rgba(22, 163, 74, 0.08);
    color: var(--brand-primary, #16a34a);
  }
}

/* ---------- 账户选择弹窗 ---------- */
.dialog-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px 0 18px;
}
.logo-container {
  display: flex;
  justify-content: center;
}
.dialog-logo {
  width: 72px;
  height: 72px;
  border-radius: 18px;
  box-shadow: var(--shadow-sm, 0 2px 8px rgba(15, 23, 42, 0.08));
}
.dialog-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #18181b);
  text-align: center;
}
.dialog-search {
  width: 100%;
}
.account-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0;
  margin: 0;
  max-height: 320px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border, #dcdce0) transparent;
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--color-border, #dcdce0);
    border-radius: 999px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
}
.account-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  cursor: pointer;
  background-color: transparent;
  box-shadow: inset 0 0 0 1px transparent;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
  &:hover {
    background-color: var(--color-hover, #f8f9fb);
  }
  &.current-account {
    background-color: var(--brand-primary-soft, rgba(22, 163, 74, 0.06));
    box-shadow: inset 0 0 0 1px var(--brand-primary-light, rgba(22, 163, 74, 0.25));
  }
}
.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.left-column {
  flex: 1;
  max-width: 62%;
}
.right-column {
  flex-shrink: 0;
  text-align: right;
}
.account-id {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
}
.account-type {
  font-size: 13px;
  color: var(--text-faint, #9ca3af);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
.account-company {
  font-size: 13px;
  color: var(--text-regular, #6b7280);
  white-space: nowrap;
}
.balance-label {
  color: var(--text-faint, #9ca3af);
}
.balance-value {
  font-weight: 600;
  color: var(--brand-primary, #16a34a);
}
.account-number {
  font-size: 12px;
  color: var(--text-faint, #9ca3af);
  white-space: nowrap;
}
.dialog-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  line-height: 1;
  border-radius: 8px;
  cursor: pointer;
  color: var(--text-faint, #9ca3af);
  transition: background-color 0.2s ease, color 0.2s ease;
  &:hover {
    background-color: var(--color-hover, #f8f9fb);
    color: var(--text-primary, #374151);
  }
}
</style>

<style lang="scss">
/* 弹窗外壳：EP 2.12 已移除 custom-class，故改用真实 class + 全局块保证生效；
   选择器带 .el-dialog 前缀提高优先级，覆盖 element-plus-overrides.scss 的默认值 */
.el-dialog.account-dialog {
  border-radius: 16px;
  border: none;
  box-shadow: var(--shadow-xl, 0 24px 64px rgba(15, 23, 42, 0.18));
  overflow: hidden;
}
/* 弹窗自带 header 区（在 body 内），隐藏 EP 空 header —— 消除顶部空白与多余分隔线 */
.el-dialog.account-dialog .el-dialog__header {
  display: none;
}
.el-dialog.account-dialog .el-dialog__body {
  padding: 0 22px 20px;
}
</style>
