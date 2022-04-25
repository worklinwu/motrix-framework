import { powerSaveBlocker } from 'electron'

import logger from './Logger'

let psbId
export default class EnergyManager {
  // 阻止系统进入低功耗 (休眠) 模式
  startPowerSaveBlocker () {
    if (psbId && powerSaveBlocker.isStarted(psbId)) {
      return
    }

    // 阻止应用被暂停
    psbId = powerSaveBlocker.start('prevent-app-suspension')
    logger.info('[Motrix] start power save blocker:', psbId)
  }

  stopPowerSaveBlocker () {
    if (typeof psbId === 'undefined' || !powerSaveBlocker.isStarted(psbId)) {
      return
    }

    powerSaveBlocker.stop(psbId)
    logger.info('[Motrix] stop power save blocker:', psbId)
    psbId = undefined
  }
}
