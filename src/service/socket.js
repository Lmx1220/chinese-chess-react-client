import config from '@/config.js'
import { AesEncryption } from '@/utils/cipher.js'
import FingerprintJS from '@fingerprintjs/fingerprintjs'
import { io } from 'socket.io-client'

class SocketUtils {
  static getSocket() {
    return new Promise((resolve, reject) => {
      this.getServiceUri()
        .then((uri) => {
          resolve(createSocket(uri))
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  // MwMizHMizkKIXmm6EPpdVqAvZI01VACTxZh7cOHzYowJlr+/4boTyNePqahPfvRBpaYcRvGXKqiatyZuNhlg9G6zSyOPw836cSS9XhmRnr552D5mZMHcg85a3Fm73C/4
  // XOTOKxjWbqfdCVAsI0HjV50RuQ7CQ/T4gaOXv3H3yJ4h7TiBoH8hnFHzAYH4L7xGEFF3GVxW/9akYY/XbfaVn9iEEw+D0nJVWjpjI7sNoBaGDiG/J4iHqpWeQWN6qs37
  static getServiceUri() {
    return new Promise((resolve, reject) => {
      this.getFinger()
        .then((fingerprint) => {
          const token = this.generateToken(16, 10)
          const hex = this.generateToken(16, 10)
          const time = new Date()
          const data = JSON.stringify({
            token,
            hex,
            time,
          })
          const encryptedData = encryptData(data, hex, token)
          const serviceUri = constructServiceUri(token, fingerprint, hex, encryptedData)
          resolve(serviceUri)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  /**
   * 获取设备指纹
   * @returns {Promise<unknown>} 获取设备指纹
   */
  static getFinger() {
    return new Promise((resolve, reject) => {
      // 获取设备指纹
      getDeviceFingerprint()
        .then((fingerprint) => {
          resolve(fingerprint)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  static generateToken(len, radix = 10) {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('')
    const uuid = []
    let i
    radix = radix || chars.length
    if (len) {
      // Compact form
      for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix]
    }
    else {
      // rfc4122, version 4 form
      let r
      // rfc4122 requires these characters
      uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-'
      uuid[14] = '4'
      // Fill in random data.  At i==19 set the high bits of clock sequence as
      // per rfc4122, sec. 4.1.5
      for (i = 0; i < 36; i++) {
        if (!uuid[i]) {
          r = 0 | Math.random() * 16
          uuid[i] = chars[(i === 19) ? (r & 0x3) | 0x8 : r]
        }
      }
    }
    return uuid.join('')
  }
}

// 辅助函数
function createSocket(uri) {
  // 创建并返回 socket 连接
  return io(uri, {
    // 服务器指定的命名空间
    path: config.path,
    // 是否重连接
    reconnection: config.reconnection,
    // 重连接次数
    reconnectionAttempts: config.reconnectionAttempts,
    // 尝试连接前等待时间（单位：秒）
    reconnectionDelay: config.reconnectionDelay,
    // 单次重连最大的等待时间（单位：秒）
    reconnectionDelayMax: config.reconnectionDelayMax,
    // The randomization factor helps smooth
    // the load induced by the reconnection attempts of multiple clients,
    // in case a server goes down
    randomizationFactor: 0.5,
    // 连接服务器的超时时间(默认20秒)
    timeout: config.requestTimeout,
    // socket轮寻方式
    transports: config.transports,
  })
}

/**
 * 加密数据
 * @param data 数据
 * @param hex hex
 * @param token token
 * @returns {string} The encrypted data as a string.
 */
function encryptData(data, hex, token) {
  // 使用 key 和 token 加密数据
  const aesEncryption = new AesEncryption({
    key: token,
    iv: hex,
  })
  return aesEncryption.encryptByAES(data)
}

/**
 * 构建服务 URI
 * @param token token
 * @param fingerprint 指望
 * @param hex hex
 * @param encryptedData 加密数据
 * @returns {string}  The encrypted data as a string.
 */
function constructServiceUri(token, fingerprint, hex, encryptedData) {
  // 构建服务 URI
  return config.serviceUri.concat('?token=', token).concat('&f=', fingerprint.toString()).concat('&h=', hex).concat('&v=', encryptedData)
}

/**
 * 获取设备指纹
 * @returns {Promise<string>} 设备指纹
 */
function getDeviceFingerprint() {
  return new Promise((resolve, reject) => {
    // 获取设备指纹
    const fpPromise = FingerprintJS.load()
    fpPromise
      .then(fp => fp.get())
      .then((result) => {
        resolve(result.visitorId)
      })
      .catch((error) => {
        reject(error)
      })
  })
}

export default SocketUtils
