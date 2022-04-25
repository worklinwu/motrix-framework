import { getSystemTheme } from '@/utils/native'

const state = {
  systemTheme: getSystemTheme(),
  trayFocused: false,
  aboutPanelVisible: false
}

const getters = {
}

const mutations = {
  UPDATE_SYSTEM_THEME (state, theme) {
    state.systemTheme = theme
  },
  UPDATE_TRAY_FOCUSED (state, focused) {
    state.trayFocused = focused
  },
  UPDATE_ABOUT_PANEL_VISIBLE (state, visible) {
    state.aboutPanelVisible = visible
  }
}

const actions = {
  updateSystemTheme ({ commit }, theme) {
    commit('UPDATE_SYSTEM_THEME', theme)
  },
  updateTrayFocused ({ commit }, focused) {
    commit('UPDATE_TRAY_FOCUSED', focused)
  },
  showAboutPanel ({ commit }) {
    commit('UPDATE_ABOUT_PANEL_VISIBLE', true)
  },
  hideAboutPanel ({ commit }) {
    commit('UPDATE_ABOUT_PANEL_VISIBLE', false)
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
