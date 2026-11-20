<template>
  <div :class="$style.main">
    <div class="scroll" :class="$style.toc">
      <ul :class="$style.tocList" role="toolbar">
        <li v-for="h2 in tocList" :key="h2.id" :class="$style.tocListItem" role="presentation">
          <button
            type="button"
            :class="[$style.tocItem, {[$style.active]: avtiveComponentName == h2.id }]"
            role="tab" :aria-selected="avtiveComponentName == h2.id"
            :aria-label="h2.title" ignore-tip @click="toggleTab(h2.id)"
          >
            <svg :class="$style.tocIcon" viewBox="0 0 1024 1024" space="preserve"><use :xlink:href="'#icon-' + h2.icon" /></svg>
            <span :class="$style.tocText">
              <span :class="$style.tocTitle">{{ h2.title }}</span>
              <span :class="$style.tocDesc">{{ h2.desc }}</span>
            </span>
          </button>
        </li>
      </ul>
    </div>
    <div ref="dom_content_ref" class="scroll" :class="$style.setting">
      <dl>
        <component :is="avtiveComponentName" />
        <!-- <SettingBasic />
        <SettingPlay />
        <SettingPlayDetail />
        <SettingDesktopLyric />
        <SettingSearch />
        <SettingList />
        <SettingDownload />
        <SettingSync />
        <SettingHotKey />
        <SettingNetwork />
        <SettingOdc />
        <SettingBackup />
        <SettingOther />
        <SettingUpdate />
        <SettingAbout /> -->
      </dl>
    </div>
  </div>
</template>

<script>
import { ref, computed, nextTick } from '@common/utils/vueTools'
// import { currentStting } from './setting'
import { useRoute } from '@common/utils/vueRouter'

import GroupAccountSource from './components/GroupAccountSource.vue'
import GroupSyncBackup from './components/GroupSyncBackup.vue'
import GroupPlayControl from './components/GroupPlayControl.vue'
import GroupUISearch from './components/GroupUISearch.vue'
import GroupAbout from './components/GroupAbout.vue'

// 旧设置页 query 名 -> 新大项的映射，兼容旧链接
const LEGACY_TAB_MAP = {
  SettingAccounts: 'GroupAccountSource',
  SettingBasic: 'GroupAccountSource',
  SettingSync: 'GroupSyncBackup',
  SettingCloudSync: 'GroupSyncBackup',
  SettingOpenAPI: 'GroupSyncBackup',
  SettingBackup: 'GroupSyncBackup',
  SettingPlay: 'GroupPlayControl',
  SettingPlayDetail: 'GroupPlayControl',
  SettingDesktopLyric: 'GroupPlayControl',
  SettingHotKey: 'GroupPlayControl',
  SettingSearch: 'GroupUISearch',
  SettingOdc: 'GroupUISearch',
  SettingList: 'GroupUISearch',
  SettingDownload: 'GroupUISearch',
  SettingNetwork: 'GroupUISearch',
  SettingOther: 'GroupUISearch',
  SettingUpdate: 'GroupAbout',
  SettingAbout: 'GroupAbout',
}

export default {
  name: 'Setting',
  components: {
    GroupAccountSource,
    GroupSyncBackup,
    GroupPlayControl,
    GroupUISearch,
    GroupAbout,
  },
  setup() {
    const route = useRoute()

    const dom_content_ref = ref(null)

    const tocList = computed(() => {
      return [
        { id: 'GroupAccountSource', title: '账号与音源', icon: 'love', desc: '平台登录 · 音源管理' },
        { id: 'GroupSyncBackup', title: '同步与备份', icon: 'refresh', desc: '数据同步 · 网盘 · 开放接口' },
        { id: 'GroupPlayControl', title: '播放与快捷键', icon: 'play', desc: '播放 · 歌词 · 热键' },
        { id: 'GroupUISearch', title: '界面与搜索', icon: 'search-2', desc: '搜索 · 列表 · 下载 · 外观' },
        { id: 'GroupAbout', title: '关于', icon: 'album', desc: '版本信息 · 更新' },
      ]
    })

    const queryName = route.query.name
    const initialTab = queryName && tocList.value.some(t => t.id == queryName)
      ? queryName
      : (LEGACY_TAB_MAP[queryName] || tocList.value[0].id)
    const avtiveComponentName = ref(initialTab)

    const toggleTab = id => {
      avtiveComponentName.value = id
      void nextTick(() => {
        dom_content_ref.value?.scrollTo({
          top: 0,
          behavior: 'smooth',
        })
      })
    }

    return {
      tocList,
      avtiveComponentName,
      dom_content_ref,
      toggleTab,
    }
  },
  // mounted() {
  //   this.initTOC()
  // },
  // methods: {
  //   initTOC() {
  //     const list = this.$refs.dom_setting_list.children
  //     const toc = []
  //     let prevTitle
  //     for (const item of list) {
  //       if (item.tagName == 'DT') {
  //         prevTitle = {
  //           title: item.innerText.replace(/[（(].+?[)）]/, ''),
  //           id: item.getAttribute('id'),
  //           dom: item,
  //           children: [],
  //         }
  //         toc.push(prevTitle)
  //         continue
  //       }
  //       const h3 = item.querySelector('h3')
  //       if (h3) {
  //         prevTitle.children.push({
  //           title: h3.innerText.replace(/[（(].+?[)）]/, ''),
  //           id: h3.getAttribute('id'),
  //           dom: h3,
  //         })
  //       }
  //     }
  //     console.log(toc)
  //     this.toc.list = toc
  //   },
  //   handleListScroll(event) {
  //     // console.log(event.target.scrollTop)
  //   },
  // },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.main {
  display: flex;
  flex-flow: row nowrap;
  height: 100%;
  border-top: var(--color-list-header-border-bottom);
}

.toc {
  flex: 0 0 200px;
  overflow-y: auto;
  background: var(--color-main-background);
  border-right: 1px solid var(--color-primary-alpha-900);
}
.tocList {
  margin: 0;
  padding: 8px 0;
  list-style: none;
}
.tocListItem {
  margin: 0;
  padding: 0;
}
.tocItem {
  position: relative;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 10px;
  width: 100%;
  box-sizing: border-box;
  padding: 10px 14px 10px 18px;
  border: 0;
  background: transparent;
  color: var(--color-font);
  text-align: left;
  cursor: pointer;
  transition: background-color .18s ease, color .18s ease;

  &:hover {
    background: var(--color-primary-alpha-900);
  }
  &.active {
    background: var(--color-primary-alpha-900);
    color: var(--color-primary);
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 8px;
      bottom: 8px;
      width: 3px;
      border-radius: 0 3px 3px 0;
      background: var(--color-primary);
    }
    .tocIcon { color: var(--color-primary); }
    .tocTitle { color: var(--color-primary); }
  }
}
.tocIcon {
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  fill: currentColor;
  color: var(--color-primary-font);
  opacity: .85;
}
.tocText {
  display: flex;
  flex-flow: column nowrap;
  min-width: 0;
  gap: 2px;
}
.tocTitle {
  font-size: 13px;
  font-weight: 500;
  .mixin-ellipsis-1();
}
.tocDesc {
  font-size: 11px;
  color: var(--color-primary-font);
  opacity: .7;
  .mixin-ellipsis-1();
}

.setting {
  padding: 24px 32px 40px;
  font-size: 14px;
  box-sizing: border-box;
  overflow-y: auto;
  height: 100%;
  position: relative;
  width: 100%;
  background: var(--color-app-background);

  :global {
    dt {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 20px;
      font-weight: 600;
      color: var(--color-font);
      padding: 0 0 14px;
      margin: 0 0 8px;
      border-bottom: 2px solid var(--color-primary-alpha-900);

      + dd h3 {
        margin-top: 0;
      }
    }

    dd {
      > div {
        padding: 14px 4px;
        border-bottom: 1px solid var(--color-primary-alpha-900);
      }
      > div:last-child {
        border-bottom: 0;
      }
    }
    h3 {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-font);
      margin: 20px 0 12px;
    }
    .p {
      padding: 4px 0;
      line-height: 1.5;
      .btn {
        + .btn {
          margin-left: 10px;
        }
      }
    }

    .help-btn {
      padding: 0;
      margin: 0 0.4em;
      border: none;
      background: none;
      color: var(--color-button-font);
      cursor: pointer;
      transition: opacity 0.2s ease;
      &:hover {
        opacity: 0.7;
      }
    }
    .help-icon {
      margin: 0 0.4em;
    }
  }
}

// .btn-content {
//   display: inline-block;
//   transition: @transition-theme;
//   transition-property: opacity, transform;
//   opacity: 1;
//   transform: scale(1);

//   &.hide {
//     opacity: 0;
//     transform: scale(0);
//   }
// }


// :global(dt):target, :global(h3):target {
//   animation: highlight 1s ease;
// }

// @keyframes highlight {
//   from { background: yellow; }
//   to { background: transparent; }
// }

</style>

