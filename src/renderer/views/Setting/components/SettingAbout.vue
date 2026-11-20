<template lang="pug">
dt#about {{ $t('setting__about') }}
dd
  .p.small
    strong 闻声
    | （WenSheng）——支持洛雪 LX 音源与云盘同步的桌面音乐播放器。
  .p.small
    | 本项目基于开源项目「洛雪音乐助手 LX Music」二次开发，遵循其 Apache-2.0 许可与补充协议，仅用于技术学习与研究，请尊重版权、支持正版。
  .p.small
    | 上游开源地址（原项目）：
    span.hover.underline(:aria-label="$t('setting__click_open')" @click="openUrl('https://github.com/lyswhut/lx-music-desktop#readme')") https://github.com/lyswhut/lx-music-desktop
  br
  .p.small 闻声为个人基于开源代码的二次开发版本，未设在线更新源、客服或所谓「官方账号」，请谨防冒充与诈骗。
  .p.small
    | 你已签署本软件的
    base-btn(min @click="handleShowPact") 许可协议
    | ，协议内容可在弹出的窗口中查看。
  br
  .p.small
    | 上游作者（LX Music）：&nbsp;
    strong 落雪无痕
    | &nbsp;·&nbsp; 闻声二次开发：基于开源代码构建
</template>

<script>
import { isShowPact } from '@renderer/store'
import { openUrl, clipboardWriteText } from '@common/utils/electron'

export default {
  name: 'SettingAbout',
  setup() {
    const handleShowPact = () => {
      isShowPact.value = true
    }
    return {
      openUrl,
      clipboardWriteText,
      handleShowPact,
    }
  },
}
</script>
