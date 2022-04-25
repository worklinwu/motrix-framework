import logger from 'electron-log'
import dayjs from 'dayjs'
import util from 'util'

const level = process.env.NODE_ENV === 'development' ? 'debug' : 'silly'
logger.transports.console.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'
logger.transports.console.level = level
logger.transports.file.fileName = `${dayjs().format('YYYY-MM-DD')}.log`
logger.transports.file.level = level

const styles = {
  // styles
  bold: [1, 22],
  italic: [3, 23],
  underline: [4, 24],
  inverse: [7, 27],
  // grayscale
  white: [37, 39],
  grey: [90, 39],
  black: [90, 39],
  // colors
  blue: [34, 39],
  cyan: [36, 39],
  green: [32, 39],
  magenta: [35, 39],
  red: [91, 39],
  yellow: [33, 39]
}

const levels = {
  error: { id: 1, color: 'red' },
  warn: { id: 2, color: 'yellow' },
  info: { id: 3, color: 'green' },
  verbose: { id: 4, color: 'blue' },
  debug: { id: 5, color: 'cyan' },
  silly: { id: 6, color: 'magenta' }
}

function colorizeStart (style) {
  return style ? `\x1B[${styles[style][0]}m` : ''
}

function colorizeEnd (style) {
  return style ? `\x1B[${styles[style][1]}m` : ''
}

/**
 * Taken from masylum's fork (https://github.com/masylum/log4js-node)
 */
function colorize (str, style) {
  return colorizeStart(style) + str + colorizeEnd(style)
}

logger.transports.console = (msg) => {
  const messageLevel = levels[msg.level]
  // 如果是可以打印的等级
  if (messageLevel.id <= levels[level].id) {
    const time = dayjs(msg.date).format('YYYY-MM-DD HH:mm:ss.SSS')
    const color = messageLevel.color
    const header = colorize(util.format('[%s][%s]', time, msg.level.toUpperCase()), color)
    const text = colorize(util.format(...msg.data), color)
    const message = util.format('%s %s', header, text)
    console.log(message)
  }
}

console.error = logger.error
console.warn = logger.warn
console.info = logger.info
console.verbose = logger.verbose
console.debug = logger.debug
console.silly = logger.silly

export default logger
