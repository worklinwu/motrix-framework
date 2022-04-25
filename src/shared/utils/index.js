import {
  camelCase,
  isArray,
  isEmpty,
  isFunction,
  isNaN,
  isPlainObject,
  kebabCase,
  omitBy,
  pick
} from 'lodash'
import dayjs from 'dayjs'

import { userKeys, systemKeys, needRestartKeys } from '@shared/configKeys'
import {
  APP_THEME
} from '@shared/constants'

dayjs.locale('zh-cn')

export function timeRemaining (totalLength, completedLength, downloadSpeed) {
  const remainingLength = totalLength - completedLength
  return Math.ceil(remainingLength / downloadSpeed)
}

/**
 * timeFormat
 * @param {int} seconds
 * @param {string} prefix
 * @param {string} suffix
 * @param {object} i18n
 * i18n: {
 *  gt1d: 'More than one day',
 *  hour: 'h',
 *  minute: 'm',
 *  second: 's'
 * }
 */
export function timeFormat (seconds, { prefix = '', suffix = '', i18n }) {
  let result = ''
  let hours = ''
  let minutes = ''
  let secs = seconds || 0
  const i = {
    gt1d: '> 1 day',
    hour: 'h',
    minute: 'm',
    second: 's',
    ...i18n
  }

  if (secs <= 0) {
    return ''
  }
  if (secs > 86400) {
    return `${prefix} ${i.gt1d} ${suffix}`
  }
  if (secs > 3600) {
    hours = `${Math.floor(secs / 3600)}${i.hour} `
    secs %= 3600
  }
  if (secs > 60) {
    minutes = `${Math.floor(secs / 60)}${i.minute} `
    secs %= 60
  }
  secs += i.second
  result = hours + minutes + secs
  return result ? `${prefix} ${result} ${suffix}` : result
}

export function localeDateTimeFormat (timestamp, locale) {
  if (!timestamp) {
    return ''
  }

  if (`${timestamp}`.length === 10) {
    timestamp *= 1000
  }
  const date = new Date(timestamp)
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric'
  })
}

export function ellipsis (str = '', maxLen = 64) {
  const len = str.length
  let result = str
  if (len < maxLen) {
    return result
  }

  if (maxLen > 0) {
    result = `${result.substring(0, maxLen)}...`
  }

  return result
}

export function changeKeysCase (obj, caseConverter) {
  const result = {}
  if (isEmpty(obj) || !isFunction(caseConverter)) {
    return result
  }

  for (const [k, value] of Object.entries(obj)) {
    const key = caseConverter(k)
    result[key] = value
  }

  return result
}

export function changeKeysToCamelCase (obj) {
  return changeKeysCase(obj, camelCase)
}

export function changeKeysToKebabCase (obj) {
  return changeKeysCase(obj, kebabCase)
}

export function validateNumber (n) {
  return !isNaN(parseFloat(n)) && isFinite(n) && Number(n) === n
}

export function fixValue (obj) {
  const result = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === 'true') {
      result[k] = true
    } else if (v === 'false') {
      result[k] = false
    } else if (validateNumber(v)) {
      result[k] = Number(v)
    } else {
      result[k] = v
    }
  }
  return result
}

export function separateConfig (options) {
  // user
  const user = {}
  // system
  const system = {}
  // others
  const others = {}

  for (const [k, v] of Object.entries(options)) {
    if (userKeys.indexOf(k) !== -1) {
      user[k] = v
    } else if (systemKeys.indexOf(k) !== -1) {
      system[k] = v
    } else {
      others[k] = v
    }
  }
  return {
    user, system, others
  }
}

export function compactUndefined (arr = []) {
  return arr.filter((item) => {
    return item !== undefined
  })
}

const supportRtlLocales = [
  /* 'العربية', Arabic */
  'ar',
  /* 'فارسی', Persian */
  'fa',
  /* 'עברית', Hebrew */
  'he',
  /* 'Kurdî / كوردی', Kurdish */
  'ku',
  /* 'پنجابی', Western Punjabi */
  'pa',
  /* 'پښتو', Pashto, */
  'ps',
  /* 'سنڌي', Sindhi */
  'sd',
  /* 'اردو', Urdu */
  'ur',
  /* 'ייִדיש', Yiddish */
  'yi'
]
export function isRTL (locale = 'en-US') {
  return supportRtlLocales.includes(locale)
}

export function getLangDirection (locale = 'en-US') {
  return isRTL(locale) ? 'rtl' : 'ltr'
}

export function diffConfig (current = {}, next = {}) {
  const curr = pick(current, Object.keys(next))
  const result = omitBy(next, (val, key) => {
    if (isArray(val) || isPlainObject(val)) {
      return JSON.stringify(curr[key]) === JSON.stringify(val)
    }
    return curr[key] === val
  })
  return result
}

export function calcFormLabelWidth (locale) {
  return locale.startsWith('de') ? '28%' : '25%'
}

export function checkIsNeedRestart (changed = {}) {
  let result = false

  if (isEmpty(changed)) {
    return result
  }

  const kebabCaseChanged = changeKeysToKebabCase(changed)
  needRestartKeys.some((key) => {
    if (Object.keys(kebabCaseChanged).includes(key)) {
      result = true
      return true
    }
    return false
  })

  return result
}

export const checkIsNeedRun = (enable, lastTime, interval) => {
  if (!enable) {
    return false
  }

  return (Date.now() - lastTime > interval)
}

export const getInverseTheme = (theme) => {
  return (theme === APP_THEME.LIGHT) ? APP_THEME.DARK : APP_THEME.LIGHT
}

export const changedConfig = { basic: {}, advanced: {} }
export const backupConfig = { theme: undefined, locale: undefined }
