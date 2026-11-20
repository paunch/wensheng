import { mainHandle } from '@common/mainIpc'
import { LOGIN_RENDERER_EVENT_NAME } from '@common/ipcNames'
import { openLoginWindow as handleOpen, closeLoginWindow as handleClose } from './main'

export default () => {
  mainHandle<string, string | null>(
    LOGIN_RENDERER_EVENT_NAME.open,
    async({ params: platform }) => handleOpen(platform as 'wy' | 'tx' | 'kg' | 'kw'),
  )
  mainHandle(
    LOGIN_RENDERER_EVENT_NAME.close,
    async() => handleClose(),
  )
}
