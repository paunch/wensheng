/**
 * 发现音乐 - 个性化推荐 API
 *
 * 网易云接口参考：github.com/Binaryify/NeteaseCloudMusicApi
 *   - recommend_songs:   POST /api/v3/discovery/recommend/songs  (weapi)
 *   - recommend_resource:POST /weapi/v1/discovery/recommend/resource (weapi)
 *   - login_refresh:     POST /weapi/login/token/refresh (weapi)
 * QQ 音乐接口参考：github.com/ylw1997/qqmusic-api
 *   - GetRadarSong:      POST https://u.y.qq.com/cgi-bin/musicu.fcg
 *   - get_radio_track:   POST https://u.y.qq.com/cgi-bin/musicu.fcg
 *
 * 所有请求都复用项目内的 httpFetch 与 weapi 加密，带登录态 Cookie。
 */
import { httpFetch } from '@renderer/utils/request'
import { weapi } from '@renderer/utils/musicSdk/wy/utils/crypto'
import { formatPlayTime, formatPlayCount, sizeFormate } from '@renderer/utils/index'
import { formatSingerName } from '@renderer/utils/musicSdk/utils'
import { toNewMusicInfo } from '@common/utils/tools'
import { getAccountByPlatform, parseCookie, updateAccount } from '@renderer/utils/accounts'

const WY_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
const TX_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
const COMMON_UA = WY_UA

// ==================== 网易云音乐 ====================

/** 构造网易 weapi 请求参数 */
const wyRequest = async(url, data, cookie) => {
  const form = weapi(data || {})
  const { body } = await httpFetch(url, {
    method: 'post',
    headers: {
      'User-Agent': WY_UA,
      Referer: 'https://music.163.com/',
      Origin: 'https://music.163.com',
      Cookie: cookie || '',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    form,
  }).promise
  return body
}

/** 格式化网易歌曲为项目标准音乐对象 */
const formatWySong = (item) => {
  const types = []
  const _types = {}
  const addType = (type, size) => {
    if (!types.some(t => t.type === type)) types.push({ type, size })
    _types[type] = { size }
  }
  if (item.hr) addType('flac24bit', sizeFormate(item.hr.size))
  if (item.h) addType('flac', sizeFormate(item.h.size))
  if (item.h && item.h.br >= 320000) addType('320k', sizeFormate(item.h.size))
  if (item.l) addType('128k', sizeFormate(item.l.size))
  types.reverse()
  return toNewMusicInfo({
    singer: formatSingerName(item.ar, 'name'),
    name: item.name ?? '',
    albumName: item.al?.name,
    albumId: item.al?.id,
    source: 'wy',
    interval: formatPlayTime((item.dt ?? 0) / 1000),
    songmid: item.id,
    img: item.al?.picUrl ?? '',
    lrc: null,
    otherSource: null,
    types,
    _types,
    typeUrl: {},
  })
}

/** 获取网易每日推荐歌曲 */
export const getWyDailySongs = async(cookie) => {
  const body = await wyRequest('https://music.163.com/api/v3/discovery/recommend/songs', {}, cookie)
  if (!body || body.code !== 200) throw new Error(body?.msg || '获取网易每日推荐失败，请检查登录状态')
  const list = (body.data?.dailySongs || []).map(formatWySong).filter(Boolean)
  return { list, updateTime: body.data?.updateTime || Date.now() }
}

/** 获取网易每日推荐歌单 */
export const getWyDailyPlaylists = async(cookie) => {
  const body = await wyRequest('https://music.163.com/weapi/v1/discovery/recommend/resource', {}, cookie)
  if (!body || body.code !== 200) throw new Error(body?.msg || '获取网易推荐歌单失败，请检查登录状态')
  const list = (body.recommend || []).map(item => ({
    id: String(item.id),
    name: item.name ?? '',
    author: item.creator?.nickname ?? '',
    play_count: formatPlayCount(item.playCount ?? 0),
    img: item.coverImgUrl ?? '',
    desc: item.copywriter ?? null,
    source: 'wy',
    total: item.trackCount,
    // 带 ### 的 id 可被内置 songList SDK 识别为带 cookie 的特殊歌单
    detailId: item.id,
  }))
  return { list }
}

/**
 * 续期网易 Cookie（token refresh）
 * 网易 refresh 依赖 MUSIC_R_T，成功后返回新的 MUSIC_U 并更新账号
 */
export const refreshWyCookie = async() => {
  const account = getAccountByPlatform('wy')
  if (!account || !account.cookie) return false
  const cookies = parseCookie(account.cookie)
  if (!cookies.MUSIC_U) return false

  try {
    const body = await wyRequest('https://music.163.com/weapi/login/token/refresh', {}, account.cookie)
    if (body?.code === 200 && Array.isArray(body.cookie)) {
      // 用新 Cookie 覆盖旧的关键字段
      const newCookies = {}
      for (const item of body.cookie) newCookies[item.name || item.key] = item.value
      const merged = { ...cookies, ...newCookies }
      const cookieString = Object.entries(merged).map(([k, v]) => `${k}=${v}`).join('; ')
      updateAccount(account.id, { cookie: cookieString, updatedAt: Date.now(), status: 'ok' })
      return true
    }
    // 没有 MUSIC_R_T 或 refresh 失败：若仍可正常请求则视为有效
    const check = await wyRequest('https://music.163.com/w/nuser/account/get', {}, account.cookie)
    const ok = check?.code === 200
    updateAccount(account.id, { updatedAt: Date.now(), status: ok ? 'ok' : 'expired' })
    return ok
  } catch (_) {
    return false
  }
}

// ==================== QQ 音乐 ====================

/** QQ musicu.fcg 请求封装 */
const txRequest = async(param, cookie, comm = {}) => {
  const body = {
    comm: {
      cv: 13020508,
      v: 13020508,
      ct: '11',
      tmeAppID: 'qqmusic',
      format: 'json',
      inCharset: 'utf-8',
      outCharset: 'utf-8',
      ...comm,
    },
    ...param,
  }
  const headers = {
    'User-Agent': TX_UA,
    Referer: 'https://y.qq.com/',
    Origin: 'https://y.qq.com',
    'Content-Type': 'application/json',
  }
  if (cookie) headers.Cookie = cookie
  const { body: resp } = await httpFetch('https://u.y.qq.com/cgi-bin/musicu.fcg', {
    method: 'post',
    headers,
    body,
  }).promise
  return resp
}

/** 从 QQ 账号 Cookie 提取登录态参数，构造 comm 字段 */
const getTxComm = (account) => {
  if (!account) return {}
  const cookies = parseCookie(account.cookie)
  const uin = cookies.uin || ''
  const key = cookies.qm_keyst || cookies.qqmusic_key || ''
  if (!uin || !key) return {}
  return {
    uid: uin,
    qq: uin,
    authst: key,
    loginUin: uin,
    tmeLoginType: key.startsWith('W_X') ? '1' : '2',
  }
}

/** 格式化 QQ 歌曲为项目标准音乐对象 */
const formatTxSong = (item) => {
  const mid = item.mid || item.songmid || ''
  const singer = (item.singer || []).map(s => s.name).join('、')
  const albumName = item.album?.name || item.albumname || ''
  const interval = item.interval ? formatPlayTime(item.interval) : ''
  const picUrl = mid ? `https://y.qq.com/music/photo_new/T002R300x300M000${mid}.jpg` : ''
  return toNewMusicInfo({
    singer,
    name: item.title || item.name || '',
    albumName,
    albumId: item.album?.mid || '',
    source: 'tx',
    interval,
    songmid: mid,
    img: picUrl,
    lrc: null,
    otherSource: null,
    types: [],
    _types: {},
    typeUrl: {},
    strMediaMid: item.media_mid || '',
  })
}

/** 获取 QQ 雷达推荐歌曲 */
export const getTxRadarSongs = async(account) => {
  // 雷达接口每页固定 5 首，翻页累积到 30 首
  const TARGET = 30
  const list = []
  const seen = new Set()
  for (let page = 1; page <= Math.ceil(TARGET / 5) && list.length < TARGET; page++) {
    const resp = await txRequest({
      'music.recommend.TrackRelationServer': {
        module: 'music.recommend.TrackRelationServer',
        method: 'GetRadarSong',
        param: { Page: page, ReqType: 0, FavSongs: [], EntranceSongs: [] },
      },
    }, account?.cookie, getTxComm(account))
    const data = resp?.['music.recommend.TrackRelationServer']?.data
    if (!data) {
      if (page === 1) throw new Error('获取 QQ 雷达推荐失败')
      break
    }
    // QQ 接口新版返回 VecSongs（元素为 { Track: {...} }），旧版为 songList/tracks/list
    const raw = data.VecSongs || data.songList || data.tracks || data.list || []
    for (const item of raw) {
      const song = formatTxSong(item.Track || item)
      if (!song || seen.has(song.id)) continue
      seen.add(song.id)
      list.push(song)
      if (list.length >= TARGET) break
    }
    if (!raw.length || !data.HasMore) break
  }
  return { list }
}

/** 获取 QQ 猜你喜欢歌曲 */
export const getTxGuessSongs = async(account) => {
  const resp = await txRequest({
    'music.radioProxy.MbTrackRadioSvr': {
      module: 'music.radioProxy.MbTrackRadioSvr',
      method: 'get_radio_track',
      param: { id: 99, num: 30, from: 0, scene: 0, song_ids: [], ext: { bluetooth: '' }, should_count_down: 1 },
    },
  }, account?.cookie, getTxComm(account))
  const data = resp?.['music.radioProxy.MbTrackRadioSvr']?.data
  if (!data) throw new Error('获取 QQ 猜你喜欢失败')
  const raw = data.tracks || data.songList || data.list || []
  return { list: raw.map(formatTxSong).filter(Boolean) }
}

/** 获取 QQ 推荐歌单 */
export const getTxDailyPlaylists = async(account) => {
  const resp = await txRequest({
    'music.playlist.PlaylistSquare.GetRecommendFeed': {
      module: 'music.playlist.PlaylistSquare.GetRecommendFeed',
      method: 'GetRecommendFeed',
      param: { Page: 1, Size: 30 },
    },
  }, account?.cookie, getTxComm(account))
  const data = resp?.['music.playlist.PlaylistSquare.GetRecommendFeed']?.data
  if (!data) throw new Error('获取 QQ 推荐歌单失败')
  const list = (data.List || []).map(item => {
    const basic = item.Playlist?.basic || item.basic || {}
    return {
      id: String(basic.tid || basic.id || ''),
      name: basic.title || basic.name || '',
      author: basic.creator?.nick || basic.nick || '',
      play_count: formatPlayCount(basic.playCount || 0),
      img: basic.cover?.url || basic.coverUrl || basic.img || '',
      desc: basic.desc || null,
      source: 'tx',
      total: basic.songCount || basic.total,
      detailId: basic.tid || basic.id,
    }
  }).filter(item => item.id)
  return { list }
}

/** 检测并更新 QQ 登录态（无续期接口，仅做可用性验证） */
export const checkTxCookie = async() => {
  const account = getAccountByPlatform('tx')
  if (!account || !account.cookie) return false
  try {
    const resp = await txRequest({
      'music.UserInfo.userInfoServer': {
        module: 'music.UserInfo.userInfoServer',
        method: 'GetLoginUserInfo',
        param: {},
      },
    }, account.cookie, getTxComm(account))
    const code = resp?.['music.UserInfo.userInfoServer']?.code
    const ok = code === 0
    updateAccount(account.id, { updatedAt: Date.now(), status: ok ? 'ok' : 'expired' })
    return ok
  } catch (_) {
    return false
  }
}

/**
 * 把红心（喜欢/取消喜欢）同步到歌曲所属平台
 * 失败不影响本地收藏，仅返回 false。
 * @param {LX.Music.MusicInfoOnline} musicInfo 歌曲信息
 * @param {boolean} isLike true=收藏 false=取消收藏
 */
export const syncLikeToPlatform = async(musicInfo, isLike) => {
  if (!musicInfo || !musicInfo.source) return false
  const source = musicInfo.source
  const account = getAccountByPlatform(source)
  if (!account || !account.cookie) return false
  const songId = musicInfo.meta?.songId
  if (!songId) return false

  try {
    if (source === 'wy') {
      const body = await wyRequest('https://music.163.com/weapi/song/like', {
        songId,
        trackId: songId,
        like: isLike ? 'true' : 'false',
      }, account.cookie)
      return body?.code === 200
    }
    if (source === 'tx') {
      // QQ 音乐：通过 musicu.fcg 操作“我喜欢”（dirid 201）
      const mid = musicInfo.meta?.songId || musicInfo.id?.replace(/^tx_/, '')
      const resp = await txRequest({
        'music.srfDissInfo.DissInfo': {
          module: 'music.srfDissInfo.DissInfo',
          method: isLike ? 'CgiAddDissSong' : 'CgiDelDissSong',
          param: {
            disstid: 0,
            dirid: 201,
            songmid: [mid],
          },
        },
      }, account.cookie, getTxComm(account))
      return resp?.['music.srfDissInfo.DissInfo']?.code === 0
    }
  } catch (_) {
    return false
  }
  return false
}

/**
 * 获取账号昵称（用于设置页展示）
 */
export const fetchAccountNickname = async(platform, cookie) => {
  if (platform === 'wy') {
    const body = await wyRequest('https://music.163.com/w/nuser/account/get', {}, cookie)
    return body?.profile?.nickname || ''
  }
  if (platform === 'tx') {
    const account = getAccountByPlatform('tx')
    const resp = await txRequest({
      'music.UserInfo.userInfoServer': {
        module: 'music.UserInfo.userInfoServer',
        method: 'GetLoginUserInfo',
        param: {},
      },
    }, cookie, getTxComm(account))
    const info = resp?.['music.UserInfo.userInfoServer']?.data || {}
    return info.nick || info.nickname || ''
  }
  if (platform === 'kg') {
    // 酷狗网页用户信息：/v1/user/getinfo 返回 nickname / userid
    const { body } = await httpFetch('https://www.kugou.com/yy/index.php?r=play/getdata', {
      method: 'get',
      headers: { 'User-Agent': COMMON_UA, Referer: 'https://www.kugou.com/', Cookie: cookie || '' },
    }).promise
    try {
      const json = typeof body === 'string' ? JSON.parse(body) : body
      return json?.data?.nickname || ''
    } catch (_) { return '' }
  }
  if (platform === 'kw') {
    // 酷我网页用户信息：/web/v1/user/info
    const { body } = await httpFetch('https://www.kuwo.cn/api/www/user/info', {
      method: 'get',
      headers: { 'User-Agent': COMMON_UA, Referer: 'https://www.kuwo.cn/', Cookie: cookie || '', csrf: parseCookie(cookie).kw_token || '' },
    }).promise
    try {
      const json = typeof body === 'string' ? JSON.parse(body) : body
      return json?.data?.nickname || json?.data?.name || ''
    } catch (_) { return '' }
  }
  return ''
}

/**
 * 通用账号可用性校验（酷狗/酷我）：以登录后专属 Cookie 字段是否存在判断，
 * 比服务端接口更稳（这两个平台的网页接口变动频繁）。
 */
export const checkAccountCookie = async(platform) => {
  const account = getAccountByPlatform(platform)
  if (!account || !account.cookie) return false
  const markerMap = {
    kg: ['token', 'userid'],
    kw: ['loginSid', 'loginUid'],
  }
  const keys = markerMap[platform] || []
  const ok = keys.length > 0 && keys.every(k => new RegExp(`(^|;\\s*)${k}=`).test(account.cookie))
  updateAccount(account.id, { updatedAt: Date.now(), status: ok ? 'ok' : 'expired' })
  return ok
}

// ==================== 聚合入口 ====================

/**
 * 获取推荐数据
 * @param {'all'|'wy'|'tx'} platform 平台
 * @param {'playlist'|'music'} view 视图
 */
export const getDiscoverData = async(platform, view) => {
  const result = { wy: null, tx: null, errors: [] }
  const tasks = []

  if (platform === 'all' || platform === 'wy') {
    const wyAccount = getAccountByPlatform('wy')
    if (wyAccount?.cookie) {
      tasks.push(
        (view === 'music' ? getWyDailySongs(wyAccount.cookie) : getWyDailyPlaylists(wyAccount.cookie))
          .then(data => { result.wy = data })
          .catch(err => { result.errors.push({ platform: 'wy', message: err.message || String(err) }) }),
      )
    }
  }

  if (platform === 'all' || platform === 'tx') {
    const txAccount = getAccountByPlatform('tx')
    if (txAccount?.cookie) {
      tasks.push(
        (view === 'music' ? getTxRadarSongs(txAccount) : getTxDailyPlaylists(txAccount))
          .then(data => { result.tx = data })
          .catch(err => { result.errors.push({ platform: 'tx', message: err.message || String(err) }) }),
      )
    }
  }

  await Promise.all(tasks)
  return result
}
