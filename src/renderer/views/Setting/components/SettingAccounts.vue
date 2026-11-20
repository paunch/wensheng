<template lang="pug">
dt#accounts 多平台账号
dd
  .p.small 登录后可在「发现音乐」查看每日推荐、雷达推荐等个性化内容。支持内嵌网页登录（手机号/密码/扫码）或手动粘贴 Cookie。Cookie 仅保存在本地，并会随云盘同步一起备份。本软件不收集任何账号信息。

  .p.login-buttons
    base-btn(min outline :disabled="!!logging" @click="login('wy')") {{ logging === 'wy' ? '登录中…' : '登录网易云音乐' }}
    base-btn(min outline :disabled="!!logging" @click="login('tx')") {{ logging === 'tx' ? '登录中…' : '登录 QQ 音乐' }}
    base-btn(min outline :disabled="!!logging" @click="login('kg')") {{ logging === 'kg' ? '登录中…' : '登录酷狗音乐' }}
    base-btn(min outline :disabled="!!logging" @click="login('kw')") {{ logging === 'kw' ? '登录中…' : '登录酷我音乐' }}

  .p.small
    label.toggle-row
      input(type="checkbox" :checked="autoRefresh" @change="toggleAutoRefresh")
      span 启动时自动续期 Cookie（网易云）

  .p.account-item(v-for="(acc, index) in accounts" :key="acc.id")
    .account-row
      strong {{ platformName(acc.platform) }}
      span(v-if="acc.nickname") · {{ acc.nickname }}
      span(v-else-if="acc.name") · {{ acc.name }}
      span.status-tag(:class="statusClass(acc)") {{ statusText(acc) }}
      .row-actions
        base-btn(min @click="refreshAccount(acc)") 刷新
        base-btn(min @click="removeAccount(index)") 删除
    .account-cookie {{ maskCookie(acc.cookie) }}
    .account-meta {{ loginTypeName(acc.loginType) }} · 更新于 {{ formatTime(acc.updatedAt) }}

  .p.add-form
    .form-title 手动添加 Cookie（可选）
    .form-row
      select(v-model="newPlatform" :class="$style.select")
        option(value="wy") 网易云音乐
        option(value="tx") QQ音乐
        option(value="kg") 酷狗音乐
        option(value="kw") 酷我音乐
      base-input(v-model="newName" placeholder="备注名称（可选）" :class="$style.nameInput")
    textarea(v-model="newCookie" :class="$style.textarea" placeholder="粘贴该平台的 Cookie（如 MUSIC_U=xxx; __csrf=xxx）")
    .form-actions
      base-btn(min @click="addAccount") 添加账号
  .p.small.status(:class="{ error: statusIsError }") {{ message }}
</template>

<script>
import { ref, computed } from '@common/utils/vueTools'
import { appSetting, updateSetting } from '@renderer/store/setting'
import { dialog } from '@renderer/plugins/Dialog'
import { openLoginWindow } from '@renderer/utils/ipc'
import {
  getAccounts, saveAccounts, createAccount, removeAccount as removeAccountById,
} from '@renderer/utils/accounts'
import { refreshWyCookie, checkTxCookie, checkAccountCookie, fetchAccountNickname } from '@renderer/utils/discoverApi'

const PLATFORM_NAMES = { wy: '网易云音乐', tx: 'QQ音乐', kg: '酷狗音乐', kw: '酷我音乐' }
const LOGIN_TYPE_NAMES = { web: '网页登录', api: '接口登录', manual: '手动添加' }

export default {
  name: 'SettingAccounts',
  setup() {
    const accounts = ref([])
    const reload = () => { accounts.value = getAccounts() }
    reload()

    const message = ref('')
    const statusIsError = ref(false)
    const logging = ref('')
    const newPlatform = ref('wy')
    const newName = ref('')
    const newCookie = ref('')
    const autoRefresh = computed(() => !!appSetting['accounts.autoRefresh'])

    const platformName = (id) => PLATFORM_NAMES[id] ?? id
    const loginTypeName = (t) => LOGIN_TYPE_NAMES[t] ?? t
    const maskCookie = (cookie) => {
      if (!cookie) return ''
      return cookie.length > 46 ? cookie.slice(0, 46) + '…' : cookie
    }
    const statusText = (acc) => {
      if (!acc.cookie) return '未登录'
      if (acc.status === 'expired') return '已失效'
      if (acc.status === 'expiring') return '即将过期'
      return '正常'
    }
    const statusClass = (acc) => {
      if (acc.status === 'expired' || !acc.cookie) return 'bad'
      return 'good'
    }
    const formatTime = (t) => {
      if (!t) return '未知'
      return new Date(t).toLocaleString('zh-CN', { hour12: false })
    }

    const setMessage = (text, isError = false) => {
      message.value = text
      statusIsError.value = isError
    }

    const login = async(platform) => {
      if (logging.value) return
      logging.value = platform
      setMessage(`正在打开${platformName(platform)}登录窗口…`)
      try {
        const cookie = await openLoginWindow(platform)
        if (!cookie) {
          setMessage('已取消登录或未检测到登录态', true)
          return
        }
        const account = createAccount({ platform, cookie, loginType: 'web' })
        // 尝试获取昵称
        const nickname = await fetchAccountNickname(platform, cookie).catch(() => '')
        account.nickname = nickname || ''
        saveAccounts([...getAccounts().filter(a => a.platform !== platform), account])
        reload()
        setMessage(`${platformName(platform)}登录成功`)
        void dialog(`${platformName(platform)}登录成功`)
      } catch (err) {
        setMessage(`登录失败：${err?.message || String(err)}`, true)
      } finally {
        logging.value = ''
      }
    }

    const refreshAccount = async(acc) => {
      setMessage(`正在验证${platformName(acc.platform)}账号…`)
      let ok = false
      if (acc.platform === 'wy') ok = await refreshWyCookie()
      else if (acc.platform === 'tx') ok = await checkTxCookie()
      else ok = await checkAccountCookie(acc.platform)
      reload()
      setMessage(ok ? `${platformName(acc.platform)}账号状态正常` : `${platformName(acc.platform)}账号已失效，请重新登录`, !ok)
    }

    const removeAccount = (index) => {
      const acc = accounts.value[index]
      if (!acc) return
      removeAccountById(acc.id)
      reload()
      setMessage('账号已删除')
    }

    const addAccount = () => {
      const cookie = newCookie.value.trim()
      if (!cookie) {
        setMessage('请先粘贴 Cookie', true)
        return
      }
      const account = createAccount({ platform: newPlatform.value, cookie, name: newName.value.trim(), loginType: 'manual' })
      saveAccounts([...getAccounts().filter(a => a.platform !== newPlatform.value), account])
      reload()
      newName.value = ''
      newCookie.value = ''
      setMessage('账号已添加')
    }

    const toggleAutoRefresh = (e) => {
      updateSetting({ 'accounts.autoRefresh': e.target.checked })
    }

    return {
      accounts,
      message,
      statusIsError,
      logging,
      newPlatform,
      newName,
      newCookie,
      autoRefresh,
      platformName,
      loginTypeName,
      maskCookie,
      statusText,
      statusClass,
      formatTime,
      login,
      refreshAccount,
      removeAccount,
      addAccount,
      toggleAutoRefresh,
    }
  },
}
</script>

<style lang="less" module>
.select, .nameInput {
  margin-right: 8px;
}
.nameInput {
  flex: 1 1 auto;
}
.textarea {
  width: 100%;
  min-height: 60px;
  box-sizing: border-box;
  margin-top: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  border: 1px solid var(--color-primary-alpha-500);
  background: var(--color-main-background);
  color: var(--color-font);
  font-size: 13px;
  resize: vertical;
}
</style>

<style lang="less">
.account-item {
  border-bottom: 1px solid var(--color-primary-alpha-900);
  padding: 8px 0;
}
.account-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.row-actions {
  margin-left: auto;
  display: flex;
  gap: 6px;
}
.account-cookie {
  font-size: 12px;
  color: var(--color-primary-font);
  word-break: break-all;
  margin-top: 4px;
}
.account-meta {
  font-size: 11px;
  color: var(--color-font-label);
  margin-top: 2px;
}
.status-tag {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 8px;
  &.good {
    color: #fff;
    background: #4caf50;
  }
  &.bad {
    color: #fff;
    background: #e94560;
  }
}
.login-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.toggle-row {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.add-form {
  display: flex;
  flex-flow: column nowrap;
  margin-top: 12px;
}
.form-title {
  font-weight: bold;
  margin-bottom: 6px;
}
.form-row {
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
}
.form-actions {
  margin-top: 8px;
}
.status.error {
  color: #e64545;
}
</style>
