import request from "@/request/index";
import request_group from "@/request/index_group";
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
    // 集团预登录
    groupPrelogin: (data) => request_group.post("/Auth/group/prelogin", data),
    // 集团邮箱验证码验证
    verifyEmailCode: (data) => request_group.get("/auth/group/verify-email-code", { params: data }),
    // 集团登录
    groupLogin: (data) => request_group.post("/Auth/group/login", data),
    // 集团选择商户
    selectMerchant: (data, headers) => request_group.post("/Auth/group/selectMerchant", data, { headers }),
    // 集团菜单权限
    getGroupMenus: () => request_group.get("/Auth/group/menus"),  // 未用
    // 集团可访问商户
    getGroupMerchants: () => request_group.get("/Auth/group/merchants"),
    // 集团用户列表 （查询）
    getGroupUsers: () => request_group.post("/Auth/group/users"),
    // 创建集团用户 （创建）
    createGroupUser: (data) => request_group.post("/Auth/group/users/create", data),
    // 修改集团用户 （修改）
    updateGroupUser: (data) => request_group.post("/Auth/group/users/update", data),
    // 删除集团用户 （删除）
    deleteGroupUser: (data) => request_group.post("/Auth/group/users/delete", data),
    // 逻辑删除集团用户
    softDeleteGroupUser: (data) => request_group.post("/Auth/group/users/softDelete", data),
    // 修改集团用户邮箱
    updateGroupUserEmail: (data) => request_group.post("/Auth/group/users/updateEmail", data),
    // 重置集团用户密码 （重置密码）
    resetGroupUserPassword: (data) => request_group.post("/Auth/group/users/resetPassword", data),
    // 集团登录记录
    groupLoginLogs: (params) => request_group.post("/Auth/group/loginlogs", params),
    // 验证设置密码Token
    verifySetPasswordToken: (data) => request_group.post("/Auth/group/verify-token", data),
    // 通过Token设置密码
    setGroupUserPassword: (data) => request_group.post("/Auth/group/set-password", data),
    // 支付密码修改（使用集团MFA2验证）
    updateGroupPayPassword: (data, headers) => request_group.post("/Auth/group/paypassword", data, { headers }),
    // 集团商户互转余额查询
    // groupTransferBalance: (params, headers) => request_group.get("/Auth/group/transfer/balance", { params, headers }), // 郭哥接口暂时不用
    // 集团商户互转
    // groupMerchantTransfer: (data, headers) => request_group.post("/Auth/group/transfer", data, { headers }),  // 郭哥接口暂时不用
    // 集团订单模糊查询
    groupOrderQuery: (data, headers) => request_group.post("/Auth/group/orderQuery", data, { headers }),

    // 集团统计报表
    groupRealtime:   (params) => request_group.get("/groupStatistics/realtime", { params }),
    groupDailyRpt:   (params) => request_group.get("/groupStatistics/dailyRpt", { params }),
    groupMonthlyRpt: (params) => request_group.get("/groupStatistics/monthlyRpt", { params }),


    
    // 即时报表
    // 代付成功率统计
    paySuccessRatio: (params) => request.get('/pay/successratio', { params }),
    // 代收成功率统计
    collectSuccessRatio: (params) => request.get('/collect/successratio', { params }),
    // 集团新增钱包地址
    addWalletAddress: (data, headers) => request.post('/wfwallet/apply', data, { headers }),
    // 集团提U
    groupUsdtTransfer: (data, headers) => request.post('/wfwithdraw/apply', data, { headers }),
    // 集团钱包地址查询
    groupWalletQuery: (params, headers) => request.get('/wfwallet/group-wallets', { params, headers }),
    // 集团删除钱包地址
    deleteWalletAddress: (data, headers) => request.post('/wfwallet/delete', data, { headers }),
    // 集团新增IP白名单  
    // // 1：代付
    // 2：代收 （先不做）
    // 3：登录 useFor
    addLoginIp: (data, headers) => request.post('/wfipwhitelist/apply', data, { headers }),
    // 集团查询IP白名单
    // 查询IP白名单（别名）
    queryIpWhiteList: (params, headers) => request.get('/wfipwhitelist/list', { params, headers }),
    // 集团删除IP白名单
    // 删除IP白名单（别名）
    deleteIpWhiteList: (data, headers) => request.post('/wfipwhitelist/delete', data, { headers }),
    // 集团互转审批-刘强
    groupTransferApproval: (data, headers) => request.post("/wftransfer/apply", data, { headers }),
    // 集团互转查询-刘强
    groupTransferQuery: (data) => request.post("/WfTransfer/records", data), 



    login: (data) => request.post('/Auth/login', data),
    prelogin: (data) => request.post('/Auth/prelogin', data),
    // 商户信息
    merchant: (params) => request.get('/User/merchantinfo', { params }),
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
    // 统计报表查每天，每月
    financeReportByDay: (params) => request.get("/Finance/dailyRpt", { params }),
    financeReportByMonth: (params) => request.get("Finance/monthlyRpt", { params }),
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
    // 补发回调-代收
    reissueCallback: data => request.post('/Collect/callback', data),
    // 补发回调-代付
    reissueCallbackPay: data => request.post('/Pay/callback', data),
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
    // 按天统计代收代付汇总数据  api/Collect/statisticsByDayBoth
    statisticsByDayBoth: (params) => request.get('/Collect/statisticsByDayBoth', { params }),
    // 导出记录
    exportList: (params) => request.post('/Transfer/exportlist', params),
}
