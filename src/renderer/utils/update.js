import pkg from '../../../package.json'

// 闻声为二次开发项目，未搭建在线更新发布源。
// 为避免请求上游洛雪（LX Music）的版本地址，此处直接返回“当前已是最新版本”，
// 不发起任何网络请求。若日后配置了自有发布源，可在此处接入。
export const getVersionInfo = async() => {
  return {
    version: pkg.version,
    desc: '闻声暂无在线更新源，当前已是本地最新版本。',
    history: [],
  }
}
