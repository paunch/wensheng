import { BrowserWindow, session } from 'electron'
import { LOGIN_RENDERER_EVENT_NAME } from '@common/ipcNames'
import { sendEvent as sendToMainWindow } from '@main/modules/winMain/main'

type Platform = 'wy' | 'tx' | 'kg' | 'kw'

const LOGIN_URLS: Record<Platform, string> = {
  wy: 'https://music.163.com/',
  tx: 'https://y.qq.com/',
  kg: 'https://www.kugou.com/',
  kw: 'https://www.kuwo.cn/',
}

/** 各平台显示名 */
const PLATFORM_NAMES: Record<Platform, string> = {
  wy: '网易云音乐',
  tx: 'QQ 音乐',
  kg: '酷狗音乐',
  kw: '酷我音乐',
}

/** 各平台判断“已登录”的关键 Cookie 字段（任一命中即可） */
const LOGIN_MARKERS: Record<Platform, string[]> = {
  // 网易网页登录态：MUSIC_U 必存在，部分场景只有 MUSIC_A / MUSIC_R_T
  wy: ['MUSIC_U', 'MUSIC_R_T', 'MUSIC_A'],
  // QQ 音乐网页登录态字段较多，命中任一即视为已登录
  tx: ['qm_keyst', 'qqmusic_key', 'musickey', 'uin'],
  // 酷狗网页登录态：userid + token（登录后才出现）
  kg: ['userid', 'token', 'kg_auth_token', 'KuGoo'],
  // 酷我网页登录态：loginUid + loginSid
  kw: ['loginUid', 'loginSid', 'kw_token'],
}

/** 真正代表“已登录”的强字段（避免只靠设备/匿名字段误判） */
const STRONG_MARKERS: Record<Platform, string[]> = {
  wy: ['MUSIC_U', 'MUSIC_R_T'],
  tx: ['qm_keyst', 'qqmusic_key', 'musickey'],
  kg: ['token', 'kg_auth_token'],
  kw: ['loginSid'],
}

let loginWindow: Electron.BrowserWindow | null = null
let currentPlatform: Platform = 'wy'
let resolveLogin: ((value: string | null) => void) | null = null

/** 获取登录窗口使用的持久化 session */
const getSession = (platform: Platform) => session.fromPartition(`persist:login-${platform}`)

/** 读取 session 中所有 Cookie 并拼接为请求字符串 */
const collectCookies = async(platform: Platform): Promise<string> => {
  try {
    const cookies = await getSession(platform).cookies.get({})
    return cookies.map(c => `${c.name}=${c.value}`).join('; ')
  } catch (_) {
    return ''
  }
}

/** 判断 Cookie 字符串是否包含指定字段 */
const hasAnyMarker = (cookieString: string, keys: string[]): boolean => {
  return keys.some(key => new RegExp(`(^|;\\s*)${key}=`).test(cookieString))
}

/**
 * 打开窗口前清除上一轮的登录态 Cookie，
 * 避免残留的旧 Cookie 让本次任意变化都被误判为“已登录”。
 */
const clearPreviousLogin = async(platform: Platform) => {
  const ses = getSession(platform)
  try {
    const cookies = await ses.cookies.get({})
    for (const cookie of cookies) {
      if (hasAnyMarker(`${cookie.name}=`, LOGIN_MARKERS[platform])) {
        const domain = (cookie.domain || '').replace(/^\./, '')
        const url = `${cookie.secure ? 'https' : 'http'}://${domain}${cookie.path || '/'}`
        await ses.cookies.remove(url, cookie.name).catch(() => { /* ignore */ })
      }
    }
  } catch (_) { /* ignore */ }
}

/** 关闭并清理登录窗口 */
const destroyWindow = () => {
  if (loginWindow && !loginWindow.isDestroyed()) {
    loginWindow.destroy()
  }
  loginWindow = null
}

/** 完成登录：先关窗口、后 resolve，避免窗口残留与重复触发 */
const finishLogin = async(platform: Platform, cookieString: string) => {
  if (!resolveLogin) return
  const resolve = resolveLogin
  resolveLogin = null
  const ok = hasAnyMarker(cookieString, STRONG_MARKERS[platform])
  destroyWindow()
  resolve(ok ? cookieString : null)
  sendToMainWindow(LOGIN_RENDERER_EVENT_NAME.result, { platform, success: ok })
}

/**
 * 打开网页登录窗口
 * @returns Promise<Cookie 字符串 | null>，登录成功返回 Cookie，取消/失败返回 null
 */
export const openLoginWindow = (platform: Platform): Promise<string | null> => {
  return new Promise((resolve) => {
    // 关闭上一个窗口（若存在）
    if (loginWindow && !loginWindow.isDestroyed()) {
      if (resolveLogin) resolveLogin(null)
      destroyWindow()
    }

    currentPlatform = platform
    resolveLogin = resolve

    const ses = getSession(platform)
    loginWindow = new BrowserWindow({
      width: 1024,
      height: 720,
      minWidth: 800,
      minHeight: 600,
      title: `登录${PLATFORM_NAMES[platform]}`,
      webPreferences: {
        session: ses,
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        webSecurity: true,
        spellcheck: false,
      },
    })

    const win = loginWindow
    // 标记该窗口为登录窗口，跳过 app.ts 全局 will-navigate 白名单拦截，
    // 否则音乐平台登录页会被 preventDefault 成空白页。
    ;(win.webContents as any).__isLoginWindow = true

    win.on('closed', () => {
      if (loginWindow === win) loginWindow = null
      if (resolveLogin) {
        const pendingResolve = resolveLogin
        resolveLogin = null
        pendingResolve(null)
      }
    })

    // 监听 Cookie 变化，检测到强登录态后自动完成
    const onCookieChanged = (_event: Electron.Event, _cookie: Electron.Cookie, _cause: string, removed: boolean) => {
      if (removed) return
      void collectCookies(platform).then((cookieString) => {
        // 用局部变量 platform，避免并发登录时 currentPlatform 被覆盖导致误判
        if (resolveLogin && hasAnyMarker(cookieString, STRONG_MARKERS[platform])) {
          void finishLogin(platform, cookieString)
        }
      })
    }
    ses.cookies.on('changed', onCookieChanged)
    win.once('closed', () => {
      ses.cookies.off('changed', onCookieChanged)
    })

    // 清掉旧登录态后再加载页面
    void clearPreviousLogin(platform).then(() => {
      if (!win.isDestroyed()) void win.loadURL(LOGIN_URLS[platform]).catch(() => { /* ignore */ })
    })

    win.focus()
  })
}

/** 关闭登录窗口（用户取消） */
export const closeLoginWindow = () => {
  destroyWindow()
  if (resolveLogin) {
    const pendingResolve = resolveLogin
    resolveLogin = null
    pendingResolve(null)
  }
}
