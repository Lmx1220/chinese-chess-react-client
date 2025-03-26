import config from '@/config'
import moment from 'moment'

console.log = (function (originalLog) {
  return function (message, optionalParam) {
    if (config.debug) { // 只有 debug 模式开启时才会打印日志
      const formattedMessage = typeof message === 'string' ? message : JSON.stringify(message)
      const additionalInfo = optionalParam !== undefined ? optionalParam : ''
      originalLog(`${moment().format('YYYY-MM-DD HH:mm:ss SSS')} - ${formattedMessage}`, additionalInfo)
    }
  }
}(console.log))
console.error = (function (originalLog) {
  return function (message, optionalParam) {
    const formattedMessage = typeof message === 'string' ? message : JSON.stringify(message)
    const additionalInfo = optionalParam !== undefined ? optionalParam : ''
    originalLog(`${moment().format('YYYY-MM-DD HH:mm:ss SSS')} - ${formattedMessage}`, additionalInfo)
  }
}(console.error))

/**
 * 常用日志
 * @param msg
 * @param param
 */
export function log(msg, ...param) {
  if (config.debug) {
    const msgStr = (typeof msg === 'string') ? msg : JSON.stringify(msg)
    const outParam = (typeof param !== 'undefined') ? param : ''
    console.log(`${moment().format('YYYY-MM-DD HH:mm:ss SSS')} - ${msgStr}`, outParam)
  }
}

/**
 * 需要醒目的日志
 * @param msg
 * @param param
 */
export function error(msg, ...param) {
  const msgStr = (typeof msg === 'string') ? msg : JSON.stringify(msg)
  const outParam = (typeof param !== 'undefined') ? param : ''
  console.error(`${moment().format('YYYY-MM-DD HH:mm:ss SSS')} - ${msgStr}`, outParam)
}
