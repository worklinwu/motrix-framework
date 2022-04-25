import is from 'electron-is'
import { shell, nativeTheme } from '@electron/remote'
import { access, constants } from 'fs'
import { Message } from 'element-ui'

import { APP_THEME } from '@shared/constants'

export function showItemInFolder (fullPath, { errorMsg }) {
  if (!fullPath) {
    return
  }

  access(fullPath, constants.F_OK, (err) => {
    console.log(`[Motrix] ${fullPath} ${err ? 'does not exist' : 'exists'}`)
    if (err) {
      Message.error(errorMsg)
      return
    }

    shell.showItemInFolder(fullPath)
  })
}

export const openItem = async (fullPath) => {
  if (!fullPath) {
    return
  }

  const result = await shell.openPath(fullPath)
  return result
}

export function getSystemTheme () {
  let result = APP_THEME.LIGHT
  if (!is.macOS()) {
    return result
  }
  result = nativeTheme.shouldUseDarkColors ? APP_THEME.DARK : APP_THEME.LIGHT
  return result
}
