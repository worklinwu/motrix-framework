import { APP_RUN_MODE, AUTO_CHECK_UPDATE_INTERVAL } from '@shared/constants'
import { checkIsNeedRun } from '@shared/utils'
import { app, dialog, ipcMain, shell } from 'electron'
import is from 'electron-is'
import { EventEmitter } from 'events'
import { readFile } from 'fs'
import { isEmpty } from 'lodash'
import { basename } from 'path'
import AutoLaunchManager from './core/AutoLaunchManager'
import ConfigManager from './core/ConfigManager'
import EnergyManager from './core/EnergyManager'
import ProtocolManager from './core/ProtocolManager'
import logger from './core/Logger'
import UpdateManager from './core/UpdateManager'
import DockManager from './ui/DockManager'
import { setupLocaleManager } from './ui/Locale'
import MenuManager from './ui/MenuManager'
import ThemeManager from './ui/ThemeManager'
import TouchBarManager from './ui/TouchBarManager'
import TrayManager from './ui/TrayManager'
import WindowManager from './ui/WindowManager'

export default class Application extends EventEmitter {
  constructor () {
    super()
    this.isReady = false
    this.init()
  }

  init () {
    this.configManager = this.initConfigManager()

    this.locale = this.configManager.getLocale()
    this.localeManager = setupLocaleManager(this.locale)
    this.i18n = this.localeManager.getI18n()

    this.setupApplicationMenu()

    this.initWindowManager()

    this.initTouchBarManager()

    this.initThemeManager()

    this.initTrayManager()

    this.initDockManager()

    this.autoLaunchManager = new AutoLaunchManager()

    this.energyManager = new EnergyManager()

    this.initUpdaterManager()

    this.initProtocolManager()

    this.handleCommands()

    this.handleEvents()

    this.handleIpcMessages()

    this.handleIpcInvokes()

    this.emit('application:initialized')
  }

  initConfigManager () {
    this.configListeners = {}
    return new ConfigManager()
  }

  offConfigListeners () {
    try {
      Object.keys(this.configListeners).forEach((key) => {
        this.configListeners[key]()
      })
    } catch (e) {
      logger.warn('[Motrix] offConfigListeners===>', e)
    }
    this.configListeners = {}
  }

  setupApplicationMenu () {
    this.menuManager = new MenuManager()
    this.menuManager.setup(this.locale)
  }

  adjustMenu () {
    if (is.mas()) {
      const visibleStates = {
        'app.check-for-updates': false
      }
      this.menuManager.updateMenuStates(visibleStates, null, null)
      this.trayManager.updateMenuStates(visibleStates, null, null)
    }
  }

  initTrayManager () {
    this.trayManager = new TrayManager({
      theme: this.configManager.getUserConfig('tray-theme'),
      systemTheme: this.themeManager.getSystemTheme(),
      speedometer: this.configManager.getUserConfig('tray-speedometer')
    })

    this.trayManager.on('mouse-down', ({ focused }) => {
      this.sendCommandToAll('application:update-tray-focused', { focused })
    })

    this.trayManager.on('mouse-up', ({ focused }) => {
      this.sendCommandToAll('application:update-tray-focused', { focused })
    })

    this.trayManager.on('drop-files', (files = []) => {
      this.handleFile(files[0])
    })
  }

  initDockManager () {
    this.dockManager = new DockManager({
      runMode: this.configManager.getUserConfig('run-mode')
    })
  }

  initWindowManager () {
    this.windowManager = new WindowManager({
      userConfig: this.configManager.getUserConfig()
    })

    this.windowManager.on('window-resized', (data) => {
      this.storeWindowState(data)
    })

    this.windowManager.on('window-moved', (data) => {
      this.storeWindowState(data)
    })

    this.windowManager.on('window-closed', (data) => {
      this.storeWindowState(data)
    })

    this.windowManager.on('enter-full-screen', (window) => {
      this.dockManager.show()
    })

    this.windowManager.on('leave-full-screen', (window) => {
      const mode = this.configManager.getUserConfig('run-mode')
      if (mode !== APP_RUN_MODE.STANDARD) {
        this.dockManager.hide()
      }
    })
  }

  storeWindowState (data = {}) {
    const enabled = this.configManager.getUserConfig('keep-window-state')
    if (!enabled) {
      return
    }

    const state = this.configManager.getUserConfig('window-state', {})
    const { page, bounds } = data
    const newState = {
      ...state,
      [page]: bounds
    }
    this.configManager.setUserConfig('window-state', newState)
  }

  start (page, options = {}) {
    const win = this.showPage(page, options)

    win.once('ready-to-show', () => {
      this.isReady = true
      this.emit('ready')
    })
    if (is.macOS()) {
      this.touchBarManager.setup(page, win)
    }
  }

  // 打开页面, 如果存在窗体就直接打开, 并聚焦; 不存在就创建一个
  showPage (page, options = {}) {
    const { openedAtLogin } = options
    const autoHideWindow = this.configManager.getUserConfig('auto-hide-window')
    return this.windowManager.openWindow(page, {
      hidden: openedAtLogin || autoHideWindow
    })
  }

  // 显示指定窗体, 不存在就跳过
  show (page = 'index') {
    this.windowManager.showWindow(page)
  }

  // 隐藏窗体
  hide (page) {
    if (page) {
      this.windowManager.hideWindow(page)
    } else {
      this.windowManager.hideAllWindow()
    }
  }

  toggle (page = 'index') {
    this.windowManager.toggleWindow(page)
  }

  closePage (page) {
    this.windowManager.destroyWindow(page)
  }

  async stop () {
    try {
      this.energyManager.stopPowerSaveBlocker()
      this.trayManager.destroy()
    } catch (err) {
      logger.warn('[Motrix] stop error: ', err.message)
    }
  }

  async quit () {
    await this.stop()
    app.exit()
  }

  // 发指令给当前激活的窗体
  sendCommand (command, ...args) {
    if (!this.emit(command, ...args)) {
      const window = this.windowManager.getFocusedWindow()
      if (window) {
        this.windowManager.sendCommandTo(window, command, ...args)
      }
    }
  }

  // 发送指令给所有窗体
  sendCommandToAll (command, ...args) {
    if (!this.emit(command, ...args)) {
      this.windowManager.getWindowList().forEach(window => {
        this.windowManager.sendCommandTo(window, command, ...args)
      })
    }
  }

  sendMessageToAll (channel, ...args) {
    this.windowManager.getWindowList().forEach(window => {
      this.windowManager.sendMessageTo(window, channel, ...args)
    })
  }

  initThemeManager () {
    this.themeManager = new ThemeManager()
    this.themeManager.on('system-theme-change', (theme) => {
      this.trayManager.handleSystemThemeChange(theme)
      this.sendCommandToAll('application:update-system-theme', { theme })
    })
  }

  initTouchBarManager () {
    if (!is.macOS()) {
      return
    }

    this.touchBarManager = new TouchBarManager()
  }

  initProtocolManager () {
    const protocols = this.configManager.getUserConfig('protocols', {})
    this.protocolManager = new ProtocolManager({
      protocols
    })
  }

  handleProtocol (url) {
    this.show()

    this.protocolManager.handle(url)
  }

  handleFile (filePath) {
    if (!filePath) {
      return
    }

    // 过滤掉不识别的文件
    // if (extname(filePath).toLowerCase() !== '.torrent') {
    //   return
    // }

    this.show()

    const name = basename(filePath)
    readFile(filePath, (err, data) => {
      if (err) {
        logger.warn(`[Motrix] read file error: ${filePath}`, err.message)
        return
      }
      const dataURL = Buffer.from(data).toString('base64')
      logger.info(name, dataURL)
      // do something
      // this.sendCommandToAll('application:new-bt-task-with-file', {
      //   name,
      //   dataURL
      // })
    })
  }

  initUpdaterManager () {
    if (is.mas()) {
      return
    }

    const enabled = this.configManager.getUserConfig('auto-check-update')
    const lastTime = this.configManager.getUserConfig('last-check-update-time')
    this.updateManager = new UpdateManager({
      autoCheck: checkIsNeedRun(enabled, lastTime, AUTO_CHECK_UPDATE_INTERVAL)
    })
    this.handleUpdaterEvents()
  }

  handleUpdaterEvents () {
    this.updateManager.on('checking', (event) => {
      this.menuManager.updateMenuItemEnabledState('app.check-for-updates', false)
      this.trayManager.updateMenuItemEnabledState('app.check-for-updates', false)
      this.configManager.setUserConfig('last-check-update-time', Date.now())
    })

    this.updateManager.on('download-progress', (event) => {
      const win = this.windowManager.getWindow('index')
      win.setProgressBar(event.percent / 100)
    })

    this.updateManager.on('update-not-available', (event) => {
      this.menuManager.updateMenuItemEnabledState('app.check-for-updates', true)
      this.trayManager.updateMenuItemEnabledState('app.check-for-updates', true)
    })

    this.updateManager.on('update-downloaded', (event) => {
      this.menuManager.updateMenuItemEnabledState('app.check-for-updates', true)
      this.trayManager.updateMenuItemEnabledState('app.check-for-updates', true)
      const win = this.windowManager.getWindow('index')
      win.setProgressBar(0)
    })

    this.updateManager.on('will-updated', async (event) => {
      this.windowManager.setWillQuit(true)
      await this.stop()
    })

    this.updateManager.on('update-error', (event) => {
      this.menuManager.updateMenuItemEnabledState('app.check-for-updates', true)
      this.trayManager.updateMenuItemEnabledState('app.check-for-updates', true)
    })
  }

  async relaunch () {
    await this.stop()
    app.relaunch()
    app.exit()
  }

  savePreference (config = {}) {
    logger.info('[Motrix] save preference:', config)
    const { system, user } = config
    if (!isEmpty(system)) {
      console.info('[Motrix] main save system config: ', system)
      this.configManager.setSystemConfig(system)
    }

    if (!isEmpty(user)) {
      console.info('[Motrix] main save user config: ', user)
      this.configManager.setUserConfig(user)
    }
  }

  // 关键代码, 与客户端的事件交互
  handleCommands () {
    this.on('application:save-preference', this.savePreference)

    this.on('application:update-tray', (tray) => {
      this.trayManager.updateTrayByImage(tray)
    })

    this.on('application:relaunch', () => {
      this.relaunch()
    })

    this.on('application:quit', () => {
      this.quit()
    })

    this.on('application:open-at-login', (openAtLogin) => {
      if (is.linux()) {
        return
      }

      if (openAtLogin) {
        this.autoLaunchManager.enable()
      } else {
        this.autoLaunchManager.disable()
      }
    })

    this.on('application:show', ({ page }) => {
      this.show(page)
    })

    this.on('application:hide', ({ page }) => {
      this.hide(page)
    })

    this.on('application:reset', () => {
      this.offConfigListeners()
      this.configManager.reset()
      this.relaunch()
    })

    this.on('application:check-for-updates', () => {
      this.updateManager.check()
    })

    this.on('application:change-theme', (theme) => {
      this.themeManager.updateSystemTheme(theme)
      this.sendCommandToAll('application:update-theme', { theme })
    })

    this.on('application:change-locale', (locale) => {
      this.localeManager.changeLanguageByLocale(locale)
        .then(() => {
          this.menuManager.handleLocaleChange(locale)
          this.trayManager.handleLocaleChange(locale)
        })
    })

    this.on('application:toggle-dock', (visible) => {
      if (visible) {
        this.dockManager.show()
      } else {
        this.dockManager.hide()
        // Hiding the dock icon will trigger the entire app to hide.
        this.show()
      }
    })

    this.on('application:auto-hide-window', (hide) => {
      if (hide) {
        this.windowManager.handleWindowBlur()
      } else {
        this.windowManager.unbindWindowBlur()
      }
    })

    this.on('application:change-menu-states', (visibleStates, enabledStates, checkedStates) => {
      this.menuManager.updateMenuStates(visibleStates, enabledStates, checkedStates)
      this.trayManager.updateMenuStates(visibleStates, enabledStates, checkedStates)
    })

    this.on('application:open-file', (event) => {
      dialog.showOpenDialog({
        properties: ['openFile']
        // filters: [
        //   {
        //     name: 'Torrent',
        //     extensions: ['torrent']
        //   }
        // ]
      }).then(({ canceled, filePaths }) => {
        if (canceled || filePaths.length === 0) {
          return
        }

        const [filePath] = filePaths
        this.handleFile(filePath)
      })
    })

    this.on('application:setup-protocols-client', (protocols) => {
      if (is.dev() || is.mas()) {
        return
      }
      logger.info('[Motrix] setup protocols client:', protocols)
      this.protocolManager.setup(protocols)
    })

    this.on('application:open-external', (url) => {
      this.openExternal(url)
    })

    this.on('help:official-website', () => {
      const url = 'https://motrix.app/'
      this.openExternal(url)
    })

    this.on('help:manual', () => {
      const url = 'https://motrix.app/manual'
      this.openExternal(url)
    })

    this.on('help:release-notes', () => {
      const url = 'https://motrix.app/release'
      this.openExternal(url)
    })

    this.on('help:report-problem', () => {
      const url = 'https://motrix.app/report'
      this.openExternal(url)
    })
  }

  openExternal (url) {
    if (!url) {
      return
    }

    shell.openExternal(url)
  }

  handleConfigChange (configName) {
    this.sendCommandToAll('application:update-preference-config', { configName })
  }

  handleEvents () {
    this.once('application:initialized', () => {
      this.adjustMenu()
    })

    this.configManager.userConfig.onDidAnyChange(() => this.handleConfigChange('user'))
    this.configManager.systemConfig.onDidAnyChange(() => this.handleConfigChange('system'))
  }

  handleIpcMessages () {
    ipcMain.on('command', (event, command, ...args) => {
      logger.log('[Motrix] ipc receive command', command, ...args)
      this.emit(command, ...args)
    })

    ipcMain.on('event', (event, eventName, ...args) => {
      logger.log('[Motrix] ipc receive event', eventName, ...args)
      this.emit(eventName, ...args)
    })
  }

  handleIpcInvokes () {
    ipcMain.handle('get-app-config', async () => {
      const systemConfig = this.configManager.getSystemConfig()
      const userConfig = this.configManager.getUserConfig()

      return {
        ...systemConfig,
        ...userConfig
      }
    })

    ipcMain.handle('show-message-box', async (event, config) => {
      return dialog.showMessageBox(config)
    })

    ipcMain.handle('show-save-dialog', async (event, config) => {
      return dialog.showSaveDialog(config)
    })

    ipcMain.handle('show-open-dialog', async (event, config) => {
      return dialog.showOpenDialog(config)
    })
  }
}
