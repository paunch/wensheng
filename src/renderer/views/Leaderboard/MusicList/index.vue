<template>
  <div :class="$style.container">
    <div v-if="boardBanner" :class="$style.banner">
      <img v-if="boardBanner?.pic" :src="boardBanner?.pic" :class="$style.bannerCover" alt="">
      <div v-else :class="[$style.bannerCover, $style.bannerPlaceholder]">♪</div>
      <div :class="$style.bannerInfo">
        <h2>{{ boardBanner?.name }}</h2>
        <span>{{ boardBanner?.count }} 首歌曲</span>
      </div>
    </div>
    <div :class="$style.listWrap">
      <material-online-list
        ref="listRef"
        :page="listDetailInfo.page"
        :limit="listDetailInfo.limit"
        :total="listDetailInfo.total"
        :list="listDetailInfo.list"
        :no-item="listDetailInfo.noItemLabel"
        @show-menu="hideListsMenu"
        @play-list="handlePlayList"
        @toggle-page="togglePage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from '@common/utils/vueTools'
import useList from './useList'


const props = defineProps<{
  source: LX.OnlineSource
  boardId?: string
}>()

const emit = defineEmits(['show-menu'])

const {
  listRef,
  listDetailInfo,
  boardBanner,
  getList,
  handlePlayList,
} = useList()

watch(() => props.boardId, (boardId) => {
  if (!boardId) return
  getList(boardId, 1)
}, {
  immediate: true,
})


const hideListsMenu = () => {
  emit('show-menu')
}

const togglePage = (page: number) => {
  getList(listDetailInfo.id, page)
}

const hideMenu = () => {
  listRef.value?.handleMenuClick()
}

defineExpose({ hideMenu })


</script>


<style lang="less" module>
.container {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
}
.banner {
  flex: none;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--color-primary-alpha-900);
}
.bannerCover {
  width: 84px;
  height: 84px;
  border-radius: 12px;
  object-fit: cover;
  flex: none;
  box-shadow: 0 6px 18px rgba(0,0,0,.18);
}
.bannerPlaceholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34px;
  color: #fff;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark-100));
}
.bannerInfo {
  h2 {
    font-size: 20px;
    font-weight: 500;
    margin: 0 0 6px;
  }
  span {
    font-size: 13px;
    color: var(--color-font-label);
  }
}
.listWrap {
  flex: auto;
  min-height: 0;
  position: relative;
}

</style>
