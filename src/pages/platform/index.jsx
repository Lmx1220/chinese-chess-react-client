import { USER_TYPE } from '@/enums.js'
import ModeUserAvatar from '@/pages/platform/components/modeUserAvatar/index.jsx'
import SocketEvent from '@/service/event.js'
import AdvancedSpin from '@/spinner/index.jsx'
import { CACHE_BATTLE_KEY } from '@/utils/cache-key-utils.js'
import { btnSound, playSound } from '@/utils/sounds-res.js'
import { Badge, Ellipsis, Image, Toast } from 'antd-mobile'
import { Component } from 'react'
import ViewModeUserDetail from './components/viewModeUserDetail/index.jsx'
import style from './index.module.less'

/**
 * 模式枚举
 * @type {string}
 */
// 匹配模式
export const MODE_RANDOM_PK = 'MODE_RANDOM_BATTLE'
// 开房模式
export const MODE_FREEDOM_PK = 'MODE_FREEDOM_BATTLE'
// 观战
export const MODE_WATCH = 'MODE_WATCH'
// 复盘
export const MODE_REVIEW = 'MODE_REVIEW'
class Platform extends Component {
  constructor(props) {
    super(props)
    this.queryUserDetail = () => {
      // 发送请求获取用户详细信息
      SocketEvent.emit('userDetailApi', {
        userId: props.userId,
      }, (response) => {
        console.log('用户详情：', response)

        if (response.code === 'success') {
          // 更新用户信息到组件状态中
          const user = response.data.user
          this.setState({
            user,
          })
          // 将用户信息存储到 sessionStorage 中
          sessionStorage.setItem(CACHE_BATTLE_KEY, JSON.stringify(user))

          // 如果用户没有头像，则切换到头像视图，并改变邀请视图状态为不可见
          if (!user.iconUrl) {
            this.setState({
              viewMode: this.viewModeUserAvatar,
            })
            this.props.changeInviteViewStatus(false)
          }
        }
        else {
          // 显示提示信息，提示用户账号信息异常，请重新登录
          Toast.show('账号信息异常，请重新登录')
          // 返回上一页
          this.props.goBack()
        }
      })
    }

    this.sendOnlineCount = (bool) => {
      // 判断页面是否可见
      const hidden = typeof bool === 'boolean' ? bool : document.hidden

      // 如果页面可见，则发送在线统计请求
      if (!hidden) {
        SocketEvent.emit('onlineCountApi', {
          userId: props.userId,
        }, (response) => {
          console.log('请求统计在线数据返回：', response)
        })
      }
    }

    this.startAllEventListen = () => {
      SocketEvent.on('onlineCountRespApi', this.moduleId, (res) => {
        if (res.code === 'success') {
          // 在线数据统计
          console.log('在线数据统计：', res)

          // 解构从响应中获取的数据
          const { roomCount, battleCount, watchCount } = res.data

          // 从组件状态中获取当前的房间数、战斗数和观看数
          const {
            roomCount: currentRoomCount,
            battleCount: currentBattleCount,
            watchCount: currentWatchCount,
          } = this.state

          // 更新房间数、战斗数和观看数到组件状态中
          this.setState({
            roomCount: roomCount === undefined ? currentRoomCount : roomCount,
            battleCount: battleCount === undefined ? currentBattleCount : battleCount,
            watchCount: watchCount === undefined ? currentWatchCount : watchCount,
          })
        }
      })
    }

    this.handleMatchMode = (mode) => {
      // if (mode === 'MODE_WATCH'){
      //   return Toast.show("暂未开放")
      // }
      playSound(btnSound)
      const { user } = this.state
      const { userType, userName, iconUrl } = user || {}

      if (user) {
        if (iconUrl) {
          if (userType !== USER_TYPE.TOURIST_USER && userName && userName.length > 5) {
            // 在个人中心修改用户名
            Toast.show('请在个人中心修改名称')
          }
          else {
            // 延迟一段时间后执行选择完成的回调函数
            setTimeout(() => {
              this.props.selectComplete(mode)
            }, 150)
          }
        }
        else {
          // 请上传头像
          Toast.show('请上传头像')
        }
      }
      else {
        // 用户数据错误
        Toast.show('用户数据错误')
      }
    }

    this.platformView = () => {
      const { user, roomCount, battleCount, viewMode } = this.state
      const isDefaultView = viewMode === this.viewModeDefault

      return (
        <div className={style.platformBody} style={{ display: isDefaultView ? 'block' : 'none' }}>
          <div className={style.user}>
            <div
              className={style.icon}
              onClick={() => {
                playSound(btnSound)
                setTimeout(() => {
                  this.setState({ viewMode: this.viewModeUserDetail })
                  this.props.changeInviteViewStatus(false)
                }, 150)
              }}
            >
              <div className={style.imgWrap}>
                <Image
                  src={user?.iconUrl}
                  style={{ borderRadius: 22, border: '1px solid #eee' }}
                  fit="cover"
                  width={44}
                  height={44}
                />
              </div>
              <div className={style.battle}>
                <div className={style.title}>
                  <div className={style.name}>
                    <div><Ellipsis content={user?.userName || ''} /></div>
                  </div>
                  <div className={style.sort}>
                    <div>
                      排名：
                      <span>{user?.scoreSort ? `第 ${user.scoreSort} 位` : ' - '}</span>
                    </div>
                  </div>
                </div>
                <div className={style.info}>
                  <div className={style.subject}>
                    <div>积分</div>
                    <div>
                      <span>胜</span>
&nbsp;
                      <span>负</span>
&nbsp;
                      <span>和</span>
                    </div>
                  </div>
                  <div className={style.value}>
                    <div>{user?.score || '-'}</div>
                    <div>
                      <span>{user?.pkWinCount || '0'}</span>
                      /
                      <span>{user?.pkFailCount || '0'}</span>
                      /
                      <span>{user?.pkPeaceCount || '0'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={style.platform}>
            <div className={style.badge}>
              <Badge content={`在线: ${roomCount}`}>
                <div className={style.btnRed} onClick={() => this.handleMatchMode(MODE_RANDOM_PK)}>
                  加入房间
                </div>
              </Badge>
            </div>
            <div className={style.badge}>
              <Badge content={`场次: ${battleCount}`}>
                <div className={style.btnRed} onClick={() => this.handleMatchMode(MODE_WATCH)}>
                  观战对局
                </div>
              </Badge>
            </div>
            <div className={style.badge}>
              <Badge content={`场次: ${user?.pkTotalCount || 0}`}>
                <div className={style.btnRed} onClick={() => this.handleMatchMode(MODE_REVIEW)}>
                  复盘对局
                </div>
              </Badge>
            </div>
          </div>
        </div>
      )
    }

    // this.joinRoomSelectView = () => (
    //   <div className={style.joinRoomSelectBody}>
    //     <ChildTitleLayout text="房间模式" />
    //     <div className={style.content}>
    //       <AdvancedBtn type="normal" text="匹配对战" onClick={() => this.handleMatchMode(MODE_RANDOM_PK)} />
    //       <div />
    //       <AdvancedBtn type="normal" text="开房约战" onClick={() => this.handleMatchMode(MODE_FREEDOM_PK)} />
    //     </div>
    //   </div>
    // )

    this.viewModeDefault = 'viewModeDefault'
    // this.viewModeJoinRoom = 'viewModeJoinRoom'
    this.viewModeUserDetail = 'viewModeUserDetail'
    this.viewModeUserAvatar = 'viewModeUserAvatar'
    this.state = {
      text: '',
      loading: false,
      user: null,
      roomCount: 0,
      battleCount: 0,
      watchCount: 0,
      viewMode: this.viewModeDefault,
    }
    this.moduleId = 'platform'
  }

  componentDidMount() {
    const str = sessionStorage.getItem(CACHE_BATTLE_KEY)
    if (str) {
      this.setState({
        user: JSON.parse(str),
      })
    }
    document.addEventListener('visibilitychange', this.sendOnlineCount)
    this.queryUserDetail()
    this.startAllEventListen()
    this.sendOnlineCount(false)
  }

  componentWillUnmount() {
    document.removeEventListener('visibilitychange', this.sendOnlineCount)
    SocketEvent.off(this.moduleId)
    this.setState = () => false
  }

  render() {
    const { viewMode, user } = this.state
    return (
      <>
        <div className={style.wrap}>
          {this.platformView()}
          {viewMode === this.viewModeUserDetail && (
            <ViewModeUserDetail
              userId={this.props.userId}
              user={user}
              queryUserDetail={() => this.queryUserDetail()}
              goBack={() => {
                playSound(btnSound)
                this.setState({ viewMode: this.viewModeDefault })
                this.props.changeInviteViewStatus(true)
              }}
              goLoginOut={() => this.props.goBack()}
            />
          )}
          {viewMode === this.viewModeUserAvatar && (
            <ModeUserAvatar
              userId={this.props.userId}
              goBack={() => {
                playSound(btnSound)
                this.queryUserDetail()
                this.setState({ viewMode: this.viewModeDefault })
                this.props.changeInviteViewStatus(true)
              }}
            />
          )}
          <AdvancedSpin text={this.state.text} show={this.state.loading} />
        </div>
      </>
    )
  }
}

export default Platform
