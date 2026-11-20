<template>
  <SettingAccounts />
  <SettingBasic />
</template>

<script>
import SettingAccounts from './SettingAccounts.vue'
import SettingBasic from './SettingBasic.vue'

export default {
  name: 'GroupAccountSource',
  components: { SettingAccounts, SettingBasic },
}
</script>
