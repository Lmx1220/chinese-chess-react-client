import PropTypes from 'prop-types'
import { Component } from 'react'
import styles from './index.module.less'

/**
 * 游戏标题
 */
class SubjectHeaderLayout extends Component {
  render() {
    let { text } = this.props
    if (text.length === 2) {
      text = ` ${text} `
    }
    const translatePos = [0, -3, -2, 2]

    return (
      <>
        <div className={styles.title}>
          <div className={styles.background}>
            <div className={styles.content}>
              {
                text.split('').map((content, index) => {
                  return (
                    <div
                      key={index}
                      style={{
                        transform: `translateY(${translatePos[index]}px)`,
                      }}
                    >
                      {content}
                    </div>
                  )
                })
              }
            </div>
          </div>
        </div>
      </>
    )
  }
}

// eslint-disable-next-line react/no-prop-types
SubjectHeaderLayout.propTypes = {
  text: PropTypes.string,
}

SubjectHeaderLayout.defaultProps = {
  text: '主标题',
}

export default SubjectHeaderLayout
