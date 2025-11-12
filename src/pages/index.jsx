import { Button, Card, Dialog, FloatingPanel, Image, List, Toast } from 'antd-mobile'
import { Component } from 'react'
import config from '@/config.js'
import { ROOM_JOIN_TYPE } from '@/enums.js'
import Board from '@/pages/board/index.jsx'
import Login from '@/pages/login/index.jsx'
import Platform, { MODE_FREEDOM_PK, MODE_RANDOM_PK, MODE_REVIEW, MODE_WATCH } from '@/pages/platform/index.jsx'
import Review from '@/pages/review/index.jsx'
import PlayerRandom from '@/pages/room/random/index.jsx'
import Watch from '@/pages/watch/index.jsx'
import SocketEvent from '@/service/event.js'
import SocketUtils from '@/service/socket.js'
import AdvancedSpin from '@/spinner/index.jsx'
import { btnSound, pauseAllSound, playSound, startAllSound } from '@/utils/sounds-res.js'
import style from './index.module.less'

class Home extends Component {
  constructor(props) {
    super(props)
    this.inviteMessageExpired = () => {
      this.inviteMessageExpiredInterId = setInterval(() => {
        const { inviteUserList } = this.state
        if (inviteUserList.length) {
          const now = Date.now()
          const updatedList = inviteUserList.filter(user => user.expiredTimeUnix > now)
          this.setState({
            inviteUserList: updatedList,
          })

          if (!updatedList.length && this.floatingPanelRef) {
            this.floatingPanelRef.setHeight(0)
          }
        }
      }, 1000)
    }

    this.startAllEventListen = () => {
      SocketEvent.on('exceptionRespApi', this.moduleId, (data) => {
        console.log('监听到全局异常, resp: ', data)
        Dialog.alert({
          title: '系统提示',
          content: data.msg,
          confirmText: '确定',
          onConfirm: () => {
            playSound(btnSound)
          },
        })
      })
      SocketEvent.on('connect_error', this.moduleId, (_data) => {
        const connectCount = this.state.connectCount
        if (config.reconnection && connectCount < config.reconnectionAttempts) {
          this.setState({
            loading: true,
            connectCount: connectCount + 1,
            text: `连接服务器中(${connectCount + 1}/${config.reconnectionAttempts})`,
          })
        }

        if (!config.reconnection || connectCount === config.reconnectionAttempts) {
          this.setState({
            loading: false,
          })
          Dialog.alert({
            title: '系统提示',
            content: '服务器无响应',
            confirmText: '重新连接',
            onConfirm: () => {
              playSound(btnSound)
              this.setState({
                loading: true,
                text: '连接服务器中',
                connectCount: 0,
              })
              this.socket = this.socket.connect()
            },
          })
        }
      })
      SocketEvent.on('connect', this.moduleId, () => {
        SocketEvent.setSocket(this.socket)
        this.setState({
          loading: false,
        })
        const { page, userId, roomId, battleId } = this.state
        if (page === this.board) {
          SocketEvent.emit('userOfflineBattleOverApi', {
            userId,
            battleId,
            roomId,
          })
        }
      })
      SocketEvent.on('disconnect', this.moduleId, () => {
        console.log('服务器断开了连接')
        // 如果是账号被踢出，不再重连
        if (!this.state.isKickOut) {
          if (config.reconnection) {
            this.setState({
              loading: true,
              text: `连接服务器中(1/${config.reconnectionAttempts})`,
              connectCount: 1,
            })
          }
          else {
            Dialog.alert({
              title: '系统提示',
              content: '与服务器断开连接',
              confirmText: '重新连接',
              onConfirm: () => {
                playSound(btnSound)
                this.setState({
                  loading: true,
                  text: '连接服务器中',
                  connectCount: 0,
                })
                this.socket = this.socket.connect()
              },
            })
          }
        }
        else {
          console.log('被服务器踢出')
        }
      })
      SocketEvent.on('sessionRecoverNotifyApi', this.moduleId, (data) => {
        console.log('会话恢复通知：', data)
        if (data.code === 'success') {
          this.setState({
            loading: true,
            text: data.msg,
          })
        }
      })
      SocketEvent.on('inviteUserRespApi', this.moduleId, (data) => {
        if (data.code === 'success') {
          console.log('被邀请消息通知：', data)
          const inviteUserList = this.state.inviteUserList
          const inviteId = data.data.inviteId
          const userDetail = data.data.userDetail
          const expiredTimeUnix = data.data.expiredTimeUnix
          const userId = userDetail.userId
          const roomId = userDetail.roomId
          const iconUrl = userDetail.iconUrl
          const userName = userDetail.userName
          const score = userDetail.score
          const sucPercentage = userDetail.sucPercentage
          const index = inviteUserList.findIndex(item => item.userId === userId)
          if (index !== -1) {
            inviteUserList.splice(index, 1)
          }

          inviteUserList.push({
            inviteId,
            userId,
            roomId,
            iconUrl,
            userName,
            score,
            sucPercentage,
            expiredTimeUnix,
          })
          this.setState({
            inviteUserList,
          })
          this.floatingPanelRef && this.floatingPanelRef.setHeight(this.panelAnchors[0])
        }
      })
      SocketEvent.on('sessionRecoverRespApi', this.moduleId, (res) => {
        console.log('会话恢复结果通知返回：', res)
        // const isKickOut = state.isKickOut;
        // const joinRoomType = state.joinRoomType;
        const {
          isKickOut,
          joinRoomType,
          page,
        } = this.state
        const {
          code,
          msg,
          data = {},
        } = res
        const {
          role,
          roomId,
          roomUser,
          roomEnemy,
          page: newPage,
          battleId,
          joinType = joinRoomType,
        } = data

        // const joinType = data.data.joinType || joinRoomType;
        // code: S000001，仅通知消息
        // code: S000002，房间和对局都未解散，开始恢复对局数据
        // code: S000003, 会话信息已经过期，刷新本页面
        // code: S000004，对局已经结束，但该页面还可续相关事件
        if (code === 'S000001') {
          Dialog.alert({
            title: '系统提示',
            content: msg,
            confirmText: '知道了',
            onConfirm: () => {
              playSound(btnSound)
            },
          })
        }
        else if (code === 'S000002') {
          if (role === this.roleBattle) {
            this.setState({
              roomUser,
              roomEnemy,
              roomId,
              battleId,
              page: page !== this.board ? this.board : page,
              joinRoomType: joinType,
            })
          }
          else if (role === this.roleWatch) {
            this.setState({
              roomId,
              battleId,
              page: page !== this.watch ? this.watch : page,
            })
          }
          else if (page !== newPage) {
            this.setState({
              page: newPage,
              roomId,
              battleId,
              joinRoomType: joinType,
            })
          }
        }
        else if (code === 'S000003') {
          if (!isKickOut) {
            this.setState({
              isKickOut: true,
              loading: false,
            })
            Dialog.alert({
              title: '系统提示',
              content: '您的会话已经过期，请重新登录',
              confirmText: '登录',
              onConfirm: () => {
                playSound(btnSound)
                window.location.reload(true)
              },
            })
          }
        }
        this.setState({
          loading: false,
        })
      })

      SocketEvent.on('userConflictRespApi', this.moduleId, (data) => {
        console.log('账号登录冲突返回：', data)
        const page = this.state.page
        if (page !== this.login) {
          this.setState({
            isKickOut: true,
            loading: false,
          })
          Dialog.alert({
            title: '系统提示',
            content: '账号在别处登录，您已被迫下线',
            confirmText: '首页',
            onConfirm: () => {
              playSound(btnSound)
              window.location.reload(true)
            },
          })
        }
      })
      SocketEvent.on('versionRespApi', this.moduleId, (data) => {
        console.log('游戏版本检测返回：', data)
        Dialog.clear()
        if (data.code === 'success') {
          const versionId = data.data.versionId
          if (config.version !== versionId) {
            this.setState({
              isKickOut: true,
              loading: false,
            })
            const content = () => {
              const items = data.data.versionDetailList.map((item, index) =>
                (<li key={index}><span>{item.content}</span></li>),
              )
              return (
                <>
                  <div className={style.version}>
                    <div className={style.title}>更新内容:</div>
                    <ul>{items}</ul>
                    <div className={style.extend}>更多内容请查看版本详情...</div>
                  </div>
                </>
              )
            }

            Dialog.alert({
              title: '系统升级',
              content: content(),
              confirmText: '去升级',
              onConfirm: () => {
                playSound(btnSound)
                window.location.reload(true)
              },
            })
          }
        }
      })
    }
    this.handleInviteResult = (inviteData, result, callback) => {
      const inviteId = inviteData.inviteId
      const roomId = inviteData.roomId
      playSound(btnSound)
      const { inviteUserList, userId } = this.state

      // 查找邀请的索引
      const inviteIndex = inviteUserList.findIndex(user => user.inviteId === inviteId)

      if (inviteIndex !== -1) {
        // 删除处理的邀请
        inviteUserList.splice(inviteIndex, 1)
        this.setState({
          inviteUserList,
        })
      }

      // 没有剩余邀请，调整面板高度
      if (inviteUserList.length || this.floatingPanelRef) {
        this.floatingPanelRef.setHeight(0)
      }

      // 发送处理邀请结果
      SocketEvent.emit('inviteUserResultApi', {
        userId,
        inviteId,
        result,
        rejectDesc: result === 'reject' ? '不好意思，现在不方便' : null,
      }, (response) => {
        console.log('处理被邀请的结果，返回: ', response)
        if (response.code === 'success') {
          if (result === 'agree') {
            this.joinInviteRoom(userId, inviteId, roomId, callback)
          }
        }
        else {
          Toast.show(response.msg)
          if (callback)
            callback()
        }
      })
      // 处理加入房间
      this.joinInviteRoom = (userId, inviteId, roomId, callback) => {
        SocketEvent.emit('joinInviteRoomApi', {
          userId,
          inviteId,
          roomId,
          joinType: ROOM_JOIN_TYPE.RANDOM,
        }, (response) => {
          console.log('加入受邀请的房间，返回: ', response)
          if (response.code === 'success') {
            this.setState({
              page: this.playerRandom,
              roomId,
            })
            if (callback)
              callback()
          }
          else {
            Toast.show(response.msg)
            if (callback)
              callback()
          }
        })
      }
    }

    this.inviteUserView = () => {
      const inviteUserList = this.state.inviteUserList

      return (
        <FloatingPanel ref={ref => this.floatingPanelRef = ref} anchors={inviteUserList.length ? this.panelAnchors : [0]}>
          <List style={{ '--border-bottom': 'none' }}>
            <Card className={style.invite}>
              {[...inviteUserList].reverse().map(user => (
                <List.Item
                  key={user.userId}
                  prefix={(
                    <Image
                      src={user.iconUrl}
                      style={{ borderRadius: 22, border: '1px solid #efefef' }}
                      fit="cover"
                      width={44}
                      height={44}
                    />
                  )}
                  extra={(
                    <div className={style.btn}>
                      <Button
                        size="mini"
                        color="warning"
                        onClick={() => this.handleInviteResult(user, 'reject')}
                      >
                        拒绝
                      </Button>
                      <Button
                        size="mini"
                        color="success"
                        onClick={() => this.handleInviteResult(user, 'agree')}
                      >
                        同意
                      </Button>
                    </div>
                  )}
                  description={(
                    <div className={style.desc}>
                      <label className={style.score}>
                        <span>积分: </span>
                        {user.score || '-'}
                      </label>
                      <label className={style.score}>
                        <span>胜率: </span>
                        {user.sucPercentage || '0'}
                        %
                      </label>
                    </div>
                  )}
                >
                  <div className={style.userName}>{user.userName}</div>
                </List.Item>
              ))}
            </Card>
          </List>
        </FloatingPanel>
      )
    }

    this.login = 'login'
    this.platform = 'platform'
    this.playerRandom = 'playerRandom'
    this.playerFreedom = 'playerFreedom'
    this.board = 'board'
    this.watch = 'watch'
    this.review = 'review'
    this.roleBattle = 'ROLE_BATTLE'
    this.roleWatch = 'ROLE_WATCH'
    SocketUtils.getSocket().then((res) => {
      this.socket = res
      SocketEvent.startAllServiceLister(this.socket)
    })
    this.state = {
      // 当前登录人信息
      text: '',
      loading: true,
      connectCount: 0,
      page: this.login,
      userId: null,
      // 对战房间号
      roomId: null,
      // 对战编号
      battleId: null,
      // 加入房间的类型(自由匹配/随机匹配)
      joinRoomType: null,
      // 是否被踢出状态，此状态不需要断线重连等操作
      isKickOut: false,
      inviteUserList: [],
      showInviteView: false,
      watchUserId: null,
    }
    this.panelAnchors = [160, 360]
    this.moduleId = 'home'
  }

  componentDidMount() {
    this.startAllEventListen()
    this.inviteMessageExpired()
    document.addEventListener('visibilitychange', () => {
      document.hidden ? pauseAllSound() : startAllSound()
    })
  }

  componentWillUnmount() {
    clearInterval(this.inviteMessageExpiredInterId)
    SocketEvent.off(this.moduleId)
    this.setState = () => false
    document.removeEventListener('visibilitychange', () => {
      document.hidden ? pauseAllSound() : startAllSound()
    })
  }

  render() {
    const { page, joinRoomType, showInviteView } = this.state
    return (
      <div className={style.bg}>
        {/* 登录页面 */}
        {page === this.login && (
          <Login
            loginSuccess={(userId) => {
              this.setState({
                userId,
                page: this.platform,
                showInviteView: true,
              })
            }}
          />
        )}

        {/* 平台页面 */}
        {page === this.platform && (
          <Platform
            userId={this.state.userId}
            selectComplete={(mode) => {
              let nextPage
              let joinType = null
              switch (mode) {
                case MODE_WATCH:
                  nextPage = this.watch
                  break
                case MODE_REVIEW:
                  nextPage = this.review
                  break
                case MODE_RANDOM_PK:
                  nextPage = this.playerRandom
                  joinType = ROOM_JOIN_TYPE.RANDOM
                  break
                case MODE_FREEDOM_PK:
                  nextPage = this.playerFreedom
                  joinType = ROOM_JOIN_TYPE.FREEDOM
                  break
                default:
                  nextPage = this.platform
                  console.warn('模式选择错误')
              }
              this.setState({
                joinRoomType: joinType,
                page: nextPage,
                roomId: null,
                battleId: null,
                showInviteView: false,
              })
            }}
            changeInviteViewStatus={showInviteView => this.setState({
              showInviteView,
            })}
            goBack={() => this.setState({
              page: this.login,
              roomId: null,
              battleId: null,
            })}
          />
        )}

        {/* 其他页面 */}
        {page === this.playerRandom && (
          <PlayerRandom
            userId={this.state.userId}
            roomId={this.state.roomId}
            roomUser={this.state.roomUser}
            roomEnemy={this.state.roomEnemy}
            inviteUserList={this.state.inviteUserList.reverse().slice(0, 5)}
            handleInviteResult={(inviteData, result, callback) => this.handleInviteResult(inviteData, result, callback)}
            matchSuccess={(battleId, roomId, roomUser, roomEnemy) => {
              this.setState({
                page: this.board,
                battleId,
                roomId,
                roomUser,
                roomEnemy,
              })
            }}
            joinWatch={(userId, roomId, _watchUserId) => {
              this.setState({
                page: this.watch,
                roomId,
                watchUserId: userId,
              })
            }}
            goBack={() => this.setState({
              page: this.platform,
              roomId: null,
              battleId: null,
              showInviteView: !0,
            })}
          />
        )}

        {page === this.playerFreedom && (
          <PlayerFreedom
            userId={this.state.userId}
            roomId={this.state.roomId}
            roomUser={this.state.roomUser}
            roomEnemy={this.state.roomEnemy}
            matchSuccess={(battleId, roomId, roomUser, roomEnemy) => {
              this.setState({
                page: this.board,
                battleId,
                roomId,
                roomUser,
                roomEnemy,
              })
            }}
            goBack={() =>
              this.setState({
                page: this.platform,
                roomId: null,
                battleId: null,
                showInviteView: !0,
              })}
          />
        )}

        {page === this.board && (
          <Board
            userId={this.state.userId}
            roomUser={this.state.roomUser}
            roomEnemy={this.state.roomEnemy}
            roomId={this.state.roomId}
            battleId={this.state.battleId}
            goPlatformView={() => this.setState({
              page: this.platform,
              battleId: null,
              roomId: null,
              showInviteView: !0,
            })}
            goBack={() => this.setState({
              page: joinRoomType === ROOM_JOIN_TYPE.FREEDOM ? this.playerFreedom : this.playerRandom,
              battleId: null,
            })}

          />
        )}

        {page === this.watch && (
          <Watch
            userId={this.state.userId}
            roomId={this.state.roomId}
            battleId={this.state.battleId}
            watchUserId={this.state.watchUserId}
            goBack={() => this.setState({
              page: this.platform,
              roomId: null,
              battleId: null,
              showInviteView: !0,
              watchUserId: null,
            })}
          />
        )}

        {page === this.review && (
          <Review
            userId={this.state.userId}
            goBack={() => this.setState({
              page: this.platform,
              showInviteView: !0,
            })}
          />
        )}
        {showInviteView && this.inviteUserView()}
        {/* 加载动画 */}
        <AdvancedSpin text={this.state.text} show={this.state.loading} />
      </div>
    )
  }
}

export default Home
