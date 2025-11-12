import { Dialog } from 'antd-mobile'
import qrcode from 'qrcode'
import React from 'react'
import { UAParser } from 'ua-parser-js'
import config from '@/config'
import { btnSound, playSound } from '@/utils/sounds-res.js'
import styles from './index.module.less'

class BasicLayout extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      ua: new UAParser(navigator.userAgent).getResult(),
      isMobile: null,
    }
    this.getIframeFlag = () => {
      const eventKey = 'verify'

      window.parent.postMessage({ event: eventKey, key: eventKey }, '*')

      return new Promise((resolve) => {
        window.addEventListener('message', ({ data }) => {
          if (data.event === eventKey && data.key === eventKey) {
            resolve(data.value || undefined)
          }
        })
      })
    }
  }

  componentDidMount() {
    this.deviceCheck()
    window.addEventListener('resize', this.deviceCheck)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.deviceCheck)
  }

  deviceCheck = async () => {
    const ua = new UAParser(navigator.userAgent).getResult()
    const iframeFlag = await this.getIframeFlag()
    const isMobile = iframeFlag || ['iOS', 'Android'].includes(ua.os.name)

    // 设置浏览器标识
    this.setState({ isMobile, ua })
    Dialog.clear()
    if (!isMobile) {
      if (!config.debug) {
        // window.open('/pc.html')
        window.location.pathname = '/pc.html'
      }
      const qrCodeUrl = await qrcode.toDataURL('url')
      Dialog.alert({
        title: '',
        content: (
          <div className={styles.qrcodeWrap}>
            <img src={qrCodeUrl} className={styles.qrcode}></img>
            <span>请使用手机扫码体验,更好!!!</span>
          </div>
        ),

        confirmText: '确定',
        onConfirm: () => playSound(btnSound),
      })
    }
  }

  deviceDoesNotSupportView = () => {
    const { ua } = this.state
    const screenWidth = document.documentElement.clientWidth
    const screenHeight = document.documentElement.clientHeight

    return (
      <div className={styles.support}>
        <div className={styles.wrap}>
          <div className={styles.title}>
            <span>象棋</span>

            <div className={styles.tips}>
              <div>-- 本游戏仅适配了手机端，请使用手机浏览器打开 -- </div>
            </div>
            <span>我是作者：lmx</span>
            <span>[象棋]所有素材均来源于网络(图片、音效、字体)</span>
            <span>本着学习的精神，构建了本游戏</span>
            <span>欢迎点赞收藏，您的支持是我最大的动力</span>
          </div>
          <div className={styles.floor}>
            <p>
              浏览器：
              <span>{ua.browser.name}</span>
              系统：
              <span>{ua.os.name}</span>
              内核：
              <span>{ua.engine.name}</span>
              屏幕宽高：
              <span>
                {screenWidth}
                {' '}
                *
                {' '}
                {screenHeight}
              </span>
            </p>
            <p>
            </p>
          </div>
        </div>
      </div>
    )
  }

  render() {
    const { isMobile } = this.state
    return (
      // <React.Fragment>
      <>
        {
          isMobile != null && (isMobile
            ? <div className={styles.background}>{this.props.children}</div>
            : this.deviceDoesNotSupportView())
        }
      </>
      // </React.Fragment>
    )
  }
}
export default BasicLayout
