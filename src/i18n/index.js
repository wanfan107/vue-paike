// ============================================================
// vue-i18n 基建
// 语言持久化到 localStorage('app-locale')，默认中文
// 组件内使用：const { t } = useI18n() / $t('menu.home')
// ============================================================
import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN'
import enUS from './locales/en-US'

export const LOCALE_KEY = 'app-locale'
export const LOCALES = [
  { value: 'zh-CN', label: '中文' },
  { value: 'en-US', label: 'EN' },
]

function getInitialLocale() {
  const saved = localStorage.getItem(LOCALE_KEY)
  if (saved && ['zh-CN', 'en-US'].includes(saved)) return saved
  return 'zh-CN'
}

const i18n = createI18n({
  legacy: false, // 组合式 API 模式
  locale: getInitialLocale(),
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
})

// 切换语言并持久化（EP 组件语言通过 App.vue 的 ElConfigProvider 联动）
export function setLocale(locale) {
  if (!['zh-CN', 'en-US'].includes(locale)) return
  i18n.global.locale.value = locale
  localStorage.setItem(LOCALE_KEY, locale)
  document.documentElement.setAttribute('lang', locale === 'zh-CN' ? 'zh-CN' : 'en')
}

export default i18n
