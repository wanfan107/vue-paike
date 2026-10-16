// ============================================================
// 品牌配置 —— 所有品牌相关的文案/资源/链接集中管理
// ★ 换皮时只改这里，不碰页面代码
// ★ 资源通过 @brand alias 引入，vite 构建时自动指向对应品牌目录
// ============================================================
import logoUrl from '@brand/logo.png'
import logoLockupUrl from '@brand/logo-lockup.png'
import logoIconUrl from '@brand/logoicon.png'

/**
 * @type {import('./brand').BrandConfig}
 */
export const brand = {
  // —— 基础身份 ——
  id: 'univepay',
  name: 'PIX',
  fullName: 'PIX 商户后台',
  subtitle: 'FINANCE · v1.2',
  description: 'PIX Merchant Console',

  // —— 资源（@brand 指向 src/assets/brands/${VITE_BRAND}/） ——
  assets: {
    logo: logoUrl,              // 方形图标版（侧栏/小尺寸）
    logoLockup: logoLockupUrl,  // 横版带文字（登录页品牌区）
    logoIcon: logoIconUrl,
    favicon: '/logoicon.png', // favicon 走 public 目录，避免构建路径问题
  },

  // —— 默认币种（业务侧可被 merchantInfo.currency 覆盖） ——
  defaultCurrency: 'BRL',
  currencySymbol: 'R$',

  // —— 链接 ——
  links: {
    manual: '/manual/merchant.html',
    helpCenter: '',
    support: '',
  },

  // —— 版权与备案 ——
  copyright: `© ${new Date().getFullYear()} PIX. All rights reserved.`,
  icp: '',
}

/**
 * @typedef {Object} BrandConfig
 * @property {string} id
 * @property {string} name
 * @property {string} fullName
 * @property {string} subtitle
 * @property {string} description
 * @property {{logo:string, logoLockup:string, logoIcon:string, favicon:string}} assets
 * @property {string} defaultCurrency
 * @property {string} currencySymbol
 * @property {{manual:string, helpCenter:string, support:string}} links
 * @property {string} copyright
 * @property {string} icp
 */

export default brand
