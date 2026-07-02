/**
 * 业务小工具
 */
import { isEmpty } from './BaseUtil';
import { BASE64Helper } from './CryptUtil.js';

const TOKEN = 'token';
const USER_INFOT = 'userinfo';
const MERCHANT_INFO = 'merchantinfo';
const MERCHANT_ID = 'merchantid';


/**
 * 保存token
 */
export const setToken = token => {
    // sessionStorage.setItem(TOKEN, BASE64Helper.encode(JSON.stringify(token)))
    localStorage.setItem(TOKEN, BASE64Helper.encode(JSON.stringify(token)))
}

/**
 * 获取token
 */
export const getToken = () => {
    try {
        // return JSON.parse(BASE64Helper.decode(sessionStorage.getItem(TOKEN)))
        return JSON.parse(BASE64Helper.decode(localStorage.getItem(TOKEN)))
    } catch (err) {
        return ''
    }
}

/**
 * 清除token
 */
export const removeToken = () => {
    localStorage.removeItem(TOKEN)
    localStorage.removeItem(USER_INFOT)
    // sessionStorage.removeItem(TOKEN)
    // sessionStorage.removeItem(USER_INFOT)
}

/**
 * 保存用户数据
 */
export const saveUserInfo = (userinfo = {}) => {
    if (isEmpty(userinfo)) {
        return
    }
    // sessionStorage.setItem(USER_INFOT, BASE64Helper.encode(JSON.stringify(userinfo)))
    localStorage.setItem(USER_INFOT, BASE64Helper.encode(JSON.stringify(userinfo)))
}

/**
 * 获取用户数据
 */
export const loadUserinfo = () => {
    try {
        // return JSON.parse(BASE64Helper.decode(sessionStorage.getItem(USER_INFOT)))
        return JSON.parse(BASE64Helper.decode(localStorage.getItem(USER_INFOT)))
    } catch (err) {
        return {}
    }
}

/**
 * 保存商户信息
 */
export const saveMerchantInfo = (merchantInfo = {}) => {
    if (isEmpty(merchantInfo)) {
        return
    }
    localStorage.setItem(MERCHANT_INFO, BASE64Helper.encode(JSON.stringify(merchantInfo)))
}

/**
 * 获取商户信息
 */
export const loadMerchantInfo = () => {
    try {
        return JSON.parse(BASE64Helper.decode(localStorage.getItem(MERCHANT_INFO)))
    } catch (err) {
        return {}
    }
}

/**
 * 保存商户ID
 */
export const saveMerchantId = (merchantId = '') => {
    localStorage.setItem(MERCHANT_ID, BASE64Helper.encode(JSON.stringify(merchantId)))
}

/**
 * 获取商户ID
 */
export const loadMerchantId = () => {
    try {
        return JSON.parse(BASE64Helper.decode(localStorage.getItem(MERCHANT_ID)))
    } catch (err) {
        return ''
    }
}

// 保存 localStorage
export const setLocalStorage = (key, value) => {
    localStorage.setItem(key, value)
}
// 获取 localStorage
export const getLocalStorage = key => {
    return localStorage.getItem(key)
}

// 集团相关加密存储
const GROUP_TOKEN = 'groupToken';
const MERCHANTS = 'merchants';
const CURRENT_MERCHANT_CODE = 'currentMerchantCode';
const ROLE_CODE = 'roleCode';
const ROLE_NAME = 'roleName';
const GROUP_USER_INFO = 'groupUserInfo';

export const setGroupToken = (token) => {
    localStorage.setItem(GROUP_TOKEN, BASE64Helper.encode(JSON.stringify(token)))
}

export const getGroupToken = () => {
    try {
        return JSON.parse(BASE64Helper.decode(localStorage.getItem(GROUP_TOKEN) || ''))
    } catch (err) {
        return ''
    }
}

export const setMerchants = (merchants) => {
    localStorage.setItem(MERCHANTS, BASE64Helper.encode(JSON.stringify(merchants)))
}

export const getMerchants = () => {
    try {
        return JSON.parse(BASE64Helper.decode(localStorage.getItem(MERCHANTS) || '[]'))
    } catch (err) {
        return []
    }
}

export const setCurrentMerchantCode = (code) => {
    localStorage.setItem(CURRENT_MERCHANT_CODE, BASE64Helper.encode(JSON.stringify(code)))
}

export const getCurrentMerchantCode = () => {
    try {
        return JSON.parse(BASE64Helper.decode(localStorage.getItem(CURRENT_MERCHANT_CODE) || ''))
    } catch (err) {
        return ''
    }
}

export const setRoleCode = (code) => {
    localStorage.setItem(ROLE_CODE, BASE64Helper.encode(JSON.stringify(code)))
}

export const getRoleCode = () => {
    try {
        return JSON.parse(BASE64Helper.decode(localStorage.getItem(ROLE_CODE) || ''))
    } catch (err) {
        return ''
    }
}

export const setRoleName = (name) => {
    localStorage.setItem(ROLE_NAME, BASE64Helper.encode(JSON.stringify(name)))
}

export const getRoleName = () => {
    try {
        return JSON.parse(BASE64Helper.decode(localStorage.getItem(ROLE_NAME) || ''))
    } catch (err) {
        return ''
    }
}

export const setGroupUserInfo = (info) => {
    localStorage.setItem(GROUP_USER_INFO, BASE64Helper.encode(JSON.stringify(info)))
}

export const getGroupUserInfo = () => {
    try {
        return JSON.parse(BASE64Helper.decode(localStorage.getItem(GROUP_USER_INFO) || '{}'))
    } catch (err) {
        return {}
    }
}

export const clearGroupData = () => {
    localStorage.removeItem(GROUP_TOKEN);
    localStorage.removeItem(MERCHANTS);
    localStorage.removeItem(CURRENT_MERCHANT_CODE);
    localStorage.removeItem(ROLE_CODE);
    localStorage.removeItem(ROLE_NAME);
    localStorage.removeItem(GROUP_USER_INFO);
}