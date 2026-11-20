import { HOTKEY_RENDERER_EVENT_NAME } from '@common/ipcNames'
import { mainHandle } from '@common/mainIpc'
import defaultHotKey from '@common/defaultHotKey'
import { init, registerHotkey, unRegisterHotkey, unRegisterHotkeyAll } from './utils'


export default () => {
  mainHandle<LX.HotKeyActions, boolean>(HOTKEY_RENDERER_EVENT_NAME.set_config, async({ params }) => {
    switch (params.action) {
      case 'config':
        // global.lx.event_app.saveConfig(data, source)
        global.lx.event_app.hot_key_config_update(params.data)
        return true
      case 'enable':
        global.lx.hotKey.enable = params.data
        params.data ? init(true) : unRegisterHotkeyAll()
        return true
      case 'register':
        return registerHotkey(params.data)
      case 'unregister':
        unRegisterHotkey(params.data)
        return true
    }
  })

  // 恢复默认快捷键：重置配置为默认值并重新注册全局热键
  mainHandle<LX.HotKeyConfigAll>(HOTKEY_RENDERER_EVENT_NAME.reset_config, async() => {
    const config = JSON.parse(JSON.stringify(defaultHotKey)) as LX.HotKeyConfigAll
    global.lx.hotKey.config = config
    global.lx.event_app.hot_key_config_update(config)
    // 重新注册全局热键（按当前 enable 状态）
    global.lx.hotKey.enable ? init(true) : unRegisterHotkeyAll()
    return config
  })

  mainHandle<LX.HotKeyState>(HOTKEY_RENDERER_EVENT_NAME.status, async() => global.lx.hotKey.state)

  mainHandle<boolean>(HOTKEY_RENDERER_EVENT_NAME.enable, async({ params: flag }) => {
    flag ? init() : unRegisterHotkeyAll()
  })

  init()
}
