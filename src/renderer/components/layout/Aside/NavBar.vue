<template>
  <div ref="dom_menu" :class="$style.menu">
    <ul :class="$style.list" role="toolbar">
      <li v-for="item in menus" :key="item.key" :class="$style.navItem" role="presentation">
        <router-link :class="[$style.link, {[$style.active]: isActive(item)}]" role="tab" :aria-selected="isActive(item)" :to="item.to" :aria-label="item.tips">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" :viewBox="item.iconSize" :height="item.size" :width="item.size" space="preserve">
            <use :xlink:href="item.icon" />
          </svg>
          <span :class="$style.label">{{ item.label }}</span>
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { appSetting } from '@renderer/store/setting'
import { useI18n } from '@root/lang'
import { useRoute } from '@common/utils/vueRouter'
import { ref, computed } from '@common/utils/vueTools'

export default {
  name: 'NavBar',
  setup() {
    const t = useI18n()
    const route = useRoute()
    const dom_menu = ref<HTMLElement>()
    // 统一图标尺寸：所有导航图标使用同一渲染尺寸
    const size = computed(() => 22)

    const onlineTo = { path: '/list', query: { type: 'online' } }
    const loveTo = { path: '/list', query: { type: 'love' } }

    const menus = computed(() => [
      {
        key: 'musicHall',
        to: '/musicHall',
        tips: '音乐馆',
        label: '音乐馆',
        icon: '#icon-musicFolder',
        iconSize: '0 0 247.498 247.498',
        size: size.value,
        match: (r: any) => (r.path || '').startsWith('/musicHall'),
      },
      {
        key: 'online',
        to: onlineTo,
        tips: '在线歌单',
        label: '在线歌单',
        icon: '#icon-album',
        iconSize: '0 0 425.2 425.2',
        size: size.value,
        match: (r: any) => r.path == '/list' && (r.query.type || 'online') == 'online',
      },
      {
        key: 'love',
        to: loveTo,
        tips: '我喜欢',
        label: '我喜欢',
        icon: '#icon-love',
        iconSize: '0 0 444.87 391.18',
        size: size.value,
        match: (r: any) => r.path == '/list' && r.query.type == 'love',
      },
      {
        key: 'download',
        to: '/download',
        tips: t('download'),
        label: t('download'),
        icon: '#icon-download-2',
        iconSize: '0 0 425.2 425.2',
        size: size.value,
        match: (r: any) => r.path == '/download',
        enable: appSetting['download.enable'],
      },
    ].filter(m => m.enable !== false))

    const isActive = (item: any) => item.match(route)

    return {
      appSetting,
      menus,
      dom_menu,
      isActive,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.menu {
  flex: auto;
  // &.controlBtnLeft {
  //   display: flex;
  //   flex-flow: column nowrap;
  //   justify-content: center;
  //   padding-bottom: @control-btn-height;
  // }
  // padding: 5px;
}
.list {
  -webkit-app-region: no-drag;
  // margin-bottom: 15px;
  &:last-child {
    margin-bottom: 0;
  }
  // background-color: pink;
  // dt {
  //   padding-left: 5px;
  //   font-size: 11px;
  //   transition: @transition-normal;
  //   transition-property: color;
  //   color: @color-theme-font-label;
  //   .mixin-ellipsis-1();
  // }
}
.navItem {
  position: relative;
  &:before {
    content: '';
    display: block;
    width: 100%;
    padding-bottom: 84%;
  }
}
.link {
  position: absolute;
  left: 6%;
  top: 3%;
  width: 88%;
  height: 94%;
  box-sizing: border-box;
  transition: @transition-fast;
  transition-property: background-color, opacity, color, transform;
  color: var(--color-nav-font);
  cursor: pointer;
  text-align: center;
  outline: none;
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;
  gap: 3px;
  border-radius: 12px;

  .mixin-ellipsis-1();

  svg {
    flex: none;
    transition: transform @transition-fast, color @transition-fast;
  }
  .label {
    font-size: 11px;
    line-height: 1.2;
    white-space: nowrap;
  }

  &.active {
    background-color: var(--color-primary-light-300-alpha-700);
    color: var(--color-primary);
    svg {
      transform: scale(1.06);
    }
    &:hover {
      background-color: var(--color-primary-light-300-alpha-800);
    }
  }

  &:hover {
    color: var(--color-primary);
    &:not(.active) {
      background-color: var(--color-primary-light-400-alpha-700);
      svg {
        transform: scale(1.06);
      }
    }
  }
  &:active:not(.active) {
    opacity: .6;
    transform: scale(.94);
    background-color: var(--color-primary-light-300-alpha-600);
  }
}

// .icon {
//   // margin-bottom: 5px;
//   &> svg {
//     width: 32%;
//   }
// }

</style>
