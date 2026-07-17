import { createRouter, createWebHistory } from 'vue-router'
import { HomeFilled, Setting, Operation, DataLine, FolderOpened, DataAnalysis, CreditCard, Files, Wallet, WalletFilled, Download, Postcard, Folder, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// // 布局组件
// const MainLayout = () => import('../components/MainLayout.vue')

// // 页面组件导入
// const HomeView = () => import('../views/Home/HomeView.vue')
// // 登录
// const Login = () => import('../views/Login/Login.vue')
// // 设置密码
// const SetPassword = () => import('../views/Login/SetPassword.vue')
// // 重置密码
// const ResetPassword = () => import('../views/Login/ResetPassword.vue')
// // 交易查询
// // const TransactionInquiry = () => import('../views/TransactionInquiry/index.vue')
// // 资金流水
// const CapitalFlow = () => import('../views/CapitalFlow/index.vue')
// // 统计报表
// // --即使报表--
// const Realtime = () => import('../views/Statistics/index.vue')
// // -- 每日报表--
// const DailyReport = () => import('../views/Statistics/DailyReport.vue')
// // -- 每月报表--
// const MonthlyReport = () => import('../views/Statistics/MonthlyReport.vue')
// // 收款订单
// const ReceiptOrder = () => import('../views/ReceiptOrder/index.vue')
// // 付款订单
// const payment = () => import('../views/payment/index.vue')
// // 下发订单
// const withdraw = () => import('../views/withdraw/index.vue')

// // 财务管理
// // 申请下发
// const ApplyU = () => import('../views/Finance/ApplyU.vue')
// // 商户费率
// const RateInquiry = () => import('../views/RateInquiry/index.vue')
// // 账户互转
// const Rotation = () => import('../views/Finance/Rotation.vue')
// // 转账/提现
// const Transfer = () => import('../views/Finance/Transfer.vue')
// // 内充申请
// const Inflation = () => import('../views/Finance/Inflation.vue')


// // 其他查询
// const Otherorders = () => import('../views/Otherorders/index.vue')

// // 导出记录
// const ExportRecord = () => import('../views/ExportRecord/index.vue')

// // 接口文档
// const ApiDoc = () => import('../views/ApiDoc/index.vue')

// // 账户管理
// // -- 基本信息
// const info = () => import('../views/account/info/index.vue')
// // -- 应用配置
// const config = () => import('../views/account/config/index.vue')
// // -- 登录密码
// const loginPassword = () => import('../views/account/loginPassword/index.vue')
// // -- 支付密码
// const payPassword = () => import('../views/account/payPassword/index.vue')

// // 集团管理
// // -- 登录记录
// const logs = () => import('../views/Group/logs.vue')
// // -- 商户列表
// const MerchantList = () => import('../views/Group/MerchantList.vue')
// // -- 操作员管理
// const PermissionManagement = () => import('../views/Group/PermissionManagement.vue')
// // -- 集团支付密码
// const grouppayPassword = () => import('../views/Group/grouppayPassword.vue')
// // -- 集团商户互转
// const groupTransfer = () => import('../views/Group/groupTransfer.vue')
// // -- 登录IP白名单
// const loginIPWhiteList = () => import('../views/Group/loginIPWhiteList.vue')
// // -- 集团订单模糊查询
// const groupOrderFuzzyQuery = () => import('../views/Group/groupOrderFuzzyQuery.vue')
// // -- 集团申请下发
// const groupApplyU = () => import('../views/Group/groupApplyU.vue')



// 布局组件 - 静态导入
import MainLayout from '../components/MainLayout.vue'

// 页面组件导入 - 静态导入
import HomeView from '../views/Home/HomeView.vue'
import Login from '../views/Login/Login.vue'
import SetPassword from '../views/Login/SetPassword.vue'
import ResetPassword from '../views/Login/ResetPassword.vue'
import CapitalFlow from '../views/CapitalFlow/index.vue'
import Realtime from '../views/Statistics/index.vue'
import DailyReport from '../views/Statistics/DailyReport.vue'
import MonthlyReport from '../views/Statistics/MonthlyReport.vue'
import ReceiptOrder from '../views/ReceiptOrder/index.vue'
import payment from '../views/payment/index.vue'
import withdraw from '../views/withdraw/index.vue'
import ApplyU from '../views/Finance/ApplyU.vue'
import RateInquiry from '../views/RateInquiry/index.vue'
import Rotation from '../views/Finance/Rotation.vue'
import Transfer from '../views/Finance/Transfer.vue'
import Inflation from '../views/Finance/Inflation.vue'
import Otherorders from '../views/Otherorders/index.vue'
import ExportRecord from '../views/ExportRecord/index.vue'
import ApiDoc from '../views/ApiDoc/index.vue'
import info from '../views/account/info/index.vue'
import config from '../views/account/config/index.vue'
import loginPassword from '../views/account/loginPassword/index.vue'
import payPassword from '../views/account/payPassword/index.vue'
import logs from '../views/Group/logs.vue'
import MerchantList from '../views/Group/MerchantList.vue'
import PermissionManagement from '../views/Group/PermissionManagement.vue'
import grouppayPassword from '../views/Group/grouppayPassword.vue'
import groupTransfer from '../views/Group/groupTransfer.vue'
import loginIPWhiteList from '../views/Group/loginIPWhiteList.vue'
import groupOrderFuzzyQuery from '../views/Group/groupOrderFuzzyQuery.vue'
import groupApplyU from '../views/Group/groupApplyU.vue'



// 集团统计报表
import GroupStatistics from '../views/GroupStatistics/index.vue'
import GroupDailyReport from '../views/GroupStatistics/DailyReport.vue'
import GroupMonthlyReport from '../views/GroupStatistics/MonthlyReport.vue'



const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 登录页面 - 不需要登录即可访问，直接渲染，不包含布局
    { path: '/Login', name: 'Login', title: '登录', component: Login },
    // 设置密码页面 - 商户/操作员首次设置密码
    { path: '/set-password', name: 'SetPassword', title: '设置密码', component: SetPassword },
    // 重置密码页面 - 忘记密码重置
    // { path: '/reset-password', name: 'ResetPassword', title: '重置密码', component: ResetPassword },

    // 主应用布局 - 包含左侧菜单，所有非登录页面都在这个布局下
    {
      path: '/',
      redirect: '/home', // 添加默认重定向到首页
      component: MainLayout, // 使用主布局组件
      children: [
        // 首页 - 所有用户都能访问
        { path: 'home', name: 'home', title: '首页', icon: HomeFilled, component: HomeView, meta: { roles: ['admin', 'merchant', 'finance', 'operator'] } },
        // 交易查询
        // { path: 'TransactionInquiry', name: 'TransactionInquiry', title: '交易查询', icon: Search, component: TransactionInquiry, meta: { roles: ['admin','merchant', 'finance', 'operator'] } },
        // { path: 'TransactionInquiry2', name: 'TransactionInquiry2', title: '交易查询2', icon: Search, component: TransactionInquiry2, meta: { roles: ['admin','merchant', 'finance', 'operator'] } },
        // 集团订单查询
        { path: 'groupOrderFuzzyQuery', name: 'groupOrderFuzzyQuery', icon: Search, component: groupOrderFuzzyQuery, title: '订单查询', meta: { roles: ['admin', 'finance', 'operator'] } },
        // 资金流水
        { path: 'CapitalFlow', name: 'CapitalFlow', title: '资金流水', icon: FolderOpened, component: CapitalFlow, meta: { roles: ['admin', 'merchant', 'finance', 'operator'] } },

        // 统计报表
        {
          path: 'Statistics', name: 'Statistics', title: '统计报表', icon: DataAnalysis, redirect: 'Realtime', meta: { roles: ['admin', 'merchant', 'finance', 'operator'] },
          children: [
            { path: 'Realtime', name: 'Realtime', component: Realtime, title: '即时统计', meta: { roles: ['admin', 'merchant', 'finance', 'operator'] } },
            { path: 'dailyReport', name: 'dailyReport', component: DailyReport, title: '每日报表', meta: { roles: ['admin', 'merchant', 'finance', 'operator'] } },
            { path: 'monthlyReport', name: 'monthlyReport', component: MonthlyReport, title: '每月报表', meta: { roles: ['admin', 'merchant', 'finance', 'operator'] } },
          ]
        },


        // 收款订单
        { path: 'ReceiptOrder', name: 'ReceiptOrder', title: '收款订单', icon: WalletFilled, component: ReceiptOrder, meta: { roles: ['admin', 'merchant', 'finance', 'operator'] } },
        // 付款订单
        { path: 'payment', name: 'payment', title: '付款订单', icon: CreditCard, component: payment, meta: { roles: ['admin', 'merchant', 'finance', 'operator'] } },
        // 下发订单
        { path: 'withdraw', name: 'withdraw', title: '下发订单', icon: Postcard, component: withdraw, meta: { roles: ['admin', 'merchant', 'finance', 'operator'] } },
        // 集团管理
        {
          path: 'group',
          redirect: 'info',
          title: '集团账户管理',
          icon: Operation,
          meta: { roles: ['admin', 'operator', 'finance'] },
          children: [
            { path: 'logs', name: 'groupLogs', component: logs, title: '集团登录记录', meta: { roles: ['admin', 'finance', 'operator'] } },
            { path: 'MerchantList', name: 'groupMerchantList', component: MerchantList, title: '集团商户列表', meta: { roles: ['admin', 'finance', 'operator'] } },
            { path: 'PermissionManagement', name: 'groupPermission', component: PermissionManagement, title: '集团操作员列表', meta: { roles: ['admin'] } },
            // { path: 'grouppayPassword', name: 'grouppayPassword', component: grouppayPassword, title: '集团支付密码', meta: { roles: ['admin', 'finance'] } },
            // { path: 'groupTransfer', name: 'groupTransfer', component: groupTransfer, title: '集团商户互转', meta: { roles: ['admin', 'finance'] } },
            { path: 'loginIPWhiteList', name: 'loginIPWhiteList', component: loginIPWhiteList, title: '集团IP白名单', meta: { roles: ['admin'] } },
            { path: 'grouppayPassword', name: 'grouppayPassword', component: grouppayPassword, title: '支付密码管理', meta: { roles: ['admin', 'finance'] } },
            // { path: 'groupApplyU', name: 'groupApplyU', component: groupApplyU, title: '集团申请下发', meta: { roles: ['admin', 'finance'] } },
          ]
        },
        // 其他订单
        // { path: 'Otherorders', name: 'Otherorders', title: '其他订单', icon: Wallet, component: Otherorders, meta: { roles: ['admin','merchant', 'finance'] } },

        // 财务管理
        {
          path: 'Finance', name: 'Finance', title: '财务管理', icon: Files, redirect: 'ApplyU', meta: { roles: ['merchant'] },
          children: [
            { path: 'ApplyU', name: 'ApplyU', component: ApplyU, title: '申请下发', meta: { roles: ['merchant'] } },
            // { path: 'Rotation', name: 'Rotation', component: Rotation, title: '账户互转', meta: { roles: ['admin','finance', 'merchant'] } },
            // { path: 'Transfer', name: 'Transfer', component: Transfer, title: '转账/提现', meta: { roles: ['admin', 'finance', 'merchant'] } },
            // { path: 'Inflation', name: 'Inflation', component: Inflation, title: '内充申请', meta: { roles: ['admin','finance', 'merchant'] } },
            // 集团的财务管理
            //  { path: 'groupApplyU', name: 'groupApplyU', component: groupApplyU, title: '集团申请下发', meta: { roles: ['admin', 'finance'] } },
            // { path: 'groupTransfer', name: 'groupTransfer', component: groupTransfer, title: '集团商户互转', meta: { roles: ['admin', 'finance'] } },
          ]
        },
        {
          path: 'groupFinance', name: 'groupFinance', title: '集团财务管理', icon: Files, redirect: 'ApplyU', meta: { roles: ['admin', 'finance',] },
          children: [
            // { path: 'ApplyU', name: 'ApplyU', component: ApplyU, title: '申请下发', meta: { roles: [ 'merchant'] } },
            // { path: 'Rotation', name: 'Rotation', component: Rotation, title: '账户互转', meta: { roles: ['admin','finance', 'merchant'] } },
            // { path: 'Transfer', name: 'Transfer', component: Transfer, title: '转账/提现', meta: { roles: ['admin', 'finance', 'merchant'] } },
            // { path: 'Inflation', name: 'Inflation', component: Inflation, title: '内充申请', meta: { roles: ['admin','finance', 'merchant'] } },
            // 集团的财务管理
            { path: 'groupApplyU', name: 'groupApplyU', component: groupApplyU, title: '集团申请下发', meta: { roles: ['admin', 'finance'] } },
            { path: 'groupTransfer', name: 'groupTransfer', component: groupTransfer, title: '集团商户互转', meta: { roles: ['admin', 'finance'] } },
          ]
        },
        // 集团统计报表
        {
          path: 'groupStatistics', name: 'groupStatistics', title: '集团统计报表', icon: DataAnalysis, redirect: 'groupRealtime', meta: { roles: ['admin', 'finance'] },
          children: [
            { path: 'groupRealtime', name: 'groupRealtime', component: GroupStatistics, title: '即时统计', meta: { roles: ['admin', 'finance'] } },
            { path: 'groupDailyReport', name: 'groupDailyReport', component: GroupDailyReport, title: '每日报表', meta: { roles: ['admin', 'finance'] } },
            { path: 'groupMonthlyReport', name: 'groupMonthlyReport', component: GroupMonthlyReport, title: '每月报表', meta: { roles: ['admin', 'finance'] } },
          ]
        },
        // 导出记录
        { path: 'ExportRecord', name: 'exportRecord', title: '导出记录', icon: Download, component: ExportRecord, meta: { roles: ['admin', 'merchant', 'finance', 'operator'] } },
        // 接口文档
        { path: 'ApiDoc', name: 'ApiDoc', title: '接口文档', icon: DataLine, component: ApiDoc, meta: { roles: ['admin', 'merchant'] } },
        // 商户费率
        { path: 'RateInquiry', name: 'RateInquiry', title: '商户费率', icon: Folder, component: RateInquiry, meta: { roles: ['admin', 'merchant', 'finance', 'operator'] } },
        // 账户管理
        {
          path: 'account',
          redirect: 'info',
          title: '应用设置',
          icon: Setting,
          meta: { roles: ['admin', 'finance', 'operator', 'merchant'] },
          children: [
            { path: 'info', name: 'info', component: info, title: '基本信息', meta: { roles: ['admin', 'finance', 'operator', 'merchant'] } },
            { path: 'config', name: 'config', component: config, title: '应用配置', meta: { roles: ['admin', 'merchant'] } },
            { path: 'loginPassword', name: 'loginPassword', component: loginPassword, title: '登录密码', meta: { roles: ['merchant'] } },
            { path: 'payPassword', name: 'payPassword', component: payPassword, title: '支付密码', meta: { roles: ['merchant'] } },
          ]
        },

      ]
    },
  ],
})

// 路由守卫 - 确保没有登录不能访问其他页面
import useUserStore from '../stores/user';

router.beforeEach((to, from, next) => {
  // 定义不需要登录的页面
  const whiteList = ['/Login', '/set-password'];

  // 直接从URL判断是否为白名单页面，避免创建不必要的store实例
  if (whiteList.includes(to.path)) {
    next();
    return;
  }

  // 对于需要登录的页面，创建store实例
  const userStore = useUserStore();

  // 如果用户已登录（通过token是否存在判断）
  // 使用 !! 确保转换为布尔值，避免空字符串被误判
  if (!!userStore.token && userStore.token.trim() !== '') {
    // 如果访问的是登录页面，重定向到首页
    if (to.path === '/Login') {
      next({ path: '/' });
    } else {
      // 已登录，检查角色权限
      // console.log('当前路径:', to.path);
      // console.log('匹配的路由:', to.matched);
      // 检查所有匹配的路由（包括嵌套路由）
      const hasPermission = to.matched.every(route => {
        const routeRoles = route.meta?.roles;
        // console.log('路由:', route.path, '角色要求:', routeRoles);
        // 如果路由没有配置roles，说明该路由不需要角色权限
        if (!routeRoles || routeRoles.length === 0) {
          return true;
        }
        // 获取当前用户的角色
        // admin 管理员角色    
        // merchant 商户角色    
        // operator 操作员    
        // finance 财务角色  
        const userRole = userStore?.roleCode || 'merchant';
        // console.log('当前用户角色:', userRole);
        // 检查用户角色是否在允许的角色列表中
        const hasRole = routeRoles.includes(userRole);
        // console.log('是否有权限:', hasRole);
        return hasRole;
      });
      // console.log('最终权限检查结果:', hasPermission);

      if (hasPermission) {
        next();
      } else {
        // 没有权限，显示提示并重定向到首页
        ElMessage({
          type: 'warning',
          message: '抱歉，您没有权限访问该页面',
          duration: 3000
        });
        // console.warn('当前用户没有权限访问该页面:', to.path);
        next({ path: '/home' });
      }
    }
  } else {
    // 未登录且访问的不是登录页面，重定向到登录页面
    next({ path: '/Login', query: { redirect: to.fullPath } });
  }
});

export default router
