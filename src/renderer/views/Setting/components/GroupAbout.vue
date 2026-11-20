<template>
  <SettingAbout />
  <SettingUpdate />
</template>

<script>
import SettingAbout from './SettingAbout.vue'
import SettingUpdate from './SettingUpdate.vue'

export default {
  name: 'GroupAbout',
  components: { SettingAbout, SettingUpdate },
}
</script>
