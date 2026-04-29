import request from "@/request/index";
const defaultApi = (apiName) => {
    return {
        list: (params) => request.get(`/${apiName}/list`, { params }),
        page: (params) => request.get(`/${apiName}`, { params }),
        read: (id) => request.get(`/${apiName}/` + id),
        create: (id, data) => request.post(`/${apiName}`, data),
        update: (id, data) => request.put(`/${apiName}/` + id, { ...data, create_time: undefined, id: undefined }),
        delete: (id) => request.delete(`/${apiName}/` + id)
    }
}
export const http = {
    form: defaultApi('form'),
    login: (data) => request.post('/Auth/login', data),
    prelogin: (data) => request.post('/Auth/prelogin', data),
    // 商户信息
    merchant: (params) =>  request.get('/User/merchantinfo', { params }),
    // 资金流水明细
    financePage: (params) => request.post('/Finance/recordnew', params),
    updatePassword: data => request.post('/User/password', data),
    // 更新支付密码
    updatePayPassword: data => request.post('/User/paypassword', data),
    // 登陆记录/api/User/loginlog
    loginRecord: (params) => request.post('/User/loginlog', params),
    // 提现配置信息
    withdrawConfig: (params) => request.get('/Transfer/info?id=' + params.id, params),
    // 提现
    /*withdraw: data => request.post('/USDT/transfer', data),*/
    withdraw: data => request.post('/Pay/Payout', data),
    //提U：
    usdttransfer: data => request.post('/USDT/transfer', data),
    // 统计报表
    financeReport: (params) => request.post('/Finance/dailyorderstats', params),
    // 查询汇率
    exchangeRate: (params) => request.get('/USDT/rate', { params }),
    // 资金记录导出
    exportFinance: (params) => request.post('/finance/Export', params),
    /**
     * 分页
     */
    // 代收订单
    collectOrderPage: (params) => request.post('/Collect/record', params),
    // 代付订单
    payOrderPage: (params) => request.post('/Pay/record', params),
    // 提现记录
    withdrawPage: (params) => request.post('/Transfer/record', params),
    // 补发回调
    reissueCallback: data => request.post('/Collect/callback', data),
    // 代收导出
    exportCollect: (params) => request.post('/Collect/Export', params),
    /**
     *
     */
    // 代付白名单 User/getIPConfig
    payWhiteList: (params) => request.get('/User/getIPConfig?id=' + params.id, { params }),
    // 保存代付白名单 User/saveIPConfig
    savePayWhiteList: data => request.post('/User/saveIPConfig', data),
    // 代付导出
    exportPay: (params) => request.post('/Pay/Export', params),
    /**
     * 首页
     */
    // 统计代收成功率 /Collect/statisticsByDay
    collectSuccessRate: (params) => request.get('/Collect/statisticsByDay', { params }),
    // 统计代收成功率 /Collect/statisticsByMinute
    collectSuccessRateByMinute: (params) => request.get('/Collect/statisticsByMinute', { params }),
    // 当日代付统计 /Finance/totalPay
    totalPay: (params) => request.get('/Finance/totalPay', { params }),
    // 当日提现统计 /Finance/totalUSDT
    totalUSDT: (params) => request.get('/Finance/totalUSDT', { params }),
    // 导出记录
    exportList: (params) => request.post('/Transfer/exportlist', params),
}
