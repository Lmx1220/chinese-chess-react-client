import backImg from '@/assets/back.png'
import AdvancedSpin from '@/spinner/index.jsx'
import { backgroundSound, btnSound, playSound } from '@/utils/sounds-res.js'
import { Component } from 'react'
import style from './index.module.less'

class VersionView extends Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: false,
      text: '',
      data: [],
    }
    this.timeoutId = null
    this.scrollInterval = null
  }

  // 平滑滚动
  startBackgroundMusic() {
    this.timeoutId = setTimeout(() => {
      let currentPosition = 0
      const scrollInterval = 25
      const maxScrollHeight = this.scrollRef ? this.scrollRef.scrollHeight : 0

      const scrollTimer = setInterval(() => {
        if (!this.scrollRef) {
          clearInterval(scrollTimer)
          return
        }

        const currentScrollTop = this.scrollRef.scrollTop

        if (currentPosition >= maxScrollHeight || Math.abs(currentScrollTop - currentPosition) > 5) {
          clearInterval(scrollTimer)
        }
        else {
          currentPosition++
          this.scrollRef.scrollTop = currentPosition
        }
      }, scrollInterval)
    }, 1000)
  }

  goBack = () => {
    playSound(btnSound)
    this.props.goBack()
  }

  componentDidMount() {
    this.setState({ data: this.props.versionData })
    this.startBackgroundMusic()
  }

  componentWillUnmount() {
    playSound(backgroundSound)
    clearTimeout(this.timeoutId)
  }

  render() {
    return (
      <div className={style.bg}>
        <div className={style.scroll} ref={el => (this.scrollRef = el)}>
          {this.state.data.map((item, index) => (
            <div className={style.wrap} key={index}>
              <div className={style.line}></div>
              <div className={style.dot}></div>
              <div className={style.content}>
                <div className={style.title}>
                  {item.date}
                  <span className={style.version}>
                    {' '}
                    {item.version}
                  </span>
                </div>
                <ul>
                  {item.event.map((event, eventIndex) => (
                    <li key={eventIndex}>
                      <div className={style.liFlex}>
                        <span>{event.changeType}</span>
                        <span>{event.content}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
        <div className={style.page} onClick={this.goBack}>
          <img src={backImg} width="100%" height="100%" alt="" />
        </div>
        <AdvancedSpin text={this.state.text} show={this.state.loading} />
      </div>
    )
  }
}

export default VersionView
