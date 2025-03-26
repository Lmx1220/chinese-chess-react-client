import { AesEncryption } from '@/utils/cipher.js'

export const sleep = (n = 500) => new Promise(r => setTimeout(r, n))
const aes = new AesEncryption()
const apiData = [
  {
    name: 'connect',
    serviceList: [],
  },
  {
    name: 'disconnect',
    serviceList: [],
  },
  {
    name: 'connect_error',
    serviceList: [],
  },
  {
    name: 'connect_timeout',
    serviceList: [],
  },
  {
    name: 'reconnect_attempt',
    serviceList: [],
  },
  {
    name: 'reconnect_error',
    serviceList: [],
  },
  {
    name: 'reconnect_failed',
    serviceList: [],
  },
  {
    name: 'reconnecting',
    serviceList: [],
  },
  {
    name: 'reconnect',
    serviceList: [],
  },
  {
    name: 'exceptionRespApi',
    serviceList: [],
  },
  {
    name: 'roomExceptionRespApi',
    serviceList: [],
  },
  {
    name: 'enemyLeaveRoomRespApi',
    serviceList: [],
  },
  {
    name: 'joinRoomRespApi',
    serviceList: [],
  },
  {
    name: 'leaveRoomRespApi',
    serviceList: [],
  },
  {
    name: 'moveChessRespApi',
    serviceList: [],
  },
  {
    name: 'syncRoomDataRespApi',
    serviceList: [],
  },
  {
    name: 'syncBattleDataRespApi',
    serviceList: [],
  },
  {
    name: 'chatRespApi',
    serviceList: [],
  },
  {
    name: 'gameWinRespApi',
    serviceList: [],
  },
  {
    name: 'matchSuccessRespApi',
    serviceList: [],
  },
  {
    name: 'allowInBattleApi',
    serviceList: [],
  },
  {
    name: 'watchNotifyRespApi',
    serviceList: [],
  },
  {
    name: 'sessionRecoverNotifyApi',
    serviceList: [],
  },
  {
    name: 'sessionRecoverRespApi',
    serviceList: [],
  },
  {
    name: 'enemyOfflineRespApi',
    serviceList: [],
  },
  {
    name: 'userConflictRespApi',
    serviceList: [],
  },
  {
    name: 'enemyOnlineRespApi',
    serviceList: [],
  },
  {
    name: 'sendPeaceRespApi',
    serviceList: [],
  },
  {
    name: 'sendPeaceResultRespApi',
    serviceList: [],
  },
  {
    name: 'inviteUserRespApi',
    serviceList: [],
  },
  {
    name: 'inviteUserResultRespApi',
    serviceList: [],
  },
  {
    name: 'backMoveRespApi',
    serviceList: [],
  },
  {
    name: 'backMoveResultRespApi',
    serviceList: [],
  },
  {
    name: 'userTimeRespApi',
    serviceList: [],
  },
  {
    name: 'versionRespApi',
    serviceList: [],
  },
  {
    name: 'versionDetailApi',
    serviceList: [],
  },
  {
    name: 'onlineCountRespApi',
    serviceList: [],
  },
  {
    name: 'onlineUserChangeRespApi',
    serviceList: [],
  },
  {
    name: 'onlineUserListRespApi',
    serviceList: [],

  },
  {
    name: 'battleCountRespApi',
    serviceList: [],
  },
  {
    name: 'kickUserRespApi',
    serviceList: [],
  },
]

class SocketEvent {
  // 当前socket
  static localSocket = undefined

  // 开启所有监听
  static startAllServiceLister = (socket) => {
    // eslint-disable-next-line array-callback-return
    apiData.map((api) => {
      socket.on(api.name, (data) => {
        // eslint-disable-next-line array-callback-return
        api.serviceList.map((service) => {
          // eslint-disable-next-line no-eval
          eval(service.callback)(aes.decryptByAES(data))
        })
      })
    })
    console.log(`监听事件已注册成功`)
  }

  /**
   * 设置socket
   * @param socket Socket
   */
  static setSocket(socket) {
    this.localSocket = socket
  }

  /**
   * 注册回调监听
   *
   * @param name 要注册的api名称
   * @param serviceId 当前要注册的服务归属快id
   * @param callback 回调函数
   * @returns {boolean} 是否注册成功
   */
  static on(name, serviceId, callback) {
    const apiObj = apiData.find(service => service.name === name)
    if (!apiObj) {
      // tips: 遇此错误请在本类的 apiData 中加入本ApiName.
      console.error(`需要注册的ApiName: ${name} 无法被找到，请进行注册`)
      return false
    }
    const id = `${serviceId}.${name}`
    // 寻找一下是否有重复的回调
    const index = apiObj.serviceList.findIndex(service => service.id === id)
    if (index !== -1) {
      apiObj.serviceList.splice(index, 1, { id, callback })
    }
    else {
      apiObj.serviceList.push({ id, callback })
    }
    return true
  }

  /**
   * 移除监听
   * @param serviceList 要移除的监听的命名空间
   */
  static off(serviceList) {
    apiData.map((api) => {
      api.serviceList = api.serviceList.filter(service => !service.id.startsWith(serviceList))
      return api
    })
  }

  /**
   * 全局发送的方法
   * @param api
   * @param params
   * @param fn
   */
  static emit(api, params, fn) {
    setTimeout(async () => {
      console.log(`请求api: ${api}, 参数:`, params)
      // 等待 socket 加载
      while (!this.localSocket) {
        console.log('等待socket加载')
        await sleep(2)
      }
      const encryptedData = aes.encryptByAES(params)
      // 发送消息
      this.localSocket.emit(api, encryptedData, (response) => {
        if (fn && typeof fn === 'function') {
          let decryptedData = null
          try {
            decryptedData = aes.decryptByAES(response)
          }
          catch (error) {
            console.error(`Api: ${api} 传回的消息错误，消息体为：`, response, error)
          }
          fn(decryptedData)
        }
      })
    }, 0)
  };
}

export default SocketEvent
