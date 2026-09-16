/****   request.js   ****/
// 导入axios
import axios from 'axios'
// 使用Element Plus的ElMessage做消息提醒
import { ElMessage } from 'element-plus';
// 导入Pinia store
import useUserStore from '@/stores/user';
// AWS WAF 人机验证兜底（405 CAPTCHA / 202 Challenge）
import { handleWafBlock, handleWafChallengeOnSuccess } from './wafCaptcha';

//1. 创建新的axios实例
const service = axios.create({
  // 使用环境变量配置baseURL
  baseURL: import.meta.env.VITE_APP_REQUEST_BASE_API || '/api',
  timeout: import.meta.env.VITE_APP_REQUEST_TIMEOUT || 30000,
})

// 2.请求拦截器
service.interceptors.request.use(config => {
  // 默认 Content-Type 为 application/json
  config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';

  // 从Pinia store获取token
  const userStore = useUserStore();
  if (userStore.token) {
    config.headers['authorization'] = `Bearer ${userStore.token}`;
  }

  return config
}, error => {
  console.error('请求拦截器错误:', error);
  return Promise.reject(error)
})

// 3.响应拦截器
service.interceptors.response.use(response => {
  // AWS WAF 静默 Challenge：202 属于 2xx 会进入此成功回调，需在最前面拦截并自动重放
  const wafChallengeRetry = handleWafChallengeOnSuccess(service, response);
  if (wafChallengeRetry) {
    return wafChallengeRetry;
  }
  // 直接返回响应数据，方便调用处使用
  console.log('响应数据:', response.data);
  if (response.data.code === 200) {
    return response.data
  } else if (response.data.code === 401) {
    ElMessage.error(response.data.msg);
    if (response.data.msg == '登录失效，请重新登录') {
      const userStore = useUserStore();
      userStore.resetToken();
      window.location.href = "/Login";
    }
    return response.data
  } else if (response.data.code === 403) {
    ElMessage.error(response.data.msg);
    return response.data
  } else if (response.data.code === 500) {
    ElMessage.error(response.data.msg);
    // return response.data
  }
  return response.data
}, error => {
  // AWS WAF 人机验证兜底：405 弹拼图后自动重放 / 202 静默质询后自动重放
  const wafRetry = handleWafBlock(service, error);
  if (wafRetry) {
    return wafRetry;
  }
  // 从Pinia store获取store实例
  const userStore = useUserStore();

  if (error && error.response) {
    switch (error.response.status) {
      case 400:
        error.message = error.response.data.msg || '错误请求'
        break;
      case 401:
        error.message = '未授权，请重新登录'
        // 清除存储的令牌并重定向到登录页面
        userStore.resetToken();
        window.location.href = "/Login";
        break;
      case 403:
        error.message = error.response.data.msg || '拒绝访问'
        break;
      case 404:
        error.message = '请求错误,未找到该资源'
        break;
      case 405:
        error.message = '请求方法未允许'
        break;
      case 408:
        error.message = '请求超时'
        break;
      case 500:
        error.message = '商户配置错误,请联系商务'
        break;
      case 501:
        error.message = '网络未实现'
        break;
      case 502:
        error.message = '网络错误'
        break;
      case 503:
        error.message = '服务不可用'
        break;
      case 504:
        error.message = '网络超时'
        break;
      case 505:
        error.message = 'http版本不支持该请求'
        break;
      default:
        error.message = `连接错误${error.response.status}`
    }
  } else {
    error.message = '连接服务器失败'
  }

  ElMessage.error(error.message);
  return Promise.reject(error);
})

export default service