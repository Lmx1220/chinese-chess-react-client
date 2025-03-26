import Gif from '@/spinner/gif'
import styles from '@/spinner/index.module.less'

/**
 * 自定义活动指示器
 * @see https://github.com/JackPu/react-core-loading-spinner
 */
function AdvancedSpin({
  width = '68px',
  height = '55px',
  text = 'Loading',
  show = false,
  type = 'gif',
  color = '#9b59b6',
  display = 'block',
  children,
  // eslint-disable-next-line react/no-unstable-default-props
  style = {},
}) {
  if (!show) {
    return <span />
  }

  const styleObject = { ...style }

  let loading = (
    <div className={styles.svgLoader} style={styleObject}>
      <svg width="1em" height="1em">
        <circle style={{ stroke: color }} cx="0.5em" cy="0.5em" r="0.45em" />
      </svg>
    </div>
  )

  if (type === 'gif') {
    loading = <Gif width={width} height={height} />
  }
  else if (type === 'custom') {
    loading = children
  }

  // 返回行内的加载内容
  if (display === 'inline') {
    return loading
  }

  return (
    <div className={styles.loadingSpinner}>
      <div className={styles.inner}>
        {loading}
        <div className={styles.alertText} hidden={!text}>{text}</div>
      </div>
    </div>
  )
}

export default AdvancedSpin
