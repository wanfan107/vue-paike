<!-- AWS WAF CAPTCHA 全局弹窗（由 axios 拦截器在收到 WAF 405 时驱动） -->
<template>
  <el-dialog
    v-model="visible"
    :title="t('captcha.title')"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    width="400px"
    @closed="handleClosed"
  >
    <div class="captcha-body">
      <div ref="captchaContainer" class="captcha-container"></div>
      <p v-if="loadError" class="captcha-error">{{ loadError }}</p>
      <p class="captcha-tip">{{ t('captcha.tip') }}</p>
    </div>

    <template #footer>
      <div class="captcha-footer">
        <el-button size="small" @click="handleCancel">取消</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import CaptchaController from '@/utils/CaptchaController'

const { t } = useI18n()

const visible = ref(false)
const rendering = ref(false)
const loadError = ref('')
const captchaContainer = ref(null)
let settled = false
let sdkWaitTimer = null

// 弹窗打开后渲染拼图；关闭由 Controller 统一驱动，这里只做单向同步
watch(
  () => CaptchaController.state.show,
  (show) => {
    visible.value = show
    if (show) {
      settled = false
      loadError.value = ''
      nextTick(() => renderCaptcha())
    }
  }
)

// 等待 jsapi.js 就绪（defer 脚本通常早已加载，这里做兜底）
const waitForSdk = (timeout = 10000, interval = 100) =>
  new Promise((resolve) => {
    const start = Date.now()
    const check = () => {
      if (window.AwsWafCaptcha?.renderCaptcha) {
        resolve(true)
      } else if (Date.now() - start >= timeout) {
        resolve(false)
      } else {
        sdkWaitTimer = setTimeout(check, interval)
      }
    }
    check()
  })

const renderCaptcha = async () => {
  const container = captchaContainer.value
  if (!container) return

  const ready = await waitForSdk()
  if (!ready || settled) {
    if (!ready) {
      loadError.value = '安全验证组件加载失败，请刷新页面重试'
    }
    return
  }

  rendering.value = true
  // 每次打开清空旧的拼图 DOM
  container.innerHTML = ''

  try {
    // 官方现代 API：window.AwsWafCaptcha.renderCaptcha(el, { apiKey, onSuccess, onError })
    window.AwsWafCaptcha.renderCaptcha(container, {
      apiKey: CaptchaController.apiKey,
      onSuccess: (token) => {
        if (settled) return
        settled = true
        rendering.value = false
        CaptchaController.onSuccess(token)
      },
      onError: (error) => {
        console.error('CAPTCHA验证失败:', error)
        ElMessage.error(t('captcha.loadFailed'))
        if (settled) return
        settled = true
        rendering.value = false
        CaptchaController.onClose()
      }
    })
  } catch (error) {
    console.error('渲染CAPTCHA时出错:', error)
    rendering.value = false
    ElMessage.error(t('captcha.initFailed'))
    CaptchaController.onClose()
  }
}

const handleCancel = () => {
  if (settled) return
  settled = true
  CaptchaController.onClose()
}

// 弹窗关闭动画结束后清理容器
const handleClosed = () => {
  if (captchaContainer.value) {
    captchaContainer.value.innerHTML = ''
  }
}

onBeforeUnmount(() => {
  if (sdkWaitTimer) clearTimeout(sdkWaitTimer)
})
</script>

<style scoped>
.captcha-body {
  text-align: center;
  padding: 10px 0;
}

.captcha-container {
  min-height: 150px;
  display: flex;
  justify-content: center;
}

.captcha-tip {
  color: var(--text-faint, #999);
  font-size: 12px;
  margin-top: 10px;
}

.captcha-error {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 10px;
}

.captcha-footer {
  text-align: center;
}
</style>
