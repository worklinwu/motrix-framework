import { isEmpty } from 'lodash'

import api from '@/api'
import { getLangDirection } from '@shared/utils'

const state = {
  config: {}
}

const getters = {
  theme: state => state.config.theme,
  locale: state => state.config.locale,
  dir: state => getLangDirection(state.config.locale)
}

const mutations = {
  UPDATE_PREFERENCE_DATA (state, config) {
    state.config = { ...state.config, ...config }
  }
}

const actions = {
  fetchPreference ({ dispatch }) {
    return new Promise((resolve) => {
      api.fetchPreference()
        .then((config) => {
          dispatch('updatePreference', config)
          resolve(config)
        })
    })
  },
  save ({ dispatch }, config) {
    if (isEmpty(config)) {
      return
    }

    dispatch('updatePreference', config)
    return api.savePreference(config)
  },
  updateThemeConfig ({ dispatch }, theme) {
    dispatch('updatePreference', { theme })
  },
  updatePreference  ({ commit }, config) {
    commit('UPDATE_PREFERENCE_DATA', config)
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
