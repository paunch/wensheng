<template lang="pug">
dt#hot_key {{ $t('setting__hot_key') }}
dd
  .p.small(:class="$style.categoryDesc") 快捷键分为「软件内」与「全局」两类。软件内快捷键仅在软件窗口获得焦点时生效；全局快捷键由系统接管，即使软件在后台也能触发（部分按键可能被其他程序占用，设置后显示删除线即表示注册失败）。

  .hotkey-toolbar(:class="$style.toolbar")
    base-btn(min outline @click="handleReset") 恢复默认快捷键

  //- 软件内快捷键
  h3#hot_key_local_title(:class="$style.categoryTitle") {{ $t('setting__hot_key_local_title') }}
  .p.small(:class="$style.categoryDesc") 仅在软件窗口激活时生效，适合日常操作。点击输入框后按下想要的组合键即可自定义，Backspace / Delete 可清除。
  div
    base-checkbox(id="setting_download_hotKeyLocal" v-model="current_hot_key.local.enable" :label="$t('setting__is_enable')" @change="handleHotKeySaveConfig")
  div(v-for="group in localGroups" :key="group.id" :class="$style.group")
    h4(:class="$style.groupTitle") {{ group.name }}
    div(:class="$style.hotKeyContainer" :style="{ opacity: current_hot_key.local.enable ? 1 : .6 }")
      div(v-for="(item, index) in group.items" :key="index" :class="$style.hotKeyItem")
        h5(:class="$style.hotKeyItemTitle") {{ $t('setting__hot_key_' + item.name) }}
        base-input(
          :class="$style.hotKeyItemInput" readonly :auto-paste="false"
          :placeholder="$t('setting__hot_key_unset_input')" :value="hotKeyConfig.local[item.name] && formatHotKeyName(hotKeyConfig.local[item.name].key)"
          @keyup.prevent
          @focus="handleHotKeyFocus($event, item, 'local')"
          @blur="handleHotKeyBlur($event, item, 'local')")

  //- 全局快捷键
  h3#hot_key_global_title(:class="$style.categoryTitle") {{ $t('setting__hot_key_global_title') }}
  .p.small(:class="$style.categoryDesc") 由系统全局接管，软件在后台也能响应。启用后按键会被系统级注册，可能与其他软件冲突；显示删除线表示注册失败，请更换按键。
  div
    base-checkbox(id="setting_download_hotKeyGlobal" v-model="current_hot_key.global.enable" :label="$t('setting__is_enable')" @change="handleEnableHotKey")
  div(v-for="group in globalGroups" :key="group.id" :class="$style.group")
    h4(:class="$style.groupTitle") {{ group.name }}
    div(:class="$style.hotKeyContainer" :style="{ opacity: current_hot_key.global.enable ? 1 : .6 }")
      div(v-for="(item, index) in group.items" :key="index" :class="$style.hotKeyItem")
        h5(:class="$style.hotKeyItemTitle") {{ $t('setting__hot_key_' + item.name) }}
        base-input(
          :class="[$style.hotKeyItemInput, hotKeyConfig.global[item.name] && hotKeyStatus[hotKeyConfig.global[item.name].key] && hotKeyStatus[hotKeyConfig.global[item.name].key].status === false ? $style.hotKeyFailed : null]"
          :value="hotKeyConfig.global[item.name] && formatHotKeyName(hotKeyConfig.global[item.name].key)" :auto-paste="false" readonly :placeholder="$t('setting__hot_key_unset_input')" @input.prevent
          @focus="handleHotKeyFocus($event, item, 'global')"
          @blur="handleHotKeyBlur($event, item, 'global')")
</template>

<script>
import { ref, computed, onBeforeUnmount, toRaw, shallowReactive } from '@common/utils/vueTools'
import { allHotKeys, hotKeySetEnable, hotKeySetConfig, hotKeyGetStatus, hotKeyResetConfig } from '@renderer/utils/ipc'
import { isMac } from '@common/utils'
import { useI18n } from '@renderer/plugins/i18n'
import { dialog } from '@renderer/plugins/Dialog'

/** 按功能对动作分组，便于按类别查看 */
const GROUP_NAMES = {
  player: '播放控制',
  window: '窗口控制',
  lyric: '桌面歌词',
  other: '其他',
}
const groupOf = (name) => {
  if (name.includes('desktop_lyric')) return 'lyric'
  if (name.startsWith('player_')) return 'player'
  if (/common_(min|toggle_min|toggle_hide|toggle_close|toggle_play_detail)/.test(name)) return 'window'
  return 'other'
}
const makeGroups = (list) => {
  const map = { player: [], window: [], lyric: [], other: [] }
  for (const item of list) map[groupOf(item.name)].push(item)
  return Object.keys(map)
    .filter(id => map[id].length)
    .map(id => ({ id, name: GROUP_NAMES[id], items: map[id] }))
}


const formatHotKeyName = (name) => {
  if (name.includes('arrow')) {
    name = name.replace(/arrow(left|right|up|down)/, s => {
      switch (s) {
        case 'arrowleft': return '←'
        case 'arrowright': return '→'
        case 'arrowup': return '↑'
        case 'arrowdown': return '↓'
      }
    })
  }
  if (name.includes('mod')) name = name.replace('mod', isMac ? 'Command' : 'Ctrl')
  name = name.replace(/(\+|^)[a-z]/g, l => l.toUpperCase())
  if (name.length > 1) name = name.replace(/\+/g, ' + ')
  return name
}

export default {
  name: 'SettingHotKey',
  setup() {
    const t = useI18n()
    const current_hot_key = ref({
      local: {
        enable: false,
        keys: {},
      },
      global: {
        enable: false,
        keys: {},
      },
    })

    const hotKeyConfig = ref({
      local: {},
      global: {},
    })

    const hotKeyStatus = ref({})
    const tip = t('setting__hot_key_tip_input')
    // 当前正在编辑的快捷键状态：一个输入框一套，避免多个输入框互相覆盖
    const editing = {
      active: false,
      target: null,
      info: null,
      type: '',
      newKey: '',
      cleared: false,
    }

    const initHotKeyConfig = () => {
      let config = {}
      for (const [type, typeInfo] of Object.entries(current_hot_key.value)) {
        let configInfo = config[type] = {}
        for (const [key, info] of Object.entries(typeInfo.keys)) {
          if (!info.name) continue
          configInfo[info.name] = shallowReactive({
            key,
            info,
          })
        }
      }
      hotKeyConfig.value = config
    }

    const handleHotKeyFocus = (event, info, type) => {
      const config = hotKeyConfig.value[type][info.name]
      // 同步设置编辑状态，保证紧接着的 keydown 能被捕获（原来在 setTimeout 里造成竞态）
      editing.active = true
      editing.target = event.target
      editing.info = info
      editing.type = type
      editing.newKey = config?.key || ''
      editing.cleared = false
      window.lx.isEditingHotKey = true
      event.target.value = tip
      // 暂停全局热键放在后台，不阻塞编辑状态
      void hotKeySetEnable(false)
    }

    const handleHotKeyBlur = (event, info, type) => {
      // 只处理当前正在编辑的输入框；其它输入框的 blur 直接忽略
      if (!editing.active || editing.target !== event.target) return
      const target = editing.target
      const targetInfo = editing.info
      const targetType = editing.type
      const newKey = editing.newKey
      const cleared = editing.cleared

      editing.active = false
      editing.target = null
      editing.info = null
      window.lx.isEditingHotKey = false
      void hotKeySetEnable(true)

      const config = hotKeyConfig.value[targetType][targetInfo.name]
      const originKey = config?.key || ''
      // 未做任何修改（既没按键也没点清除）：恢复原值即可
      if (!cleared && newKey === originKey) {
        target.value = originKey ? formatHotKeyName(originKey) : ''
        return
      }

      void (async() => {
        if (targetType == 'global' && newKey && current_hot_key.value.global.enable) {
          try {
            await hotKeySetConfig({ action: 'register', data: { key: newKey, info: targetInfo } })
          } catch (error) {
            console.log(error)
            target.value = originKey ? formatHotKeyName(originKey) : ''
            return
          }
        }

        if (originKey) {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete current_hot_key.value[targetType].keys[originKey]
        }
        if (newKey) {
          // 同一按键不能同时绑定两个动作：从其他位置摘除
          for (const tempInfo of Object.values(current_hot_key.value)) {
            if (tempInfo.keys[newKey]) {
              // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
              delete tempInfo.keys[newKey]
            }
          }
          current_hot_key.value[targetType].keys[newKey] = targetInfo
        }

        initHotKeyConfig()
        target.value = newKey ? formatHotKeyName(newKey) : ''
        if (originKey && current_hot_key.value.global.enable) {
          try {
            await hotKeySetConfig({ action: 'unregister', data: originKey })
          } catch (error) {
            console.log(error)
          }
        }
        await handleHotKeySaveConfig()
        await getHotKeyStatus()
      })()
    }

    const handleKeyDown = ({ event, key, type }) => {
      if (!event || event.repeat || type == 'up' || !editing.active || !editing.target) return
      event.preventDefault()
      if (key == 'delete' || key == 'backspace') {
        // 明确标记“清除”，不依赖输入框文本推断
        editing.newKey = ''
        editing.cleared = true
        editing.target.value = ''
        return
      }
      editing.cleared = false
      editing.newKey = key
      editing.target.value = formatHotKeyName(key)
    }
    // const handleUpdateHotKeyConfig = (config) => {
    //   // console.log(config)
    //   for (const [type, info] of Object.entries(config)) {
    //     current_hot_key.value[type] = info
    //   }
    // }
    const handleHotKeySaveConfig = async() => {
      // console.log(this.current_hot_key)
      await hotKeySetConfig({
        action: 'config',
        data: toRaw(current_hot_key.value),
      })
    }
    const handleEnableHotKey = async() => {
      await hotKeySetConfig({
        action: 'enable',
        data: current_hot_key.value.global.enable,
      })
      await handleHotKeySaveConfig()
      await getHotKeyStatus()
    }
    const getHotKeyStatus = async() => {
      return hotKeyGetStatus().then(status => {
        // console.log(status)
        hotKeyStatus.value = status
        return status
      })
    }

    const handleReset = async() => {
      const confirm = await dialog.confirm({
        message: '确定要将所有快捷键恢复为默认设置吗？',
        confirmButtonText: '恢复默认',
      })
      if (!confirm) return
      const config = await hotKeyResetConfig()
      current_hot_key.value = config
      initHotKeyConfig()
      // 同步渲染进程副本，确保软件内快捷键立即生效
      window.lx.appHotKeyConfig = config
      await getHotKeyStatus()
      void dialog('快捷键已恢复默认')
    }

    const localGroups = computed(() => makeGroups(allHotKeys.local))
    const globalGroups = computed(() => makeGroups(allHotKeys.global))

    current_hot_key.value = window.lx.appHotKeyConfig
    initHotKeyConfig()
    void getHotKeyStatus()

    window.app_event.on('keyDown', handleKeyDown)

    onBeforeUnmount(() => {
      window.app_event.off('keyDown', handleKeyDown)
    })

    return {
      // appSetting,
      allHotKeys,
      current_hot_key,
      hotKeyConfig,
      hotKeyStatus,
      localGroups,
      globalGroups,
      handleHotKeyFocus,
      handleHotKeyBlur,
      handleEnableHotKey,
      handleReset,
      formatHotKeyName,
      handleHotKeySaveConfig,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}
.categoryTitle {
  margin: 18px 0 6px;
  color: var(--color-font);
  font-size: 16px;
  border-left: 3px solid var(--color-primary);
  padding-left: 8px;
}
.categoryDesc {
  color: var(--color-font-label);
  line-height: 1.6;
}
.group {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--color-primary-alpha-900);
}
.groupTitle {
  color: var(--color-primary-font);
  font-size: 13px;
  margin: 0 0 4px;
}
.hotKeyContainer {
  display: flex;
  flex-flow: row wrap;
  // margin-top: -15px;
  margin-bottom: 15px;
  transition: opacity @transition-normal;
}
.hotKeyItem {
  width: 30%;
  padding-right: 35px;
  margin-top: 15px;
  box-sizing: border-box;
}
.hotKeyItemTitle {
  .mixin-ellipsis-1();
  padding-bottom: 5px;
  color: var(--color-font-label);
  font-size: 12px;
}
.hotKeyItemInput {
  width: 100%;
  box-sizing: border-box;
  // font-family: monospace;
  &:focus {
    background-color: var(--color-primary-background-active);
    text-decoration: none;
  }
  &::placeholder {
    color: var(--color-200) !important;
  }
}
.hotKeyFailed {
  text-decoration: line-through;
}

// .delLine {
//   position: relative;
//   &:before {
//     display: block;
//     height: 1px;
//     position: absolute;
//     width: 110%;
//     content: ' ';
//     left: 0;
//     background-color: #000;
//     transform: rotate(-24deg);
//     transform-origin: 0;
//     top: 83%;
//     z-index: 1;
//   }
//   &:after {
//     display: block;
//     height: 1px;
//     position: absolute;
//     width: 110%;
//     content: ' ';
//     left: 0;
//     background-color: #000;
//     transform: rotate(23deg);
//     transform-origin: 0px;
//     top: 2px;
//     z-index: 1;
//   }
// }

</style>
