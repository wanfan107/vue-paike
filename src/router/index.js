import { createRouter, createWebHistory } from 'vue-router'
import { HomeFilled, Search, Operation,DataLine,FolderOpened,DataAnalysis,CreditCard,Files,Wallet,WalletFilled,Download,Postcard } from '@element-plus/icons-vue'

// 布局组件
const MainLayout = () => import('../components/MainLayout.vue')

// 页面组件导入
const HomeView = () => import('../views/Home/HomeView.vue')
// 登录
const Login = () => import('../views/Login/Login.vue')
// 交易查询
const TransactionInquiry = () => import('../views/TransactionInquiry/index.vue')
// 资金流水
const CapitalFlow = () => import('../views/CapitalFlow/index.vue')
// 统计报表
// --即使报表--
const Realtime = () => import('../views/Statistics/index.vue')
// -- 每日报表--
const DailyReport = () => import('../views/Statistics/DailyReport.vue')
// -- 每月报表--
const MonthlyReport = () => import('../views/Statistics/MonthlyReport.vue')
// 收款订单
const ReceiptOrder = () => import('../views/ReceiptOrder/index.vue')
// 付款订单
const payment = () => import('../views/payment/index.vue')
// 下发订单
const withdraw = () => import('../views/withdraw/index.vue')

// 财务管理
// 申请下发
const ApplyU = () => import('../views/Finance/ApplyU.vue')
// 商户费率
const  RateInquiry = () => import('../views/RateInquiry/index.vue')
// 账户互转
const Rotation = () => import('../views/Finance/Rotation.vue')
// 转账/提现
const Transfer = () => import('../views/Finance/Transfer.vue')
// 内充申请
const Inflation = () => import('../views/Finance/Inflation.vue')


// 其他查询
const Otherorders = () => import('../views/Otherorders/index.vue')

// 导出记录
const ExportRecord = () => import('../views/ExportRecord/index.vue')

// 接口文档
const ApiDoc = () => import('../views/ApiDoc/index.vue')

// 账户管理
// -- 基本信息
const info = () => import('../views/account/info/index.vue')
// -- 应用配置
const config = () => import('../views/account/config/index.vue')
// -- 登录密码
const loginPassword = () => import('../views/account/loginPassword/index.vue')
// -- 支付密码
const payPassword = () => import('../views/account/payPassword/index.vue')
// -- 权限操作
const PermissionManagement = () => import('../views/account/PermissionManagement/index.vue')


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 登录页面 - 不需要登录即可访问，直接渲染，不包含布局
    { path: '/Login', name: 'Login', title: '登录', component: Login },
    
    // 主应用布局 - 包含左侧菜单，所有非登录页面都在这个布局下
    { 
      path: '/', 
      redirect: '/home', // 添加默认重定向到首页
      component: MainLayout, // 使用主布局组件
      children: [
        // 首页 - path设置为'home'，这样菜单数据获取时能正确处理
        { path: 'home', name: 'home', title: '首页', icon: HomeFilled, component: HomeView },
        // 交易查询
        { path: 'TransactionInquiry', name: 'TransactionInquiry', title: '交易查询', icon: Search, component: TransactionInquiry },
        // 资金流水
        { path: 'CapitalFlow', name: 'CapitalFlow', title: '资金流水', icon: FolderOpened, component: CapitalFlow },
        // 统计报表
        { path: 'Statistics', name: 'Statistics', title: '统计报表', icon: DataAnalysis, redirect: 'Realtime',  // 添加重定向
            children: [
            { path: 'Realtime', name: 'Realtime', component: Realtime, title: '即时统计' },
            { path: 'dailyReport', name: 'dailyReport', component: DailyReport, title: '每日报表' },
            { path: 'monthlyReport', name: 'monthlyReport', component: MonthlyReport, title: '每月报表' },
          ]
         },
      
        // 收款订单
        { path: 'ReceiptOrder', name: 'ReceiptOrder', title: '收款订单', icon: WalletFilled, component: ReceiptOrder },
        // 付款订单
        { path: 'payment', name: 'payment', title: '付款订单', icon: CreditCard, component: payment },
        // 下发订单
        { path: 'withdraw', name: 'withdraw', title: '下发订单', icon: Postcard, component: withdraw },
        // 其他订单、
         { path: 'Otherorders', name: 'Otherorders', title: '其他订单', icon: Wallet, component: Otherorders },
        // 商户费率
        { path: 'RateInquiry', name: 'RateInquiry', title: '商户费率', icon: DataLine, component: RateInquiry },
        // 财务管理
        { path: 'Finance', name: 'Finance', title: '财务管理', icon: Files, redirect: 'ApplyU',  // 添加重定向
            children: [
            { path: 'ApplyU', name: 'ApplyU', component: ApplyU, title: '申请下发' },
            { path: 'Rotation', name: 'Rotation', component: Rotation, title: '账户互转' },
            { path: 'Transfer', name: 'Transfer', component: Transfer, title: '转账/提现' },
            { path: 'Inflation', name: 'Inflation', component: Inflation, title: '内充申请' },
            // { path: 'Otherorders', name: 'Otherorders', component: Otherorders, title: '其他查询' },
          ]
         },
        // 申请下发
        // { path: 'ApplyU', name: 'ApplyU', title: '申请下发', icon: Wallet, component: ApplyU },
        // 导出记录
        { path: 'ExportRecord', name: 'exportRecord', title: '导出记录', icon: Download, component: ExportRecord },
        // 账户互转
        // { path: 'Transfer', name: 'Transfer', title: '账户互转', icon: Files, component: Transfer },
        // 接口文档
        { path: 'ApiDoc', name: 'ApiDoc', title: '接口文档', icon: DataLine, component: ApiDoc },
        // 账户管理
        { 
          path: 'account', 
          redirect: 'info', // 使用相对路径重定向
          title: '应用设置',
          icon: Operation,
          children: [
            { path: 'info', name: 'info', component: info, title: '基本信息' }, 
            { path: 'config', name: 'config', component: config, title: '应用配置' }, 
            { path: 'loginPassword', name: 'loginPassword', component: loginPassword, title: '登录密码' }, 
            { path: 'payPassword', name: 'payPassword', component: payPassword, title: '支付密码' }, 
            { path: 'PermissionManagement', name: 'PermissionManagement', component: PermissionManagement, title: '操作员权限' }, 
          ]
        },
      ]
    },
  ],
})

// 路由守卫 - 确保没有登录不能访问其他页面
import useUserStore from '../stores/user';

router.beforeEach( (to, from, next) => {
  // 定义不需要登录的页面
  const whiteList = ['/Login'];
  
  // 直接从URL判断是否为白名单页面，避免创建不必要的store实例
  if (whiteList.includes(to.path)) {
    next();
    return;
  }
  
  // 对于需要登录的页面，创建store实例
  const userStore = useUserStore();
  
  // 如果用户已登录（通过token是否存在判断）
  if (userStore.token) {
    // 如果访问的是登录页面，重定向到首页
    if (to.path === '/Login') {
      next({ path: '/' });
    } else {
      // 已登录，允许访问其他页面

      next();
    }
  } else {
    // 未登录且访问的不是登录页面，重定向到登录页面
    next({ path: '/Login', query: { redirect: to.fullPath } });
  }
});

export default router
