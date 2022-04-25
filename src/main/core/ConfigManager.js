import { app } from 'electron'
import is from 'electron-is'
import Store from 'electron-store'

import {
  getUserDownloadsPath
} from '../utils/index'
import {
  APP_RUN_MODE,
  APP_THEME,
  LOGIN_SETTING_OPTIONS
} from '@shared/constants'

export default class ConfigManager {
  constructor () {
    this.systemConfig = {}
    this.userConfig = {}

    this.init()
  }

  init () {
    this.initSystemConfig()
    this.initUserConfig()
  }

  initSystemConfig () {
    this.systemConfig = new Store({
      name: 'system',
      /* eslint-disable quote-props */
      defaults: {
        'dir': getUserDownloadsPath()
      }
      /* eslint-enable quote-props */
    })
    this.fixSystemConfig()
  }

  initUserConfig () {
    this.userConfig = new Store({
      name: 'user',
      // Schema need electron-store upgrade to 3.x.x,
      // but it will cause the application build to fail.
      // schema: {
      //   theme: {
      //     type: 'string',
      //     enum: ['auto', 'light', 'dark']
      //   }
      // },
      /* eslint-disable quote-props */
      defaults: {
        'auto-check-update': is.macOS(),
        'auto-hide-window': false,
        'hide-app-menu': is.windows() || is.linux(),
        'keep-window-state': false,
        'last-check-update-time': 0,
        'locale': app.getLocale(),
        'open-at-login': false,
        'run-mode': APP_RUN_MODE.STANDARD,
        'theme': APP_THEME.AUTO,
        'tray-theme': APP_THEME.AUTO,
        'window-state': {}
      }
      /* eslint-enable quote-props */
    })
    this.fixUserConfig()
  }

  fixSystemConfig () {
    // Remove aria2c unrecognized options
    // const { others } = separateConfig(this.systemConfig.store)
    // if (!others) {
    //   return
    // }
    //
    // Object.keys(others).forEach(key => {
    //   this.systemConfig.delete(key)
    // })
  }

  fixUserConfig () {
    // Fix the value of open-at-login when the user delete
    // the Motrix self-starting item through startup management.
    const openAtLogin = app.getLoginItemSettings(LOGIN_SETTING_OPTIONS).openAtLogin
    if (this.getUserConfig('open-at-login') !== openAtLogin) {
      this.setUserConfig('open-at-login', openAtLogin)
    }
  }

  getSystemConfig (key, defaultValue) {
    if (typeof key === 'undefined' &&
        typeof defaultValue === 'undefined') {
      return this.systemConfig.store
    }

    return this.systemConfig.get(key, defaultValue)
  }

  getUserConfig (key, defaultValue) {
    if (typeof key === 'undefined' &&
        typeof defaultValue === 'undefined') {
      return this.userConfig.store
    }

    return this.userConfig.get(key, defaultValue)
  }

  getLocale () {
    return this.getUserConfig('locale') || app.getLocale()
  }

  setSystemConfig (...args) {
    this.systemConfig.set(...args)
  }

  setUserConfig (...args) {
    this.userConfig.set(...args)
  }

  reset () {
    this.systemConfig.clear()
    this.userConfig.clear()
  }
}
