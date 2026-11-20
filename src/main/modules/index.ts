import registerUserApi from './userApi'
import registerWinMain from './winMain'
import registerHotKey from './hotKey'
import registerTray from './tray'
import registerAppMenu from './appMenu'
import registerWinLyric from './winLyric'
import registerCommonRenderers from './commonRenderers'
import registerLogin from './login'

let isRegistered = false
export default () => {
  if (isRegistered) return
  registerUserApi()
  registerCommonRenderers()
  registerLogin()
  registerWinMain()
  registerHotKey()
  registerTray()
  registerAppMenu()
  registerWinLyric()
  isRegistered = true
}
