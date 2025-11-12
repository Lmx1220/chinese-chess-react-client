import { Dialog, Grid, Image, Toast } from 'antd-mobile'
import { ActionSheet, Modal } from 'antd-mobile-v2'
import NoSleep from 'nosleep.js'
import { Component } from 'react'
import chatImg from '@/assets/chat.png'
import chatHistoryImg from '@/assets/chatHistory.png'
import noSleepTextImg from '@/assets/noSleepText.png'
import skinImg from '@/assets/skin.png'
import swapChessBoardImg from '@/assets/swapChessBoard.png'
import AdvancedBtn from '@/button/index.jsx'
import { GAME_OVER_TYPE } from '@/enums.js'
import SocketEvent from '@/service/event.js'
import AdvancedSpin from '@/spinner/index.jsx'
import { formatTime } from '@/utils/board-canvas-utils.js'
import { CACHE_BATTLE_KEY } from '@/utils/cache-key-utils.js'
import { changeSkin } from '@/utils/map-res.js'
import { btnSound, playSound } from '@/utils/sounds-res.js'
import styles from './index.module.less'

class WatchBoardUser extends Component {
  constructor(props) {
    super(props)

    this.loadUserDetail = () => {
      // 从 sessionStorage 中获取用户信息
      const storedUserInfo = sessionStorage.getItem(CACHE_BATTLE_KEY)
      if (storedUserInfo) {
        const userDetail = JSON.parse(storedUserInfo)
        // 更新组件状态中的用户详情
        this.setState({
          userDetail,
        })
      }
      else {
        // 若 sessionStorage 中无用户信息，发送请求获取
        SocketEvent.emit('userDetailApi', {
          userId: this.props.userId,
        }, (response) => {
          console.log('用户详情：', response)
          if (response.code === 'success') {
            const user = response.data.user
            // 更新组件状态中的用户详情
            this.setState({
              userDetail: user,
            })
          }
          else {
            // 显示错误信息并返回上一页
            Toast.show('账号信息异常，请重新登录')
            this.props.goBack()
          }
        })
      }
    }

    this.startMsgScrollTask = () => {
      const intervalTime = 120
      this.watchChatIntervalId = setInterval(() => {
        const { watchChatCache, watchChatShow } = this.state
        // 若消息未显示且缓存中有消息
        if (!watchChatShow && watchChatCache.length > 0) {
          const lastIndex = watchChatCache.length - 1
          const lastMessage = watchChatCache[lastIndex]
          // 清空缓存
          watchChatCache.splice(0, watchChatCache.length)
          // 更新组件状态以显示最新消息
          this.setState({
            watchChatObj: lastMessage,
            watchChatShow: true,
            watchChatCache,
          })
        }
      }, intervalTime)
    }

    this.startMsgEventListen = () => {
      // 监听聊天消息响应
      SocketEvent.on('chatRespApi', this.moduleId, (response) => {
        console.log('聊天消息，返回：', response)
        if (response.code === 'success') {
          const { chatHistory, watchChatCache } = this.state
          const { userId, userName, content } = response.data
          const newMessage = {
            userId,
            userName,
            content,
          }
          // 将新消息添加到聊天历史和缓存中
          chatHistory.push(newMessage)
          watchChatCache.push(newMessage)
          // 更新组件状态
          this.setState({
            chatHistory,
            watchChatCache,
            watchChatShow: false,
          })
          // 将消息窗口滚动到底部
          this.msgWindowToBottom()
        }
        else {
          // 显示错误消息
          Toast.show(response.msg)
        }
      })

      // 监听游戏结束响应
      SocketEvent.on('gameWinRespApi', this.moduleId, (response) => {
        console.log('观战游戏结束(用户界面)，resp: ', response)
        if (response.code === 'success') {
          const { type, isRedColorWin } = response.data
          const { playOne, playTwo } = this.props
          const winner = playOne.first === isRedColorWin ? playOne : playTwo
          const loser = playOne.first === isRedColorWin ? playTwo : playOne
          let resultMessage
          if (type === '0006') {
            resultMessage = '双方无可进攻棋子'
          }
          else if (type === GAME_OVER_TYPE.USER_PEACE) {
            resultMessage = '双方议和'
          }
          else if (type === GAME_OVER_TYPE.ADMIT_DEFEAT) {
            resultMessage = `[${loser.userName}]认输`
          }
          else if (type === GAME_OVER_TYPE.USER_LEAVE) {
            resultMessage = `[${loser.userName}]逃跑判负`
          }
          else if (type === GAME_OVER_TYPE.USER_TIMEOUT) {
            resultMessage = `[${loser.userName}]超时判负`
          }
          else {
            resultMessage = `[${winner.userName}]获得胜利`
          }
          const { chatHistory } = this.state
          // 添加系统消息到聊天历史
          chatHistory.push({
            userId: 'system',
            userName: '系统消息',
            content: `对局结束, ${resultMessage}`,
          })
          // 更新组件状态
          this.setState({
            chatHistory,
          })
        }
      })

      // 监听服务器允许双方进入对局响应
      SocketEvent.on('allowInBattleApi', this.moduleId, (response) => {
        console.log('(观战)服务器允许双方进入对局，resp: ', response)
        if (response.code === 'success') {
          const { chatHistory } = this.state
          // 添加系统消息到聊天历史
          chatHistory.push({
            userId: 'system',
            userName: '系统消息',
            content: '对局已重新开始',
          })
          // 更新组件状态
          this.setState({
            chatHistory,
          })
        }
      })
    }

    this.exitWatch = () => {
      // 执行某个操作，可能是 UI 相关的变化
      playSound(btnSound)
      const { gameOver, userId, roomId, goBack } = this.props

      const leaveRoom = () => {
        // 发送离开观战房间的请求
        SocketEvent.emit('leaveWatchRoomApi', {
          userId,
          roomId,
        }, (response) => {
          console.log('离开房间返回：', response)
          // 调用返回上一页的方法
          goBack()
        })
      }

      if (gameOver) {
        // 游戏结束，直接离开房间
        leaveRoom()
      }
      else {
        // 游戏未结束，弹出确认框
        Dialog.confirm({
          title: '系统提示',
          content: '确认退出观战吗?',
          confirmText: '确认',
          cancelText: '取消',
          onConfirm: () => {
            playSound(btnSound)
            leaveRoom()
          },
          onCancel: () => {
            playSound(btnSound)
          },
        })
      }
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
    // 用户聊天处理方法
    this.userChat = () => {
      // 播放按钮音效
      playSound(btnSound)
      const userDetail = this.state.userDetail
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
            const { chatHistory, watchChatCache } = this.state

            // 将新消息添加到聊天历史记录中
            const msg = {
              userId: props.userId,
              userName: userDetail.userName,
              content: inputText,
            }

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
            chatHistory.push(msg)
            watchChatCache.push(msg)

            // 更新状态
            this.setState({
              chatHistory,
              watchChatCache,
              msgWindowShow: false,
            })

            // 删除聊天窗口定时器
            delete this.chatWindowIntervalId
          },
        },
      ])
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
          icon: <img src={swapChessBoardImg} alt="" style={{ width: 36 }} />,
          title: this.swapChessBoard,
        },
        {
          icon: <img src={skinImg} alt="" style={{ width: 36 }} />,
          title: this.skin,
        },
        {
          icon: <img src={noSleepTextImg} alt="" style={{ width: 36 }} />,
          title: this.noSleepText,
        },
      ]
      const options = [...firstMenuGroup]
      ActionSheet.showShareActionSheetWithOptions({
        options,
        message: '菜单',
      }, async (selectedIndex) => {
        const selectedOptionTitle = selectedIndex > -1 ? options[selectedIndex].title : 'cancel'
        playSound(btnSound)

        if (selectedOptionTitle === this.skin) {
          await changeSkin()
          this.props.resetSkinMap()
        }
        else if (selectedOptionTitle === this.swapChessBoard) {
          this.props.handleSwapChessBoard()
        }
        else if (selectedOptionTitle === this.chat) {
          this.userChat()
        }
        else if (selectedOptionTitle === this.chatHistory) {
          this.setState({ msgWindowShow: true })
          this.msgWindowToBottom()
        }
        else if (selectedOptionTitle === this.noSleepText) {
          this.noSleep()
        }
      })
    }
    this.state = {
      loading: false,
      text: '',
      msgWindowShow: false,
      chatHistory: [],
      watchChatCache: [],
      watchChatObj: null,
      watchChatShow: false,
      noSleep: new NoSleep(),
      userDetail: null,
    }

    // 定义聊天相关的文案
    this.chat = '聊天'
    // 定义消息记录相关的文案
    this.chatHistory = '消息记录'
    // 定义交换棋手相关的文案
    this.swapChessBoard = '交换棋手'
    // 定义换肤相关的文案
    this.skin = '换肤'
    // 定义屏幕常亮相关的文案
    this.noSleepText = '屏幕常亮'
    // 用于存储 DOM 引用，初始化为 null
    this.listRef = null
    // 模块的唯一标识符
    this.moduleId = 'watchBoardUser'
  }

  noSleep() {
    // 从状态中获取 noSleep 对象
    const { noSleep } = this.state
    if (noSleep.isEnabled) {
      // 若已启用，则禁用并显示关闭提示
      noSleep.disable()
      Toast.show('已关闭')
    }
    else {
      // 若未启用，则启用并在成功后显示开启提示
      noSleep.enable().then(() => {
        Toast.show('已开启')
      })
    }
  };

  componentDidMount() {
    this.loadUserDetail()
    this.startMsgScrollTask()
    this.startMsgEventListen()
    this.props.callAndSetPlayDom(this.playOneRef, this.playTwoRef)
  }

  componentWillUnmount() {
    clearInterval(this.watchChatIntervalId)
    SocketEvent.off(this.moduleId)
  }

  render() {
    const { playOne, playTwo, gameOver, gameOverMsg } = this.props
    const { watchChatShow, watchChatObj } = this.state
    const chatMessage = `[${watchChatObj?.userName}]: ${watchChatObj?.content}`

    return (
      <>
        <div className={styles.wrap}>
          {gameOver && gameOverMsg && (
            <div className={styles.over}>{gameOverMsg}</div>
          )}
          <div className={styles.player}>
            <Grid columns={24} gap={1} className={styles.user}>
              <Grid.Item span={4}>
                <div className={styles.icon}>
                  <div style={{ display: playOne?.iconUrl ? 'block' : 'none' }}>
                    <Image
                      src={playOne?.iconUrl}
                      width="100%"
                      height="100%"
                      style={{ borderRadius: '50%' }}
                      fit="cover"
                      alt=""
                      lazy
                    />
                    <div className={styles.head} ref={e => this.playOneRef = e} />
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
                  <Grid.Item
                    span={12}
                    style={{ display: playOne.userId ? 'inline-block' : 'none' }}
                    className={styles.allTime}
                  >
                    局时
                    <span>{formatTime(playOne.allTime)}</span>
                  </Grid.Item>
                  <Grid.Item
                    span={12}
                    style={{ display: playOne.userId ? 'inline-block' : 'none' }}
                    className={styles.stepTime}
                  >
                    步时
                    <span>{formatTime(playOne.stepTime)}</span>
                  </Grid.Item>
                </Grid>
              </Grid.Item>
              <Grid.Item span={5}>
                <div className={styles.floor}>
                  <AdvancedBtn type="square" text="退出" onClick={e => this.exitWatch(e)} />
                </div>
              </Grid.Item>
            </Grid>
            <div className={styles.watchMsg}>
              {watchChatShow && (
                <div
                  onAnimationStart={() => this.setState({ watchChatShow: chatMessage.length > 5 })}
                  onAnimationEnd={() => this.setState({ watchChatShow: false })}
                >
                  {chatMessage}
                </div>
              )}
            </div>
            <div className={styles.boardPlaceholder} />
            <div className={styles.watchMsgPlaceholder} />
            <Grid columns={24} gap={1} className={styles.enemy}>
              <Grid.Item span={4}>
                <div className={styles.icon}>
                  <div style={{ display: playTwo?.iconUrl ? 'block' : 'none' }}>
                    <Image
                      src={playTwo?.iconUrl}
                      width="100%"
                      height="100%"
                      alt=""
                      style={{ borderRadius: '50%' }}
                      fit="cover"
                    />
                    <div className={styles.head} ref={e => this.playTwoRef = e} />
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
                  <Grid.Item
                    span={12}
                    style={{ display: playTwo.userId ? 'inline-block' : 'none' }}
                    className={styles.allTime}
                  >
                    局时
                    <span>{formatTime(playTwo.allTime)}</span>
                  </Grid.Item>
                  <Grid.Item
                    span={12}
                    style={{ display: playTwo.userId ? 'inline-block' : 'none' }}
                    className={styles.stepTime}
                  >
                    步时
                    <span>{formatTime(playTwo.stepTime)}</span>
                  </Grid.Item>
                </Grid>
              </Grid.Item>
              <Grid.Item span={5}>
                <div className={styles.floor}>
                  <AdvancedBtn type="square" text="菜单" onClick={this.showMenuList} />
                </div>
              </Grid.Item>
            </Grid>
          </div>
          {this.state.msgWindowShow ? this.msgWindowView() : ''}
        </div>
        <AdvancedSpin text={this.state.text} show={this.state.loading} />
      </>
    )
  }
}

export default WatchBoardUser
