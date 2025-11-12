import { Grid } from 'antd-mobile'
import { Component } from 'react'
import AdvancedBtn from '@/button/index.jsx'
import { btnSound, playSound } from '@/utils/sounds-res.js'
import styles from './index.module.less'

class WinShow extends Component {
  render() {
    const { user, enemy, gameScore, userIsKick, closeWin, goBack } = this.props
    let { winTypeMsg, winScore, failScore, isRedColorWin } = gameScore

    if (user.first !== isRedColorWin) {
      winScore = gameScore.failScore
      failScore = gameScore.winScore
    }

    return (
      <div className={styles.bg}>
        <div className={styles.title}>
          <div title="icon"></div>
          <span>对局结果</span>
        </div>
        <div
          className={styles.close}
          onClick={() => {
            playSound(btnSound)
            closeWin()
          }}
        >
          <div title="close"></div>
        </div>
        <div className={styles.content}>
          <Grid columns={24} gap={1}>
            <Grid.Item span={24} className={styles.winType}>
              {winTypeMsg}
            </Grid.Item>
          </Grid>
          <Grid columns={24} gap={1}>
            <Grid.Item span={24} className={styles.name}>
              我方：
              <span>{user?.userName}</span>
            </Grid.Item>
          </Grid>
          <Grid columns={24} gap={1}>
            <Grid.Item span={24} className={styles.score}>
              积分：
              <span>
                {(user?.score || 0) + winScore}
                (
                {winScore > 0 ? '+' : ''}
                {winScore}
                )
              </span>
            </Grid.Item>
          </Grid>
          <Grid columns={24} gap={1}>
            <Grid.Item span={24} className={styles.name}>
              对方：
              <span>{enemy?.userName}</span>
            </Grid.Item>
          </Grid>
          <Grid columns={24} gap={1}>
            <Grid.Item span={24} className={styles.score}>
              积分：
              <span>
                {(enemy?.score || 0) + failScore}
                (
                {failScore > 0 ? '+' : ''}
                {failScore}
                )
              </span>
            </Grid.Item>
          </Grid>
          <Grid columns={24} gap={1}>
            <Grid.Item span={5}></Grid.Item>
            <Grid.Item
              span={14}
              children={(
                <AdvancedBtn
                  type="normal"
                  text={userIsKick ? '返回平台' : '返回房间'}
                  onClick={() => {
                    playSound(btnSound)
                    goBack()
                  }}
                />
              )}
            >
            </Grid.Item>
            <Grid.Item span={5}></Grid.Item>
          </Grid>
        </div>
      </div>
    )
  }
}

export default WinShow
