<template>
  <SettingSync />
  <SettingCloudSync />
  <SettingOpenAPI />
  <SettingBackup />
</template>

<script>
import SettingSync from './SettingSync/index.vue'
import SettingCloudSync from './SettingCloudSync.vue'
import SettingOpenAPI from './SettingOpenAPI.vue'
import SettingBackup from './SettingBackup.vue'

export default {
  name: 'GroupSyncBackup',
  components: { SettingSync, SettingCloudSync, SettingOpenAPI, SettingBackup },
}
</script>
