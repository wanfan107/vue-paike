import { defineStore } from 'pinia'
import Request from '@/request/request.js'
import { getToken, setToken, removeToken, saveUserInfo, loadUserinfo, saveMerchantInfo, loadMerchantInfo, saveMerchantId, loadMerchantId, getGroupToken, setGroupToken, getMerchants, setMerchants, getCurrentMerchantCode, setCurrentMerchantCode, getRoleCode, setRoleCode, getRoleName, setRoleName, clearGroupData } from '@/utils/ProjectTools.js'
import { http } from "@/api";

const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: loadUserinfo(),
    // userInfo: {},
    token: getToken(),
    valid: false, // 当前路由是否有效
    roles: {}, //角色信息
    // 商户信息
    merchantInfo: loadMerchantInfo(),
    merchantId: loadMerchantId(),

    // 集团相关
    groupToken: getGroupToken(),  // 集团token
    merchants: getMerchants(),  // 商户列表
    currentMerchantCode: getCurrentMerchantCode(),  // 当前商户code
    roleCode: getRoleCode(),  // 当前角色code
    roleName: getRoleName(),   // 当前角色名称
    groupMenus: [] // 集团菜单
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
        userInfo: {
          id: res.data.id,
          token: res.data.token
        }
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

    // ----------------------集团账户相关-------------------------

    // 集团登录
    async groupLogin(userInfo) {
      const { email, password, code, deviceFingerprint, EmailCode, deviceInfo } = userInfo

      const res = await http.groupLogin({
        email,
        password,
        code,
        deviceFingerprint,
        EmailCode,
        deviceInfo
      });

      if (res.code === 401) {
        return Promise.reject(res)
      }

      // 保存集团信息
      this.groupToken = res.data.groupToken;
      this.merchants = res.data.merchants;
      this.roleCode = res.data.roleCode || '';
      this.roleName = res.data.roleName || '';

      // 保存到 localStorage
      setGroupToken(res.data.groupToken);
      setMerchants(res.data.merchants);
      setRoleCode(res.data.roleCode || '');
      setRoleName(res.data.roleName || '');

      // 如果只有一个商户，自动选择
      if (res.data.merchantsLen === 1) {
        const merchantCode = res.data.merchants[0].code;
        const headers = res.data.groupToken ? { 'Authorization': 'Bearer ' + res.data.groupToken } : {};
        const selectRes = await http.selectMerchant({ merchantCode }, headers);

        if (selectRes.code === 200) {
          // 保存当前商户信息
          this.token = selectRes.data.token;
          this.currentMerchantCode = selectRes.data.id;
          // this.merchantId = selectRes.data.id;
          if (!this.userInfo) {
            this.userInfo = {};
          }
          let result = {
            token: selectRes.data.token,
            userInfo: {
              id: selectRes.data.id,
              token: selectRes.data.token
            }
          }
          this.userInfo = result.userInfo;
          this.token = result.token;
          setToken(result.token);
          saveUserInfo(result.userInfo);
          setCurrentMerchantCode(selectRes.data.id);
          await this.getMerchantInfo();
          return { isGroup: true, autoSelected: true }
        } else {
          return Promise.reject(selectRes)
        }
      } else {
        // 多个商户，等待用户选择
        return { isGroup: true, autoSelected: false, merchants: res.data.merchants }
      }
    },
    // 集团选择商户
    async selectMerchant(merchantCode) {
      const token = this.groupToken || getGroupToken() || '';

      if (!token) {
        return Promise.reject({ code: 401, msg: '集团Token已失效，请重新登录' });
      }

      const headers = { 'Authorization': 'Bearer ' + token };
      const res = await http.selectMerchant({ merchantCode }, headers);

      if (res.code === 200) {
        this.currentMerchantCode = res.data.id;
        // 保存当前商户信息
        let result = {
          token: res.data.token,
          userInfo: {
            id: res.data.id,
            token: res.data.token
          }
        }
        this.userInfo = result.userInfo;
        this.token = result.token;
        setToken(result.token);
        saveUserInfo(result.userInfo);
        setCurrentMerchantCode(res.data.id);
        //    // 登录成功后立即获取商户信息
        await this.getMerchantInfo();
        return Promise.resolve(res);
      } else {
        return Promise.reject(res);
      }
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
      // 清除集团相关数据
      this.groupToken = '';
      this.merchants = [];
      this.roleCode = '';
      this.roleName = '';
      this.groupMenus = [];
      this.currentMerchantCode = '';


      // 清除localStorage中的商户信息
      saveMerchantInfo({});
      saveMerchantId('');
      // 清除集团相关数据
      clearGroupData();
      localStorage.removeItem('merchantinfo');
      localStorage.removeItem('merchantid');

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
          id: this.currentMerchantCode || this.userInfo.id || this.merchantId
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