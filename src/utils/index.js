import { ElMessage, ElLoading, ElMessageBox } from 'element-plus'
import { isString, isObject } from './BaseUtil'

// 加载实例
let loadingInstance = null

/**
 * 显示加载
 * @param {boolean|string} isLoading - 是否显示加载或加载文本
 * @param {string} text - 加载文本
 */
export const showLoading = (isLoading = false, text = '') => {
    if (typeof isLoading === 'string') {
        text = isLoading
        isLoading = true
    }
    if (isLoading) {
        loadingInstance = ElLoading.service({
            lock: true,
            text: text || '加载中...',
            background: 'rgba(0, 0, 0, 0.7)'
        })
    } else {
        hideLoading()
    }
}

/**
 * 隐藏加载
 */
export const hideLoading = () => {
    if (loadingInstance) {
        loadingInstance.close()
        loadingInstance = null
    }
}

/**
 * 显示消息
 * @param {Object|string} config - 消息配置或消息文本
 */
export const showMessage = (config) => {
    if (isString(config)) {
        return ElMessage({
            message: config,
            type: 'info'
        })
    } else if (isObject(config)) {
        return ElMessage(config)
    }
}

/**
 * 显示错误消息
 * @param {Object|string} config - 错误配置或错误文本
 */
export const showError = (config) => {
    const temp = {}
    if (isString(config)) {
        temp.message = config
        temp.type = 'error'
    } else if (isObject(config)) {
        Object.assign(temp, config, { type: 'error' })
    }
    return ElMessage(temp)
}

/**
 * 显示确认对话框
 * @param {string} message - 确认消息
 * @param {string} title - 对话框标题
 * @param {Object} config - 对话框配置
 * @returns {Promise} - 确认结果
 */
export const confirm = (message, title, config) => {
    const temp = { 
        message, 
        title: title || '确认', 
        ...config 
    }
    return ElMessageBox.confirm(
        temp.message,
        temp.title,
        {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            type: 'warning',
            ...temp
        }
    )
}
