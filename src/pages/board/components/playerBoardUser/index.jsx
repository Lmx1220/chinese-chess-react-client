import { Badge, Dialog, Grid, Image, Toast } from 'antd-mobile'
import { ActionSheet, Modal } from 'antd-mobile-v2'
import { Component } from 'react'
import backMoveImg from '@/assets/backMove.png'
import chatImg from '@/assets/chat.png'
import chatHistoryImg from '@/assets/chatHistory.png'
import failImg from '@/assets/fail.png'
import peaceImg from '@/assets/peace.png'
import skinImg from '@/assets/skin.png'

import AdvancedBtn from '@/button/index.jsx'
import config from '@/config.js'
import SocketEvent from '@/service/event.js'
import { formatTime } from '@/utils/board-canvas-utils.js'
import { changeSkin } from '@/utils/map-res.js'
import { btnSound, messageSound, playSound } from '@/utils/sounds-res.js'
import styles from './index.module.less'

class PlayerBoardUser extends Component {
  constructor(props) {
    super(props)

    // 发送观战人数统计
    this.sendWatchCount = (event) => {
      const isDocumentHidden = event || document.hidden
      if (!isDocumentHidden) {
        SocketEvent.emit('watchCountApi', {
          userId: this.props.userId,
          roomId: this.props.roomId,
        }, (response) => {
          console.log('请求观战人数数据返回:', response)
        })
      }
    }

    // 开始消息监听
    this.startMessageListen = () => {
      // 监听观战通知响应
      SocketEvent.on('watchNotifyRespApi', this.moduleId, (response) => {
        // 增加对 response 结构的检查
        if (response && response.code) {
          console.log('对局时有用用户加入或离开观战,resp: ', response)
          if (response.code === 'success') {
            const { action, watchUserList } = response.data || {}
            if (action === 'set') {
              this.setState({
                watchUserList,
              })
            }
            else if (action === 'add' || action === 'sub') {
              const [firstUser] = watchUserList
              // const firstUser = (watchUserList && Object(Uh["a"])(watchUserList, 1)[0]) || {};
              const userId = firstUser.userId
              const userName = firstUser.userName
              const currentWatchUserList = this.state.watchUserList || []
              const index = currentWatchUserList.findIndex(user => user.userId === userId)
              if (action === 'add' && index === -1) {
                currentWatchUserList.push({
                  userId,
                  userName,
                })
              }
              else if (action === 'sub' && index !== -1) {
                currentWatchUserList.splice(index, 1)
              }
              this.setState({
                watchUserList: currentWatchUserList,
              })
            }
          }
        }
        else {
          console.error('观战通知响应数据格式错误:', response)
        }
      })

      // 监听聊天响应
      SocketEvent.on('chatRespApi', this.moduleId, (response) => {
        console.log('聊天消息,返回:', response)
        if (response.code === 'success') {
          const { chatHistory, watchChatCache } = this.state
          const { userId, userName, content } = response.data
          const { playOne, playTwo } = this.props
          const newMessage = {
            userId,
            userName,
            content,
          }
          chatHistory.push(newMessage)
          if (userId === playOne.userId || userId === playTwo.userId) {
            this.setState({
              enemyMsg: content,
              enemyMsgShow: true,
              enemyStartDate: null,
              chatHistory,
            })
          }
          else {
            watchChatCache.push(newMessage)
            this.setState({
              watchChatCache,
              watchChatShow: false,
            })
          }
          this.msgWindowToBottom()
        }
        else {
          Toast.show(response.msg)
        }
      })

      // 监听敌方离线响应
      SocketEvent.on('enemyOfflineRespApi', this.moduleId, (response) => {
        console.log('用户离线消息,返回:', response)
        if (response.code === 'success') {
          const { offlineUserId, offlineTime, offlineTimeout } = response.data
          if (this.props.userId !== offlineUserId) {
            this.setState({
              offlineMsgShow: true,
              offlineTime,
              offlineTimeout,
            })
          }
        }
      })

      // 监听敌方在线响应
      SocketEvent.on('enemyOnlineRespApi', this.moduleId, (response) => {
        console.log('对方在线消息,返回:', response)
        if (response.code === 'success') {
          this.setState({
            offlineMsgShow: false,
            offlineMsg: null,
          })
        }
      })

      // 监听移动棋子响应（当前仅根据离线消息显示状态判断，未做具体处理）
      // SocketEvent.on('moveChessRespApi', this.moduleId, (response) => {
      //   this.state.offlineMsgShow
      // })

      // 监听求和响应
      SocketEvent.on('sendPeaceRespApi', this.moduleId, (response) => {
        console.log('对方请求和棋,返回:', response)
        if (response.code === 'success') {
          playSound(messageSound)
          Dialog.confirm({
            title: '系统提示',
            content: '对方请求和棋',
            confirmText: '同意',
            cancelText: '拒绝',
            onConfirm: () => {
              playSound(btnSound)
              SocketEvent.emit('sendPeaceResultApi', {
                userId: this.props.userId,
                roomId: this.props.roomId,
                result: 'agree',
                battleId: this.props.battleId,
              }, (resultResponse) => {
                if (resultResponse.code !== 'success') {
                  Toast.show(resultResponse.msg)
                }
              })
            },
            onCancel: () => {
              playSound(btnSound)
              SocketEvent.emit('sendPeaceResultApi', {
                userId: this.props.userId,
                roomId: this.props.roomId,
                result: 'reject',
                battleId: this.props.battleId,
              }, (resultResponse) => {
                if (resultResponse.code !== 'success') {
                  Toast.show(resultResponse.msg)
                }
              })
            },
          })
        }
      })

      // 监听求和结果响应
      SocketEvent.on('sendPeaceResultRespApi', this.moduleId, (response) => {
        console.log('对手方处理了求和意愿,返回:', response)
        if (response.code === 'success') {
          const { result } = response.data
          if (result === 'reject') {
            Toast.show('对方拒绝和棋')
          }
        }
        else if (response.code === 'fail') {
          Toast.show(response.msg)
        }
      })

      // 监听悔棋响应
      SocketEvent.on('backMoveRespApi', this.moduleId, (response) => {
        console.log('对方发起悔棋,返回:', response)
        if (response.code === 'success') {
          playSound(messageSound)
          Dialog.confirm({
            title: '系统提示',
            content: '对方请求悔棋',
            confirmText: '同意',
            cancelText: '拒绝',
            onConfirm: () => {
              playSound(btnSound)
              SocketEvent.emit('backMoveResultApi', {
                userId: this.props.userId,
                roomId: this.props.roomId,
                result: 'agree',
                battleId: this.props.battleId,
              }, (resultResponse) => {
                if (resultResponse.code === 'success') {
                  this.props.handleBackMove()
                }
                else {
                  Toast.show(resultResponse.msg)
                }
              })
            },
            onCancel: () => {
              playSound(btnSound)
              SocketEvent.emit('backMoveResultApi', {
                userId: this.props.userId,
                roomId: this.props.roomId,
                result: 'reject',
                battleId: this.props.battleId,
              }, (resultResponse) => {
                if (resultResponse.code !== 'success') {
                  Toast.show(resultResponse.msg)
                }
              })
            },
          })
        }
      })

      // 监听悔棋结果响应
      SocketEvent.on('backMoveResultRespApi', this.moduleId, (response) => {
        console.log('对手方处理了悔棋意愿,返回:', response)
        if (response.code === 'success') {
          const { result } = response.data
          if (result === 'reject') {
            Toast.show('对方拒绝悔棋')
          }
          else {
            this.props.handleBackMove()
            Toast.show('请您走棋')
          }
        }
        else if (response.code === 'fail') {
          Toast.show(response.msg)
        }
      })
    }

    // 处理聊天消息超时
    this.handleChatMessageTimeout = () => {
      const timeoutDuration = 5000
      this.chatIntervalId = setInterval(() => {
        const { userMsgShow, userStartDate, enemyMsgShow, enemyStartDate } = this.state
        if (userMsgShow) {
          if (userStartDate === null) {
            this.setState({
              userStartDate: new Date(),
            })
          }
          else {
            const elapsedTime = new Date().getTime() - userStartDate.getTime()
            if (elapsedTime >= timeoutDuration) {
              this.setState({
                userMsgShow: false,
                userStartDate: null,
              })
            }
          }
        }
        if (enemyMsgShow) {
          if (enemyStartDate === null) {
            this.setState({
              enemyStartDate: new Date(),
            })
          }
          else {
            const elapsedTime = new Date().getTime() - enemyStartDate.getTime()
            if (elapsedTime >= timeoutDuration) {
              this.setState({
                enemyMsgShow: false,
                enemyStartDate: null,
              })
            }
          }
        }
      }, 1000)
    }

    // 处理离线消息超时
    this.handleOfflineMessageTimeout = () => {
      this.offlineIntervalId = setInterval(() => {
        const { offlineTime, offlineTimeout, offlineMsgShow } = this.state
        if (offlineMsgShow) {
          const elapsedTime = new Date().getTime() - offlineTime
          const remainingTime = Math.floor((1000 * offlineTimeout - elapsedTime) / 1000)
          this.setState({
            offlineMsg: `对方网络连接中断...${remainingTime}s`,
          })
          if (remainingTime <= 0 || this.props.gameOver) {
            this.setState({
              offlineMsgShow: false,
              offlineMsg: null,
            })
            clearInterval(this.offlineIntervalId)
          }
        }
      }, 1000)
    }
    // 处理观战聊天超时逻辑
    this.handleWatchChatTimeout = () => {
      this.watchChatIntervalId = setInterval(() => {
        // 从状态中获取观战聊天缓存和显示状态
        const { watchChatCache, watchChatShow } = this.state

        // 如果聊天未显示且缓存中有消息
        if (!watchChatShow && watchChatCache.length > 0) {
          // 获取缓存消息的数量
          const cacheLength = watchChatCache.length
          // 获取最后一条消息
          const lastMessage = watchChatCache[cacheLength - 1]

          // 清空缓存
          watchChatCache.splice(0, cacheLength)

          // 更新状态
          this.setState({
            watchChatObj: lastMessage,
            watchChatShow: true,
            watchChatCache,
          })
        }
      }, 120)
    }

    // 用户聊天处理方法
    this.userChat = () => {
      // 播放按钮音效
      playSound(btnSound)

      // 检查对局是否结束或正在结算
      if (this.props.gameOver || this.props.handleBattleData) {
        Toast.show('对战已经结束')
        return
      }

      // 弹出输入框让用户输入聊天内容
      Modal.prompt('请输入聊天内容', '', [
        {
          text: '取消',
          onPress: () => playSound(btnSound),
        },
        {
          text: '发送',
          onPress: (inputText) => {
            // 播放按钮音效
            playSound(btnSound)

            // 检查输入内容是否为空
            if (inputText.length === 0) {
              Toast.show('请输入有效的聊天内容')
              return
            }

            // 检查输入内容是否超过 30 个字
            if (inputText.length > 30) {
              Toast.show('内容限制在 30 个字内')
              return
            }

            // 获取聊天历史记录和玩家信息
            const { chatHistory } = this.state
            const { playOne, playTwo } = this.props
            const currentPlayer = playOne.userId === this.props.userId ? playOne : playTwo

            // 将新消息添加到聊天历史记录中
            chatHistory.push({
              userId: this.props.userId,
              userName: currentPlayer.userName,
              content: inputText,
            })

            // 发送聊天消息到服务器
            SocketEvent.emit('chatApi', {
              userId: this.props.userId,
              roomId: this.props.roomId,
              battleId: this.props.battleId,
              content: inputText,
            }, (response) => {
              // 检查消息发送是否成功
              if (response.code !== 'success') {
                Toast.show(response.msg)
              }
            })

            // 更新状态
            this.setState({
              userMsg: inputText,
              userMsgShow: true,
              userStartDate: null,
              chatHistory,
              msgWindowShow: false,
            })

            // 删除聊天窗口定时器
            delete this.chatWindowIntervalId
          },
        },
      ])
    }

    // 关闭聊天消息窗口
    this.closeMsgWidow = () => {
      // 播放按钮音效
      playSound(btnSound)

      // 更新状态隐藏消息窗口
      this.setState({
        msgWindowShow: false,
      })

      // 删除聊天窗口定时器
      delete this.chatWindowIntervalId
    }

    // 关闭观战窗口
    this.closeWatchWindow = () => {
      // 播放按钮音效
      playSound(btnSound)

      // 更新状态隐藏观战窗口
      this.setState({
        watchWindowShow: false,
      })
    }

    this.watchWindowView = () => {
      const { watchUserList } = this.state
      return (
        <div className={styles.watch}>
          <div className={styles.title}>
            <div title="icon" />
            <span>观战厅</span>
          </div>
          <div className={styles.content}>
            <div className={styles.list}>
              {watchUserList.map((user, index) => (
                <Grid className={styles.row} columns={24} gap={1} key={index}>
                  <Grid.Item span={2} className={styles.colTitle}>
                    {index + 1}
                    .
                  </Grid.Item>
                  <Grid.Item span={10} className={styles.colContent}>
                    {user.userName}
                  </Grid.Item>
                  <Grid.Item span={2} />
                  <Grid.Item span={10} />
                </Grid>
              ))}
            </div>
            <div className={styles.floor}>
              <Grid columns={24} gap={1}>
                <Grid.Item span={8} />
                <Grid.Item span={8}>
                  <AdvancedBtn type="danger" text="关闭" onClick={e => this.closeWatchWindow(e)} />
                </Grid.Item>
                <Grid.Item span={8} />
              </Grid>
            </div>
          </div>
        </div>
      )
    }
    this.msgWindowView = () => {
      const { chatHistory } = this.state
      const { userId, playOne, playTwo } = this.props
      const sideMap = new Map()
      sideMap.set(playOne.userId, playOne.first ? '(红方)' : '(黑方)')
      sideMap.set(playTwo.userId, playTwo.first ? '(红方)' : '(黑方)')

      return (
        <div className={styles.msgWindow}>
          <div className={styles.title}>
            <div title="icon" />
            <span>消息记录</span>
          </div>
          <div className={styles.content}>
            <div className={styles.list} ref={ref => this.listRef = ref}>
              {chatHistory.map((message, index) => (
                <p key={`msg_${index}`}>
                  <span
                    className={`${message.userId === 'system' ? styles.system : message.userId === userId ? styles.self : styles.people}`}
                  >
                    {message.userName}
                    {sideMap.get(message.userId)}
                    ：
                    {message.content}
                  </span>
                </p>
              ))}
            </div>
            <div className={styles.floor}>
              <Grid columns={24} gap={1}>
                <Grid.Item span={7}>
                  <AdvancedBtn type="normal" text="常用语" />
                </Grid.Item>
                <Grid.Item span={1} />
                <Grid.Item span={7}>
                  <AdvancedBtn type="normal" text="编辑" onClick={e => this.userChat(e)} />
                </Grid.Item>
                <Grid.Item span={1} />
                <Grid.Item span={8}>
                  <AdvancedBtn type="danger" text="关闭" onClick={e => this.closeMsgWidow(e)} />
                </Grid.Item>
              </Grid>
            </div>
          </div>
        </div>
      )
    }
    this.msgWindowToBottom = () => {
      // 如果已经有定时器在运行，则不执行后续操作
      if (this.chatWindowIntervalId) {
        return
      }

      // 最大尝试次数
      const maxAttempts = 10
      // 当前尝试次数
      let currentAttempt = 0

      // 定义定时器回调函数
      const scrollToBottom = () => {
        // 获取聊天列表的引用
        const chatList = this.listRef

        // 如果聊天列表引用存在，或者达到最大尝试次数
        if (chatList || currentAttempt >= maxAttempts) {
          if (chatList) {
            // 将聊天列表滚动到最底部
            chatList.scrollTop = chatList.scrollHeight
          }
          // 清除定时器
          clearInterval(this.chatWindowIntervalId)
          // 删除定时器 ID
          delete this.chatWindowIntervalId
          // 打印日志，表示滚动操作已完成
          console.log('将聊天消息拉到最底部，已完成')
        }

        // 增加尝试次数
        currentAttempt++
      }

      // 设置定时器，每 5 毫秒执行一次滚动操作
      this.chatWindowIntervalId = setInterval(scrollToBottom, 5)
    }

    // 假设以下函数在类组件中
    this.showMenuList = async () => {
      playSound(btnSound)
      const firstMenuGroup = [
        {
          icon: <img src={chatImg} alt="" style={{ width: 36 }} />,
          title: this.chat,
        },
        {
          icon: <img src={chatHistoryImg} alt="" style={{ width: 36 }} />,
          title: this.chatHistory,
        },
        {
          icon: <img src={skinImg} alt="" style={{ width: 36 }} />,
          title: this.skin,
        },
      ]
      const secondMenuGroup = [
        {
          icon: <img src={peaceImg} alt="" style={{ width: 36 }} />,
          title: this.peace,
        },
        {
          icon: <img src={backMoveImg} alt="" style={{ width: 36 }} />,
          title: this.backMove,
        },
        {
          icon: <img src={failImg} alt="" style={{ width: 36 }} />,
          title: this.fail,
        },
      ]
      const options = [[...firstMenuGroup], [...secondMenuGroup]]
      ActionSheet.showShareActionSheetWithOptions({
        options,
        message: '菜单',
      }, async (selectedIndex, optionIndex) => {
        const selectedOptionTitle = selectedIndex > -1 ? options[optionIndex][selectedIndex].title : 'cancel'
        playSound(btnSound)

        if (this.props.handleBattleData) {
          Toast.show('正在结算，请稍后')
          return false
        }

        if (this.props.gameOver) {
          Toast.show('对局已结束')
          this.props.showGameOverWindow()
          return
        }

        if (selectedOptionTitle === this.skin) {
          await changeSkin()
          this.props.resetSkinMap()
        }
        else if (selectedOptionTitle === this.fail) {
          Dialog.confirm({
            title: '系统提示',
            content: '确定认输吗?',
            confirmText: '确认',
            cancelText: '取消',
            onConfirm: () => {
              playSound(btnSound)
              this.props.exitPk()
            },
            onCancel: () => {
              playSound(btnSound)
            },
          })
        }
        else if (selectedOptionTitle === this.peace) {
          const { userId, roomId, battleId } = this.props
          SocketEvent.emit('sendPeaceApi', { userId, roomId, battleId }, (response) => {
            if (response.code === 'success') {
              Toast.show('已发送求和请求')
            }
            else {
              Toast.show(response.msg)
            }
          })
        }
        else if (selectedOptionTitle === this.backMove) {
          const { historyMoveStep, playTwo, isRedMove } = this.props
          if (historyMoveStep.length <= 1) {
            Toast.show('空棋盘，操作无效')
          }
          else if (playTwo.first === isRedMove) {
            Toast.show('我方落子时尚无法悔棋')
          }
          else {
            const { userId, roomId, battleId } = this.props
            SocketEvent.emit('backMoveApi', { userId, roomId, battleId }, (response) => {
              if (response.code === 'success') {
                Toast.show('已发送悔棋请求')
              }
              else {
                Toast.show(response.msg)
              }
            })
          }
        }
        else if (selectedOptionTitle === this.chat) {
          this.userChat()
        }
        else if (selectedOptionTitle === this.chatHistory) {
          this.setState({ msgWindowShow: true })
          this.msgWindowToBottom()
        }
      })
    }
    this.state = {
      // 消息窗口是否显示
      msgWindowShow: false,
      // 聊天历史记录
      chatHistory: [],
      // 观战聊天缓存
      watchChatCache: [],
      // 观战聊天对象
      watchChatObj: null,
      // 观战聊天窗口是否显示
      watchChatShow: false,
      // 用户消息
      userMsg: null,
      // 敌人消息
      enemyMsg: null,
      // 用户消息窗口是否显示
      userMsgShow: false,
      // 敌人消息窗口是否显示
      enemyMsgShow: false,
      // 用户开始时间
      userStartDate: null,
      // 敌人开始时间
      enemyStartDate: null,
      // 离线消息窗口是否显示
      offlineMsgShow: false,
      // 离线消息内容
      offlineMsg: null,
      // 离线时间
      offlineTime: null,
      // 离线超时计时器
      offlineTimeout: null,
      // 观战用户列表
      watchUserList: [],
      // 观战窗口是否显示
      watchWindowShow: false,
    }

    // 组件的模块ID
    this.moduleId = 'playerBoardUser'

    // 初始化一些字符串常量
    this.chat = '聊天' // 聊天功能名称
    this.chatHistory = '消息记录' // 聊天历史记录功能名称
    this.peace = '求和' // 请求和棋的功能名称
    this.backMove = '悔棋' // 请求悔棋的功能名称
    this.fail = '认输' // 认输功能名称
    this.skin = '换肤' // 更换皮肤功能名称

    // 列表引用，用于获取DialogM元素
    this.listRef = null
  }

  componentDidMount() {
    // 处理聊天消息超时
    this.handleChatMessageTimeout()
    // 处理离线消息超时
    this.handleOfflineMessageTimeout()
    // 处理观战聊天超时
    this.handleWatchChatTimeout()
    // 开始监听消息事件
    this.startMessageListen()
    // 发送观战计数（参数为false）
    this.sendWatchCount(false)
    // 调用props中的方法，并设置游戏DialogM元素的引用
    this.props.callAndSetPlayDom(this.playOneRef, this.playTwoRef)
    // 添加文档可见性变化事件监听器
    document.addEventListener('visibilitychange', this.sendWatchCount)
  }

  componentWillUnmount() {
    // 移除文档可见性变化事件监听器
    document.removeEventListener('visibilitychange', this.sendWatchCount)
    // 清除各种定时器
    clearInterval(this.chatWinDialogwIntervalId)
    clearInterval(this.chatIntervalId)
    clearInterval(this.offlineIntervalId)
    clearInterval(this.watchChatIntervalId)
    // 移除游戏DialogM元素
    this.playOneRef.remove()
    this.playTwoRef.remove()
    // 取消所有基于moduleId的Socket事件监听
    SocketEvent.off(this.moduleId)
  }

  render() {
    const {
      playOne,
      playTwo,
    } = this.props
    const {
      enemyMsgShow,
      enemyMsg,
      offlineMsg,
      userMsgShow,
      userMsg,
      watchUserList,
      watchChatShow,
      watchChatObj,
      watchWindowShow,
      msgWindowShow,
    } = this.state

    const m = `[${watchChatObj?.userName}]: ${watchChatObj?.content}`

    return (
      <>
        <div className={styles.wrap}>
          {/* Player One Section */}
          <div className={styles.player}>
            <Grid columns={24} gap={1} className={styles.user}>
              <Grid.Item span={4}>
                <div className={styles.icon}>
                  <div>
                    <Image
                      src={playOne.iconUrl}
                      width="100%"
                      height="100%"
                      style={{ borderRadius: '50%' }}
                      alt=""
                    />
                    <div className={styles.head} ref={el => this.playOneRef = el} />
                  </div>
                </div>
              </Grid.Item>
              <Grid.Item span={15} className={styles.body}>
                <Grid columns={24} gap={1}>
                  <Grid.Item span={14} className={styles.name}>
                    {playOne.userName}
                  </Grid.Item>
                  <Grid.Item span={10} className={styles.score}>
                    {playOne.score}
                  </Grid.Item>
                </Grid>
                <Grid columns={24} gap={1}>
                  <Grid.Item span={12} className={styles.allTime}>
                    局时
                    {' '}
                    <span>{formatTime(playOne.allTime)}</span>
                  </Grid.Item>
                  <Grid.Item span={12} className={styles.stepTime}>
                    步时
                    {' '}
                    <span>{formatTime(playOne.stepTime)}</span>
                  </Grid.Item>
                </Grid>
              </Grid.Item>
              <Grid.Item span={5}>
                <div className={styles.floor}>
                  <AdvancedBtn
                    type="square"
                    text="旁观"
                    onClick={() => {
                      playSound(btnSound)
                      this.setState({ watchWindowShow: !0 })
                    }}
                  />
                  <Badge
                    style={{ display: watchUserList.length ? 'block' : 'none' }}
                    content={watchUserList.length}
                    className={styles.badge}
                  />
                </div>
              </Grid.Item>
            </Grid>
            <div className={styles.watchMsg}>
              {/* Watch Message Section */}
              {watchChatShow && (
                <div
                  className={styles.watchMsg}
                  onAnimationStart={() => this.setState({ watchChatShow: m.length > 5 })}
                  onAnimationEnd={() => this.setState({ watchChatShow: false })}
                >
                  {m}
                </div>
              )}
            </div>

            {/* Message Display */}
            <div className={styles.boardPlaceholder}>
              <div
                className={styles.enemyMsg}
                style={{ display: enemyMsgShow ? 'block' : 'none' }}
                onClick={() => this.setState({ enemyMsgShow: false })}
              >
                <span>{enemyMsg}</span>
              </div>
              <div
                className={styles.enemyMsg}
                style={{ display: offlineMsg ? 'block' : 'none' }}
              >
                <span>{offlineMsg}</span>
              </div>
              <div
                className={styles.userMsg}
                style={{ display: userMsgShow ? 'block' : 'none' }}
                onClick={() => this.setState({ userMsgShow: false })}
              >
                <span>{userMsg}</span>
              </div>
            </div>
            <div className={styles.watchMsgPlaceholder}></div>
            {/* Player Two Section */}
            <Grid columns={24} gap={1} className={styles.enemy}>
              <Grid.Item span={4}>
                <div className={styles.icon}>
                  <div>
                    <Image
                      src={playTwo.iconUrl}
                      width="100%"
                      height="100%"
                      style={{ borderRadius: '50%' }}
                      alt=""
                    />
                    <div className={styles.head} ref={el => this.playTwoRef = el} />
                  </div>
                </div>
              </Grid.Item>
              <Grid.Item span={15} className={styles.body}>
                <Grid columns={24} gap={1}>
                  <Grid.Item span={14} className={styles.name}>
                    {playTwo.userName}
                  </Grid.Item>
                  <Grid.Item span={10} className={styles.score}>
                    {playTwo.score}
                  </Grid.Item>
                </Grid>
                <Grid columns={24} gap={1}>
                  <Grid.Item span={12} className={styles.allTime}>
                    局时
                    {' '}
                    <span
                      className={playTwo.allTime && playTwo.allTime <= config.allTimeoutTips ? styles.timeout : ''}
                    >
                      {formatTime(playTwo.allTime)}
                    </span>
                  </Grid.Item>
                  <Grid.Item span={12} className={styles.stepTime}>
                    步时
                    {' '}
                    <span
                      className={playTwo.stepTime && playTwo.stepTime <= config.stepTimeoutTips ? styles.timeout : ''}
                    >
                      {formatTime(playTwo.stepTime)}
                    </span>
                  </Grid.Item>
                </Grid>
              </Grid.Item>
              <Grid.Item span={5}>
                <div className={styles.floor}>
                  <AdvancedBtn
                    type="square"
                    text="菜单"
                    onClick={this.showMenuList}
                  />
                </div>
              </Grid.Item>
            </Grid>
          </div>
          {msgWindowShow && !this.props.gameOver && this.msgWindowView()}
          {watchWindowShow && !this.props.gameOver && this.watchWindowView()}

        </div>
      </>
    )
  }
}

export default PlayerBoardUser
