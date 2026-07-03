<!-- src/components/AwsCaptchaDialog.vue -->
<template>
  <el-dialog
    title="安全验证"
    :visible.sync="localVisible"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    width="400px"
    @close="handleClose"
  >
    <div style="text-align: center; padding: 10px 0;">
      <div ref="captchaContainer" style="min-height: 150px;"></div>
      <p style="color: #999; font-size: 12px; margin-top: 10px;">
        请完成验证以继续操作
      </p>
    </div>
    
    <div slot="footer" style="text-align: center;">
      <el-button 
        size="small" 
        @click="handleClose"
        :disabled="isRendering"
      >
        取消
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
import CaptchaController from '@/utils/CaptchaController'

export default {
  name: 'AwsCaptchaDialog',
  
  data() {
    return {
      localVisible: false,
      isRendering: false
    }
  },
  
  watch: {
    // 监听控制器的show状态
    '$captchaState.show': {
      immediate: true,
      handler(newVal) {
        this.localVisible = newVal
        if (newVal) {
          this.$nextTick(() => this.renderCaptcha())
        }
      }
    }
  },
  
  computed: {
    // 映射控制器状态
    $captchaState() {
      return CaptchaController.getState()
    }
  },
  
  methods: {
    // 渲染CAPTCHA
    renderCaptcha() {
      if (!this.$refs.captchaContainer || !window.AWSWAFIntegration) {
        console.error('CAPTCHA容器或API未就绪')
        this.handleClose()
        return
      }
      
      this.isRendering = true
      this.$refs.captchaContainer.innerHTML = ''
      
      try {
        AWSWAFIntegration.API.renderCaptcha(this.$refs.captchaContainer, {
          apiKey: this.$captchaState.apiKey,
          onSuccess: (token) => {
            console.log('CAPTCHA验证成功')
            this.isRendering = false
            CaptchaController.onSuccess(token)
          },
          onError: (error) => {
            console.error('CAPTCHA验证失败:', error)
            this.isRendering = false
            // this.$message.error('验证加载失败，请重试')
            CaptchaController.onClose()
          }
        })
      } catch (error) {
        console.error('渲染CAPTCHA时出错:', error)
        this.isRendering = false
        this.handleClose()
      }
    },
    
    // 关闭弹窗
    handleClose() {
      if (!this.isRendering) {
        CaptchaController.onClose()
      }
    }
  }
}
</script>