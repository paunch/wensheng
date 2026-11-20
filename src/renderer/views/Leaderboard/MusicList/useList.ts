import { ref, computed } from '@common/utils/vueTools'
// import { useI18n } from '@renderer/plugins/i18n'
// import { } from '@renderer/store/search/state'
import { getAndSetListDetail } from '@renderer/store/leaderboard/action'
import { listDetailInfo, boards } from '@renderer/store/leaderboard/state'
import { playSongListDetail } from '../action'

export default () => {
  const listRef = ref<any>(null)

  // 榜单详情顶部横幅：榜单名 + 第一首歌封面
  const boardBanner = computed(() => {
    const id = listDetailInfo.id
    if (!id) return null
    const source = id.split('__')[0]
    const board = (boards as any)[source]?.list?.find((b: any) => b.id === id)
    const pic = listDetailInfo.list?.[0]?.meta?.picUrl || ''
    return {
      name: board?.name || '排行榜',
      pic,
      count: listDetailInfo.total || listDetailInfo.list?.length || 0,
    }
  })

  const handlePlayList = (index: number) => {
    void playSongListDetail(listDetailInfo.id, listDetailInfo.list, index)
  }

  const getList = (id: string, page: number) => {
    void getAndSetListDetail(id, page).then(() => {
      setTimeout(() => {
        if (listRef.value) listRef.value.scrollToTop()
      })
    })
  }

  return {
    listRef,
    listDetailInfo,
    boardBanner,
    getList,
    handlePlayList,
  }
}
