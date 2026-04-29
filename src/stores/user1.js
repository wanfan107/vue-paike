import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  // 状态定义
  const token = ref(localStorage.getItem('token') || '')
  const merchantInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))
  const isLoggedIn = computed(() => !!token.value)

  // 兼容旧代码，提供userInfo作为merchantInfo的别名
  const userInfo = computed({
    get: () => merchantInfo.value,
    set: (value) => {
      merchantInfo.value = value
      localStorage.setItem('userInfo', JSON.stringify(value))
    }
  })

  // 方法定义
  function setToken(newToken) {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  function setMerchantInfo(newMerchantInfo) {
    merchantInfo.value = newMerchantInfo
    localStorage.setItem('userInfo', JSON.stringify(newMerchantInfo))
  }

  // 兼容旧代码
  function setUserInfo(newUserInfo) {
    setMerchantInfo(newUserInfo)
  }

  function login(data) {
    console.log('login', data)
    setToken(data.token)
    setMerchantInfo(data.userInfo || data.merchantInfo || {})
  }

  function logout() {
    setToken('')
    merchantInfo.value = {}
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('previousFingerprint')
  }

  return {
    token,
    merchantInfo,
    userInfo, // 保持向后兼容
    isLoggedIn,
    setToken,
    setMerchantInfo,
    setUserInfo, // 保持向后兼容
    login,
    logout
  }
})