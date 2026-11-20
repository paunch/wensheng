<template lang="pug">
transition(enter-active-class="animated slideInRight" leave-active-class="animated slideOutDown" @after-enter="handleAfterEnter" @after-leave="handleAfterLeave")
  div(v-if="isShowPlayerDetail" :class="[$style.container, { fullscreen: isFullscreen, [$style.lyricBottom]: appSetting['playDetail.customStyle.lyricPosition'] == 'bottom', [$style.darkBg]: appSetting['playDetail.customStyle.bgMode'] == 'dark', [$style.lightBg]: appSetting['playDetail.customStyle.bgMode'] == 'light' }]" @contextmenu="handleContextMenu")
    div(:class="$style.bg" :style="bgStyle")
    //- div(:class="$style.bg" :style="bgStyle")
    //- div(:class="$style.bg2")
    ControlBtnsRightHeader
    div(:class="[$style.main, {[$style.showComment]: isShowPlayComment}]")
      div.left(:class="$style.left")
        //- div(:class="$style.info")
        div(:class="$style.info")
          img(v-if="musicInfo.pic" :class="$style.img" :src="musicInfo.pic" :aria-label="'放大封面'" @click="showCover = true")
          div.description(:class="['scroll', $style.description]")
            p {{ $t('player__music_name') }}{{ musicInfo.name }}
            p.artistLink(:class="$style.artistLink" @click="handleSearch(musicInfo.singer)") {{ $t('player__music_singer') }}{{ musicInfo.singer }}
            p.artistLink(v-if="musicInfo.album" :class="$style.artistLink" @click="handleSearch(musicInfo.album)") {{ $t('player__music_album') }}{{ musicInfo.album }}

      transition(enter-active-class="animated fadeIn" leave-active-class="animated fadeOut")
        LyricPlayer(v-if="visibled")
      music-comment(v-if="visibled" :class="$style.comment" :show="isShowPlayComment" :music-info="playMusicInfo.musicInfo" @close="hideComment")
    transition(enter-active-class="animated fadeIn" leave-active-class="animated fadeOut")
      play-bar(v-if="visibled")
    transition(enter-active-class="animated-slow fadeIn" leave-active-class="animated-slow fadeOut")
      common-audio-visualizer(v-if="appSetting['player.audioVisualization'] && visibled")
    transition(enter-active-class="animated fadeIn" leave-active-class="animated fadeOut")
      div(v-if="showCover" :class="$style.coverOverlay" @click="showCover = false")
        img(v-if="musicInfo.pic" :src="musicInfo.pic" :class="$style.coverOverlayImg")
</template>


<script>
import { ref, watch, computed } from '@common/utils/vueTools'
import { isFullscreen } from '@renderer/store'
import {
  isShowPlayerDetail,
  isShowPlayComment,
  musicInfo,
  playMusicInfo,
} from '@renderer/store/player/state'
import {
  setShowPlayerDetail,
  setShowPlayComment,
  setShowPlayLrcSelectContentLrc,
} from '@renderer/store/player/action'
import LyricPlayer from './LyricPlayer.vue'
import PlayBar from './PlayBar.vue'
import MusicComment from './components/MusicComment/index.vue'
import ControlBtnsRightHeader from './ControlBtnsRightHeader.vue'
import { registerAutoHideMounse, unregisterAutoHideMounse } from './autoHideMounse'
import { appSetting } from '@renderer/store/setting'
import { closeWindow, maxWindow, minWindow, setFullScreen } from '@renderer/utils/ipc'
import { useRouter } from '@common/utils/vueRouter'
import { goSearch } from '@renderer/utils/goSearch'

export default {
  name: 'CorePlayDetail',
  components: {
    ControlBtnsRightHeader,
    LyricPlayer,
    PlayBar,
    MusicComment,
  },
  setup() {
    const visibled = ref(false)
    const showCover = ref(false)
    const router = useRouter()
    const handleSearch = (text) => { if (text) goSearch(router, text) }
    const bgStyle = computed(() => {
      if (!appSetting['playDetail.customStyle.coverBlurBg'] || !musicInfo.pic) return {}
      return { backgroundImage: `url(${musicInfo.pic})`, backgroundSize: 'cover', backgroundPosition: 'center', transform: 'scale(1.15)', filter: 'blur(40px) brightness(.5)', opacity: '.5' }
    })

    let clickTime = 0

    const hide = () => {
      setShowPlayerDetail(false)
    }
    const handleContextMenu = () => {
      if (window.performance.now() - clickTime > 400) {
        clickTime = window.performance.now()
        return
      }
      clickTime = 0
      hide()
    }

    const hideComment = () => {
      setShowPlayComment(false)
    }

    const handleAfterEnter = () => {
      if (isFullscreen.value) registerAutoHideMounse()

      visibled.value = true
    }

    const handleAfterLeave = () => {
      setShowPlayLrcSelectContentLrc(false)
      hideComment(false)
      visibled.value = false

      unregisterAutoHideMounse()
    }

    watch(isFullscreen, isFullscreen => {
      (isFullscreen ? registerAutoHideMounse : unregisterAutoHideMounse)()
    })


    return {
      appSetting,
      playMusicInfo,
      isShowPlayerDetail,
      isShowPlayComment,
      musicInfo,
      hide,
      handleSearch,
      handleContextMenu,
      hideComment,
      handleAfterEnter,
      handleAfterLeave,
      visibled,
      showCover,
      bgStyle,
      isFullscreen,
      fullscreenExit() {
        void setFullScreen(false).then((fullscreen) => {
          isFullscreen.value = fullscreen
        })
      },
      min() {
        minWindow()
      },
      max() {
        maxWindow()
      },
      close() {
        closeWindow()
      },
    }
  },
}
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

@control-btn-width: @height-toolbar * .26;

.container {
  position: absolute;
  display: flex;
  flex-flow: column nowrap;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background-color: var(--color-content-background);
  z-index: 10;
  // -webkit-app-region: drag;
  overflow: hidden;
  border-radius: @radius-border;
  color: var(--color-font);
  // border-left: 12px solid var(--color-primary-alpha-900);
  -webkit-app-region: no-drag;
  contain: strict;

  box-sizing: border-box;

  * {
    box-sizing: border-box;
  }
}
.bg {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background: var(--background-image) var(--background-image-position) no-repeat;
  background-size: var(--background-image-size);
  // background-size: 110% 110%;
  // filter: blur(60px);
  opacity: .7;
  z-index: -1;
  &:before {
    content: '';
    display: block;
    width: 100%;
    height: 100%;
    background-color: var(--color-app-background);
  }
  &:after {
    position: absolute;
    left: 0;
    top: 0;
    content: '';
    display: block;
    width: 100%;
    height: 100%;
    background-color: var(--color-main-background);
  }
}
// .bg2 {
//   position: absolute;
//   width: 100%;
//   height: 100%;
//   top: 0;
//   left: 0;
//   z-index: -1;
//   background-color: rgba(255, 255, 255, .8);
// }

.main {
  flex: auto;
  min-height: 0;
  overflow: hidden;
  display: flex;
  margin: 0 30px;
  position: relative;

  &.showComment {
    :global {
      .left {
        flex-basis: 18%;
        .description p {
          font-size: 12px;
        }
      }
      .right {
        flex-basis: 30%;
        .lyricSelectContent {
          font-size: 14px;
        }
      }
      .comment {
        opacity: 1;
        transform: scaleX(1);
      }
    }
  }
}
.left {
  flex: 0 0 40%;
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  padding: 13px;
  overflow: hidden;
  transition: flex-basis @transition-normal;
}

.info {
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  max-width: 300px;
  min-height: 0;
}
.img {
  max-width: 100%;
  max-height: 80%;
  min-width: 100%;
  box-shadow: 0 0 6px var(--color-primary-alpha-500);
  border-radius: 6px;
  opacity: .8;
}
.description {
  max-width: 300px;
  margin-top: 15px;
  padding-bottom: 15px;
  min-height: 0;
  p {
    line-height: 1.5;
    font-size: 14px;
    overflow-wrap: break-word;
  }
}


.comment {
  position: absolute;
  right: 0;
  top: 0;
  width: 50%;
  height: 100%;
  opacity: 1;
  margin-left: 10px;
  transform: scaleX(0);
}



.artistLink {
  cursor: pointer;
  transition: color @transition-fast;
  &:hover {
    color: var(--color-primary);
  }
}
.img {
  cursor: zoom-in;
}
.coverOverlay {
  position: absolute;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, .72);
  backdrop-filter: blur(20px);
  cursor: zoom-out;
}
.coverOverlayImg {
  max-width: 82%;
  max-height: 82%;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0,0,0,.5);
}


.lyricBottom {
  :global(.main), .main {
    flex-flow: column nowrap !important;
  }
}
.darkBg {
  background-color: #16151a !important;
}
.lightBg {
  background-color: #faf9f7 !important;
  color: #2a2a30;
}
</style>
