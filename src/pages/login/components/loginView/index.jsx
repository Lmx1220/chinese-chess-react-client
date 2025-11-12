import { Dialog, Form, Grid, Input, Toast } from 'antd-mobile'
import { Modal } from 'antd-mobile-v2'
import { Component } from 'react'
import qqImg from '@/assets/qq.png'
import visitorImg from '@/assets/visitor.png'
import AdvancedBtn from '@/button/index.jsx'
import config from '@/config.js'
import { USER_TYPE } from '@/enums.js'
import SocketEvent, { sleep } from '@/service/event.js'
import SocketUtils from '@/service/socket.js'
import AdvancedSpin from '@/spinner/index.jsx'
import {
  CACHE_BATTLE_KEY,
  CACHE_QQ_USER_KEY,
  CACHE_TOURIST_USER_KEY,
  CACHE_USER_KEY,
} from '@/utils/cache-key-utils.js'
import { encryptByMd5 } from '@/utils/cipher.js'
import { btnSound, playSound } from '@/utils/sounds-res.js'
import { getItem, removeItem, setItem } from '@/utils/storage-utils.js'
import style from './index.module.less'

class LoginView extends Component {
  constructor(props) {
    super(props)

    this.state = {
      text: '',
      loading: false,
      userId: null,
      password: null,
      isSpeedLogin: false,
      isPull: false,
    }
  }

  pullHandle = () => {
    playSound(btnSound)

    const isPull = this.state.isPull
    this.setState({
      isPull: !isPull,
    })
    this.props.setHeaderHide(!isPull)
    this.props.setFloorHide(!isPull)
  }

  qqLogin = async () => {
    playSound(btnSound)

    setTimeout(async () => {
      // 获取 QQ 登录信息

      const storedData = await getItem(CACHE_QQ_USER_KEY)
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData)
          const { openId, accessToken, type } = parsedData

          if (openId && accessToken) {
            console.log('QQ 登录信息：', parsedData)

            SocketEvent.emit(
              'loginApi',
              { password: encryptByMd5(openId), type, openId, accessToken },
              (response) => {
                console.log('账号登录返回：', response)
                this.setState({ loading: false })

                if (response.code === 'success') {
                  this.props.loginSuccess(response.data.userId)
                }
                else {
                  Toast.show(response.msg)
                  playSound(btnSound)
                }
              },
            )
          }
        }
        catch (error) {
          console.error('解析 QQ 登录数据失败', error)
        }
      }

      // 如果没有 QQ 登录数据，则跳转到 QQ 授权页面
      const fingerprint = await SocketUtils.getFinger()
      const qqAuthUrl = `https://graph.qq.com/oauth2.0/show?state=${fingerprint}&which=Login&display=pc&client_id=${config.APP_ID}&response_type=token&scope=all&redirect_uri=${config.LOGIN_CALL_PATH}`

      // 使用 window.open 而不是直接修改 href，避免影响当前页面
      window.open(qqAuthUrl, '_blank')

      // 更新组件状态
      this.setState({ isPull: false })
      this.props.setHeaderHide(false)
      this.props.setFloorHide(false)
    })
  }

  /**
   * 用户登录
   */
  loginClick = () => {
    playSound(btnSound)

    // 从组件状态中获取用户ID、密码、票据和是否为快速登录标志位
    const { userId, password, ticket, isSpeedLogin } = this.state
    if (!userId) {
      Toast.show('请输入账号')
      return
    }

    if (!password) {
      Toast.show('请输入密码')
      return
    }

    // 设置加载状态和文本内容
    this.setState({
      loading: true,
      text: '正在登录',
    })

    // 根据是否为快速登录选择登录类型
    const loginType = isSpeedLogin ? USER_TYPE.TOURIST_USER : USER_TYPE.REGISTER_USER

    // 发送登录请求
    SocketEvent.emit('loginApi', {
      userId,
      password: encryptByMd5(password),
      ticket,
      type: loginType,
    }, (response) => {
      console.log('账号登录返回：', response)
      // 恢复加载状态
      this.setState({
        loading: false,
      })
      // 如果登录成功
      if (response.code === 'success') {
        // 从响应数据中获取票据和用户ID
        const { ticket: newTicket, userId: newUserId } = response.data || {}

        // 存储登录信息到本地存储中
        setItem(CACHE_USER_KEY, JSON.stringify({
          userId: newUserId,
          pwdLength: password.length,
          ticket: newTicket,
          type: USER_TYPE.REGISTER_USER,
        }))

        // 触发登录成功回调函数
        this.props.loginSuccess(newUserId)
      }
      else {
        // 如果登录失败，显示错误信息
        Toast.show(response.msg)

        // 如果是快速登录，清除密码
        if (loginType === USER_TYPE.REGISTER_USER) {
          this.setState({
            password: null,
          })
        }
      }
    })
  }

  /**
   * 游客登录
   */
  touristClick = () => {
    playSound(btnSound)
    setTimeout(async () => {
      const userTicket = await getItem(CACHE_TOURIST_USER_KEY)
      if (userTicket) {
        try {
          const { userId, ticket } = JSON.parse(userTicket)
          this.setState({ loading: true, text: '正在登录' })
          // 游客账号自动登录
          SocketEvent.emit('loginApi', {
            userId,
            ticket,
            type: USER_TYPE.TOURIST_USER,
          }, (resp) => {
            console.log(`(游客自动)账号登录返回：`, resp)
            this.setState({ loading: false })
            // 登录成功
            if (resp.code === 'success') {
              const { userId } = resp.data || {}
              this.props.loginSuccess(userId)
            }
            else {
              Toast.show(resp.msg)
              removeItem(CACHE_TOURIST_USER_KEY)
            }
          })
        }
        catch {
          Toast.show('登录失败，请重试')
          removeItem(CACHE_TOURIST_USER_KEY)
        }
      }
      else {
        const message = (
          <ul
            style={{ textAlign: 'left', listStyle: 'decimal', paddingLeft: '22px', margin: '0', fontSize: '14px' }}
          >
            <li>游客凭证将缓存在本地</li>
            <li>游客长时间不登录将会被注销</li>
            <li>游客部分功能将受限</li>
          </ul>
        )

        /**
         * 游客账号注册
         * @param value
         */
        const doRegisterAction = (value) => {
          SocketEvent.emit('generateTouristApi', {
            captcha: value,
          }, (resp) => {
            console.log('自动生成游客账号返回：', resp)
            if (resp.code === 'success') {
              const { userId, ticket } = resp.data || {}
              // 请求登录
              SocketEvent.emit('loginApi', {
                userId,
                ticket,
                type: USER_TYPE.TOURIST_USER,
              }, (resp) => {
                console.log(`(游客)账号登录返回：`, resp)
                this.setState({ loading: false })
                // 登录成功
                if (resp.code === 'success') {
                  setItem(CACHE_TOURIST_USER_KEY, JSON.stringify({
                    ticket,
                    userId,
                    type: USER_TYPE.TOURIST_USER,
                  }))
                  this.props.loginSuccess(userId)
                }
                else {
                  Toast.show(resp.msg)
                }
              })
            }
            else {
              this.setState({ loading: false })
              Toast.show(resp.msg)
            }
          })
        }

        /**
         * 验证码获取
         */
        const doCaptchaAction = () => {
          // 获取验证码
          SocketEvent.emit('getCaptchaApi', {}, (resp) => {
            console.log('游客登录获取验证码返回：', resp)
            if (resp.code === 'success') {
              const { svg } = resp.data

              Modal.prompt('安全验证', <div dangerouslySetInnerHTML={{ __html: svg }} />, [
                { text: '取消', onPress: () => playSound(btnSound) },
                {
                  text: '提交',
                  onPress: (value) => {
                    playSound(btnSound)
                    if (value.length === 0) {
                      Toast.show('验证码错误')
                    }
                    else {
                      // 带着数据一起提交
                      this.setState({ loading: true, text: '正在登录' })
                      doRegisterAction(value)
                    }
                  },
                },
              ])
            }
            else {
              Toast.show('验证码获取失败，请重试')
            }
          })
        }

        Dialog.confirm({
          title: '系统提示',
          content: message,
          confirmText: '登录',
          cancelText: '取消',
          onConfirm: () => {
            playSound(btnSound)
            doCaptchaAction()
          },
          onCancel: () => {
            playSound(btnSound)
          },
        },
        )
      }
    })
  }

  componentDidMount() {
    // 加载用户账号信息
    setTimeout(async () => {
      do {
        await sleep(20)
      } while (!window.QC)
      sessionStorage.removeItem(CACHE_BATTLE_KEY)
      // 读取缓存数据
      const cacheUserJson = await getItem(CACHE_USER_KEY)
      if (cacheUserJson) {
        // 若能读取到，解析数据
        const cacheUser = JSON.parse(cacheUserJson)
        // 账号、凭证
        const userId = cacheUser.userId
        const ticket = cacheUser.ticket
        const length = cacheUser.pwdLength || 0
        const type = cacheUser.type
        if (type === USER_TYPE.REGISTER_USER) {
          // 因为是假登录，所以随机模拟一个密码
          const password = SocketUtils.generateToken(length)

          this.setState({
            isSpeedLogin: true,
            userId,
            ticket,
            password,
          })
        }
      }
    })
  }

  render() {
    return (
      <>
        <div className={this.state.isPull ? style.loginPull : style.login}>
          <div className={style.pkTitle}>
            <div title="icon" />
            <span>登录</span>
          </div>

          <div className={style.content}>
            {/* 账号输入框 */}
            <div className={style.input}>
              <Form
                layout="horizontal"
                mode="card"
              >
                <Form.Item>
                  <Input
                    clearable
                    placeholder="请输入账号/邮箱"
                    value={this.state.userId || ''}
                    onChange={e => this.setState({ userId: e })}
                  />
                </Form.Item>
              </Form>
            </div>

            {/* 密码输入框 */}
            <div className={style.input}>
              <Form
                layout="horizontal"
                mode="card"
              >
                <Form.Item>
                  <Input
                    type="password"
                    clearable
                    maxLength={32}
                    minLength={6}
                    placeholder="请输入密码"
                    value={this.state.password || ''}
                    onFocus={() => {
                      this.state.isSpeedLogin && this.setState({
                        password: null,
                        isSpeedLogin: false,
                      })
                    }}
                    onChange={e => this.setState({ password: e })}
                  />
                </Form.Item>
              </Form>
            </div>

            {/* 按钮区域 */}
            <Grid columns={24} gap={1} className={style.grid}>
              <Grid.Item span={7}>
                <AdvancedBtn text="登录" onClick={this.loginClick} />
              </Grid.Item>
              <Grid.Item span={1} />
              <Grid.Item span={8}>
                <AdvancedBtn text="游客登录" onClick={this.pullHandle} />
              </Grid.Item>
              <Grid.Item span={1} />
              <Grid.Item span={7}>
                <AdvancedBtn
                  type="danger"
                  text="注册"
                  onClick={() => {
                    playSound(btnSound)
                    this.props.goRegister()
                  }}
                />
              </Grid.Item>
            </Grid>

            {/* 其他登录方式 */}
            <div className={style.pullWrap}>
              <div className={style.pull} style={{ opacity: this.state.isPull ? 1 : 0 }}>
                <div className={style.box}>
                  <div className={style.channel} onClick={this.touristClick}>
                    <img src={visitorImg} alt="游客登录" />
                    <span>游客登录</span>
                  </div>
                  <div className={style.channel} onClick={this.qqLogin}>
                    <img src={qqImg} alt="QQ 登录" />
                    <span>QQ 登录</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <AdvancedSpin show={this.state.loading} text={this.state.text} />
        </div>
      </>
    )
  }
}

export default LoginView
