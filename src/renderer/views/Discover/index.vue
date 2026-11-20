<template>
  <div :class="$style.container" class="view-enter">
    <div :class="$style.header">
      <div :class="$style.tabs">
        <button
          v-for="tab in platformTabs"
          :key="tab.id"
          :class="[$style.tab, { [$style.active]: platform === tab.id }]"
          @click="handlePlatform(tab.id)"
        >{{ tab.name }}</button>
      </div>
      <div :class="$style.right">
        <base-btn min outline :class="$style.refreshBtn" :disabled="loading" @click="loadData">刷新</base-btn>
      </div>
    </div>

    <div v-if="!hasAnyAccount" :class="$style.empty">
      <p>还没有登录任何音乐平台</p>
      <p :class="$style.emptyTip">点击下方按钮，在弹出的网页中登录，登录成功后会自动获取登录状态</p>
      <div :class="$style.loginBtns">
        <base-btn min :disabled="!!logging" @click="login('wy')">{{ logging === 'wy' ? '登录中…' : '登录网易云音乐' }}</base-btn>
        <base-btn min :disabled="!!logging" @click="login('tx')">{{ logging === 'tx' ? '登录中…' : '登录 QQ 音乐' }}</base-btn>
        <base-btn min :disabled="!!logging" @click="login('kg')">{{ logging === 'kg' ? '登录中…' : '登录酷狗音乐' }}</base-btn>
        <base-btn min :disabled="!!logging" @click="login('kw')">{{ logging === 'kw' ? '登录中…' : '登录酷我音乐' }}</base-btn>
      </div>
      <p v-if="loginMessage" :class="$style.loginMessage">{{ loginMessage }}</p>
    </div>

    <div v-else-if="loading" :class="$style.empty">
      <p>正在获取推荐…</p>
    </div>

    <div v-else ref="dom_scroll" :class="$style.scroll" class="scroll">
      <div v-if="errors.length" :class="$style.errors">
        <p v-for="(err, i) in errors" :key="i">{{ platformName(err.platform) }}：{{ err.message }}</p>
      </div>

      <section v-for="section in musicSections" :key="section.platform" :class="$style.section">
        <h3 :class="$style.sectionTitle">
          <span :class="[$style.dot, { [$style.tx]: section.platform === 'tx' }]" />
          {{ section.title }}
        </h3>
        <ul :class="$style.songList">
          <li
            v-for="(song, index) in section.list"
            :key="song.id"
            :class="$style.songItem"
            @dblclick="playSong(section.list, index)"
          >
            <span :class="$style.songNum">{{ index + 1 }}</span>
            <span :class="$style.songName">{{ song.name }}</span>
            <span :class="$style.songSinger" @click.stop="goSearch(song.singer)">{{ song.singer }}</span>
            <span :class="$style.songAlbum" @click.stop="goSearch(song.meta?.albumName)">{{ song.meta?.albumName }}</span>
            <span :class="$style.songTime">{{ song.interval }}</span>
          </li>
        </ul>
      </section>

      <div v-if="!hasData" :class="$style.noData">暂无推荐数据，试试点击刷新或检查账号登录状态</div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from '@common/utils/vueTools'
import { useRouter } from '@common/utils/vueRouter'
import { appSetting, updateSetting } from '@renderer/store/setting'
import { getAccounts, createAccount, saveAccounts } from '@renderer/utils/accounts'
import { getDiscoverData, fetchAccountNickname } from '@renderer/utils/discoverApi'
import { openLoginWindow } from '@renderer/utils/ipc'
import { setTempList } from '@renderer/store/list/action'
import { playList } from '@renderer/core/player/action'
import { LIST_IDS } from '@common/constants'
import { goSearch } from '@renderer/utils/goSearch'

const PLATFORM_TABS = [
  { id: 'all', name: '全部' },
  { id: 'wy', name: '网易云音乐' },
  { id: 'tx', name: 'QQ音乐' },
]

// 推荐数据缓存（组件卸载后仍保留，避免切 tab 回来重复刷新）
const cache = { data: { wy: null, tx: null }, loaded: false }

export default {
  name: 'Discover',
  setup() {
    const router = useRouter()
    const platform = ref(appSetting['discover.defaultPlatform'] || 'all')
    const loading = ref(false)
    const errors = ref([])
    // 模块级缓存：从排行榜切回推荐时复用已加载数据，避免重复请求
    const data = ref(cache.data)
    const dom_scroll = ref(null)

    const accounts = computed(() => getAccounts())
    const hasAnyAccount = computed(() => accounts.value.some(a => a.cookie))

    const platformTabs = PLATFORM_TABS
    const platformName = (id) => PLATFORM_TABS.find(t => t.id === id)?.name ?? id

    const musicSections = computed(() => {
      const result = []
      if ((platform.value === 'all' || platform.value === 'wy') && data.value.wy?.list?.length) {
        result.push({ platform: 'wy', title: '网易云音乐 · 每日推荐歌曲', list: data.value.wy.list })
      }
      if ((platform.value === 'all' || platform.value === 'tx') && data.value.tx?.list?.length) {
        result.push({ platform: 'tx', title: 'QQ音乐 · 雷达推荐歌曲', list: data.value.tx.list })
      }
      return result
    })

    const hasData = computed(() => musicSections.value.length > 0)

    const loadData = async() => {
      if (!hasAnyAccount.value) return
      loading.value = true
      errors.value = []
      try {
        // 始终拉取所有已登录平台的数据并缓存；切平台 tab 时只在本地筛选，不再重复请求
        const result = await getDiscoverData('all', 'music')
        data.value = { wy: result.wy, tx: result.tx }
        cache.data = data.value
        cache.loaded = true
        errors.value = result.errors || []
        if (dom_scroll.value) dom_scroll.value.scrollTop = 0
      } catch (err) {
        errors.value = [{ platform: '', message: err.message || '获取推荐失败' }]
      } finally {
        loading.value = false
      }
    }

    const handlePlatform = (id) => {
      if (platform.value === id) return
      platform.value = id
      updateSetting({ 'discover.defaultPlatform': id })
      // 仅切换本地筛选，数据已按 all 全量加载，无需重新请求
    }

    const playSong = async(list, index) => {
      if (!list?.length) return
      await setTempList('discover', [...list])
      playList(LIST_IDS.TEMP, index)
    }

    const logging = ref('')
    const loginMessage = ref('')
    // 渲染层诊断日志：定位"登录按钮点击无反应"
    const login = async(platformName) => {
      if (logging.value) return
      logging.value = platformName
      loginMessage.value = '已打开登录窗口，请在窗口中完成登录…'
      try {
        const cookie = await openLoginWindow(platformName)
        if (!cookie) {
          loginMessage.value = '未检测到登录状态，请重试或在设置页手动添加 Cookie'
          return
        }
        const account = createAccount({ platform: platformName, cookie, loginType: 'web' })
        const nickname = await fetchAccountNickname(platformName, cookie).catch(() => '')
        account.nickname = nickname || ''
        saveAccounts([...getAccounts().filter(a => a.platform !== platformName), account])
        loginMessage.value = '登录成功，正在加载推荐…'
        await loadData()
      } catch (err) {
        loginMessage.value = `登录失败：${err?.message || String(err)}`
      } finally {
        logging.value = ''
      }
    }

    onMounted(() => {
      // 已有缓存数据则直接复用，不再自动刷新（切排行榜回来时不重置列表）
      if (!cache.loaded) void loadData()
    })

    const handleSearchText = (text) => { goSearch(router, text) }
    return {
      platform,
      loading,
      errors,
      data,
      dom_scroll,
      platformTabs,
      platformName,
      hasAnyAccount,
      musicSections,
      hasData,
      loadData,
      handlePlatform,
      playSong,
      logging,
      loginMessage,
      login,
      goSearch: handleSearchText,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.container {
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
  position: relative;
}
.header {
  flex: none;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px 10px;
  border-bottom: 1px solid var(--color-list-header-border-bottom);
}
.tabs, .right, .viewSwitch {
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 6px;
}
.tab, .viewBtn {
  border: none;
  background: transparent;
  color: var(--color-font);
  font-size: 13px;
  padding: 6px 14px;
  border-radius: 4px;
  cursor: pointer;
  transition: background @transition-fast, color @transition-fast;
  &:hover {
    background: var(--color-primary-alpha-900);
  }
  &.active {
    background: var(--color-primary-alpha-100);
    color: #fff;
  }
}
.viewBtn {
  padding: 5px 12px;
  font-size: 12px;
}
.refreshBtn {
  margin-left: 4px;
}
.scroll {
  flex: auto;
  overflow-y: auto;
  padding: 15px 20px 40px;
}
.section {
  margin-bottom: 28px;
}
.sectionTitle {
  display: flex;
  align-items: center;
  font-size: 16px;
  margin: 0 0 14px;
  color: var(--color-font);
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #e94560;
  margin-right: 8px;
  &.tx {
    background: #12b7f5;
  }
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
  list-style: none;
  padding: 0;
  margin: 0;
}
.card {
  display: flex;
  cursor: pointer;
  border-radius: 6px;
  padding: 8px;
  transition: background @transition-fast;
  &:hover {
    background: var(--color-primary-alpha-900);
  }
}
.image {
  flex: none;
  width: 90px;
  height: 90px;
  border-radius: 4px;
  overflow: hidden;
  background: var(--color-primary-alpha-800);
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}
.desc {
  flex: auto;
  min-width: 0;
  padding-left: 10px;
  h4 {
    font-size: 13px;
    line-height: 1.4;
    .mixin-ellipsis-2();
    margin: 0;
  }
}
.author {
  font-size: 12px;
  color: var(--color-font-label);
  margin: 6px 0 0;
  .mixin-ellipsis-1();
}
.meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: var(--color-font-label);
  margin-top: 8px;
}
.songList {
  list-style: none;
  padding: 0;
  margin: 0;
}
.songItem {
  display: flex;
  align-items: center;
  height: 38px;
  border-radius: 4px;
  padding: 0 8px;
  font-size: 13px;
  cursor: default;
  background: #fff;
  &:nth-child(odd) {
    background: rgba(0, 0, 0, 0.025);
  }
  &:hover {
    background: rgba(0, 0, 0, 0.06);
  }
}
.songNum {
  flex: none;
  width: 36px;
  color: var(--color-font-label);
}
.songName {
  flex: 3;
  min-width: 0;
  .mixin-ellipsis-1();
}
.songSinger, .songAlbum {
  flex: 2;
  min-width: 0;
  color: var(--color-font-label);
  .mixin-ellipsis-1();
  cursor: pointer;
  &:hover {
    color: var(--color-primary-font-hover);
  }
}
.songTime {
  flex: none;
  width: 50px;
  text-align: right;
  color: var(--color-font-label);
}
.empty, .noData {
  flex: auto;
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;
  color: var(--color-font-label);
  gap: 12px;
}
.emptyTip {
  font-size: 13px;
}
.loginBtns {
  display: flex;
  gap: 10px;
  margin-top: 6px;
}
.loginMessage {
  font-size: 12px;
  color: var(--color-primary);
  margin: 0;
}
.errors {
  background: rgba(233, 105, 108, 0.12);
  border-radius: 4px;
  padding: 8px 12px;
  margin-bottom: 16px;
  p {
    margin: 2px 0;
    font-size: 12px;
    color: #e94560;
  }
}
</style>
