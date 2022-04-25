import { EventEmitter } from 'events'
import { app } from 'electron'
import is from 'electron-is'

import ExceptionHandler from './core/ExceptionHandler'
import logger from './core/Logger'
import Application from './Application'
import {
  splitArgv,
  parseArgvAsUrl,
  parseArgvAsFile
} from './utils'
import { EMPTY_STRING } from '@shared/constants'

export default class Launcher extends EventEmitter {
  constructor () {
    super()
    this.url = EMPTY_STRING
    this.file = EMPTY_STRING

    this.makeSingleInstance(() => {
      this.init()
    })
  }

  makeSingleInstance (callback) {
    // Mac App Store Sandboxed App not support requestSingleInstanceLock
    if (is.mas()) {
      callback && callback()
      return
    }

    const gotSingleLock = app.requestSingleInstanceLock()

    if (!gotSingleLock) {
      app.quit()
    } else {
      app.on('second-instance', (event, argv, workingDirectory) => {
        global.application.showPage('index')
        if (!is.macOS() && argv.length > 1) {
          this.handleAppLaunchArgv(argv)
        }
      })

      callback && callback()
    }
  }

  init () {
    this.exceptionHandler = new ExceptionHandler()

    // 判断是否是开机启动
    this.openedAtLogin = is.macOS()
      ? app.getLoginItemSettings().wasOpenedAtLogin
      : false

    // 判断是否是带参数启动程序
    if (process.argv.length > 1) {
      this.handleAppLaunchArgv(process.argv)
    }

    logger.info('[Motrix] openedAtLogin:', this.openedAtLogin)

    this.handleAppEvents()
  }

  handleAppEvents () {
    this.handleOpenUrl()
    this.handleOpenFile()

    this.handleAppReady()
    this.handleAppWillQuit()
  }

  /**
   * handleOpenUrl
   * Event 'open-url' macOS only
   * "name": "Motrix Protocol",
   * "schemes": ["mo", "motrix"]
   */
  handleOpenUrl () {
    if (is.mas() || !is.macOS()) {
      return
    }
    app.on('open-url', (event, url) => {
      logger.info(`[Motrix] open-url: ${url}`)
      event.preventDefault()
      this.url = url
      this.sendUrlToApplication()
    })
  }

  /**
   * handleOpenFile
   * Event 'open-file' macOS only
   * handle open torrent file
   */
  handleOpenFile () {
    if (!is.macOS()) {
      return
    }
    app.on('open-file', (event, path) => {
      logger.info(`[Motrix] open-file: ${path}`)
      event.preventDefault()
      this.file = path
      this.sendFileToApplication()
    })
  }

  /**
   * handleAppLaunchArgv
   * For Windows, Linux
   * @param {array} argv
   */
  handleAppLaunchArgv (argv) {
    logger.info('[Motrix] handleAppLaunchArgv:', argv)

    // args: array, extra: map
    const { args, extra } = splitArgv(argv)
    logger.info('[Motrix] split argv args:', args)
    logger.info('[Motrix] split argv extra:', extra)
    if (extra['--opened-at-login'] === '1') {
      this.openedAtLogin = true
    }

    const file = parseArgvAsFile(args)
    if (file) {
      this.file = file
      this.sendFileToApplication()
    }

    const url = parseArgvAsUrl(args)
    if (url) {
      this.url = url
      this.sendUrlToApplication()
    }
  }

  sendUrlToApplication () {
    if (this.url && global.application && global.application.isReady) {
      global.application.handleProtocol(this.url)
      this.url = EMPTY_STRING
    }
  }

  sendFileToApplication () {
    if (this.file && global.application && global.application.isReady) {
      global.application.handleFile(this.file)
      this.file = EMPTY_STRING
    }
  }

  handleAppReady () {
    app.on('ready', () => {
      global.application = new Application() // 关键

      const { openedAtLogin } = this

      // 打开窗口
      global.application.start('index', {
        openedAtLogin
      })

      global.application.on('ready', () => {
        this.sendUrlToApplication()

        this.sendFileToApplication()
      })
    })

    app.on('activate', () => {
      if (global.application) {
        logger.info('[Motrix] activate')
        global.application.showPage('index')
      }
    })
  }

  handleAppWillQuit () {
    app.on('will-quit', () => {
      logger.info('[Motrix] will-quit')
      if (global.application) {
        // 关闭应用前要先关闭其他一些关联的服务
        global.application.stop()
      }
    })
  }
}
