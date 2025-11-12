import {
  Badge,
  Button,
  Dialog,
  Empty,
  FloatingBubble,
  Grid,
  Image,
  List,
  Popup,
  Tabs,
  Toast,
} from 'antd-mobile'
import { Component } from 'react'
import onlineUserImg from '@/assets/onlineUser.png'
import AdvancedBtn from '@/button/index.jsx'
import config from '@/config.js'
import { ROOM_JOIN_TYPE, USER_STATUS } from '@/enums.js'
import SocketEvent, { sleep } from '@/service/event.js'
import { dateDiffSeconds } from '@/utils/dateUtil.js'
import { btnSound, playSound } from '@/utils/sounds-res.js'
import styles from './index.module.less'

class PlayerRandom extends Component {
  constructor(props) {
    super(props)

    this.onlineUserActionTimer = () => {
      this.onlineUserActionInterId = setInterval(() => {
        const updatedUserMap = new Map(this.state.onlineUserMap)

        updatedUserMap.forEach((user, userId) => {
          const timeStr = this.handleOnlineUserTimeStr(user)
          updatedUserMap.set(userId, { ...user, ...timeStr })
        })

        this.setState({ onlineUserMap: updatedUserMap })
      }, 5000)
    }

    this.handleOnlineUserTimeStr = (user) => {
      const timeDiff = dateDiffSeconds(user.extendStr, new Date())
      const timeStr = timeDiff < 60 ? '近1分钟' : `${Math.floor(timeDiff / 60)}分钟`

      return {
        battleTimeStr: `开局${timeStr}`,
        watchTimeStr: `观战${timeStr}`,
      }
    }

    this.initRoomData = () => {
      const { userId, roomId, roomUser, roomEnemy } = this.props

      if (roomId) {
        console.log(`已存在对战房间号，同步房间数据, roomId: ${roomId}, 双方信息为(可能):`, roomUser, roomEnemy)
        this.setState({
          roomId,
          historyRoomList: [{ roomId, timestamp: Date.now() }],
          roomUser: roomUser ? { ...roomUser, isReady: false } : null,
          roomEnemy: roomEnemy ? { ...roomEnemy, isReady: false } : null,
        })

        SocketEvent.emit('syncRoomDataApi', { userId, roomId }, (response) => {
          if (response.code !== 'success') {
            Dialog.alert({
              title: '系统提示',
              content: response.msg,
              confirmText: '返回',
              onConfirm: () => {
                playSound(btnSound)
                this.props.goBack()
              },
            })
          }
        })
      }
      else {
        console.log('开始申请加入房间 userId: ', userId)
        this.applyJoinRoom()
      }
    }

    this.startEventListen = () => {
      SocketEvent.on('onlineUserListRespApi', this.moduleId, (response) => {
        console.log('加载在线用户数据, resp: ', response)
        if (response.code !== 'success') {
          Dialog.alert({
            title: '系统提示',
            content: response.msg,
            confirmText: '知道了',
            onConfirm: () => {
              playSound(btnSound)
            },
          })
          return
        }

        const users = response.data || []
        const onlineUserMap = new Map()

        users.forEach((user) => {
          const timeStr = this.handleOnlineUserTimeStr(user)
          onlineUserMap.set(user.userId, {
            ...user,
            battleTimeStr: timeStr.battleTimeStr,
            watchTimeStr: timeStr.watchTimeStr,
            inviteDesc: '',
          })
        })

        this.setState({ onlineUserMap })
      })

      SocketEvent.on('onlineUserChangeRespApi', this.moduleId, (response) => {
        if (response.code !== 'success') {
          return
        }
        console.log('在线数据变更：', response)

        const { userArray, dataType, changeType } = response.data
        const onlineUserMap = this.state.onlineUserMap

        userArray.filter(user => user.userId !== this.props.userId).forEach((user) => {
          if (dataType === 'onlineCount' && changeType === 'sub') {
            onlineUserMap.delete(user.userId)
          }
          else {
            const timeStr = this.handleOnlineUserTimeStr(user)
            onlineUserMap.set(user.userId, {
              ...user,
              battleTimeStr: timeStr.battleTimeStr,
              watchTimeStr: timeStr.watchTimeStr,
            })
          }
        })

        this.setState({ onlineUserMap })
      })

      SocketEvent.on('syncRoomDataRespApi', this.moduleId, (response) => {
        console.log('同步的房间数据为：', response)
        if (response.code !== 'success') {
          console.error('房间数据异常，错误信息：', response.msg)
          Toast.fail(response.msg, 2, () => {
            this.props.goBack()
          })
          return
        }

        const { roomId, roomDataList } = response.data
        const roomUser = roomDataList.find(user => user.userId === this.props.userId)
        const roomEnemy = roomDataList.find(user => user.userId !== this.props.userId)

        this.setState({ roomUser, roomEnemy, roomId })
        if (!this.intervalId) {
          this.userReadyTimeout()
        }
      })

      SocketEvent.on('enemyLeaveRoomRespApi', this.moduleId, (response) => {
        console.log('对方离开了我方房间，返回：', response)
        if (response.code === 'success' && this.state.roomEnemy?.userId === response.data.userId) {
          this.setState({ roomEnemy: null })
        }
      })

      SocketEvent.on('matchSuccessRespApi', this.moduleId, (response) => {
        console.log('服务器返回双方已准备信息，resp: ', response)
        this.setState({ loading: response.code === 'success', text: '' })
        if (response.code !== 'success') {
          Toast.show(response.msg)
        }
      })

      SocketEvent.on('allowInBattleApi', this.moduleId, async (response) => {
        console.log('服务器允许双方进入对局，resp: ', response)
        if (response.code !== 'success') {
          return Toast.show(response.msg)
        }

        while (!this.state.roomUser?.isReady || !this.state.roomEnemy?.isReady) {
          await sleep(10)
        }

        const { battleId, playOne, playTwo } = response.data
        const userId = this.props.userId
        const roomId = this.state.roomId
        const self = playOne.userId === userId ? playOne : playTwo
        const opponent = playOne.userId === userId ? playTwo : playOne

        console.log(`即将进入对战页面, userId: ${self.userId}, roomId: ${roomId}`)
        this.props.matchSuccess(battleId, roomId, self, opponent)
      })

      SocketEvent.on('kickUserRespApi', this.moduleId, (response) => {
        console.log('被房主踢出房间，resp: ', response)
        if (response.code === 'success' && this.props.userId === response.data.userId && this.state.roomId === response.data.roomId) {
          clearInterval(this.intervalId)
          SocketEvent.off(this.moduleId)
          Dialog.alert({
            title: '系统提示',
            content: '您被房主请出了房间',
            confirmText: '确认',
            onConfirm: () => {
              playSound(btnSound)
              this.props.goBack()
            },
          })
        }
        else {
          Toast.show(response.msg)
        }
      })

      SocketEvent.on('inviteUserResultRespApi', this.moduleId, (response) => {
        console.log('对方对邀请结果进行了响应，resp: ', response)
        if (response.code !== 'success') {
          return Toast.show(response.msg)
        }

        const { result, rejectDesc, userName, userId } = response.data
        if (result === 'reject') {
          Toast.show({ content: `${userName}：${rejectDesc}`, duration: 3000 })

          const onlineUserMap = this.state.onlineUserMap
          const user = onlineUserMap.get(userId)
          if (user) {
            onlineUserMap.set(userId, { ...user, inviteDesc: '邀请被拒' })
            this.setState({ onlineUserMap })
          }
        }
      })
    }

    this.getHistoryJoinRoomIds = () => {
      const { historyRoomList } = this.state
      const currentTime = Date.now()
      const timeThreshold = 1e4 // 10,000 milliseconds

      const recentRooms = historyRoomList?.filter(room => currentTime - room.timestamp <= timeThreshold) || []

      this.setState({
        historyRoomList: recentRooms,
      })

      return recentRooms.map(room => room.roomId)
    }
    this.applyJoinRoom = () => {
      const { userId } = this.props
      const { roomId, historyRoomList } = this.state

      this.setState({
        loading: false,
      })

      console.log(`开始发送加入房间的请求:`, { userId })

      SocketEvent.emit('joinRoomApi', {
        userId,
        oldRoomIds: roomId ? [roomId] : null,
        joinType: ROOM_JOIN_TYPE.RANDOM,
      }, (response) => {
        console.log(`申请加入房间结果返回，resp: `, response)

        if (response.code === 'success') {
          const newRoomId = response.data.roomId
          const updatedHistoryRoomList = [...historyRoomList, { roomId: newRoomId, timestamp: Date.now() }]

          this.setState({
            roomId: newRoomId,
            historyRoomList: updatedHistoryRoomList,
          })
        }
        else {
          Dialog.alert({
            title: '系统提示',
            content: response.msg,
            confirmText: '确定',
            onConfirm: () => {
              playSound(btnSound)
              this.props.goBack()
            },
          })
        }
      })
    }
    this.userReadyTimeout = () => {
      this.setState({
        timeout: config.normalReadyTimeout,
      })

      this.intervalId = setInterval(async () => {
        const { roomUser, roomEnemy, timeout } = this.state

        if (roomUser && roomUser.isReady) {
          clearInterval(this.intervalId)
          delete this.intervalId
          return false
        }

        let newTimeout = timeout - 1
        if (roomEnemy && roomEnemy.isReady) {
          newTimeout = Math.min(newTimeout, config.noReadyTimeout)
        }

        if (newTimeout < 0) {
          clearInterval(this.intervalId)
          delete this.intervalId
          console.log(`准备进行超时离开，roomId：${this.state.roomId}`)

          SocketEvent.emit('leaveRoomApi', {
            userId: this.props.userId,
            roomId: this.state.roomId,
          }, (response) => {
            console.log('离开房间结果返回: ', response)
            if (response.code === 'success') {
              this.props.goBack()
            }
            else {
              console.log(`无法离开该房间 ${this.state.roomId}`)
            }
          })

          return false
        }
        else {
          this.setState({ timeout: newTimeout })
        }
      }, 1000)
    }
    this.startClick = async () => {
      playSound(btnSound)
      const { swapDesk, roomId, roomEnemy } = this.state

      console.log(`点击「开始」按钮，roomId: ${roomId}`)

      if (swapDesk) {
        Toast.show('请等待换房完成')
        return
      }

      const handleUserReady = () => {
        SocketEvent.emit('userReadyApi', {
          userId: this.props.userId,
          roomId: this.state.roomId,
        }, (response) => {
          if (response.code !== 'success') {
            Toast.show(response.msg)
          }
        })
      }

      if (roomEnemy && roomEnemy.isOffline && roomEnemy.isReady) {
        Dialog.confirm({
          title: '系统提示',
          content: '对手已离线，确认对局吗？',
          confirmText: '确认',
          cancelText: '取消',
          onConfirm: () => {
            playSound(btnSound)
            handleUserReady()
          },
          onCancel: () => {
            playSound(btnSound)
          },
        })
      }
      else {
        handleUserReady()
      }
    }

    this.swapDeskClick = () => {
      playSound(btnSound)

      clearInterval(this.intervalId)
      delete this.intervalId

      this.setState({
        loading: false,
        swapDesk: true,
        swapDeskLock: true,
      })

      setTimeout(() => this.setState({ swapDeskLock: false }), 2000)

      SocketEvent.emit('swapDeskApi', {
        userId: this.props.userId,
        roomId: this.state.roomId,
        oldRoomIds: this.getHistoryJoinRoomIds(),
        joinType: ROOM_JOIN_TYPE.RANDOM,
      }, (response) => {
        console.log('换房结果返回: ', response)
        if (response.code === 'success') {
          const newRoomId = response.data.roomId
          const historyRoomList = this.state.historyRoomList
          historyRoomList.push({
            roomId: newRoomId,
            timestamp: Date.now(),
          })
          this.setState({
            roomId: newRoomId,
            historyRoomList,
            swapDesk: false,
          })
        }
        else {
          Toast.show(response.msg)
          this.goBack()
        }
      })
    }

    this.goBack = () => {
      playSound(btnSound)
      const roomId = this.state.roomId
      if (roomId) {
        console.log(`用户[${this.props.userId}]即将退出房间[${roomId}]`)

        SocketEvent.emit('leaveRoomApi', {
          userId: this.props.userId,
          roomId,
        }, (response) => {
          this.setState({
            loading: false,
          })

          console.log('离开房间结果返回: ', response)

          if (response.code === 'success') {
            // 如果成功离开房间，则执行返回操作
            this.props.goBack()
          }
          else {
            // 如果失败，显示错误消息
            Toast.show(response.msg)
          }
        })
      }
    }
    this.kickEnemyHandle = () => {
      const kickAction = () => {
        const enemyInfo = this.state.roomEnemy
        if (enemyInfo) {
          const currentUserId = this.props.userId
          const targetUserId = enemyInfo.userId
          const roomId = enemyInfo.roomId
          SocketEvent.emit('kickUserApi', {
            userId: currentUserId,
            kickUserId: targetUserId,
            roomId,
          }, (response) => {
            if (response.code !== 'success') {
              Toast.show(response.msg)
            }
          })
        }
        else {
          Toast.show('对方已不在房间中')
        }
      }

      Dialog.confirm({
        title: '系统提示',
        content: '确定踢出对手吗？',
        confirmText: '确认',
        cancelText: '取消',
        onConfirm: () => {
          playSound(btnSound)
          kickAction()
        },
        onCancel: () => {
          playSound(btnSound)
        },
      })
    }

    this.showOnlineUser = () => {
      playSound(btnSound)
      this.setState({
        userListVisible: !0,
      })
    }
    this.inviteUser = (inviteUserId) => {
      playSound(btnSound)
      SocketEvent.emit('inviteUserApi', {
        userId: this.props.userId,
        roomId: this.state.roomId,
        inviteUserId,
      }, (response) => {
        console.log('邀请用户加入房间返回: ', response)
        if (response.code === 'success') {
          const updatedOnlineUserMap = this.state.onlineUserMap
          const userInfo = updatedOnlineUserMap.get(inviteUserId)
          if (userInfo) {
            updatedOnlineUserMap.set(inviteUserId, { ...userInfo, inviteDesc: '已邀请' })
            this.setState({
              onlineUserMap: updatedOnlineUserMap,
            })
          }
        }
        else {
          Toast.show(response.msg)
        }
      })
    }

    this.leaveRoomAndJoinWatch = (userId, roomId, battleId) => {
      playSound(btnSound)
      Dialog.confirm({
        title: '系统提示',
        content: '离开当前房间并加入观战?',
        confirmText: '确认',
        cancelText: '取消',
        onConfirm: () => {
          playSound(btnSound)
          SocketEvent.emit('leaveRoomApi', {
            userId: this.props.userId,
            roomId: this.state.roomId,
          }, (response) => {
            console.log('(在房间中观战别人)离开房间结果返回: ', response)
            if (response.code === 'success') {
              this.props.joinWatch(userId, roomId, battleId)
            }
            else {
              Toast.show(response.msg)
            }
          })
        },
        onCancel: () => {
          playSound(btnSound)
        },
      })
    }

    this.handleInvite = (inviteData) => {
      playSound(btnSound)

      // 获取用户名
      const userName = inviteData.userName

      // 显示确认对话框
      Dialog.confirm({
        title: '系统提示',
        content: `邀请人：${userName}`,
        confirmText: '同意',
        cancelText: '拒绝',
        onConfirm: () => {
          if (this.intervalId) {
            clearInterval(this.intervalId)
            delete this.intervalId
          }

          this.props.handleInviteResult(inviteData, 'agree', () => {
            if (!this.intervalId) {
              this.userReadyTimeout()
            }
          })
        },
        onCancel: () => {
          this.props.handleInviteResult(inviteData, 'reject')
        },
      })
    }
    this.state = {
      loading: false,
      text: null,
      swapDesk: false,
      swapDeskLock: false,
      roomUser: null,
      roomEnemy: null,
      timeout: null,
      roomId: null,
      historyRoomList: [],
      userListVisible: false,
      onlineUserMap: new Map(),
      friendList: [],
    }
    this.moduleId = 'playerRandom'
  }

  componentDidMount() {
    const userId = this.props.userId
    console.log('进入匹配页面(随机模式) userId: ', userId)
    this.initRoomData()
    this.startEventListen()
    this.onlineUserActionTimer()
  }

  componentWillUnmount() {
    clearInterval(this.intervalId)
    clearInterval(this.onlineUserActionInterId)
    Toast.clear()
    SocketEvent.off(this.moduleId)
    this.setState = () => false
  }

  render() {
    const { inviteUserList } = this.props
    const { roomUser, roomEnemy, timeout, swapDeskLock, userListVisible, onlineUserMap } = this.state
    const playerIds = [roomUser?.userId, roomEnemy?.userId]
    const onlineUsers = [...onlineUserMap.values()].filter(user => !playerIds.includes(user.userId))

    return (
      <div className={styles.wrap}>
        {/* 邀请列表 */}
        <div className={styles.inviteShow}>
          {inviteUserList?.length
            ? (
                <div className={styles.inviteList}>
                  {inviteUserList.map(user => (
                    <div key={user.userId} className={styles.item} onClick={() => this.handleInvite(user)}>
                      <Image src={user.iconUrl} width={38} height={38} style={{ borderRadius: 19 }} />
                      <span className={styles.text}>[邀请]</span>
                    </div>
                  ))}
                </div>
              )
            : null}
        </div>

        {/* PK 战斗板块 */}
        <div className={styles.pkBoard}>
          <div className={styles.pkTitle}>
            <div className={styles.subject}>
              <div className={styles.icon} />
              <span>
                对战平台
                <label>
                  {roomUser?.roomId ? `(${roomUser.roomId}号房)` : ''}
                </label>

              </span>
            </div>
            <div className={styles.extends}>
              <div
                onClick={() => this.kickEnemyHandle()}
                style={{
                  marginRight: 10,
                  display: roomUser?.isRoomAdmin && roomEnemy ? 'inline-block' : 'none',
                }}
              >
                <Badge content="踢">

                </Badge>

              </div>
            </div>
          </div>

          {/* 玩家信息 */
          }
          {
            [roomUser, roomEnemy].map((player, index) => (
              player
                ? (
                    <div key={index} className={styles.pkLineItem}>
                      <div className={styles.border}>
                        <div className={styles.firstTips}>
                          <sup style={{ backgroundColor: player.first ? '#ff5b05' : '#1e1e1a' }}>
                            {player.first ? '先手' : '后手'}
                          </sup>
                        </div>
                        <Grid columns={24} gap={1}>
                          <Grid.Item span={4} className={styles.titleLeft}>名称:</Grid.Item>
                          <Grid.Item span={11} className={styles.name}>{player.userName}</Grid.Item>
                          <Grid.Item span={9} className={styles.timeout}>
                            {player.isReady ? '准备' : index === 0 && timeout}
                            <span style={{ display: player.isOffline ? 'inline-block' : 'none' }}>离线</span>
                          </Grid.Item>
                        </Grid>
                        <Grid columns={24} gap={1}>
                          <Grid.Item span={4} className={styles.titleLeft}>积分:</Grid.Item>
                          <Grid.Item span={10} className={styles.score}>{player.score}</Grid.Item>
                          <Grid.Item span={6} className={styles.title}>胜率:</Grid.Item>
                          <Grid.Item span={4} className={styles.scoreRight}>
                            {player.pkTotalCount > 0 ? Math.floor((player.pkWinCount / player.pkTotalCount) * 100) : 0}
                            %
                          </Grid.Item>
                        </Grid>
                      </div>
                    </div>
                  )
                : (
                    <div key={index} className={styles.pkLineItem}>
                      <div className={styles.mask}>
                        <div className={styles.content}>等待玩家加入</div>
                      </div>
                    </div>
                  )
            ))
          }

          {/* 按钮操作 */}
          <div className={styles.pkLineItem}>
            <Grid columns={24} gap={1}>
              <Grid.Item span={2}>
              </Grid.Item>
              <Grid.Item span={6}>
                <AdvancedBtn
                  type="normal"
                  onClick={this.startClick}
                  disabled={roomUser?.isReady}
                  text="开始"
                >
                </AdvancedBtn>
              </Grid.Item>
              <Grid.Item span={1}>
              </Grid.Item>
              <Grid.Item span={6}>
                <AdvancedBtn
                  type="normal"
                  onClick={this.swapDeskClick}
                  disabled={swapDeskLock || (roomUser?.isReady && roomEnemy?.isReady)}
                  text="换房"
                >
                </AdvancedBtn>
              </Grid.Item>
              <Grid.Item span={1}>
              </Grid.Item>
              <Grid.Item span={6}>
                <AdvancedBtn
                  type="danger"
                  onClick={this.goBack}
                  disabled={roomUser?.isReady && roomEnemy?.isReady}
                  text="返回"
                >
                </AdvancedBtn>
              </Grid.Item>
              <Grid.Item span={2}>
              </Grid.Item>
            </Grid>
          </div>
        </div>

        {/* 在线用户悬浮按钮 */}
        <FloatingBubble
          magnetic="x"
          axis="xy"
          style={{
            '--initial-position-bottom': '24px',
            '--initial-position-right': '24px',
            '--edge-distance': '24px',
            '--background': '#eee',
          }}
          className={styles.floatingBubble}
        >
          <Badge
            bordered
            style={{
              '--right': '7px',
              '--top': '3px',
              'display': onlineUsers.length ? 'block' : 'none',
            }}
            content={onlineUsers.length > 99 ? '99+' : onlineUsers.length}
          >
            <img src={onlineUserImg} width="100%" height="100%" alt="在线用户" onClick={this.showOnlineUser} />
          </Badge>

        </FloatingBubble>

        {/* 在线用户列表弹出框 */}
        <Popup
          visible={userListVisible}
          bodyStyle={{
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
          }}
          style={{ height: '40vh' }}
          onMaskClick={() => this.setState({ userListVisible: false })}
        >
          <div className={styles.onlineHead}>
            <Tabs
              activeKey="onlineUser"
              style={{
                '--content-padding': 0,
              }}
              stretch
            >
              <Tabs.Tab key="onlineUser" title="在线用户">

              </Tabs.Tab>
            </Tabs>
          </div>
          <div className={styles.onlineContent}>
            <List>
              {onlineUsers.length === 0
                ? (
                    <div className={styles.empty}>
                      <Empty description="暂无玩家数据" />
                    </div>
                  )
                : (
                    onlineUsers.map(user => (
                      <List.Item
                        key={user.userId}
                        className={styles.userItem}
                        prefix={(
                          <Image
                            src={user.iconUrl}
                            lazy
                            fit="cover"
                            width={40}
                            height={40}
                            style={{ borderRadius: 20, border: '1px solid #efefef' }}
                          />
                        )}
                        extra={(
                          <>
                            {(user.status === USER_STATUS.PLATFORM || user.status === USER_STATUS.WATCH || user.status === USER_STATUS.IN_ROOM)
                              && (
                                <Button
                                  size="mini"
                                  color="success"
                                  onClick={() => this.inviteUser(user.userId)}
                                >
                                  邀请
                                </Button>
                              )}
                            {user.status === USER_STATUS.BATTLE && (
                              <Button
                                size="mini"
                                color="primary"
                                onClick={() => this.leaveRoomAndJoinWatch(user.userId, user.roomId, user.battleId)}
                              >
                                观战
                              </Button>
                            )}
                          </>
                        )}
                        description={(
                          <div className={styles.itemDescription}>
                            <div className={styles.desc}>
                              <label className={styles.score}>
                                <span>积分: </span>
                                {user.score || '-'}
                              </label>
                              <label className={styles.score}>
                                <span>胜率: </span>
                                {user.sucPercentage || '0'}
                                %
                              </label>
                            </div>
                          </div>
                        )}

                      >
                        <div className={styles.content}>
                          <span>{user.userName}</span>
                          <div className={styles.invite}>{user.inviteDesc}</div>
                          <label className={styles.status}>
                            {
                              user.status === USER_STATUS.PLATFORM
                                ? user.statusName
                                : user.status === USER_STATUS.BATTLE
                                  ? user.battleTimeStr
                                  : user.status === USER_STATUS.WATCH
                                    ? user.watchTimeStr
                                    : user.status === USER_STATUS.IN_ROOM
                                      ? `${user.statusName}${user.extendStr || ''}`
                                      : ''
                            }
                          </label>
                        </div>
                      </List.Item>
                    ))
                  )}
            </List>
          </div>
        </Popup>
      </div>
    )
  }
}

export default PlayerRandom
