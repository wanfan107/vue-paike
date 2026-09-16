// AWS WAF CAPTCHA / Challenge 拦截器兜底
// 触发条件（AWS 官方约定，见 waf-js-captcha-api-conditional 文档）：
//   HTTP 405 + 响应头 x-amzn-waf-action: captcha  → 需要人工拼图
//   HTTP 202 + 响应头 x-amzn-waf-action: challenge → 静默质询（SDK 后台自动解题）
import CaptchaController from '@/utils/CaptchaController'

const WAF_ACTION_HEADER = 'x-amzn-waf-action'

const getWafAction = (response) => {
  const headers = response?.headers || {}
  return headers[WAF_ACTION_HEADER] || headers['X-Amzn-Waf-Action'] || ''
}

// 返回 'captcha' | 'challenge' | null
export const detectWafBlock = (response) => {
  if (!response) return null
  const action = getWafAction(response)
  if (action === 'captcha' || response.status === 405) return 'captcha'
  if (action === 'challenge' || response.status === 202) return 'challenge'
  return null
}

const setWafTokenHeader = (config, token) => {
  config.headers = config.headers || {}
  if (token) {
    // axios 1.x 的 headers 是 AxiosHeaders 实例，优先用 set()
    if (typeof config.headers.set === 'function') {
      config.headers.set('x-aws-waf-token', token)
    } else {
      config.headers['x-aws-waf-token'] = token
    }
  }
}

// 静默质询：官方 SDK 后台完成工作量证明并换取 token（用户无感）
const silentAcquireToken = () => {
  if (window.AwsWafIntegration?.getToken) {
    return Promise.resolve(window.AwsWafIntegration.getToken())
  }
  return Promise.reject(new Error('AWS_WAF_SDK_NOT_READY'))
}

/**
 * 在 axios 响应【成功】拦截器最前面调用。
 * AWS Challenge 动作返回 HTTP 202（属于 2xx，axios 会 resolve 而非 reject），
 * 必须在成功回调中拦截，否则空响应体会被当成业务数据下发。
 * @param {AxiosInstance} service 当前 axios 实例（用于重放原请求）
 * @param {any} response axios 成功响应
 * @returns {Promise|null} 命中 Challenge 时返回重放 Promise；未命中返回 null
 */
export const handleWafChallengeOnSuccess = (service, response) => {
  // 成功回调里只会出现 Challenge（CAPTCHA 是 405，必定走错误回调）
  if (detectWafBlock(response) !== 'challenge') return null
  const config = response?.config
  if (!config) return null
  if (config.__wafChallengeRetried) return Promise.reject(new Error('WAF_CHALLENGE_RETRY_EXHAUSTED'))
  config.__wafChallengeRetried = true
  return silentAcquireToken()
    .then((token) => {
      setWafTokenHeader(config, token)
      return service(config)
    })
    .catch(() => Promise.reject(new Error('WAF_CHALLENGE_SDK_UNAVAILABLE')))
}

/**
 * 在 axios 响应错误拦截器中调用。
 * @param {AxiosInstance} service 当前 axios 实例（用于重放原请求）
 * @param {any} error axios 拒绝错误
 * @returns {Promise|null} 命中 WAF 时返回重放 Promise；未命中返回 null
 */
export const handleWafBlock = (service, error) => {
  const kind = detectWafBlock(error?.response)
  const config = error?.config
  if (!kind || !config) return null

  if (kind === 'captcha') {
    // 重放后仍被拦 → 不再循环，交给业务错误处理
    if (config.__wafCaptchaRetried) return Promise.reject(error)
    return CaptchaController.triggerChallenge().then((token) => {
      config.__wafCaptchaRetried = true
      setWafTokenHeader(config, token)
      return service(config)
    })
  }

  // challenge：静默拿 token 后自动重放，仅重试一次
  if (config.__wafChallengeRetried) return Promise.reject(error)
  config.__wafChallengeRetried = true
  return silentAcquireToken()
    .then((token) => {
      setWafTokenHeader(config, token)
      return service(config)
    })
    .catch(() => Promise.reject(error))
}
