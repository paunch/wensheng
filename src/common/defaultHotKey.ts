import { HOTKEY_PLAYER, HOTKEY_COMMON, HOTKEY_DESKTOP_LYRIC } from './hotKey'

const local: LX.HotKeyConfig = {
  enable: true,
  keys: {
    'mod+f5': {
      type: HOTKEY_PLAYER.toggle_play.type,
      name: HOTKEY_PLAYER.toggle_play.name,
      action: HOTKEY_PLAYER.toggle_play.action,
    },
    'mod+arrowleft': {
      type: HOTKEY_PLAYER.prev.type,
      name: HOTKEY_PLAYER.prev.name,
      action: HOTKEY_PLAYER.prev.action,
    },
    'mod+arrowright': {
      type: HOTKEY_PLAYER.next.type,
      name: HOTKEY_PLAYER.next.name,
      action: HOTKEY_PLAYER.next.action,
    },
    f1: {
      type: HOTKEY_COMMON.focusSearchInput.type,
      name: HOTKEY_COMMON.focusSearchInput.name,
      action: HOTKEY_COMMON.focusSearchInput.action,
    },
    f11: {
      type: HOTKEY_COMMON.toggle_fullscreen.type,
      name: HOTKEY_COMMON.toggle_fullscreen.name,
      action: HOTKEY_COMMON.toggle_fullscreen.action,
    },
    'mod+m': {
      type: HOTKEY_PLAYER.toggle_play_mode.type,
      name: HOTKEY_PLAYER.toggle_play_mode.name,
      action: HOTKEY_PLAYER.toggle_play_mode.action,
    },
    'mod+,': {
      type: HOTKEY_COMMON.open_setting.type,
      name: HOTKEY_COMMON.open_setting.name,
      action: HOTKEY_COMMON.open_setting.action,
    },
    f: {
      type: HOTKEY_COMMON.toggle_play_detail.type,
      name: HOTKEY_COMMON.toggle_play_detail.name,
      action: HOTKEY_COMMON.toggle_play_detail.action,
    },
    'mod+shift+arrowup': {
      type: HOTKEY_PLAYER.volume_up.type,
      name: HOTKEY_PLAYER.volume_up.name,
      action: HOTKEY_PLAYER.volume_up.action,
    },
    'mod+shift+arrowdown': {
      type: HOTKEY_PLAYER.volume_down.type,
      name: HOTKEY_PLAYER.volume_down.name,
      action: HOTKEY_PLAYER.volume_down.action,
    },
    'mod+shift+m': {
      type: HOTKEY_PLAYER.volume_mute.type,
      name: HOTKEY_PLAYER.volume_mute.name,
      action: HOTKEY_PLAYER.volume_mute.action,
    },
    'mod+shift+l': {
      type: HOTKEY_PLAYER.music_love.type,
      name: HOTKEY_PLAYER.music_love.name,
      action: HOTKEY_PLAYER.music_love.action,
    },
    'mod+shift+u': {
      type: HOTKEY_PLAYER.music_unlove.type,
      name: HOTKEY_PLAYER.music_unlove.name,
      action: HOTKEY_PLAYER.music_unlove.action,
    },
  },
}

const global: LX.HotKeyConfig = {
  enable: false,
  keys: {
    'mod+alt+q': {
      type: HOTKEY_COMMON.hide_toggle.type,
      name: HOTKEY_COMMON.hide_toggle.name,
      action: HOTKEY_COMMON.hide_toggle.action,
    },
    // MediaPlayPause: {
    //   type: HOTKEY_PLAYER.toggle_play.type,
    //   name: '',
    //   action: HOTKEY_PLAYER.toggle_play.action,
    // },
    // MediaPreviousTrack: {
    //   type: HOTKEY_PLAYER.prev.type,
    //   name: '',
    //   action: HOTKEY_PLAYER.prev.action,
    // },
    // MediaNextTrack: {
    //   type: HOTKEY_PLAYER.next.type,
    //   name: '',
    //   action: HOTKEY_PLAYER.next.action,
    // },
    'mod+alt+f5': {
      type: HOTKEY_PLAYER.toggle_play.type,
      name: HOTKEY_PLAYER.toggle_play.name,
      action: HOTKEY_PLAYER.toggle_play.action,
    },
    'mod+alt+arrowleft': {
      type: HOTKEY_PLAYER.prev.type,
      name: HOTKEY_PLAYER.prev.name,
      action: HOTKEY_PLAYER.prev.action,
    },
    'mod+alt+arrowright': {
      type: HOTKEY_PLAYER.next.type,
      name: HOTKEY_PLAYER.next.name,
      action: HOTKEY_PLAYER.next.action,
    },
    'mod+alt+arrowup': {
      type: HOTKEY_PLAYER.volume_up.type,
      name: HOTKEY_PLAYER.volume_up.name,
      action: HOTKEY_PLAYER.volume_up.action,
    },
    'mod+alt+arrowdown': {
      type: HOTKEY_PLAYER.volume_down.type,
      name: HOTKEY_PLAYER.volume_down.name,
      action: HOTKEY_PLAYER.volume_down.action,
    },
    'mod+alt+m': {
      type: HOTKEY_PLAYER.volume_mute.type,
      name: HOTKEY_PLAYER.volume_mute.name,
      action: HOTKEY_PLAYER.volume_mute.action,
    },
    'mod+alt+p': {
      type: HOTKEY_PLAYER.toggle_play_mode.type,
      name: HOTKEY_PLAYER.toggle_play_mode.name,
      action: HOTKEY_PLAYER.toggle_play_mode.action,
    },
    'mod+alt+9': {
      type: HOTKEY_COMMON.toggle_fullscreen.type,
      name: HOTKEY_COMMON.toggle_fullscreen.name,
      action: HOTKEY_COMMON.toggle_fullscreen.action,
    },
    'mod+alt+0': {
      type: HOTKEY_DESKTOP_LYRIC.toggle_visible.type,
      name: HOTKEY_DESKTOP_LYRIC.toggle_visible.name,
      action: HOTKEY_DESKTOP_LYRIC.toggle_visible.action,
    },
    'mod+alt+-': {
      type: HOTKEY_DESKTOP_LYRIC.toggle_lock.type,
      name: HOTKEY_DESKTOP_LYRIC.toggle_lock.name,
      action: HOTKEY_DESKTOP_LYRIC.toggle_lock.action,
    },
    'mod+alt+=': {
      type: HOTKEY_DESKTOP_LYRIC.toggle_always_top.type,
      name: HOTKEY_DESKTOP_LYRIC.toggle_always_top.name,
      action: HOTKEY_DESKTOP_LYRIC.toggle_always_top.action,
    },
  },
}

export default {
  local,
  global,
}
