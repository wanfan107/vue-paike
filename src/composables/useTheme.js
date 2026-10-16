// ============================================================
// 主题切换（暗色/亮色）
// 持久化到 localStorage('app-theme')，通过 html.dark class 生效
// 暗色变量定义见 src/styles/tokens/dark.scss
// 切换时派发 'app-theme-change' 事件（图表等按需监听重绘）
// ============================================================
import { ref } from 'vue'

export const THEME_KEY = 'app-theme'

const isDark = ref(document.documentElement.classList.contains('dark'))

function applyTheme(dark) {
  document.documentElement.classList.toggle('dark', dark)
  localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light')
  isDark.value = dark
  window.dispatchEvent(new CustomEvent('app-theme-change', { detail: { dark } }))
}

export function useTheme() {
  const toggleTheme = () => applyTheme(!isDark.value)
  const setTheme = (theme) => applyTheme(theme === 'dark')
  return { isDark, toggleTheme, setTheme }
}

// main.js 启动时调用：挂载前初始化，避免闪烁
export function initTheme() {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === 'dark') {
    document.documentElement.classList.add('dark')
    isDark.value = true
  }
}
