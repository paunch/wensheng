<template>
  <SettingSearch />
  <SettingOdc />
  <SettingList />
  <SettingDownload />
  <SettingNetwork />
  <SettingOther />
</template>

<script>
import SettingSearch from './SettingSearch.vue'
import SettingOdc from './SettingOdc.vue'
import SettingList from './SettingList.vue'
import SettingDownload from './SettingDownload.vue'
import SettingNetwork from './SettingNetwork.vue'
import SettingOther from './SettingOther.vue'

export default {
  name: 'GroupUISearch',
  components: { SettingSearch, SettingOdc, SettingList, SettingDownload, SettingNetwork, SettingOther },
}
</script>
