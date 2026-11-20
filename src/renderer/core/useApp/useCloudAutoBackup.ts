/**
 * 云盘自动备份：应用启动时若开启 autoBackup，则把当前数据备份到 WebDAV。
 * 静默执行，失败不阻塞启动。
 */
import { toRaw } from '@common/utils/vueTools'
import { appSetting, updateSetting } from '@renderer/store/setting'
import { getListMusics } from '@renderer/store/list/action'
import { loveList } from '@renderer/store/list/state'

export default async(): Promise<void> => {
  if (!appSetting['cloudSync.autoBackup'] || !appSetting['cloudSync.url']) return

  try {
    // 只上传“我喜欢”收藏歌单，不上传设置等其他信息
    const loveListData = await getListMusics(loveList.id).then(musics => ({ ...loveList, list: toRaw(musics) }))
    const backupData = {
      type: 'loveList_v1',
      playList: [loveListData],
    }
    const compressed = await window.lx.worker.main.gzipString(JSON.stringify(backupData))
    const res = await window.lx.worker.main.webdavUpload({
      url: appSetting['cloudSync.url'],
      username: appSetting['cloudSync.username'],
      password: appSetting['cloudSync.password'],
      remoteDir: appSetting['cloudSync.remoteDir'],
    }, 'wensheng.lxmc', compressed)

    if (res.ok) updateSetting({ 'cloudSync.lastBackupTime': new Date().toLocaleString() })
  } catch (err) {
    console.warn('[闻声] 云盘自动备份失败:', err)
  }
}
