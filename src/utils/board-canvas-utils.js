import { nameMap, stepsMap } from '@/utils/map-res.js'
import { basicRule } from '@/utils/rules/basic-rule.js'
import { isMovementValid } from '@/utils/rules/boss-rule.js'

export const X = 10
export const Y = 9

export function generateMoveNotation(isForward, startPosition, endPosition) {
  const startColor = nameMap.get(startPosition.id)
  const isBlackColor = !startPosition.isBlackColor
  let direction

  const { from, to } = startPosition.isBlackColor
    ? (isForward
        ? {
            from: startPosition,
            to: endPosition,
          }
        : calculateNewPositions(startPosition, endPosition))
    : (isForward
        ? calculateNewPositions(startPosition, endPosition)
        : {
            from: startPosition,
            to: endPosition,
          })

  const start = from
  const end = to

  if (start.x === end.x) {
    direction = '平'
  }
  else if (start.x < end.x) {
    direction = '进'
  }
  else {
    direction = '退'
  }

  const row = start.y + 1
  const distance = start.y === end.y ? Math.abs(end.x - start.x) : end.y + 1

  return `${startColor}${isBlackColor ? stepsMap.get(row) : row}${direction}${isBlackColor ? stepsMap.get(distance) : distance}`
}

export function initializeGrid(elements) {
  const grid = []
  for (let row = 0; row < X; ++row) {
    grid[row] = []
    for (let col = 0; col < Y; ++col) {
      grid[row][col] = null
    }
  }
  elements.map(element => grid[element.x][element.y] = element)
  return grid
}

export function killBossCheck(pieces, isBlack) {
  const nonBossPieces = pieces.filter(piece => !piece.isBoss && piece.isBlackColor === isBlack)

  if (!nonBossPieces || nonBossPieces.length === 0)
    return false

  const opponentBossPiece = pieces.find(piece => piece.isBoss && piece.isBlackColor !== isBlack)

  for (let i = 0; i < nonBossPieces.length; ++i) {
    const piece = nonBossPieces[i]
    if (basicRule(pieces, piece, opponentBossPiece)) {
      return true
    }
  }

  return false
}

export function getValidMoves(gameMap, currentChess) {
  const validMoves = []
  const grid = initializeGrid(gameMap)

  for (let row = 0; row < X; row++) {
    for (let column = 0; column < Y; column++) {
      const chess = grid[row][column]

      if (!chess || chess.isBlackColor !== currentChess.isBlackColor) {
        const newChess = { ...chess, x: row, y: column }
        if (basicRule(gameMap, currentChess, newChess) && isMovementValid(gameMap, currentChess, newChess)) {
          validMoves.push(newChess)
        }
      }
    }
  }

  return validMoves
}

export function formatTime(time) {
  if (!time || time <= 0) {
    return '00:00'
  }

  const minutes = Math.floor(time / 60)
  const seconds = time % 60
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes
  const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds

  return `${formattedMinutes}:${formattedSeconds}`
}

export function updateArrayWithNewPosition(e, t, n) {
  const parsedArray = JSON.parse(e)
  const indexToRemove = parsedArray.findIndex(item => item.x === n.x && item.y === n.y)

  if (indexToRemove !== -1) {
    parsedArray.splice(indexToRemove, 1)
  }

  const existingItem = parsedArray.find(item => item.x === t.x && item.y === t.y)
  const indexToReplace = parsedArray.findIndex(item => item.x === t.x && item.y === t.y)

  existingItem.x = n.x
  existingItem.y = n.y
  parsedArray.splice(indexToReplace, 1, existingItem)

  return parsedArray
}

export function calculateCursorPosition(event, targetElement) {
  const { width, height, top, left } = targetElement.getBoundingClientRect()
  const { pageX, pageY } = event
  const offsetX = pageX - left
  const offsetY = pageY - top

  const row = Math.floor(offsetX / (width / Y))
  const column = Math.floor(offsetY / (height / X))

  return {
    x: column < 0 ? 0 : column < X ? column : X - 1,
    y: row < 0 ? 0 : row < Y ? row : Y - 1,
  }
}

export function calculateNewPositions(startPosition, endPosition) {
  const boardHeight = X - 1
  const boardWidth = Y - 1

  return {
    from: {
      ...startPosition,
      x: boardHeight - startPosition.x,
      y: boardWidth - startPosition.y,
    },
    to: {
      ...endPosition,
      x: boardHeight - endPosition.x,
      y: boardWidth - endPosition.y,
    },
  }
}
