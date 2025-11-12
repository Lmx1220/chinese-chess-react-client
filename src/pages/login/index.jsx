import { Toast } from 'antd-mobile'
import { Component } from 'react'
import config from '@/config.js'
import SubjectHeaderLayout from '@/header/father/index.jsx'
import SocketEvent, { sleep } from '@/service/event.js'
import AdvancedSpin from '@/spinner/index.jsx'
import { CACHE_BATTLE_KEY, CACHE_QQ_USER_KEY, SEND_QQ_GRANT_AUTH_KEY } from '@/utils/cache-key-utils.js'
import { encryptByMd5 } from '@/utils/cipher.js'
import { btnSound, playSound } from '@/utils/sounds-res.js'
import { setItem } from '@/utils/storage-utils.js'
import ForgetPasswordView from './components/forgetPasswordView/index.jsx'
import LoginView from './components/loginView/index.jsx'
import RegisterView from './components/registerView/index.jsx'
import VersionView from './components/versionView/index.jsx'
import style from './index.module.less'

class Login extends Component {
  constructor(props) {
    super(props)

    this.pageLogin = 'login'
    this.pageRegister = 'register'
    this.pageForgetPassword = 'forgetPassword'
    this.pageVersion = 'version'
    this.state = {
      text: '',
      loading: false,
      page: this.pageLogin,
      headerHide: false,
      floorHide: false,
      versionData: [],
    }
  }

  qqLoginCallback = (userData) => {
    console.log('QQ 授权进入回调页面')

    // 如果授权状态无效，直接返回错误提示
    if (!window.QC.Login.check()) {
      Toast.show('授权状态验证失效')
      return
    }

    this.setState({ loading: true, text: '授权成功' })

    window.QC.Login.getMe((openId, accessToken) => {
      console.log(`获取到用户信息, openId: ${openId}, accessToken: ${accessToken}`)

      // 存储用户信息
      setItem(CACHE_QQ_USER_KEY, JSON.stringify({
        ...userData,
        openId,
        accessToken,
        type: '003',
      }))

      // 调用后端登录 API
      SocketEvent.emit('loginApi', {
        password: encryptByMd5(openId),
        type: '003',
        openId,
        accessToken,
      }, (response) => {
        console.log('账户登录返回：', response)
        // 结束 loading 状态
        this.setState({ loading: false })
        sessionStorage.removeItem(SEND_QQ_GRANT_AUTH_KEY)
        if (response.code === 'success') {
          this.props.loginSuccess(response.data.userId)
        }
        else {
          Toast.show(response.msg)
        }
      })
    })
  }

  toVersionView() {
    playSound(btnSound)
    SocketEvent.emit('versionDetailApi', {}, (resp) => {
      console.log(`获取版本详情返回：`, resp)
      this.setState({
        loading: false,
      })
      if (resp.code === 'success') {
        this.setState({
          isKickOut: true,
          versionData: resp.data,
          page: this.pageVersion,
        })
      }
      else if (resp.code === 'fail') {
        Toast.show(resp.msg)
      }
    })
  }

  toSelfView() {
    this.setState({
      headerHide: false,
      floorHide: false,
      page: this.pageLogin,
    })
  }

  componentDidMount() {
    sessionStorage.removeItem(CACHE_BATTLE_KEY)
    setTimeout(async () => {
      // 等待20秒或直到window.QC可用
      do {
        console.log('等待')
        await sleep(20)
      } while (!window.QC)

      const cachedState = sessionStorage.getItem(SEND_QQ_GRANT_AUTH_KEY)
      const cachedCredential = sessionStorage.getItem(CACHE_QQ_USER_KEY)

      console.log('QQ回调获取到的缓存信息为：', cachedState, cachedCredential)

      if (cachedState && cachedCredential) {
        this.qqLoginCallback(JSON.parse(cachedCredential))
      }
    })
  }

  componentWillUnmount() {
  }

  render() {
    const { page, headerHide, versionData, floorHide } = this.state
    return (
      <>
        {page === this.pageLogin
          && (
            <div className={style.header} style={{ top: headerHide ? -375 : 0 }}>
              <SubjectHeaderLayout text="中国象棋" />
              <div className={style.tips}>
                <span className={style.content}>
                  Bug 反馈：
                  <span className={style.num}>*** *** ***</span>
                  {' '}
                  (群)
                </span>
              </div>
            </div>
          )}
        {page === this.pageLogin && (
          <LoginView
            loginSuccess={this.props.loginSuccess}
            setHeaderHide={hide => this.setState({ headerHide: hide })}
            setFloorHide={hide => this.setState({ floorHide: hide })}
            goRegister={() => this.setState({ page: this.pageRegister })}
          />
        )}
        {page === this.pageRegister
          && (
            <RegisterView
              goBack={() => this.toSelfView()}
              loginSuccess={this.props.loginSuccess}
            />
          )}
        {page === this.pageForgetPassword
          && (
            <ForgetPasswordView
              goBack={() => this.toSelfView()}
              loginSuccess={this.props.loginSuccess}
            />
          )}
        {page === this.pageVersion
          && <VersionView versionData={versionData} goBack={() => this.toSelfView()} />}
        {page === this.pageLogin
          && (
            <div className={style.floor} style={{ bottom: floorHide ? -375 : 20 }}>
              <div className={style.content} style={{ display: 'flex' }}>
                <span
                  className={style.item}
                  onClick={() => {
                    playSound(btnSound)
                    this.setState({ page: this.pageForgetPassword })
                  }}
                >
                  忘记密码
                </span>
                <div className={style.split}>|</div>
                <span className={style.item} onClick={() => this.toVersionView()}>
                  {config.version}
                </span>
              </div>
            </div>
          )}
        <AdvancedSpin show={this.state.loading} text={this.state.text} />

      </>
    )
  }
}

export default Login
