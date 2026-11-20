/**
 * 多平台账号工具
 * 统一负责账号列表的读写、Cookie 解析、登录态判断。
 * 账号数据持久化在 appSetting['accounts.cookies']（JSON 字符串）。
 */
import { appSetting, updateSetting } from '@renderer/store/setting'

const STORAGE_KEY = 'accounts.cookies'

/** 获取账号列表（容错解析，兼容旧格式） */
export const getAccounts = () => {
  try {
    const raw = appSetting[STORAGE_KEY] || '[]'
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (_) {
    return []
  }
}

/** 保存账号列表 */
export const saveAccounts = (accounts) => {
  updateSetting({ [STORAGE_KEY]: JSON.stringify(accounts) })
}

/** 按 id 更新单个账号 */
export const updateAccount = (id, patch) => {
  const accounts = getAccounts()
  const index = accounts.findIndex(a => a.id === id)
  if (index < 0) return
  accounts[index] = { ...accounts[index], ...patch }
  saveAccounts(accounts)
}

/** 新增或替换同平台账号（一个平台只保留一个登录态） */
export const upsertAccount = (account) => {
  const accounts = getAccounts().filter(a => a.platform !== account.platform)
  accounts.push(account)
  saveAccounts(accounts)
  return account
}

/** 删除账号 */
export const removeAccount = (id) => {
  saveAccounts(getAccounts().filter(a => a.id !== id))
}

/** 获取指定平台的账号（取第一个） */
export const getAccountByPlatform = (platform) => getAccounts().find(a => a.platform === platform) || null

/**
 * 将 Cookie 字符串解析为键值对象
 * 例：'MUSIC_U=xxx; __csrf=yyy' -> { MUSIC_U: 'xxx', __csrf: 'yyy' }
 */
export const parseCookie = (cookie) => {
  const result = {}
  if (!cookie || typeof cookie !== 'string') return result
  for (const part of cookie.split(';')) {
    const index = part.indexOf('=')
    if (index < 0) continue
    const key = part.slice(0, index).trim()
    const value = part.slice(index + 1).trim()
    if (key) result[key] = value
  }
  return result
}

/**
 * 从 Electron session 的 Cookie 数组拼接为请求用的 Cookie 字符串
 * @param {Array<{name:string,value:string}>} cookies
 */
export const joinCookies = (cookies) => (Array.isArray(cookies) ? cookies : [])
  .map(c => `${c.name}=${c.value}`)
  .join('; ')

/** 判断网易账号是否处于登录态（存在 MUSIC_U 即视为登录） */
export const isWyLoggedIn = (account) => {
  if (!account || account.platform !== 'wy') return false
  const cookies = parseCookie(account.cookie)
  return !!cookies.MUSIC_U
}

/** 判断 QQ 音乐账号是否处于登录态（存在 uin 与 music key） */
export const isTxLoggedIn = (account) => {
  if (!account || account.platform !== 'tx') return false
  const cookies = parseCookie(account.cookie)
  return !!(cookies.uin && (cookies.qm_keyst || cookies.qqmusic_key))
}

export const isLoggedIn = (account) => {
  if (!account) return false
  if (account.platform === 'wy') return isWyLoggedIn(account)
  if (account.platform === 'tx') return isTxLoggedIn(account)
  return !!account.cookie
}

/** 根据 Cookie 中的关键字段推断登录方式 */
export const detectLoginType = (platform, cookie) => {
  const cookies = parseCookie(cookie)
  if (platform === 'wy') {
    // 网页登录的 Cookie 带 NMTID / __csrf，API 登录通常带 MUSIC_R_T
    if (cookies.MUSIC_R_T || cookies.os) return 'api'
    return 'web'
  }
  if (platform === 'tx') {
    // 网页登录有 p_skey / skey，扫码登录有 W_X 开头的 key
    if (cookies.p_skey || cookies.skey) return 'web'
    return 'api'
  }
  return 'web'
}

/** 构造一个标准账号对象 */
export const createAccount = ({ platform, cookie, name = '', nickname = '', avatar = '', loginType }) => ({
  id: `acc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  platform,
  name,
  nickname,
  avatar,
  cookie: cookie || '',
  loginType: loginType || detectLoginType(platform, cookie),
  expiresAt: 0,
  updatedAt: Date.now(),
  status: 'ok',
})
