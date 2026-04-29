// src/utils/CaptchaController.js
import { getToken } from '@/utils/ProjectTools'

class CaptchaController {
  constructor() {
    this.show = false
    this.apiKey = 'hvk3PUxBvg+ApULex3TiPOJeyPfWe/0E1H5kibyHK9ITwMcD6zoSCKgWzGV4Bjx+i4k+JJVzbzxpYXOttNPx/iI1j8H5OoI//wyPMpwSrIV18NETGir8Pod8Mmpevff0UawqcxgBpPid5gxlEM2ryGQZxbtUQU/dOngKAOLrC6Ldebx/Yx1xZyiUi8q6KCcUwIoKU4ovNQ060oSPFcT8cOpEwpYk9TC+P6q4ktO/rXeCB2eaowHy4fDcdloasaaq1gECwEHxfk6Xgd9L0uAG7C7dw7pYa+vfSgmSpeK5wzcjJ+Yqqqe+r5zipYq2jTfidYeSHNVVSZgjYZ6aXsd7wZe4GApV5xz8D+yOr/gTQ074qQp7DC6qAEa+Xnj8851xCkqf5gkjku1WsXsUjUuBN8D+nZrNoz0fxVSaTVNK7pZU3MsG8X+a9Ad5Bmh31JQfLS5GILDleUz5jDU8ATakG1jTL4Lt1+h8jsYjOmLVSlq+j13GzZrJk9RYKxl5+1ziRbnE7mRMM4nRMUUupVdm94gvoY9414D0WpZZavs9sFgS31s77WB5o2vMpaIlbI+w4JL6I52zHT13Ha7gAzupN5voX4otASAFcbiCX1s6lzwcii3TwAGDAsNR0R8i5Tpprdy+wHk+EV8d8QLXF1zWu2UL/PwwsOeNKwcod8Lh4Jo=_1_1' // 替换为你的AWS API密钥
    this.pendingConfig = null
    this.resolveCallback = null
    this.rejectCallback = null
  }

  // 触发挑战（由拦截器调用）
  triggerChallenge(config) {
    return new Promise((resolve, reject) => {
      this.pendingConfig = {
        ...config,
        headers: {
          ...config.headers,
          'authorization': getToken() // 确保使用最新token
        }
      }
      this.resolveCallback = resolve
      this.rejectCallback = reject
      this.show = true
    })
  }

  // 验证成功
  onSuccess(token) {
    this.show = false
    if (this.resolveCallback) {
      this.resolveCallback({
        type: 'retry',
        token: token,
        config: this.pendingConfig
      })
    }
    this.clear()
  }

  // 验证失败或取消
  onClose() {
    this.show = false
    if (this.rejectCallback) {
      this.rejectCallback(new Error('用户取消了CAPTCHA验证'))
    }
    this.clear()
  }

  // 获取当前状态（供Vue组件使用）
  getState() {
    return {
      show: this.show,
      apiKey: this.apiKey,
      pendingConfig: this.pendingConfig
    }
  }

  // 清理状态
  clear() {
    this.pendingConfig = null
    this.resolveCallback = null
    this.rejectCallback = null
  }
}

export default new CaptchaController()