import { Toast } from 'antd-mobile'
import { getValidMoves, updateArrayWithNewPosition } from '@/utils/board-canvas-utils.js'
import { basicRule } from '@/utils/rules/basic-rule.js'
import { isMovementValid, isStalemateAtBoss } from '@/utils/rules/boss-rule.js'

export function validateMovement(gameStateStr, isBlackColor, newPosition) {
  const gameState = JSON.parse(gameStateStr)
  const isValidMovement = basicRule(gameState, isBlackColor, newPosition)
  console.log('行走规则校验结果：', isValidMovement)
  if (!isValidMovement)
    return false
  const isBossValid = isMovementValid(gameState, isBlackColor, newPosition)
  console.log('Boss规则检测结果：', isBossValid)
  return !!isBossValid || isBossValid
}

export function isMoveValidForPieces(pieces, isBlackTurn, messageToShow) {
  // 如果有棋子受到攻击，或者不存在攻击的情况，即可走棋
  return !pieces.some(piece => piece.isAttach) || checkGameState(pieces, isBlackTurn.isBlackColor, messageToShow)
}

function checkGameState(elements, isBlackColor, condition) {
  // If function Qh returns true, log a message and return false
  if (Qh(elements, isBlackColor)) {
    console.log('boss还有可走的位置')
    return false
  }

  // Filter elements based on their color
  const filteredElements = elements.filter(element => element.isBlackColor !== isBlackColor)

  // If there is only one element left, show a message and return true
  if (filteredElements.length === 1) {
    Toast.show(condition ? '绝杀' : '困毙')
    return true
  }

  // If condition is not met, iterate over the filtered elements
  if (!condition) {
    for (let i = 0; i < filteredElements.length; i++) {
      const result = getValidMoves(elements, filteredElements[i])
      if (result && result.length > 0) {
        return false
      }
    }
    Toast.show('困毙')
    return true
  }

  // If condition is met, iterate over the filtered elements and perform additional checks
  const nonBossElements = filteredElements.filter(element => !element.isBoss)
  const bossElement = filteredElements.find(element => element.isBoss)

  for (let i = 0; i < nonBossElements.length; i++) {
    const result = getValidMoves(elements, nonBossElements[i])

    for (let j = 0; j < result.length; j++) {
      const newElements = updateArrayWithNewPosition(JSON.stringify(elements), nonBossElements[i], result[j])
      const sameColorElements = newElements.filter(element => element.isBlackColor === isBlackColor)
      let canMove = true

      for (let k = 0; k < sameColorElements.length; k++) {
        if (basicRule(newElements, sameColorElements[k], bossElement) || isStalemateAtBoss(newElements)) {
          canMove = false
          break
        }
      }

      if (canMove) {
        return false
      }
    }
  }

  Toast.show('绝杀')
  return true
}

function Qh(board, isBlack) {
  // 根据棋子颜色过滤棋子数组
  const filteredPieces = board.filter(piece => piece.isBlackColor !== isBlack)

  // 找到当前 boss 棋子
  const bossPiece = filteredPieces.find(piece => piece.isBoss)

  // 获取当前 boss 可以移动的位置
  const validMoves = getValidMoves(board, bossPiece)

  // 打印当前 boss 可走的位置
  console.log('当前boss可走的位置有:', validMoves)

  // 如果当前 boss 有可行的移动方式
  if (validMoves.length > 0) {
    // 遍历所有可移动的位置
    for (let i = 0; i < validMoves.length; ++i) {
      // 模拟移动棋子后的棋盘状态
      const simulatedBoard = updateArrayWithNewPosition(JSON.stringify(board), bossPiece, validMoves[i])

      // 过滤出非 boss 棋子且颜色符合的棋子
      const opponentPieces = simulatedBoard.filter(piece => !piece.isBoss && piece.isBlackColor === isBlack)

      let j = 0
      // 遍历对手棋子
      for (; j < opponentPieces.length; ++j) {
        // 如果当前对手棋子可以吃掉 boss 棋子
        if (basicRule(simulatedBoard, opponentPieces[j], { ...validMoves[i], id: bossPiece.id })) {
          // 提前结束循环
          break
        }
        // 如果当前状态下已经达到胜利条件，则提前结束循环
        if (isStalemateAtBoss(simulatedBoard)) {
          break
        }
      }
      // 如果所有对手棋子都无法吃掉 boss 棋子，则返回 true
      if (j === opponentPieces.length) {
        return true
      }
    }
  }
  // 如果所有移动都无法达到胜利条件，则返回 false
  return false
}
