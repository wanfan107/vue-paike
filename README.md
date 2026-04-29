# Univepay Vue3 Admin

Univepay 商户后台管理系统，基于 Vue 3 + Vite + Element Plus 构建的现代化单页应用。

## 功能特性

- **用户认证**：支持邮箱/商户号登录、MFA2 验证码验证、忘记密码功能
- **操作员管理**：支持操作员的新增、编辑、删除，集成谷歌验证码验证
- **多账户切换**：支持多商户账户选择和管理
- **安全验证**：集成 AWS 验证码、设备指纹识别

## 技术栈

- **前端框架**: Vue 3 (Composition API)
- **构建工具**: Vite 6.5.0
- **UI 组件库**: Element Plus
- **路由管理**: Vue Router 4
- **状态管理**: Pinia
- **HTTP 客户端**: Axios
- **图标库**: Element Plus Icons
- **验证码**: AWS Captcha

## 项目结构

```
src/
├── assets/          # 静态资源（图片、样式等）
├── components/      # 通用组件
│   └── AwsCaptcha.vue    # AWS 验证码组件
├── views/           # 页面视图
│   ├── Login/           # 登录页面
│   │   └── Login.vue
│   ├── account/         # 账户管理
│   │   └── PermissionManagement/  # 操作员管理
│   └── home/            # 首页
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
- 忘记密码功能

### 操作员管理 (PermissionManagement)

用于管理系统操作员，功能包括：
- 操作员列表展示
- 新增操作员（需谷歌验证码）
- 编辑操作员信息
- 删除操作员（需谷歌验证码验证）
- 操作员详情查看

## 安全特性

- **设备指纹识别**：检测登录设备变更
- **MFA2 验证**：二次身份验证
- **谷歌验证码**：敏感操作需验证
- **密码加密**：使用 MD5 加密传输

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

## License

MIT License

## Contributing

欢迎提交 Issue 和 Pull Request。