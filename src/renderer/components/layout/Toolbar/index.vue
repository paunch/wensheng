<template>
  <div :class="[$style.toolbar, { [$style.fullscreen]: isFullscreen }]">
    <div :class="$style.side" />
    <div :class="$style.center">
      <SearchInput />
    </div>
    <div :class="[$style.side, $style.sideRight]">
      <button type="button" :class="$style.settingBtn" aria-label="设置" title="设置" ignore-tip @click="goSetting">
        <svg viewBox="0 0 493.23 436.47" space="preserve"><use xlink:href="#icon-setting" /></svg>
      </button>
      <ControlBtns />
    </div>
  </div>
</template>

<script setup>
import { isFullscreen } from '@renderer/store'
import { useRouter } from '@common/utils/vueRouter'
import ControlBtns from './ControlBtns.vue'
import SearchInput from './SearchInput.vue'

const router = useRouter()
const goSetting = () => { void router.push({ path: '/setting' }) }

</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.toolbar {
  display: grid;
  grid-template-columns: 1fr minmax(240px, 34%) 1fr;
  align-items: center;
  height: @height-toolbar;
  padding: 0 15px;
  -webkit-app-region: drag;
  z-index: 2;

  &.fullscreen {
    -webkit-app-region: no-drag;
  }
}

.side {
  display: flex;
  align-items: center;
  min-width: 0;
  height: 100%;
}
.sideRight {
  justify-content: flex-end;
}

.center {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-width: 0;
}

.settingBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin-right: 14px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--color-font-label);
  cursor: pointer;
  -webkit-app-region: no-drag;
  transition: background-color @transition-fast, color @transition-fast;
  svg {
    width: 17px;
    height: 17px;
    fill: currentColor;
  }
  &:hover {
    background-color: var(--color-primary-light-400-alpha-700);
    color: var(--color-primary);
  }
}

</style>
