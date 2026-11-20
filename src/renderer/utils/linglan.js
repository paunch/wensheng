import { httpFetch } from '@renderer/utils/request'

// 聆澜音源在线脚本地址（极速版 / 兼容版 / 备用）
// 卡密通过 key 参数传入，脚本由服务端动态生成，音源更新后无需重新导入，
// 只需在软件启动时用保存的 KEY 重新拉取即可自动续期。
const LINGLAN_URLS = [
  'https://source.shiqianjiang.cn/api/script/lx',
  'https://lc.guoyue2010.top/script/lx',
  'https://lx.xiagua.top/script/lx',
]

const requestScript = (baseUrl, key, retry = 0) => {
  return httpFetch(`${baseUrl}?key=${encodeURIComponent(key)}`, { follow_max: 3 }).promise.then(resp => {
    const body = resp.body
    if (!body || typeof body !== 'string' || body.length < 100) throw new Error('返回的音源脚本为空')
    if (body.length > 9_000_000) throw new Error('音源脚本过大')
    return body
  }).catch(err => {
    if (retry + 1 >= LINGLAN_URLS.length) throw err
    return requestScript(LINGLAN_URLS[retry + 1], key, retry + 1)
  })
}

/**
 * 根据卡密拉取聆澜音源脚本，逐个备用地址尝试
 */
export const fetchLinglanSource = (key) => {
  const k = (key ?? '').trim()
  if (!k) return Promise.reject(new Error('KEY 不能为空'))
  return requestScript(LINGLAN_URLS[0], k)
}
