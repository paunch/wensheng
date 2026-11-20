<template>
  <SettingPlay />
  <SettingPlayDetail />
  <SettingDesktopLyric />
  <SettingHotKey />
</template>

<script>
import SettingPlay from './SettingPlay.vue'
import SettingPlayDetail from './SettingPlayDetail.vue'
import SettingDesktopLyric from './SettingDesktopLyric.vue'
import SettingHotKey from './SettingHotKey.vue'

export default {
  name: 'GroupPlayControl',
  components: { SettingPlay, SettingPlayDetail, SettingDesktopLyric, SettingHotKey },
}
</script>
