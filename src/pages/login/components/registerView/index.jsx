import { Form, Grid, Input, Toast } from 'antd-mobile'
import { Modal } from 'antd-mobile-v2'
import { Component } from 'react'
import AdvancedBtn from '@/button/index.jsx'
import { USER_TYPE } from '@/enums.js'
import SocketEvent from '@/service/event.js'
import AdvancedSpin from '@/spinner/index.jsx'
import {
  CACHE_USER_KEY,
} from '@/utils/cache-key-utils.js'
import { encryptByMd5 } from '@/utils/cipher.js'
import { btnSound, playSound } from '@/utils/sounds-res.js'
import { setItem } from '@/utils/storage-utils.js'
import style from './index.module.less'

class RegisterView extends Component {
  constructor(props) {
    super(props)
    this.state = {
      text: '',
      loading: false,
      regUserId: null,
      regUserName: null,
      regPassword: null,
      regEmail: null,
      regValidCode: null,
      isSendValidCode: false,
      timerSeconds: null,
      maxTimerSeconds: 60,
    }
  }

  /**
   * 注册
   */
  register = () => {
    playSound(btnSound)
    const { regUserId, regUserName, regPassword, regEmail, regValidCode } = this.state

    if (!regUserId) {
      Toast.show('请输入账号')
    }
    else if (!(/^\w+$/.test(regUserId))) {
      Toast.show('账号仅支持字母数字下划线')
    }
    else if (!regUserName) {
      Toast.show('请输入昵称')
    }
    else if (!regPassword) {
      Toast.show('请输入密码')
    }
    else if (regPassword.length <= 5) {
      Toast.show('密码长度不符合要求')
    }
    else if (!(/[A-Z]+/i).test(regPassword)) {
      Toast.show('密码至少包含一位字母')
    }
    else if (!(/[A-Z]+[0-9_]*$/i.test(regPassword))) {
      Toast.show('密码仅支持字母、数字、下划线')
    }
    else if (regEmail && !(/^[A-Z0-9]+@[\w-]+(?:\.[\w-]+)+$/i.test(regEmail))) {
      Toast.show('邮箱不符合要求')
    }
    else if (regEmail && !regValidCode) {
      Toast.show('请输入邮箱验证码')
    }
    else {
      const doRegisterAction = (captcha) => {
        this.setState({ loading: true, text: '注册中' })

        // 请求注册
        SocketEvent.emit('registerApi', {
          userId: regUserId,
          userName: regUserName,
          password: encryptByMd5(regPassword),
          email: regEmail,
          validCode: regEmail ? regValidCode : '',
          captcha,
        }, (resp) => {
          console.log(`账号注册返回：`, resp)
          this.setState({ loading: false })
          // 注册成功，跳转到登录页面
          if (resp.code === 'success') {
            // 进行自动登录
            SocketEvent.emit('loginApi', {
              userId: regUserId,
              userName: regUserName,
              password: encryptByMd5(regPassword),
              type: USER_TYPE.REGISTER_USER,
            }, (resp) => {
              console.log(`(自动登录)账号登录返回：`, resp)
              // 成功登录
              if (resp.code === 'success') {
                const { userId, ticket } = resp.data || {}

                setItem(CACHE_USER_KEY, JSON.stringify({
                  userId,
                  pwdLength: regPassword.length,
                  ticket,
                },
                ))
                Toast.show('已自动登录')
                this.props.loginSuccess(userId)
              }
              else {
                Toast.show(resp.msg)
              }
            })
          }
          else {
            Toast.show(resp.msg)
          }
        })
      }
      // 填写了邮箱，直接登录
      if (regEmail) {
        doRegisterAction()
      }
      else {
        // 获取验证码
        SocketEvent.emit('getCaptchaApi', {}, (resp) => {
          console.log('正式用户登录获取验证码返回：', resp)
          if (resp.code === 'success') {
            const { svg } = resp.data
            // eslint-disable-next-line react-dom/no-dangerously-set-innerhtml
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
                    doRegisterAction(value)
                  }
                },
              },
            ])
          }
          else {
            Toast.show(resp.msg)
          }
        })
      }
    }
  }

  /**
   * 注册发送邮件
   */
  handleSendEmail = () => {
    playSound(btnSound)
    const { regUserId, regUserName, regPassword, regEmail, isSendValidCode, maxTimerSeconds } = this.state

    if (!regUserId) {
      Toast.show('请输入账号')
    }
    else if (!regUserName) {
      Toast.show('请输入昵称')
    }
    else if (!regPassword) {
      Toast.show('请输入密码')
    }
    else if (regPassword.length <= 5) {
      Toast.show('密码长度不符合要求')
    }
    else if (!(/[A-Z]+/i).test(regPassword)) {
      Toast.show('密码至少包含一位字母')
    }
    else if (!(/[A-Z]+[0-9_]*$/i.test(regPassword))) {
      Toast.show('密码仅支持字母、数字、下划线')
    }
    else if (regEmail && !(/^[A-Z0-9]+@[\w-]+(?:\.[\w-]+)+$/i.test(regEmail))) {
      Toast.show('邮箱格式不正确')
    }
    else if (isSendValidCode) {
      Toast.show('发送间隔时间未刷新')
    }
    else {
      this.setState({
        loading: true,
        isSendValidCode: true,
        timerSeconds: maxTimerSeconds,
        text: '正在发送邮件',
      })
      // 发送邮件
      SocketEvent.emit('sendValidCodeApi', {
        userId: regUserId,
        userName: regUserName,
        email: regEmail,
      }, (resp) => {
        console.log(`找回密码发送邮件返回：`, resp)
        this.setState({
          loading: false,
        })
        if (resp.code === 'success') {
          Toast.show('邮件发送成功')
        }
        else if (resp.code === 'fail') {
          Toast.show(resp.msg)
          this.setState({ isSendValidCode: false })
        }
      })
    }
  }

  componentDidMount() {

  }

  componentWillUnmount() {
  }

  render() {
    const { regEmail, isSendValidCode, timerSeconds, loading, text } = this.state

    return (
      <div className={regEmail ? style.registerPlus : style.register}>
        {/* 标题部分 */}
        <div className={style.pkTitle}>
          <div title="icon" />
          <span>注册</span>
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
                  placeholder="请输入账号"
                  maxLength={32}
                  onChange={e => this.setState({ regUserId: e })}
                />
              </Form.Item>
            </Form>
          </div>

          <div className={style.input}>
            <Form
              layout="horizontal"
              mode="card"
            >
              <Form.Item>
                <Input
                  clearable
                  placeholder="请输入昵称"
                  maxLength={5}
                  onChange={e => this.setState({ regUserName: e })}
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
                  clearable
                  type="password"
                  maxLength={18}
                  minLength={6}
                  placeholder="请输入密码(6~18位)"

                  onChange={e => this.setState({ regPassword: e })}
                />
              </Form.Item>
            </Form>
          </div>
          <div className={style.inputFlex}>
            <Form
              layout="horizontal"
              mode="card"
              style={{ width: '100%' }}
            >
              <Form.Item>
                <Input
                  clearable
                  placeholder="请输入邮箱(选填)"

                  onChange={e => this.setState({ regEmail: e })}
                />

              </Form.Item>
            </Form>
            <AdvancedBtn
              type="square"
              disabled={isSendValidCode}
              text={isSendValidCode ? `${timerSeconds}` : '发送'}
              onClick={this.handleSendEmail}
            />
          </div>
          {/* 密码输入框 */}
          {regEmail && (
            <div className={style.input}>
              <Form
                layout="horizontal"
                mode="card"
              >
                <Form.Item>
                  <Input
                    clearable
                    maxLength={8}
                    placeholder="请输入验证码"

                    onChange={e => this.setState({ regValidCode: e })}
                  />
                </Form.Item>
              </Form>
            </div>
          )}

          {/* 按钮区域 */}
          <Grid columns={2} gap={12} className={style.grid}>
            <Grid.Item span={1}>
              <AdvancedBtn type="normal" text="注册" onClick={() => this.register()} />
            </Grid.Item>
            <Grid.Item span={1}>
              <AdvancedBtn
                type="danger"
                text="返回"
                onClick={() => {
                  playSound(btnSound)
                  this.props.goBack()
                }}
              />
            </Grid.Item>
          </Grid>

        </div>
        <AdvancedSpin show={loading} text={text} />
      </div>
    )
  }
}

export default RegisterView
