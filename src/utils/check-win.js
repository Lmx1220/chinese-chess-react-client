import { createElement } from 'react'
import { createRoot } from 'react-dom/client'

let animationContainer = null
let animationTimer = null
const animationMinimumDuration = 800
/**
 * 创建和控制动画效果的函数
 * @param {string} e 要显示的内容
 * @param {number} t 动画持续时间，默认为1800毫秒
 */
export function animateContent(e, t = 1800) {
  // 设置动画持续时间不小于800毫秒
  t = Math.max(animationMinimumDuration, t)
  // 调用函数创建动画效果
  createAnimation(e, t)
  // 设置定时器，在动画结束后清除动画元素
  animationTimer = setTimeout(removeAnimation, t)
}

/**
 * 创建动画效果的函数
 * @param {string} content 要显示的内容
 * @param {number} duration 动画持续时间
 */
let root

function createAnimation(content, duration) {
  // 根据内容长度选择动画样式
  const animationClass = content.length === 1 ? 'cir1' : 'cir2'
  // 设置动画样式的属性
  const animationStyle = {
    animationDuration: `${duration - animationMinimumDuration}ms`,
    animationDelay: `${animationMinimumDuration}ms`,
    animationIterationCount: 1,
  }

  // 创建动画元素
  const vNode = createElement('div', {
    className: animationClass,
    style: animationStyle,

  }, content)
  removeAnimation()
  animationContainer = document.createElement('div')
  document.body.appendChild(animationContainer)
  // 渲染动画元素到页面上
  root = createRoot(animationContainer)
  root.render(vNode)
}

/**
 * 清除动画效果的函数
 */
function removeAnimation() {
  // 移除动画元素和定时器
  if (animationContainer) {
    // root.unmount()
    document.body.removeChild(animationContainer)
    animationContainer = null
    clearTimeout(animationTimer)
    animationTimer = null
  }
}
