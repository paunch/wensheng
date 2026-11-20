import { tranditionalize } from '@renderer/utils/simplify-chinese-main'

export const langS2t = (textBase64: string): string => {
  const text = tranditionalize(Buffer.from(textBase64, 'base64').toString())
  return Buffer.from(text).toString('base64')
}

export {
  saveLxConfigFile,
  readLxConfigFile,
  saveStrToFile,
  gzipString,
  gunzipToString,
} from '@common/utils/nodejs'

export {
  webdavTestConnection,
  webdavUpload,
  webdavDownload,
  webdavDelete,
  webdavList,
  type WebDavConfig,
  type WebDavResult,
} from '@common/utils/webdav'
