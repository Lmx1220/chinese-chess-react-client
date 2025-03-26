import { Grid } from 'antd-mobile'
import React from 'react'
import styles from './index.module.less'

/**
 * 用户信息展示
 */
class User extends React.Component {
  render() {
    const { stepExplain, thinkTime, battleData, step, total } = this.props
    return (
      <div className={styles.player}>
        <Grid columns={24} gap={1} className={styles.user}>
          <Grid.Item span={24} className={styles.body}>
            <Grid columns={24} gap={1}>
              <Grid.Item span={9} className={styles.title}>
                {battleData?.firstUserName}
              </Grid.Item>
              <Grid.Item span={2} className={styles.placeholder}>:</Grid.Item>
              <Grid.Item span={9} className={styles.title}>
                {battleData?.lastUserName}
              </Grid.Item>
              <Grid.Item span={4} className={styles.step}>
                {step}
                {' '}
                /
                {Math.max(total - 1, 0)}
              </Grid.Item>
            </Grid>
            <Grid columns={24} gap={1}>
              <Grid.Item span={6} className={styles.chessBook}>
                步时:
                {' '}
                {(thinkTime / 1000).toFixed(1)}
                s
              </Grid.Item>
              <Grid.Item span={5} className={styles.round}>
                {stepExplain || '-'}
              </Grid.Item>
              <Grid.Item
                span={4}
                className={styles.round}
                style={{ color: battleData?.resultMsg === '失败' ? '#f30404de' : '#ffb200' }}
              >
                {battleData?.resultMsg}
              </Grid.Item>
              <Grid.Item span={9} className={styles.date}>
                {battleData?.createTime}
              </Grid.Item>
            </Grid>
          </Grid.Item>
        </Grid>
      </div>
    )
  }
}

export default User
