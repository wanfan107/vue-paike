

<template>
  <el-config-provider :locale="epLocale">
    <div class="app-container">
      <!-- 直接渲染路由出口，布局逻辑由路由配置控制 -->
      <router-view />
      <!-- AWS WAF CAPTCHA 全局弹窗（拦截器收到 405 时由 CaptchaController 驱动） -->
      <AwsCaptcha />
    </div>
  </el-config-provider>
</template>
<script setup>
import { computed } from 'vue'
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'
import { useI18n } from 'vue-i18n'
// App.vue简化为只负责渲染路由出口
// 所有布局逻辑移至MainLayout组件和路由配置
import AwsCaptcha from '@/components/AwsCaptcha.vue'

// EP 组件内置文案（分页/日期选择器等）跟随站点语言切换
const { locale } = useI18n()
const epLocale = computed(() => (locale.value === 'en-US' ? en : zhCn))
</script>

<style lang="scss">
// 引入全局样式文件
@use './styles/global.scss';
</style>

<style scoped lang="scss">
// 引入全局SCSS变量
@use './styles/variables.scss' as *;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: $font-family;
  background-color: var(--color-bg, #{$background-color});
  color: var(--text-primary, #{$text-color});
  margin: 0;
  padding: 0;
  // 确保在IE和旧浏览器中的兼容性
  -webkit-text-size-adjust: 100%;
  -ms-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

.app-container {
  width: 100%;
  min-height: 100vh;
  background-color: var(--color-bg, #{$background-color});
  overflow: hidden;
}

</style>
