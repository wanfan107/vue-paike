// src/utils/CaptchaController.js
import { reactive } from 'vue'

// AWS WAF CAPTCHA 加密 API Key（绑定合法前端域名，由 WAF 控制台生成）
const CAPTCHA_API_KEY =
  'hvk3PUxBvg+ApULex3TiPOJeyPfWe/0E1H5kibyHK9ITwMcD6zoSCKgWzGV4Bjx+i4k+JJVzbzxpYXOttNPx/iI1j8H5OoI//wyPMpwSrIV18NETGir8Pod8Mmpevff0UawqcxgBpPid5gxlEM2ryGQZxbtUQU/dOngKAOLrC6Ldebx/Yx1xZyiUi8q6KCcUwIoKU4ovNQ060oSPFcT8cOpEwpYk9TC+P6q4ktO/rXeCB2eaowHy4fDcdloasaaq1gECwEHxfk6Xgd9L0uAG7C7dw7pYa+vfSgmSpeK5wzcjJ+Yqqqe+r5zipYq2jTfidYeSHNVVSZgjYZ6aXsd7wZe4GApV5xz8D+yOr/gTQ074qQp7DC6qAEa+Xnj8851xCkqf5gkjku1WsXsUjUuBN8D+nZrNoz0fxVSaTVNK7pZU3MsG8X+a9Ad5Bmh31JQfLS5GILDleUz5jDU8ATakG1jTL4Lt1+h8jsYjOmLVSlq+j13GzZrJk9RYKxl5+1ziRbnE7mRMM4nRMUUupVdm94gvoY9414D0WpZZavs9sFgS31s77WB5o2vMpaIlbI+w4JL6I52zHT13Ha7gAzupN5voX4otASAFcbiCX1s6lzwcii3TwAGDAsNR0R8i5Tpprdy+wHk+EV8d8QLXF1zWu2UL/PwwsOeNKwcod8Lh4Jo=_1_1'

class CaptchaController {
  constructor() {
    // 响应式状态，供 Vue 组件直接 watch
    this.state = reactive({
      show: false
    })
    this.apiKey = CAPTCHA_API_KEY
    // 单飞（single-flight）：多个请求同时被 405 时共用同一个挑战 Promise
    this.pendingPromise = null
    this.resolveCallback = null
    this.rejectCallback = null
  }

  // 触发 CAPTCHA 挑战（由 axios 拦截器在收到 WAF 405 时调用）
  // 已在挑战中则复用同一个 Promise，避免重复弹窗
  triggerChallenge() {
    if (this.pendingPromise) {
      return this.pendingPromise
    }
    this.pendingPromise = new Promise((resolve, reject) => {
      this.resolveCallback = resolve
      this.rejectCallback = reject
      this.state.show = true
    })
    // 无论成功失败，消费完后清掉单飞锁（保留 Promise 的最终结果给其他等待者）
    this.pendingPromise.finally(() => {
      this.pendingPromise = null
    })
    return this.pendingPromise
  }

  // 验证成功（AwsWafCaptcha onSuccess，携带最新 token）
  onSuccess(token) {
    this.state.show = false
    if (this.resolveCallback) {
      this.resolveCallback(token)
    }
    this.clear()
  }

  // 验证失败或用户取消
  onClose() {
    this.state.show = false
    if (this.rejectCallback) {
      // 挂上 isCaptchaCancel，业务层 catch 可据此提示「已取消安全验证」
      const err = new Error('用户取消了CAPTCHA验证')
      err.isCaptchaCancel = true
      this.rejectCallback(err)
    }
    this.clear()
  }

  clear() {
    this.resolveCallback = null
    this.rejectCallback = null
  }
}

const captchaController = new CaptchaController()
export default captchaController

// 仅开发环境：暴露调试钩子，控制台执行 __awsWafCaptcha.trigger() 可模拟 WAF 405 弹窗
if (import.meta.env.DEV) {
  // eslint-disable-next-line no-underscore-dangle
  window.__awsWafCaptcha = {
    trigger: () => captchaController.triggerChallenge(),
    success: (token = 'debug-token') => captchaController.onSuccess(token),
    close: () => captchaController.onClose()
  }
}

