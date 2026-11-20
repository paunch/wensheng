/**
 * 聆澜音源自动续期：应用启动时若配置了 KEY，则重新拉取最新音源脚本并导入，
 * 避免音源更新后需要手动重新导入。静默执行，失败不阻塞启动。
 */
import { appSetting } from '@renderer/store/setting'
import { userApi } from '@renderer/store'
import { importUserApi } from '@renderer/utils/ipc'
import { fetchLinglanSource } from '@renderer/utils/linglan'

let isRefreshing = false

export default async(): Promise<void> => {
  if (isRefreshing) return
  const key = appSetting['linglan.key']
  if (!key) return
  isRefreshing = true
  try {
    const script = await fetchLinglanSource(key)
    if (!script || script.length < 100) return
    const { apiList } = await importUserApi(script)
    userApi.list = apiList
    console.log('[闻声] 聆澜音源已自动续期')
  } catch (err) {
    console.warn('[闻声] 聆澜音源自动续期失败:', err)
  } finally {
    isRefreshing = false
  }
}
