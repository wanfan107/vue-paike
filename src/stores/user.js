import { defineStore } from 'pinia'
import Request from '@/request/request.js'
import { getToken, setToken, removeToken, saveUserInfo, loadUserinfo, saveMerchantInfo, loadMerchantInfo, saveMerchantId, loadMerchantId } from '@/utils/ProjectTools.js'
import { http } from "@/api";

const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: loadUserinfo(),
    token: getToken(),
    valid: false, // 当前路由是否有效
    roles: {}, //角色信息
    // 商户信息
    merchantInfo: loadMerchantInfo(),
    merchantId: loadMerchantId()
  }),
  
  getters: {
    // 移除冗余的userInfo getter，直接使用state.userInfo
  },
  
  actions: {
    // 获取验证码
    getLoginCaptcha() {
      return Request.get("/public/admin/captcha")
        .then(res => res.data)
        .catch(err => Promise.reject(err));
    },
    
    // 用户登录
    async login(userInfo) {
      const { username, password, code } = userInfo
      console.log('userInfo', userInfo)
      
      const res = await http.login({ 
        username, 
        password, 
        code 
      })
      
      if (res.code === 401) {
        return Promise.reject(res)
      }
  
      let result = {
        token: res.data.token,
        userInfo: res.data
      }
      
      // 保存状态
      setToken(result.token)
      saveUserInfo(result.userInfo)
      this.token = result.token;
      this.userInfo = result.userInfo;
      
      // 登录成功后立即获取商户信息
      await this.getMerchantInfo();
      
      return { userInfo: res.data.userInfo || res.data, menus: [] }
    },
    
    // 重置令牌
    resetToken() {
      // 移除不必要的Promise包装
      removeToken();
      this.userInfo = {};
      this.merchantInfo = {};
      this.merchantId = '';
      this.token = '';
      this.valid = false;
      this.roles = {}; // 保持数据类型一致，使用{}而不是null
      
      // 清除localStorage中的商户信息
      saveMerchantInfo({});
      saveMerchantId('');
      
      return Promise.resolve()
    },
    
    // 当前路由是否有效
    setValid() {
      this.valid = true;
    },
    
    // 获取用户角色
    getUserRoles(id) {
      return new Promise((resolve, reject) => {
        Request({
          url: '/private/roles/one',
          method: 'post',
          data: {
            params: { id }
          },
        }).then(res => {
          this.roles = res.data;
          resolve(res.data)
        }).catch(error => {
          reject(error)
        })
      })
    },
    
    // 获取商户信息
    async getMerchantInfo() {
      try {
        const res = await http.merchant({
          id: this.userInfo.id
        });
        
        this.merchantInfo = res.data;
        this.merchantId = res.data.id;
        
        // 保存商户信息到localStorage
        saveMerchantInfo(res.data);
        saveMerchantId(res.data.id);
        
        console.log("商户信息", this.merchantInfo);
        console.log("商户ID", this.merchantId);
        
        return res.data;
      } catch (err) {
        console.error("获取商户信息失败:", err);
        // 如果获取失败，确保merchantInfo不是null，避免访问错误
        this.merchantInfo = {};
        this.merchantId = '';
        // 清除localStorage中的商户信息
        saveMerchantInfo({});
        saveMerchantId('');
        return Promise.reject(err);
      }
    },
    
    // 登出方法
    logout() {
      // 调用重置令牌方法，清除所有用户信息
      return this.resetToken();
    },
  }
})

export default useUserStore