import React from 'react'
import { createRoot } from 'react-dom/client'
// import ReactDOM from 'react-dom'
import styles from './index.module.less'

let circleDiv = null
let timeoutId = null
let root = null
const animationMinimumDuration = 800
/**
 * 显示节点
 * @param text
 * @param duration
 */
export function show(text, duration = 1800) {
  duration = Math.max(animationMinimumDuration, duration)
  createElement(text, duration)
  timeoutId = setTimeout(removeElement, duration)
}

/**
 * 新建节点
 */
function createElement(text, duration) {
  const divStyle = text.length === 1 ? styles.cir1 : styles.cir2
  // 设置动画样式的属性
  const animationStyle = {
    animationDuration: `${duration - animationMinimumDuration}ms`,
    animationDelay: `${animationMinimumDuration}ms`,
    animationIterationCount: 1,
  }
  const node = React.createElement('div', { className: divStyle, style: animationStyle }, text)
  // 节点存在时覆盖
  removeElement()
  // 创建新节点
  circleDiv = document.createElement('div')
  document.body.appendChild(circleDiv)
  // ReactDOM.render(node, circleDiv)
  root = createRoot(circleDiv)
  root.render(node)
}

/**
 * 移除元素
 */
function removeElement() {
  if (circleDiv) {
    root.unmount()
    document.body.removeChild(circleDiv)
    circleDiv = null
    clearTimeout(timeoutId)
    timeoutId = null
  }
}
