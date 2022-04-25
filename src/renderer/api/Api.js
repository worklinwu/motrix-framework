import { ipcRenderer } from 'electron'
import is from 'electron-is'
import { isEmpty } from 'lodash'
import {
  separateConfig,
  compactUndefined,
  changeKeysToCamelCase,
  changeKeysToKebabCase
} from '@shared/utils'

export default class Api {
  constructor (options = {}) {
    this.options = options

    this.init()
  }

  async init () {
    this.config = await this.loadConfig()
  }

  loadConfigFromLocalStorage () {
    // TODO
    const result = {}
    return result
  }

  async loadConfigFromNativeStore () {
    const result = await ipcRenderer.invoke('get-app-config')
    return result
  }

  async loadConfig () {
    let result = is.renderer()
      ? await this.loadConfigFromNativeStore()
      : this.loadConfigFromLocalStorage()

    result = changeKeysToCamelCase(result)
    return result
  }

  fetchPreference () {
    return new Promise((resolve) => {
      this.config = this.loadConfig()
      resolve(this.config)
    })
  }

  savePreference (params = {}) {
    const kebabParams = changeKeysToKebabCase(params)
    if (is.renderer()) {
      return this.savePreferenceToNativeStore(kebabParams)
    } else {
      return this.savePreferenceToLocalStorage(kebabParams)
    }
  }

  savePreferenceToLocalStorage () {
    // TODO
  }

  savePreferenceToNativeStore (params = {}) {
    const { user, system, others } = separateConfig(params)
    const config = {}

    if (!isEmpty(user)) {
      console.info('[Motrix] save user config: ', user)
      config.user = user
    }

    if (!isEmpty(system)) {
      console.info('[Motrix] save system config: ', system)
      config.system = system
      this.updateActiveTaskOption(system)
    }

    if (!isEmpty(others)) {
      console.info('[Motrix] save config found illegal key: ', others)
    }

    ipcRenderer.send('command', 'application:save-preference', config)
  }

  getGlobalOption () {
    return new Promise((resolve) => {
      this.client.call('getGlobalOption')
        .then((data) => {
          resolve(changeKeysToCamelCase(data))
        })
    })
  }

  getOption (params = {}) {
    const { gid } = params
    const args = compactUndefined([gid])

    return new Promise((resolve) => {
      this.client.call('getOption', ...args)
        .then((data) => {
          resolve(changeKeysToCamelCase(data))
        })
    })
  }
}
