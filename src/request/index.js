// 导入封装好的axios实例
import request from './request'

// 直接导出axios实例，保持与项目原有API调用方式兼容
export default request

// 可选：也可以导出常用的HTTP请求方法，方便直接使用
export const http = {
  get(url, params = {}, config = {}) {
    return request({
      method: 'get',
      url,
      params,
      ...config
    });
  },
  post(url, data = {}, config = {}) {
    return request({
      method: 'post',
      url,
      data,
      ...config
    });
  },
  put(url, data = {}, config = {}) {
    return request({
      method: 'put',
      url,
      data,
      ...config
    });
  },
  delete(url, params = {}, config = {}) {
    return request({
      method: 'delete',
      url,
      params,
      ...config
    });
  }
};