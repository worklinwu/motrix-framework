import { app, dialog } from 'electron'
import is from 'electron-is'

import logger from './Logger'

const defaults = {
  showDialog: !is.dev()
}
export default class ExceptionHandler {
  constructor (options) {
    this.options = {
      ...defaults,
      ...options
    }

    this.setup()
  }

  setup () {
    if (is.dev()) {
      return
    }
    const { showDialog } = this.options
    // 收集未捕获的异常, 避免程序崩溃
    process.on('uncaughtException', (err) => {
      const { message, stack } = err
      logger.error(`[Motrix] Uncaught exception: ${message}`)
      logger.error(stack)

      if (showDialog && app.isReady()) {
        dialog.showErrorBox('Error: ', message)
      }
    })
  }
}
