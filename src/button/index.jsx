import PropTypes from 'prop-types'
import React from 'react'
import styles from './index.module.less'

class AdvancedBtn extends React.Component {
  type2css = (type) => {
    switch (type) {
      case 'normal': return styles.normal
      case 'danger': return styles.danger
      case 'square': return styles.square
      default: return styles.normal
    }
  }

  render() {
    const { type, text, disabled } = this.props
    return (
      <button
        key={this.props.key || text}
        onClick={this.props.onClick}
        type="button"
        className={this.type2css(type)}
        disabled={disabled}
      >
        {text}
      </button>
    )
  }
}

// eslint-disable-next-line react/no-prop-types
AdvancedBtn.propTypes = {
  type: PropTypes.oneOf(['normal', 'danger', 'square']),
  text: PropTypes.string,
  disabled: PropTypes.bool,
}

// eslint-disable-next-line react/no-default-props
AdvancedBtn.defaultProps = {
  type: 'normal',
  text: '名称',
  disabled: false,
}

export default AdvancedBtn
