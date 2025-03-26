/**
 * 设置值
 * @param key
 * @param value
 */
export function setItem(key, value) {
  localStorage.setItem(key, value)
  window.parent.postMessage({
    event: 'setItem',
    key,
    value,
  }, '*')
}

/**
 * 获取值
 * @param key
 * @return {string}
 */
export async function getItem(key) {
  // 从缓存里面找，若找不到从父页面找
  const value = localStorage.getItem(key)
  if (!value) {
    const eventName = 'getItem'
    window.parent.postMessage({
      event: eventName,
      key,
    }, '*')

    return new Promise((resolve, _reject) => {
      window.addEventListener('message', (e) => {
        const { event, key: respKey, value } = e.data
        if (event === eventName && key === respKey) {
          resolve(!value ? undefined : value)
        }
      })
    })
  }
  return !value ? undefined : value
}

/**
 * 移除值
 * @param key
 */
export function removeItem(key) {
  localStorage.removeItem(key)
  window.parent.postMessage({
    event: 'removeItem',
    key,
  }, '*')
}
