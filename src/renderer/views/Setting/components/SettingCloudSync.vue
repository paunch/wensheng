<template lang="pug">
dt#cloudsync {{ $t('setting__cloudsync') }}
dd
  .p.small {{ $t('setting__cloudsync_desc') }}
  .p
    base-checkbox(id="setting_cloudsync_auto" :model-value="appSetting['cloudSync.autoBackup']" :label="$t('setting__cloudsync_auto')" @update:model-value="updateSetting({ 'cloudSync.autoBackup': $event })")
  .p
    base-input(:model-value="appSetting['cloudSync.url']" :placeholder="$t('setting__cloudsync_url')" @update:model-value="setField('cloudSync.url', $event)")
  .p
    base-input(:model-value="appSetting['cloudSync.remoteDir']" :placeholder="$t('setting__cloudsync_dir')" @update:model-value="setField('cloudSync.remoteDir', $event)")
  .p
    base-input(:model-value="appSetting['cloudSync.username']" :placeholder="$t('setting__cloudsync_user')" @update:model-value="setField('cloudSync.username', $event)")
  .p
    base-input(:model-value="appSetting['cloudSync.password']" type="password" :placeholder="$t('setting__cloudsync_pass')" @update:model-value="setField('cloudSync.password', $event)")
  .p.buttons
    base-btn.btn.gap-left(min @click="handleTest") {{ $t('setting__cloudsync_test') }}
    base-btn.btn.gap-left(min @click="handleBackup") {{ $t('setting__cloudsync_backup') }}
    base-btn.btn.gap-left(min @click="handleRestore") {{ $t('setting__cloudsync_restore') }}
  .p.small.status(:class="{ error: statusIsError }") {{ statusText }}

</template>

<script>
import { ref, toRaw } from '@common/utils/vueTools'
import { debounce } from '@common/utils'
import { appSetting, updateSetting } from '@renderer/store/setting'
import { dialog } from '@renderer/plugins/Dialog'
import { useI18n } from '@renderer/plugins/i18n'
import {
  filterMusicList,
  fixNewMusicInfoQuality,
} from '@renderer/utils'
import { getListMusics, overwriteListFull } from '@renderer/store/list/action'
import { defaultList, loveList, userLists } from '@renderer/store/list/state'
import migrateSetting from '@common/utils/migrateSetting'

const BACKUP_FILE = 'wensheng.lxmc'

export default {
  name: 'SettingCloudSync',
  setup() {
    const t = useI18n()
    const statusText = ref('')
    const statusIsError = ref(false)

    const setStatus = (text, isError = false) => {
      statusText.value = text
      statusIsError.value = isError
    }

    const setField = debounce((key, value) => {
      updateSetting({ [key]: value.trim ? value.trim() : value })
    }, 400)

    const getConfig = () => ({
      url: appSetting['cloudSync.url'],
      username: appSetting['cloudSync.username'],
      password: appSetting['cloudSync.password'],
      remoteDir: appSetting['cloudSync.remoteDir'],
    })

    const getAllLists = async() => {
      const lists = []
      lists.push(await getListMusics(defaultList.id).then(musics => ({ ...defaultList, list: toRaw(musics) })))
      lists.push(await getListMusics(loveList.id).then(musics => ({ ...loveList, list: toRaw(musics) })))
      for await (const list of userLists) {
        lists.push(await getListMusics(list.id).then(musics => ({ ...toRaw(list), list: toRaw(musics) })))
      }
      return lists
    }

    const importNewListData = async(lists) => {
      const allLists = await getAllLists()
      for (const list of lists) {
        try {
          const targetList = allLists.find(l => l.id == list.id)
          if (targetList) {
            targetList.list = filterMusicList(list.list).map(m => fixNewMusicInfoQuality(m))
          } else {
            allLists.push({
              name: list.name,
              id: list.id,
              list: filterMusicList(list.list).map(m => fixNewMusicInfoQuality(m)),
              source: list.source,
              sourceListId: list.sourceListId,
              locationUpdateTime: list.locationUpdateTime ?? null,
            })
          }
        } catch (err) {
          console.log(err)
        }
      }
      const defaultListData = allLists.shift().list
      const loveListData = allLists.shift().list
      await overwriteListFull({ defaultList: defaultListData, loveList: loveListData, userList: allLists })
    }

    const handleTest = async() => {
      setStatus(t('setting__cloudsync_testing'))
      const res = await window.lx.worker.main.webdavTestConnection(getConfig())
      setStatus(res.message, !res.ok)
    }

    const handleBackup = async() => {
      const config = getConfig()
      if (!config.url) {
        setStatus(t('setting__cloudsync_url'), true)
        return
      }
      setStatus(t('setting__cloudsync_backing'))
      try {
        // 只上传“我喜欢”收藏歌单，不上传设置等其他信息
        const loveListData = await getListMusics(loveList.id).then(musics => ({ ...loveList, list: toRaw(musics) }))
        const allData = {
          type: 'loveList_v1',
          playList: [loveListData],
        }
        // 与 readLxConfigFile 对应的格式：gzip 压缩的 JSON
        const raw = JSON.stringify(allData)
        const compressed = await compressData(raw)
        const res = await window.lx.worker.main.webdavUpload(config, BACKUP_FILE, compressed)
        if (res.ok) {
          updateSetting({ 'cloudSync.lastBackupTime': new Date().toLocaleString() })
        }
        setStatus(res.message, !res.ok)
      } catch (err) {
        setStatus(`${t('setting__cloudsync_backup_fail')}：${err.message}`, true)
      }
    }

    const compressData = async(raw) => {
      // 复用 worker 侧 Node zlib，通过 Comlink 传输 ArrayBuffer
      return await window.lx.worker.main.gzipString(raw)
    }

    const handleRestore = async() => {
      const config = getConfig()
      if (!config.url) {
        setStatus(t('setting__cloudsync_url'), true)
        return
      }
      const confirm = await dialog.confirm({
        message: t('setting__cloudsync_restore_confirm'),
        cancelButtonText: t('cancel_button_text'),
        confirmButtonText: t('confirm_button_text'),
      })
      if (!confirm) return

      setStatus(t('setting__cloudsync_restoring'))
      const res = await window.lx.worker.main.webdavDownload(config, BACKUP_FILE)
      if (!res.ok) {
        setStatus(res.message, true)
        return
      }
      try {
        const raw = await window.lx.worker.main.gunzipToString(res.data)
        const allData = JSON.parse(raw)
        if (allData.type === 'loveList_v1') {
          // 新格式：只恢复“我喜欢”，不动其他列表与设置
          const restored = allData.playList?.[0]
          if (!restored) {
            setStatus(t('setting__cloudsync_format_error'), true)
            return
          }
          const allLists = await getAllLists()
          allLists[1] = { ...restored, list: filterMusicList(restored.list).map(m => fixNewMusicInfoQuality(m)) }
          const defaultListData = allLists[0].list
          const loveListData = allLists[1].list
          const userListData = allLists.slice(2)
          await overwriteListFull({ defaultList: defaultListData, loveList: loveListData, userList: userListData })
        } else if (allData.type === 'allData_v2') {
          // 兼容旧格式：恢复全部列表与设置
          await importNewListData(allData.playList)
          const setting = migrateSetting(allData.setting)
          setting['common.isAgreePact'] = true
          updateSetting(setting)
        } else {
          setStatus(t('setting__cloudsync_format_error'), true)
          return
        }
        setStatus(t('setting__cloudsync_restore_ok'))
      } catch (err) {
        setStatus(`${t('setting__cloudsync_restore_fail')}：${err.message}`, true)
      }
    }

    return {
      appSetting,
      updateSetting,
      setField,
      statusText,
      statusIsError,
      handleTest,
      handleBackup,
      handleRestore,
    }
  },
}
</script>

<style lang="less" module>
.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.status {
  min-height: 18px;
  &.error {
    color: #e2494a;
  }
}
</style>
