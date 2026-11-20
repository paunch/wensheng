<template>
  <ul ref="dom_lists_list" class="scroll" :class="$style.listsContent">
    <li
      v-for="(item, index) in list"
      :key="item.id" :class="[$style.listsItem, { [$style.active]: item.id == boardId }, { [$style.clicked]: rightClickItemIndex == index }]"
      :aria-label="item.name" @click="handleToggleList(item.id)" @contextmenu="handleRigthClick($event, index)"
    >
      <div :class="$style.cover">
        <img v-if="item.img" :src="item.img" loading="lazy" decoding="async" alt="">
        <div v-else :class="$style.coverPlaceholder"><svg-icon name="music" /></div>
      </div>
      <span :class="$style.listsLabel">{{ item.name }}</span>
    </li>
  </ul>
  <base-menu
    v-model="isShowMenu"
    :menus="menus"
    :xy="menuLocation"
    item-name="name"
    @menu-click="handleMenuClick"
  />
</template>

<script setup>
import { watch, shallowReactive, ref } from '@common/utils/vueTools'
import { getBoardsList, setBoard, loadBoardCover } from '@renderer/store/leaderboard/action'
import { boards } from '@renderer/store/leaderboard/state'
import useMenu from './useMenu'
import { useRouter, useRoute } from '@common/utils/vueRouter'

const props = defineProps({
  source: {
    type: String,
    required: true,
  },
  boardId: {
    type: [String, undefined],
    default: undefined,
  },
})

const emit = defineEmits(['show-menu'])

const router = useRouter()
const route = useRoute()

const list = shallowReactive([])
const rightClickItemIndex = ref(-1)

const handleToggleList = (id) => {
  void router.replace({
    path: route.path,
    query: {
      source: props.source,
      boardId: id,
    },
  })
}

const {
  menus,
  menuLocation,
  isShowMenu,
  showMenu,
  menuClick,
} = useMenu({ emit, list })

const handleRigthClick = (event, index) => {
  rightClickItemIndex.value = index
  showMenu(event, index)
}
const handleMenuClick = (action) => {
  if (rightClickItemIndex.value < 0) return
  let index = rightClickItemIndex.value
  rightClickItemIndex.value = -1
  menuClick(action, index, props.source)
}


watch(() => props.source, async(source) => {
  // const source = (await getLeaderboardSetting()).source as LX.OnlineSource
  let boardList = boards[source]
  if (boardList == null) setBoard(boardList = await getBoardsList(source), source)
  list.splice(0, list.length, ...boardList.list)
  // 懒加载榜单封面（取第一首歌封面），不阻塞列表显示
  for (const board of boardList.list) loadBoardCover(board)
  if (!props.boardId && boardList.list.length) handleToggleList(boardList.list[0].id)
}, {
  immediate: true,
})

defineExpose({ hideMenu: handleMenuClick })

</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.listsContent {
  flex: auto;
  min-width: 0;
  overflow-y: scroll;
  padding: 4px 6px;
  display: flex;
  flex-flow: column nowrap;
  gap: 6px;
}
.listsItem {
  position: relative;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 6px;
  border-radius: 10px;
  border: 1px solid transparent;
  transition: .25s ease;
  transition-property: color, background-color, border-color, transform;
  background-color: transparent;
  cursor: pointer;
  &:hover:not(.active) {
    background-color: var(--color-primary-light-400-alpha-700);
    transform: translateX(2px);
  }
  &.active {
    background-color: var(--color-primary-light-300-alpha-700);
    border-color: var(--color-primary-alpha-500);
    color: var(--color-primary);
  }
  &.selected {
    background-color: var(--color-primary-font-active);
  }
  &.clicked {
    background-color: var(--color-primary-background-hover);
  }
  &.editing {
    .listsLabel {
      display: none;
    }
    .listsInput {
      display: block;
    }
  }
}
.cover {
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--color-primary-light-900-alpha-200);
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}
.coverPlaceholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary-light-400-alpha-200);
  :global(svg) {
    width: 55%;
    height: 55%;
  }
}
.listsLabel {
  flex: auto;
  min-width: 0;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  .mixin-ellipsis-1();
}


</style>

