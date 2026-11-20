/**
 * 多平台账号 Cookie 自动续期
 * 应用启动时静默验证并续期已登录账号：
 *  - 网易云：调用 token/refresh 续期
 *  - QQ 音乐：调用 GetLoginUserInfo 验证登录态
 * 之后每 6 小时续期一次，失败不阻塞启动。
 */
import { appSetting } from '@renderer/store/setting'
import { getAccounts } from '@renderer/utils/accounts'
import { refreshWyCookie, checkTxCookie, checkAccountCookie } from '@renderer/utils/discoverApi'

let timer: number | null = null
let isRefreshing = false

const refreshAll = async() => {
  if (isRefreshing) return
  if (!appSetting['accounts.autoRefresh']) return
  const accounts = getAccounts()
  if (!accounts.length) return
  isRefreshing = true
  try {
    for (const account of accounts) {
      if (!account.cookie) continue
      try {
        if (account.platform === 'wy') {
          const ok = await refreshWyCookie()
          console.log(`[闻声] 网易云账号续期${ok ? '成功' : '失败'}`)
        } else if (account.platform === 'tx') {
          const ok = await checkTxCookie()
          console.log(`[闻声] QQ音乐账号验证${ok ? '成功' : '已失效'}`)
        } else if (account.platform === 'kg' || account.platform === 'kw') {
          const ok = await checkAccountCookie(account.platform)
          console.log(`[闻声] ${account.platform} 账号验证${ok ? '成功' : '已失效'}`)
        }
      } catch (err) {
        console.warn(`[闻声] ${account.platform} 账号续期异常:`, err)
      }
    }
  } finally {
    isRefreshing = false
  }
}

export default async(): Promise<void> => {
  void refreshAll()
  if (timer !== null) window.clearInterval(timer)
  timer = window.setInterval(() => { void refreshAll() }, 6 * 60 * 60 * 1000)
}
