// 引入 Vue 3 的 createApp 方法
import { createApp } from 'vue'
import SvgIcon from './index.vue' // svg component

// 导出一个函数来注册全局组件
export function setupSvgIcon(app) {
  app.component('svg-icon', SvgIcon)
}

// 如果需要独立使用，也可以直接导出组件
export default SvgIcon

const req = require.context('./', false, /\.svg$/)

const requireAll = requireContext => requireContext.keys().map(requireContext)
requireAll(req)