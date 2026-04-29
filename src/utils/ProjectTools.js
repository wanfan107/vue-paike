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
export const removeToken = ()=>{
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