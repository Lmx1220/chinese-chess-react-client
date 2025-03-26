import config from '@/config.js'
import { LONG_FIGHT_VIRTUAL_USER_ID } from '@/utils/cache-key-utils.js'

const fightCountMap = new Map()
const finalFightCountMap = new Map()

/**
 * 更新指定用户的战斗计数
 * @param {string} chessId - 用户ID
 * @param {number} increment - 变化值
 */
export function updateLongFighting(chessId, increment) {
  const map = fightCountMap.get(LONG_FIGHT_VIRTUAL_USER_ID) ?? new Map()
  const currentValue = map.get(chessId) || 0
  const newValue = Math.max(currentValue + increment, 0)

  map.set(chessId, newValue)
  fightCountMap.set(LONG_FIGHT_VIRTUAL_USER_ID, map)

  // 仅保留最新的 key
  const lastKey = [...finalFightCountMap.keys()].pop()
  if (lastKey !== chessId) {
    map.delete(lastKey)
    fightCountMap.set(LONG_FIGHT_VIRTUAL_USER_ID, map)
  }

  // 达到战斗计数上限后，转移到最终计数Map，并清除当前Map
  if (newValue >= config.ONE_LONG_FIGHTING_COUNT) {
    finalFightCountMap.set(chessId, newValue)
    map.clear()
    fightCountMap.set(LONG_FIGHT_VIRTUAL_USER_ID, map)
  }
}

/**
 * 获取指定用户的战斗计数
 * @param {string} chessId - 用户ID
 * @returns {number} 该用户的战斗计数
 */
export function getOneLongFightData(chessId) {
  const map = fightCountMap.get(LONG_FIGHT_VIRTUAL_USER_ID)
  return map?.get(chessId) ?? finalFightCountMap.get(chessId) ?? 0
}

/**
 * 计算所有用户的战斗计数总和
 * @returns {number} 总战斗计数
 */
export function getMultipleLongFightData() {
  let total = 0

  for (const [, value] of fightCountMap.get(LONG_FIGHT_VIRTUAL_USER_ID) ?? new Map()) {
    total += value
  }

  for (const [, value] of finalFightCountMap) {
    total += value
  }

  return total
}

/**
 * 清空所有战斗计数
 */
export function clearLongFightCount() {
  fightCountMap.delete(LONG_FIGHT_VIRTUAL_USER_ID)
  finalFightCountMap.clear()
}
