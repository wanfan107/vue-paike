import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { FingerprintPlugin } from '@fingerprint/vue'
import App from './App.vue'
import router from './router'
// 导入全局样式
import './styles/index.scss'
import SvgIcon from '@/assets/icon/index.vue' // 路径根据实际情况调整
// 导入SVG图标注册
import 'virtual:svg-icons-register'
const app = createApp(App)
// 注册所有 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.use(createPinia())
app.use(router)
// 全局注册 svg-icon 组件
app.component('SvgIcon', SvgIcon);
app.use(ElementPlus, {
  locale: zhCn,
})
app.use(FingerprintPlugin, {
  apiKey: "Bq4su0RWMT4dfgNQGub8",
  // 1. 优先走你刚配置好 A 记录的新子域名
  // 2. 后面加上官方的默认 endpoint 作为 fallback 兜底（防止你的子域名解析故障）
  endpoints: [
    'https://newusmc.univepay.com',
    'https://fpcdn.io' //兜底
  ],
  region: 'us',
  timeout: 15000
})
app.mount('#app')
