import PropTypes from 'prop-types'
import { Component } from 'react'
import styles from './index.module.less'

/**
 * 副标题
 */
class ChildTitleLayout extends Component {
  render() {
    const { text } = this.props
    return (
      <>
        <div className={styles.title}>
          <div className={styles.background}>
            <div className={styles.content}>
              {text}
            </div>
          </div>
        </div>
      </>
    )
  }
}

// eslint-disable-next-line react/no-prop-types
ChildTitleLayout.propTypes = {
  text: PropTypes.string,
}

// eslint-disable-next-line react/no-default-props
ChildTitleLayout.defaultProps = {
  text: '副标题',
}

export default ChildTitleLayout
