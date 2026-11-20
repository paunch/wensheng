/**
 * 轻量 WebDAV 客户端
 * 用于「闻声」的云盘同步功能，仅依赖 Node 内置模块，无需额外依赖。
 * 支持 Basic Auth、HTTPS、PROPFIND / MKCOL / PUT / GET / DELETE。
 */

import http from 'node:http'
import https from 'node:https'
import { URL } from 'node:url'

export interface WebDavConfig {
  url: string
  username: string
  password: string
  remoteDir: string
}

export interface WebDavResult {
  ok: boolean
  status?: number
  message?: string
}

const normalizeDir = (dir: string): string => {
  if (!dir) return ''
  let d = dir.trim().replace(/\\/g, '/')
  if (!d.startsWith('/')) d = '/' + d
  if (d.length > 1 && d.endsWith('/')) d = d.slice(0, -1)
  return d
}

/** 将 WebDAV 根地址与相对目录、文件名拼接为完整 URL */
const buildUrl = (config: WebDavConfig, fileName?: string): string => {
  const base = config.url.trim().replace(/\/+$/, '')
  const url = new URL(base)
  const dir = normalizeDir(config.remoteDir)
  let pathname = url.pathname.replace(/\/+$/, '') + dir
  if (fileName) pathname += '/' + encodeURIComponent(fileName)
  url.pathname = pathname || '/'
  return url.toString()
}

const authHeader = (config: WebDavConfig): string => {
  const token = Buffer.from(`${config.username}:${config.password}`).toString('base64')
  return `Basic ${token}`
}

interface RequestOptions {
  method: string
  url: string
  config: WebDavConfig
  body?: Buffer | string
  headers?: Record<string, string>
  timeout?: number
}

const request = (options: RequestOptions): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: Buffer }> => {
  const { method, url, config, body, headers = {}, timeout = 30000 } = options
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const isHttps = parsed.protocol === 'https:'
    const transport = isHttps ? https : http
    const payload = body == null ? null : Buffer.isBuffer(body) ? body : Buffer.from(body)

    const req = transport.request({
      method,
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port || undefined,
      path: parsed.pathname + parsed.search,
      headers: {
        Authorization: authHeader(config),
        ...(payload ? { 'Content-Length': payload.length } : {}),
        ...headers,
      },
      // 允许使用自签名证书的私有云盘/NAS
      rejectUnauthorized: false,
    }, res => {
      const chunks: Buffer[] = []
      res.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)))
      res.on('end', () => resolve({
        status: res.statusCode ?? 0,
        headers: res.headers,
        body: Buffer.concat(chunks),
      }))
    })

    req.setTimeout(timeout, () => {
      req.destroy(new Error('请求超时，请检查网络或服务器地址'))
    })
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

/** 测试 WebDAV 连接：向根目录发送 PROPFIND，2xx/3xx 视为成功 */
export const webdavTestConnection = async(config: WebDavConfig): Promise<WebDavResult> => {
  try {
    if (!config.url) return { ok: false, message: '请先填写 WebDAV 服务地址' }
    const res = await request({
      method: 'PROPFIND',
      url: buildUrl(config),
      config,
      headers: { Depth: '0' },
      timeout: 15000,
    })
    if (res.status >= 200 && res.status < 400) {
      return { ok: true, status: res.status, message: '连接成功' }
    }
    if (res.status === 401) return { ok: false, status: 401, message: '用户名或密码错误' }
    if (res.status === 404) return { ok: false, status: 404, message: '路径不存在，请检查服务地址和目录' }
    return { ok: false, status: res.status, message: `连接失败（HTTP ${res.status}）` }
  } catch (err) {
    return { ok: false, message: `连接失败：${(err as Error).message}` }
  }
}

/** 确保远程目录存在（逐层 MKCOL，忽略已存在的 405） */
const ensureRemoteDir = async(config: WebDavConfig): Promise<void> => {
  const base = config.url.trim().replace(/\/+$/, '')
  const parsed = new URL(base)
  const dir = normalizeDir(config.remoteDir)
  const segments = dir.split('/').filter(Boolean)

  let current = parsed.pathname.replace(/\/+$/, '')
  for (const segment of segments) {
    current += '/' + encodeURIComponent(segment)
    parsed.pathname = current || '/'
    const res = await request({ method: 'MKCOL', url: parsed.toString(), config })
    // 2xx 成功，405 表示目录已存在，其余忽略继续尝试
    if (res.status >= 400 && res.status !== 405) {
      // 某些服务对已存在目录返回 409/403，也视为可继续
      if (res.status !== 409 && res.status !== 403) {
        throw new Error(`创建远程目录失败（HTTP ${res.status}）`)
      }
    }
  }
}

/** 上传备份文件（内容为已 gzip 的二进制 Buffer） */
export const webdavUpload = async(config: WebDavConfig, fileName: string, data: Buffer): Promise<WebDavResult> => {
  try {
    if (!config.url) return { ok: false, message: '请先填写 WebDAV 服务地址' }
    await ensureRemoteDir(config)
    const res = await request({
      method: 'PUT',
      url: buildUrl(config, fileName),
      config,
      body: data,
      headers: { 'Content-Type': 'application/octet-stream' },
      timeout: 60000,
    })
    if (res.status >= 200 && res.status < 300) {
      return { ok: true, status: res.status, message: '上传成功' }
    }
    if (res.status === 401) return { ok: false, status: 401, message: '用户名或密码错误' }
    return { ok: false, status: res.status, message: `上传失败（HTTP ${res.status}）` }
  } catch (err) {
    return { ok: false, message: `上传失败：${(err as Error).message}` }
  }
}

/** 下载备份文件，返回二进制 Buffer */
export const webdavDownload = async(config: WebDavConfig, fileName: string): Promise<{ ok: boolean; data?: Buffer; message?: string }> => {
  try {
    if (!config.url) return { ok: false, message: '请先填写 WebDAV 服务地址' }
    const res = await request({
      method: 'GET',
      url: buildUrl(config, fileName),
      config,
      timeout: 60000,
    })
    if (res.status >= 200 && res.status < 300) {
      return { ok: true, data: res.body }
    }
    if (res.status === 401) return { ok: false, message: '用户名或密码错误' }
    if (res.status === 404) return { ok: false, message: '云端暂无备份文件' }
    return { ok: false, message: `下载失败（HTTP ${res.status}）` }
  } catch (err) {
    return { ok: false, message: `下载失败：${(err as Error).message}` }
  }
}

/** 删除云端备份文件 */
export const webdavDelete = async(config: WebDavConfig, fileName: string): Promise<WebDavResult> => {
  try {
    if (!config.url) return { ok: false, message: '请先填写 WebDAV 服务地址' }
    const res = await request({ method: 'DELETE', url: buildUrl(config, fileName), config })
    if (res.status >= 200 && res.status < 300) return { ok: true, message: '删除成功' }
    if (res.status === 404) return { ok: true, message: '文件本就不存在' }
    return { ok: false, status: res.status, message: `删除失败（HTTP ${res.status}）` }
  } catch (err) {
    return { ok: false, message: `删除失败：${(err as Error).message}` }
  }
}

/** 列出远程目录中的备份文件（解析 PROPFIND XML 中的 <d:href>） */
export const webdavList = async(config: WebDavConfig): Promise<{ ok: boolean; files?: { name: string; size: number; modified: string }[]; message?: string }> => {
  try {
    if (!config.url) return { ok: false, message: '请先填写 WebDAV 服务地址' }
    const res = await request({
      method: 'PROPFIND',
      url: buildUrl(config),
      config,
      headers: { Depth: '1' },
      timeout: 30000,
    })
    if (res.status < 200 || res.status >= 400) {
      if (res.status === 404) return { ok: true, files: [] }
      return { ok: false, message: `获取列表失败（HTTP ${res.status}）` }
    }
    const xml = res.body.toString('utf8')
    const files: { name: string; size: number; modified: string }[] = []
    const hrefRegex = /<[dD]:?href[^>]*>([\s\S]*?)<\/[dD]:?href>/g
    const sizeRegex = /<[dD]:?getcontentlength[^>]*>([\s\S]*?)<\/[dD]:?getcontentlength>/g
    const modRegex = /<[dD]:?getlastmodified[^>]*>([\s\S]*?)<\/[dD]:?getlastmodified>/g
    const hrefs = Array.from(xml.matchAll(hrefRegex)).map(m => decodeURIComponent(m[1]))
    const sizes = Array.from(xml.matchAll(sizeRegex)).map(m => parseInt(m[1], 10) || 0)
    const mods = Array.from(xml.matchAll(modRegex)).map(m => m[1])
    hrefs.forEach((href, index) => {
      if (!href.endsWith('.lxmc')) return
      const name = href.split('/').pop() ?? ''
      files.push({ name, size: sizes[index] ?? 0, modified: mods[index] ?? '' })
    })
    return { ok: true, files }
  } catch (err) {
    return { ok: false, message: `获取列表失败：${(err as Error).message}` }
  }
}
