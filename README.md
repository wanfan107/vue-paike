# Univepay Vue3 Admin

Univepay 商户后台管理系统，基于 Vue 3 + Vite + Element Plus 构建的现代化单页应用。

## 功能特性

- **用户认证**：支持邮箱/商户号登录、MFA2 验证码验证、忘记密码功能
- **账户管理**：登录密码、支付密码修改，个人账户信息查看
- **操作员管理**：支持操作员的新增、编辑、删除，集成MFA2验证码验证
- **多账户切换**：支持多商户账户选择和管理
- **安全验证**：集成 AWS 验证码、设备指纹识别
- **交易管理**：交易查询、收款订单、其他订单、代付管理
- **财务管理**：USDT 申请、代付、轮询、资金流水
- **统计报表**：首页统计、日/月报表、图表展示
- **IP白名单**：登录 IP 白名单和代付 IP 白名单管理
- **集团管理**：集团商户列表、订单模糊查询、转账管理

## 技术栈

- **前端框架**: Vue 3 (Composition API)
- **构建工具**: Vite 6.5.0
- **UI 组件库**: Element Plus
- **路由管理**: Vue Router 4
- **状态管理**: Pinia
- **HTTP 客户端**: Axios
- **图表库**: ECharts
- **图标库**: Element Plus Icons
- **验证码**: AWS Captcha

## 项目结构

```
src/
├── assets/          # 静态资源（图片、样式、图标等）
│   └── icon/
├── components/      # 通用组件
│   ├── AwsCaptcha.vue         # AWS 验证码组件
│   ├── SideMenu.vue           # 侧边栏菜单组件
│   ├── SuccessDialog.vue      # 成功提示弹窗组件
│   ├── SubmitForm.vue         # 表单提交组件
│   ├── MainLayout.vue         # 主布局组件
│   └── EditableSelect.vue     # 可编辑选择组件
├── views/           # 页面视图
│   ├── Login/            # 登录页面
│   │   ├── Login.vue
│   │   ├── SetPassword.vue
│   │   └── ResetPassword.vue
│   ├── Home/             # 首页
│   │   ├── HomeView.vue
│   │   └── component/
│   │       ├── project.vue  # 项目统计卡片
│   │       └── fast.vue     # 快捷操作
│   ├── account/          # 账户管理
│   │   ├── info/            # 个人信息
│   │   ├── loginPassword/   # 登录密码
│   │   ├── payPassword/     # 支付密码
│   │   ├── config/          # 账户配置
│   │   └── loginRecord/     # 登录记录
│   ├── Group/            # 集团管理
│   │   ├── PermissionManagement.vue  # 操作员管理
│   │   ├── loginIPWhiteList.vue       # IP白名单
│   │   ├── MerchantList.vue           # 商户列表
│   │   ├── groupApplyU.vue            # 集团USDT申请
│   │   ├── groupTransfer.vue          # 集团转账
│   │   ├── groupRotation.vue          # 集团轮询
│   │   ├── groupOrderFuzzyQuery.vue   # 订单模糊查询
│   │   ├── grouppayPassword.vue       # 集团支付密码
│   │   └── logs.vue                   # 登录日志
│   ├── Statistics/       # 统计报表
│   │   ├── index.vue
│   │   ├── index2.vue
│   │   ├── DailyReport.vue
│   │   ├── MonthlyReport.vue
│   │   └── component/
│   │       └── project.vue
│   ├── Finance/          # 财务管理
│   │   ├── ApplyU.vue    # USDT申请
│   │   ├── Transfer.vue  # 代付管理
│   │   ├── Rotation.vue  # 轮询管理
│   │   └── Inflation.vue
│   ├── TransactionInquiry/  # 交易查询
│   │   ├── index.vue
│   │   └── index2.vue
│   ├── ReceiptOrder/     # 收款订单
│   ├── Otherorders/      # 其他订单
│   ├── withdraw/         # 提现管理
│   ├── CapitalFlow/      # 资金流水
│   ├── RateInquiry/      # 费率查询
│   ├── ExportRecord/     # 导出记录
│   ├── payment/          # 支付管理
│   ├── ApiDoc/           # API文档
│   └── index.vue         # 首页统计
├── stores/          # Pinia 状态管理
│   └── user.ts          # 用户状态
├── api/             # API 请求封装
│   └── index.ts
├── router/          # 路由配置
│   └── index.ts
├── styles/          # 全局样式
│   └── variables.scss
├── App.vue          # 根组件
└── main.ts          # 入口文件
```

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

启动后访问: http://localhost:5173

### 生产构建

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 页面说明

### 登录页面 (Login)

支持邮箱账户或商户号登录，包含以下功能：
- 账户/密码输入
- AWS 安全验证码
- MFA2 身份验证码验证
- 多账户选择
- 忘记密码/重置密码功能

### 首页 (Home)

- 数据统计卡片：创建订单、成功订单、成功率
- 快捷操作入口
- 实时图表展示

### 操作员管理 (PermissionManagement)

用于管理系统操作员，功能包括：
- 操作员列表展示
- 新增操作员（需MFA2验证码）
- 编辑操作员信息
- 删除操作员（需MFA2验证码验证）
- 操作员详情查看
- 管理商户权限配置

### IP白名单管理 (loginIPWhiteList)

- 登录 IP 白名单管理
- 代付 IP 白名单管理
- 支持添加、删除、查看 IP 列表
- 商户号选择

### 集团管理 (Group)

- **商户列表**：查看和管理集团下所有商户
- **订单模糊查询**：按商户、时间等条件查询订单
- **转账管理**：集团内商户间资金转账
- **USDT 申请**：集团 USDT 提币申请
- **登录日志**：查看集团登录记录和异常登录

### 财务管理 (Finance)

- **USDT 申请**：提币申请，包含钱包地址管理
- **代付管理**：代付订单处理
- **轮询管理**：轮询相关功能
- **资金流水**：查看账户资金变动记录

### 统计报表 (Statistics)

- 实时数据统计和图表展示
- 日报表和月报表
- 收款、代付数据对比分析
- 成功率趋势展示

### 账户管理 (Account)

- **个人信息**：查看和修改个人基本信息
- **登录密码**：修改登录密码
- **支付密码**：修改支付密码
- **登录记录**：查看个人登录历史

### 交易查询 (TransactionInquiry)

- 按条件查询交易记录
- 查看订单详情
- 导出功能

## 安全特性

- **设备指纹识别**：检测登录设备变更
- **MFA2 验证**：二次身份验证
- **MFA2验证码**：敏感操作需验证
- **密码加密**：使用 MD5 加密传输
- **IP白名单**：限制登录和代付 IP
- **异常登录检测**：识别并记录异常登录行为

## 开发指南

### 添加新页面

1. 在 `src/views/` 目录下创建新页面组件
2. 在 `src/router/index.ts` 中配置路由
3. 如需状态管理，在 `src/stores/` 中创建 store

### API 调用

使用封装的 HTTP 客户端：

```typescript
import { http } from '@/api';

const response = await http.login(loginForm);
```

### 样式规范

- 使用 SCSS 编写样式
- 全局变量定义在 `src/styles/variables.scss`
- 组件样式使用 scoped 特性
- 页面布局遵循统一的设计风格（圆角卡片、适当间距）

### 组件复用

常用可复用组件：

- `SuccessDialog`：成功操作提示弹窗
- `SubmitForm`：通用表单提交
- `AwsCaptcha`：AWS 验证码
- `TimeRangeSelector`：时间范围选择器

## 常用命令

```bash
# 开发
npm run dev

# 构建
npm run build

# 预览
npm run preview

# 代码检查
npm run lint

# 代码格式化
npm run format
```

## 更新日志

### v1.0.0
- 基础功能完整实现
- 登录认证系统
- 操作员管理
- 交易查询和财务管理
- 统计报表功能

## License

MIT License

## Contributing

欢迎提交 Issue 和 Pull Request。

### 提交规范

- feat: 新功能
- fix: 修复 bug
- docs: 文档更新
- style: 代码格式调整
- refactor: 重构
- test: 测试相关
- chore: 构建/工具链相关
