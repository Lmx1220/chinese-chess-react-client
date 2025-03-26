import AdvancedBtn from '@/button/index.jsx'
import SocketEvent from '@/service/event.js'
import AdvancedSpin from '@/spinner/index.jsx'
import { encryptByMd5 } from '@/utils/cipher.js'
import { btnSound, playSound } from '@/utils/sounds-res.js'
import { Form, Grid, Input, Toast } from 'antd-mobile'
import { Component } from 'react'
import style from './index.module.less'

class ForgetPasswordView extends Component {
  constructor(props) {
    super(props)

    this.state = {
      text: '',
      loading: false,
      forgetUserId: null,
      forgetEmail: null,
      forgetPassword: null,
      forgetValidCode: null,
    }
  }

  /**
   * 注册
   */
  forgetPassword = () => {
    playSound(btnSound)
    const { forgetUserId, forgetEmail, forgetPassword, forgetValidCode } = this.state

    if (!forgetUserId) {
      Toast.show('请输入账号')
    }
    else if (!forgetEmail) {
      Toast.show('请输入邮箱')
    }
    else if (forgetEmail && !(/^[A-Z0-9]+@[\w-]+(?:\.[\w-]+)+$/i.test(forgetEmail))) {
      Toast.show('邮箱格式不正确')
    }
    else if (!forgetValidCode) {
      Toast.show('请输入验证码')
    }
    else if (!forgetPassword) {
      Toast.show('请输入密码')
    }
    else if (forgetPassword.length <= 5) {
      Toast.show('密码长度不符合要求')
    }
    else if (!(/[A-Z]+/i).test(forgetPassword)) {
      Toast.show('密码至少包含一位字母')
    }
    else if (!(/[A-Z]+[0-9_]*$/i.test(forgetPassword))) {
      Toast.show('密码仅支持字母、数字、下划线')
    }
    else {
      this.setState({ loading: true, text: '请求中' })

      // 请求注册
      SocketEvent.emit('forgetPasswordApi', {
        userId: forgetUserId,
        email: forgetEmail,
        password: encryptByMd5(forgetPassword),
        validCode: forgetValidCode,
      }, (resp) => {
        console.log(`账号注册返回：`, resp)
        this.setState({ loading: false })
        // 注册成功，跳转到登录页面
        if (resp.code === 'success') {
          // 进行自动登录
          Toast.show({ content: '您的密码已成功修改', maskClickable: false })
          setTimeout(this.props.goBack, 2000)
        }
        else {
          Toast.show(resp.msg)
        }
      })
    }
  }

  /**
   * 注册发送邮件
   */
  handleForgetSendEmail = () => {
    playSound(btnSound)
    const { forgetUserId, forgetEmail } = this.state

    if (!forgetUserId) {
      Toast.show('请输入账号')
    }
    else if (!forgetEmail) {
      Toast.show('请输入邮箱')
    }
    else if (forgetEmail && !(/^[A-Z0-9]+@[\w-]+(?:\.[\w-]+)+$/i.test(forgetEmail))) {
      Toast.show('邮箱格式不正确')
    }
    else {
      this.setState({ loading: true, text: '请求中' })
      // 发送邮件
      SocketEvent.emit('forgetSendValidCodeApi', {
        userId: forgetUserId,
        email: forgetEmail,
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
        }
      })
    }
  }

  render() {
    const { loading, text } = this.state

    return (
      <div className={style.register}>
        {/* 标题部分 */}
        <div className={style.pkTitle}>
          <div title="icon" />
          <span>找回密码</span>
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
                  onChange={e => this.setState({ forgetUserId: e })}
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
                  placeholder="请输入邮箱"
                  onChange={e => this.setState({ forgetEmail: e })}
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
                  placeholder="请输入验证码"

                  onChange={e => this.setState({ forgetValidCode: e })}
                />

              </Form.Item>
            </Form>
            <AdvancedBtn
              type="square"
              text="发送"
              onClick={this.handleForgetSendEmail}
            />
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

                  onChange={e => this.setState({ forgetPassword: e })}
                />
              </Form.Item>
            </Form>
          </div>

          {/* 按钮区域 */}
          <Grid columns={2} gap={12} className={style.grid}>
            <Grid.Item span={1}>
              <AdvancedBtn type="normal" text="注册" onClick={() => this.forgetPassword()} />
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

export default ForgetPasswordView
