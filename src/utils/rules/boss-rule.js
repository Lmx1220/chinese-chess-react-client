import { initializeGrid, killBossCheck, updateArrayWithNewPosition } from '@/utils/board-canvas-utils.js'

export function isMovementValid(gameState, piece, newPosition) {
  const updatedGameState = updateArrayWithNewPosition(JSON.stringify(gameState), piece, newPosition)
  const isStalemate = isStalemateAtBoss(updatedGameState)
  return !isStalemate && !killBossCheck(updatedGameState, !piece.isBlackColor)
}

export function isStalemateAtBoss(gameState) {
  const grid = initializeGrid(gameState)
  const bossBlack = gameState.find(piece => piece.isBoss && piece.isBlackColor)
  const bossWhite = gameState.find(piece => piece.isBoss && !piece.isBlackColor)
  if (bossBlack.y !== bossWhite.y) {
    return false
  }
  const startX = Math.min(bossBlack.x, bossWhite.x) + 1
  const endX = Math.max(bossBlack.x, bossWhite.x)
  for (let x = startX; x < endX; ++x) {
    if (grid[x][bossBlack.y]) {
      return false
    }
  }
  return true
}
