<template lang="pug">
material-modal(:show="modelValue" teleport="#view" @close="handleClose")
  main(:class="$style.main")
    h2 聆澜音源
    p(:class="$style.desc") 输入聆澜音源卡密（KEY），闻声会自动拼接在线音源地址并导入。音源更新时无需重新导入，重启软件会自动续期。
    p(:class="$style.tip") 卡密请自行前往聆澜音源官方渠道获取，本软件不提供卡密。
    base-input(
      v-model="key"
      :class="$style.input"
      type="text"
      placeholder="请输入聆澜音源 KEY（卡密）"
      @submit="handleConfirm"
    )
    div(v-if="status" :class="$style.status") {{ status }}
    div(:class="$style.footer")
      base-btn(:class="$style.btn" :disabled="loading" @click="handleClose") 取消
      base-btn(:class="$style.btn" :disabled="loading || !key.trim()" @click="handleConfirm") {{ loading ? '导入中…' : '导入音源' }}
</template>

<script>
import { ref } from '@common/utils/vueTools'
import { importUserApi } from '@renderer/utils/ipc'
import { dialog } from '@renderer/plugins/Dialog'
import { appSetting, updateSetting } from '@renderer/store/setting'
import { userApi } from '@renderer/store'
import { fetchLinglanSource } from '@renderer/utils/linglan'

export default {
  name: 'LinglanKeyModal',
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue'],
  setup() {
    const key = ref(appSetting['linglan.key'] ?? '')
    const status = ref('')
    const loading = ref(false)

    return { key, status, loading }
  },
  methods: {
    handleClose() {
      this.$emit('update:modelValue', false)
    },
    async handleConfirm() {
      const k = this.key.trim()
      if (!k || this.loading) return
      this.loading = true
      this.status = '正在获取聆澜音源…'
      try {
        const script = await fetchLinglanSource(k)
        if (!script || script.length < 100) throw new Error('音源脚本获取失败，请检查 KEY 是否正确')
        const { apiList } = await importUserApi(script)
        userApi.list = apiList
        updateSetting({ 'linglan.key': k })
        this.status = ''
        void dialog('聆澜音源导入成功')
        this.handleClose()
      } catch (err) {
        this.status = `导入失败：${err.message ?? err}`
        void dialog(`导入失败：${err.message ?? err}`)
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.main {
  padding: 15px 12px;
  width: 440px;
  min-width: 300px;
  max-width: 90vw;
  display: flex;
  flex-flow: column nowrap;
  h2 {
    font-size: 16px;
    color: var(--color-font);
    text-align: center;
    margin-bottom: 12px;
  }
  .desc {
    font-size: 13px;
    line-height: 1.5;
    color: var(--color-font);
  }
  .tip {
    font-size: 12px;
    line-height: 1.5;
    color: var(--color-primary-font);
    margin: 8px 0 12px;
  }
  .input {
    padding: 8px;
  }
  .status {
    margin-top: 10px;
    font-size: 12px;
    color: #e64545;
    line-height: 1.4;
  }
  .footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 18px;
    .btn {
      min-width: 80px;
      & + .btn {
        margin-left: 10px;
      }
    }
  }
}
</style>
