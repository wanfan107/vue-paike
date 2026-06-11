import { fileURLToPath, URL } from 'node:url'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import path from 'path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import terser from '@rollup/plugin-terser'

// https://vite.dev/config/
export default defineConfig({
  server: {
    hmr: true,
    host: "0.0.0.0", // 允许外部访问
    port: "8981",
    open: true,
    https: false,
    // open: false,
    proxy: {
      '/api': {
        //  target: 'https://usmc.univepay.com/',
        //  target: 'https://192.168.0.210:5432/',
        //  target: 'http://3.236.96.173:9501',
        // target: 'http://192.168.0.210:5020',  // 郭哥布的本地线上
        target: 'http://3.237.1.60:9500',  // 正式环境
        //  target: 'http://192.168.0.54:5020',  // 刘强本地
        //  target: 'http://54.158.60.150:9500',  // 测试服
        changeOrigin: true,
        pathRewrite: {
          '^/api': '/api'
        },
      }
    }
  },
  plugins: [
    vue(),
    vueDevTools(),
    createSvgIconsPlugin({
      // 指定图标文件夹，绝对路径
      iconDirs: [path.resolve(process.cwd(), 'src/assets/icon')],
      // 指定symbolId格式
      symbolId: 'icon-[name]',
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        // 移除 console.log
        drop_console: true,
        // 移除 debugger
        drop_debugger: true,
      },
    },
  },
})
