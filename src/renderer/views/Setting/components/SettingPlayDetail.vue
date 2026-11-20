<template lang="pug">
dt#play_detail {{ $t('setting__play_detail') }}
dd
  .gap-top
    base-checkbox(id="setting_play_detail_font_zoom_enable" :model-value="appSetting['playDetail.isZoomActiveLrc']" :label="$t('setting__play_detail_font_zoom')" @update:model-value="updateSetting({'playDetail.isZoomActiveLrc': $event})")
  .gap-top
    base-checkbox(id="setting_play_detail_lyric_delayScroll" :model-value="appSetting['playDetail.isDelayScroll']" :label="$t('setting__play_detail_lyric_delay_scroll')" @update:model-value="updateSetting({ 'playDetail.isDelayScroll': $event })")
  .gap-top
    base-checkbox(id="setting_play_detail_lyric_progress_enable" :model-value="appSetting['playDetail.isShowLyricProgressSetting']" :label="$t('setting__play_detail_lyric_progress')" @update:model-value="updateSetting({'playDetail.isShowLyricProgressSetting': $event})")

dd
  h3 播放页专属样式
  div
    .gap-top
      base-checkbox(id="setting_play_detail_lyric_bottom" :model-value="appSetting['playDetail.customStyle.lyricPosition'] == 'bottom'" :label="'歌词显示在封面下方（默认在右）'" @update:model-value="updateSetting({ 'playDetail.customStyle.lyricPosition': $event ? 'bottom' : 'right' })")
    .gap-top
      base-checkbox(id="setting_play_detail_cover_blur" :model-value="appSetting['playDetail.customStyle.coverBlurBg']" :label="'封面模糊作为背景'" @update:model-value="updateSetting({ 'playDetail.customStyle.coverBlurBg': $event })")
  .gap-top 背景明暗
  div
    base-checkbox.gap-left(id="setting_play_detail_bg_auto" :model-value="appSetting['playDetail.customStyle.bgMode']" need value="auto" :label="'跟随主题'" @update:model-value="updateSetting({ 'playDetail.customStyle.bgMode': $event })")
    base-checkbox.gap-left(id="setting_play_detail_bg_light" :model-value="appSetting['playDetail.customStyle.bgMode']" need value="light" :label="'亮色'" @update:model-value="updateSetting({ 'playDetail.customStyle.bgMode': $event })")
    base-checkbox.gap-left(id="setting_play_detail_bg_dark" :model-value="appSetting['playDetail.customStyle.bgMode']" need value="dark" :label="'暗色'" @update:model-value="updateSetting({ 'playDetail.customStyle.bgMode': $event })")

dd
  h3#play_detail_align {{ $t('setting__play_detail_align') }}
  div
    base-checkbox.gap-left(id="setting_play_detail_align_left" :model-value="appSetting['playDetail.style.align']" need value="left" :label="$t('setting__play_detail_align_left')" @update:model-value="updateSetting({ 'playDetail.style.align': $event })")
    base-checkbox.gap-left(id="setting_play_detail_align_center" :model-value="appSetting['playDetail.style.align']" need value="center" :label="$t('setting__play_detail_align_center')" @update:model-value="updateSetting({ 'playDetail.style.align': $event })")
    base-checkbox.gap-left(id="setting_play_detail_align_right" :model-value="appSetting['playDetail.style.align']" need value="right" :label="$t('setting__play_detail_align_right')" @update:model-value="updateSetting({ 'playDetail.style.align': $event })")

</template>

<script>
// import { ref, onBeforeUnmount } from '@common/utils/vueTools'
import { appSetting, updateSetting } from '@renderer/store/setting'

export default {
  name: 'SettingPlayDetail',
  setup() {
    return {
      appSetting,
      updateSetting,
    }
  },
}
</script>
