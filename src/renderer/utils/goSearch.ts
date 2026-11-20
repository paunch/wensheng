type Router = {
  push: (location: { path: string, query: { text: string } }) => Promise<unknown>
}

/**
 * 跳转到搜索页并搜索指定关键词（供歌手/专辑点击使用）
 * @param router 从 useRouter() 获取的实例（需在 setup 中调用）
 * @param text 搜索关键词
 */
export const goSearch = (router: Router, text: string): void => {
  const value = (text ?? '').trim()
  if (!value) return
  void router.push({
    path: '/search',
    query: { text: value },
  }).catch(_ => _)
}
