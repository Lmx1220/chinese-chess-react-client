import moment from 'moment'
import config from '@/config'

const originalLog = console.log

// // 重写 console.log
// console.log = function (...args) {
//   if (!config.debug) {
//     return
//   }
//   // 1. 提取原始调用位置（关键步骤）
//   let originalPosition = ''
//   try {
//     // 创建 Error 获取调用栈，第2行是原始调用位置（0: Error，1: 当前重写函数，2: 实际调用处）
//     // eslint-disable-next-line unicorn/error-message
//     const stackLines = new Error().stack?.split('\n') || []
//     // 不同环境（浏览器/Node.js）的栈格式可能不同，取第2-3行尝试匹配
//     const targetLine = stackLines[2] || stackLines[3]
//     if (targetLine) {
//       // 提取位置信息（例如："at myFunction (file.js:10:5)" 或 "file.js:10:5"）
//       originalPosition = targetLine.trim().replace(/^at\s+/, '')
//     }
//   }
//   catch {
//     originalPosition = 'unknown position'
//   }
//   const [message, optionalParam] = args
//   const formattedMessage = typeof message === 'string'
//     ? message
//     : JSON.stringify(message) // 对象转为 JSON 字符串
//   const additionalInfo = optionalParam !== undefined ? optionalParam : ''
//   const timestamp = moment().format('YYYY-MM-DD HH:mm:ss SSS') // 时间戳
//
//   // 2. 附加原始位置并调用原始 log（保留上下文）
//   originalLog.call(
//     this, // 确保上下文正确
//     `[${timestamp}]\n[${originalPosition}]\n`, // 时间戳 + 原始位置
//     formattedMessage,
//     additionalInfo,
//   )
// }

/**
 * 常用日志
 * @param msg
 * @param param
 */
export function log(msg, ...param) {
  if (config.debug) {
    const msgStr = typeof msg === 'string' ? msg : JSON.stringify(msg)
    const outParam = typeof param !== 'undefined' ? param : ''
    originalLog(
      `${moment().format('YYYY-MM-DD HH:mm:ss SSS')} - ${msgStr}`,
      outParam,
    )
  }
}

/**
 * 需要醒目的日志
 * @param msg
 * @param param
 */
export function error(msg, ...param) {
  const msgStr = typeof msg === 'string' ? msg : JSON.stringify(msg)
  const outParam = typeof param !== 'undefined' ? param : ''
  console.error(
    `${moment().format('YYYY-MM-DD HH:mm:ss SSS')} - ${msgStr}`,
    outParam,
  )
}
