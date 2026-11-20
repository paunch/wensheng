<template>
  <div :class="$style.container">
    <div :class="$style.header">
      <div :class="$style.tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="[$style.tab, { [$style.active]: current == tab.id }]"
          @click="handleTab(tab.id)"
        >{{ tab.name }}</button>
      </div>
    </div>
    <div :class="$style.body">
      <router-view />
    </div>
  </div>
</template>

<script>
import { computed } from '@common/utils/vueTools'
import { useRouter, useRoute } from '@common/utils/vueRouter'

const TABS = [
  { id: 'recommend', name: '推荐' },
  { id: 'songlist', name: '歌单' },
  { id: 'leaderboard', name: '排行榜' },
]

export default {
  name: 'MusicHall',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const current = computed(() => {
      const seg = (route.path || '').split('/')[2]
      return TABS.some(t => t.id == seg) ? seg : 'recommend'
    })
    const handleTab = (id) => {
      if (current.value == id) return
      void router.replace({ path: `/musicHall/${id}` })
    }
    return { tabs: TABS, current, handleTab }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.container {
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
}
.header {
  flex: none;
  padding: 10px 20px 8px;
}
.tabs {
  display: flex;
  gap: 8px;
}
.tab {
  border: none;
  background: transparent;
  color: var(--color-font);
  font-size: 14px;
  padding: 7px 20px;
  border-radius: 10px;
  cursor: pointer;
  transition: background @transition-fast, color @transition-fast;
  &:hover {
    background: var(--color-primary-alpha-900);
  }
  &.active {
    background: var(--color-primary);
    color: #fff;
  }
}
.body {
  flex: auto;
  min-height: 0;
  position: relative;
}
</style>
