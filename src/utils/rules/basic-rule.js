import { initializeGrid, X, Y } from '@/utils/board-canvas-utils.js'

export function basicRule(pieces, current, target) {
  if (target.x >= X || target.y >= Y || target.x < 0 || target.y < 0) {
    console.error(`坐标：${target.x} ,${target.y} 超出边界`)
    return false
  }
  switch (current.prefix) {
    case 'Z':
      return bingRule(pieces, current, target)
    case 'P':
      return paoRule(pieces, current, target)
    case 'C':
      return cheRule(pieces, current, target)
    case 'M':
      return maRule(pieces, current, target)
    case 'X':
      return xiangRule(pieces, current, target)
    case 'S':
      return shiRule(pieces, current, target)
    case 'J':
      return jiaRule(pieces, current, target)
    default:
      console.error('规则前缀匹配异常，值：', current.prefix)
      break
  }
}

/**
 * 车的规则
 * @param pieces
 * @param start
 * @param end
 * @returns {boolean} 校验结果
 */
function cheRule(pieces, start, end) {
  const grid = initializeGrid(pieces)

  if (start.x === end.x) {
    const path = []
    const minY = Math.min(start.y, end.y)
    const maxY = Math.max(start.y, end.y)

    for (let y = minY + 1; y < maxY; y++) {
      if (start.y !== y && grid[start.x][y]) {
        path.push({ x: start.x, y })
      }
    }

    if (path.length === 0)
      return true
    return path.length === 1 && path[0].x === end.x && path[0].y === end.y
  }

  if (start.y === end.y) {
    const path = []
    const minX = Math.min(start.x, end.x)
    const maxX = Math.max(start.x, end.x)

    for (let x = minX + 1; x < maxX; x++) {
      if (start.x !== x && grid[x][start.y]) {
        path.push({ x, y: start.y })
      }
    }

    if (path.length === 0)
      return true
    if (path.length === 1 && path[0].x === end.x && path[0].y === end.y)
      return true
  }

  return false
}

/**
 * 马的规则检查函数
 *  @param {Array} pieces 棋子数组
 *  @param {object} current 起始位置的坐标 {x, y}
 *  @param {object} target 目标位置的坐标 {x, y}
 *  @returns {boolean} 移动是否合法
 */
function maRule(pieces, current, target) {
  const grid = initializeGrid(pieces)
  const o = 2
  const a = 1
  if (Math.abs(current.x - target.x) === o && Math.abs(current.y - target.y) === a) {
    const s = current.x - target.x > 0 ? -1 : 1
    return !grid[current.x + s][current.y]
  }
  if (Math.abs(current.y - target.y) === o && Math.abs(current.x - target.x) === a) {
    const l = current.y - target.y > 0 ? -1 : 1
    return !grid[current.x][current.y + l]
  }
  return false
}

/**
 * 象的规则检查函数
 * @param {Array} pieces 棋子数组
 * @param {object} start 起始位置的坐标 {x, y}
 * @param {object} end 目标位置的坐标 {x, y}
 * @returns {boolean} 移动是否合法
 */
function xiangRule(pieces, start, end) {
  const grid = initializeGrid(pieces)
  const dx = Math.abs(start.x - end.x)
  const dy = Math.abs(start.y - end.y)
  const diagonalStep = 2 // 象的步长为2

  if (dx === diagonalStep && dy === diagonalStep) {
    const offsetX = start.x - end.x > 0 ? -1 : 1
    const offsetY = start.y - end.y > 0 ? -1 : 1

    if (grid[start.x + offsetX][start.y + offsetY]) {
      // 象眼位置被堵住，不能移动
      return false
    }

    const halfBoardWidth = X / 2 // 棋盘的中心线
    if (start.x < halfBoardWidth) {
      // 左侧象
      return end.x < halfBoardWidth
    }
    else {
      // 右侧象
      return end.x >= halfBoardWidth
    }
  }

  return false
}

/**
 * 士的规则检查函数
 * @param {Array} pieces 棋子数组
 * @param {object} start 起始位置的坐标 {x, y}
 * @param {object} end 目标位置的坐标 {x, y}
 * @returns {boolean} 移动是否合法
 */
function shiRule(pieces, start, end) {
  const grid = initializeGrid(pieces)
  const diagonalStep = 1 // 士的步长为1

  if (Math.abs(start.x - end.x) === diagonalStep && Math.abs(start.y - end.y) === diagonalStep) {
    const offsetX = start.x - end.x > 0 ? -1 : 1
    const offsetY = start.y - end.y > 0 ? -1 : 1
    const targetPiece = grid[start.x + offsetX][start.y + offsetY]

    if (!targetPiece || start.isBlackColor !== end.isBlackColor) {
      const halfBoardWidth = X / 2 // 棋盘的中心线
      const targetX = end.x
      const targetY = end.y

      if (start.x < halfBoardWidth) {
        // 左侧士
        const minX = 0
        const maxX = 2
        const minY = 3
        const maxY = 5
        return targetX >= minX && targetX <= maxX && targetY >= minY && targetY <= maxY
      }
      else {
        // 右侧士
        const minX = 7
        const maxX = 9
        const minY = 3
        const maxY = 5
        return targetX >= minX && targetX <= maxX && targetY >= minY && targetY <= maxY
      }
    }
  }

  return false
}

/**
 * 将的规则检查函数
 * @param {Array} pieces 棋子数组
 * @param {object} start 起始位置的坐标 {x, y}
 * @param {object} end 目标位置的坐标 {x, y}
 * @returns {boolean} 移动是否合法
 */
function jiaRule(pieces, start, end) {
  const grid = initializeGrid(pieces)
  const diagonalStep = 1 // 士的步长为1

  if (start.x === end.x && Math.abs(start.y - end.y) === diagonalStep) {
    const offsetY = start.y - end.y > 0 ? -1 : 1
    const targetPiece = grid[start.x][start.y + offsetY]

    if (!targetPiece || start.isBlackColor !== end.isBlackColor) {
      const halfBoardWidth = X / 2 // 棋盘的中心线
      const targetX = end.x
      const targetY = end.y

      if (start.x < halfBoardWidth) {
        // 左侧士
        const minX = 0
        const maxX = 2
        const minY = 3
        const maxY = 5
        return targetX >= minX && targetX <= maxX && targetY >= minY && targetY <= maxY
      }
      else {
        // 右侧士
        const minX = 7
        const maxX = 9
        const minY = 3
        const maxY = 5
        return targetX >= minX && targetX <= maxX && targetY >= minY && targetY <= maxY
      }
    }
  }
  else if (start.y === end.y && Math.abs(start.x - end.x) === diagonalStep) {
    const offsetX = start.x - end.x > 0 ? -1 : 1
    const targetPiece = grid[start.x + offsetX][start.y]

    if (!targetPiece || start.isBlackColor !== end.isBlackColor) {
      const halfBoardWidth = X / 2 // 棋盘的中心线
      const targetX = end.x
      const targetY = end.y

      if (start.x < halfBoardWidth) {
        // 左侧士
        const minX = 0
        const maxX = 2
        const minY = 3
        const maxY = 5
        return targetX >= minX && targetX <= maxX && targetY >= minY && targetY <= maxY
      }
      else {
        // 右侧士
        const minX = 7
        const maxX = 9
        const minY = 3
        const maxY = 5
        return targetX >= minX && targetX <= maxX && targetY >= minY && targetY <= maxY
      }
    }
  }

  return false
}

/**
 * 炮的规则检查函数
 * @param {Array} pieces 棋子数组
 * @param {object} start 起始位置的坐标 {x, y}
 * @param {object} end 目标位置的坐标 {x, y}
 * @returns {boolean} 移动是否合法
 */
function paoRule(pieces, start, end) {
  const grid = initializeGrid(pieces)

  if (start.x === end.x) {
    // 垂直移动
    const minY = Math.min(start.y, end.y)
    const maxY = Math.max(start.y, end.y)
    const path = []
    for (let y = minY; y <= maxY; ++y) {
      if (start.y !== y && grid[start.x][y]) {
        // 棋子阻挡了路径
        path.push({ x: start.x, y })
      }
    }
    if (path.length === 0)
      return true
    if (path.length === 2) {
      // 终点处有两个棋子，只有其中一个是目标位置
      return path.some(pos => pos.x === end.x && pos.y === end.y)
    }
  }
  else if (start.y === end.y) {
    // 水平移动
    const minX = Math.min(start.x, end.x)
    const maxX = Math.max(start.x, end.x)
    const path = []
    for (let x = minX; x <= maxX; ++x) {
      if (start.x !== x && grid[x][start.y]) {
        // 棋子阻挡了路径
        path.push({ x, y: start.y })
      }
    }
    if (path.length === 0)
      return true
    if (path.length === 2) {
      // 终点处有两个棋子，只有其中一个是目标位置
      return path.some(pos => pos.x === end.x && pos.y === end.y)
    }
  }

  return false
}
/**
 *兵的规则检查函数
 *@param {Array} pieces 棋子数组
 *@param {object} start 起始位置的坐标 {x, y}
 *@param {object} end 目标位置的坐标 {x, y}
 *@returns {boolean} 移动是否合法
 */
function bingRule(pieces, start, end) {
  const step = 1 // 兵的步长为1
  // 棋盘的中心线
  const bossX = X / 2 // 将的 x 坐标
  const bossSide = pieces.find(piece => piece.isBoss && piece.isBlackColor === start.isBlackColor)

  if (bossSide.x >= bossX) {
    // 将在右侧
    if (start.y === end.y && start.x - end.x === step)
      return true // 前进一步
    if (end.x < bossX && start.x === end.x && Math.abs(start.y - end.y) === step)
      return true // 在原位时，向左或向右移动一步
  }
  else {
    // 将在左侧
    if (start.y === end.y && end.x - start.x === step) {
      return true // 前进一步
    }
    // 在原位时，向左或向右移动一步
    if (end.x >= bossX && start.x === end.x && Math.abs(start.y - end.y) === step) {
      return true
    }
  }

  return false
}
