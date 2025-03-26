import { show } from '@/circle/index.js'
import config from '@/config.js'
import { GAME_OVER_TYPE } from '@/enums.js'
import PlayerBoardUser from '@/pages/board/components/playerBoardUser/index.jsx'
import WinShow from '@/pages/board/components/winShow/index.jsx'
import SocketEvent, { sleep } from '@/service/event.js'
import AdvancedSpin from '@/spinner/index.jsx'
import {
  calculateCursorPosition,
  generateMoveNotation,
  getValidMoves,
  killBossCheck,
  updateArrayWithNewPosition,
} from '@/utils/board-canvas-utils.js'
import { gameMap, generateString } from '@/utils/board-utils.js'
import { CHESS_BOX_CACHE } from '@/utils/cache-key-utils.js'
import {
  capChess,
  destroyAllCtx,
  initBinds,
  initMap,
  move,
  setChessBox,
  setChessTips,
  setMap,
  unCapChess,
} from '@/utils/chess.js'
import { clearCanvas, initializeCanvas, removeCanvas, stopAnimation, updateAnimation } from '@/utils/const-utils.js'
import {
  clearLongFightCount,
  getMultipleLongFightData,
  getOneLongFightData,
  updateLongFighting,
} from '@/utils/long-fighting.js'
import { fetchSkin } from '@/utils/map-res.js'
import { isMoveValidForPieces, validateMovement } from '@/utils/rule-check.js'
import {
  btnSound,
  captureSound,
  eatChessSound,
  failSound,
  killBossSound,
  moveSound,
  peaceSound,
  peopleEatSound,
  playSound,
  startSound,
  winSound,
} from '@/utils/sounds-res.js'
import { Dialog, Toast } from 'antd-mobile'
import lodash from 'lodash'
import { Component } from 'react'
import styles from './index.module.less'

class BoardView extends Component {
  constructor(props) {
    super(props)

    // 定义用户离线战斗结束时的操作
    this.userOfflineBattleOver = () => {
      const { userId, battleId, roomId } = this.props

      // 发送用户离线战斗结束的通知，并处理响应
      SocketEvent.emit('userOfflineBattleOverApi', {
        userId,
        battleId,
        roomId,
      }, (response) => {
        if (response.code !== 'success') {
          // 如果响应不是成功的，则通过Toast显示错误消息
          Toast.show(response.msg)
        }
      })
    }

    // 定义在线状态事件处理器，使用防抖技术减少函数调用频率
    this.onlineEventHandle = () => {
      lodash.debounce(() => {
        const { isOffline, historyMoveStep } = this.state
        const { userId, battleId, roomId } = this.props

        if (isOffline) {
          // 更新状态为在线
          this.setState({
            isOffline: false,
          })

          // 发送用户战斗数据检查请求
          SocketEvent.emit('userBattleDataCheckApi', {
            userId,
            battleId,
            roomId,
            step: historyMoveStep.length - 1,
          }, (response) => {
            if (response.code !== 'success') {
              // 如果响应不是成功的，则通过Toast显示错误消息
              Toast.show(response.msg)
            }
          })
        }
      }, 1000)() // 防抖等待时间为1秒
    }

    // 定义离线状态事件处理器
    this.offlineEventHandle = () => {
      this.setState({
        isOffline: true,
      })
    }

    this.startEventListen = () => {
      // 监听用户时间响应事件
      SocketEvent.on('userTimeRespApi', this.moduleId, (response) => {
        console.log('对战倒计时返回：', response)
        if (response.code === 'success') {
          const { user, enemy } = this.state
          const dataList = (response.data || []).userList
          const updatedUser = dataList.find(e => e.userId === user.userId)
          if (updatedUser) {
            user.stepTime = updatedUser.stepTime
            user.allTime = updatedUser.allTime
          }
          const updatedEnemy = dataList.find(e => e.userId === enemy.userId)
          if (updatedEnemy) {
            enemy.stepTime = updatedEnemy.stepTime
            enemy.allTime = updatedEnemy.allTime
          }
          this.setState({ user, enemy })
        }
      })

      // 同步战斗数据响应事件监听
      SocketEvent.on('syncBattleDataRespApi', this.moduleId, (response) => {
        console.log('同步对战数据返回：', response)
        if (response.code === 'success') {
          const { userId } = this.props
          const battleDataList = response.data.battleDataList
          const myData = battleDataList.find(e => e.userId === userId)
          const opponentData = battleDataList.find(e => e.userId !== userId)
          this.initBattleData(myData, opponentData)
          removeCanvas(myData.userId)
          removeCanvas(opponentData.userId)
        }
      })

      // 棋子移动响应事件监听
      SocketEvent.on('moveChessRespApi', this.moduleId, (response) => {
        console.log('棋子移动，resp: ', response)
        const { gameOver, gameMap } = this.state
        if (response.code === 'success' && !gameOver) {
          const moveData = response.data || {}
          const from = moveData.from
          const to = moveData.to
          const color = from.isBlackColor ? 'boxColorBlack' : 'boxColorRed'
          const fromBox = { show: true, x: from.x, y: from.y, color }
          const toBox = { show: true, x: to.x, y: to.y, color }
          sessionStorage.setItem(CHESS_BOX_CACHE, JSON.stringify({ fromChessBox: fromBox, toChessBox: toBox }))
          this.setState({ fromChessBox: fromBox, toChessBox: toBox }, () => {
            this.handleChessMove(gameMap, from, to)
          })
        }
      })

      // 游戏胜利响应事件监听
      SocketEvent.on('gameWinRespApi', this.moduleId, (response) => {
        console.log('游戏结束，resp: ', response)
        if (response.code === 'success') {
          clearInterval(this.intervalId)
          clearCanvas()
          const { user } = this.state
          const { stepCount, isRedColorWin, type } = response.data
          let winTypeMsg = ''
          if (type === '0006') {
            playSound(peaceSound)
            Toast.show('双方无法进攻棋子')
            winTypeMsg = '和棋'
          }
          else if (type === GAME_OVER_TYPE.USER_PEACE) {
            playSound(peaceSound)
            Toast.show('双方议和')
            winTypeMsg = '和棋'
          }
          else if (stepCount <= 2) {
            playSound(peaceSound)
            Toast.show('对局在两步之内不计输赢')
            winTypeMsg = '和棋'
          }
          else {
            const isOpponent = isRedColorWin === user.first
            playSound(isOpponent ? winSound : failSound)

            if (type === GAME_OVER_TYPE.ADMIT_DEFEAT) {
              Toast.show(`${isOpponent ? '对方' : '我方'}认输`)
            }
            else if (type === GAME_OVER_TYPE.USER_LEAVE) {
              Toast.show(`${isOpponent ? '对方' : '我方'}逃跑判负`)
            }
            else if (type === GAME_OVER_TYPE.USER_TIMEOUT) {
              Toast.show(`${isOpponent ? '对方' : '我方'}对局超时判负`)
            }
            winTypeMsg = isOpponent ? '胜利' : '失败'
          }
          this.setState({
            gameOver: true,
            gameScore: {
              isRedColorWin: response.data.isRedColorWin,
              winScore: response.data.winScore,
              failScore: response.data.failScore,
              winTypeMsg,
            },
            winShow: true,
            winColor: isRedColorWin,
            loading: false,
            handleBattleData: false,
          })
        }
      })

      // 被踢出房间事件监听
      SocketEvent.on('kickUserRespApi', this.moduleId, (response) => {
        console.log('(对局页面)被房主踢出房间，resp: ', response)
        if (response.code === 'success') {
          const { userId, roomId } = response.data
          const { user } = this.state
          console.log('被房主踢出房间，用户信息为: ', user)
          if (user.userId === userId && this.props.roomId === roomId) {
            this.setState({ userIsKick: true })
            Dialog.alert({
              title: '系统提示',
              content: '您被房主请出了房间',
              confirmText: '确认',
              onConfirm: () => {
                playSound(btnSound)
              },
            })
          }
        }
        else {
          Toast.show(response.msg)
        }
      })
    }

    this.initBattleData = (gameData, enemyData) => {
      const { from: lastFromChessBox, fromChessSelected: wasFromChessSelected } = this.state
      const { isRedMove, gameFen, historyMoveStep, lastFrom, lastTo } = gameData

      // 初始化棋盘数据
      const initialGameMap = gameMap(gameFen)
      setMap(initialGameMap)

      // 设置初始状态
      this.setState({
        user: gameData,
        enemy: enemyData,
        gameMap: initialGameMap,
        isRedMove,
        historyMoveStep: historyMoveStep.length > 0
          ? historyMoveStep
          : [{
              gameFen: generateString(initialGameMap, isRedMove),
              fromChessBox: { show: false },
              toChessBox: { show: false },
            }],
        fromChessSelected: false,
        timePause: false,
      })

      // 处理上一步棋子位置显示
      if (lastFrom && lastTo && !wasFromChessSelected) {
        const chessColor = isRedMove ? 'boxColorBlack' : 'boxColorRed'
        const fromChessBox = {
          show: true,
          x: lastFrom.x,
          y: lastFrom.y,
          color: chessColor,
        }
        const toChessBox = {
          show: true,
          x: lastTo.x,
          y: lastTo.y,
          color: chessColor,
        }

        this.setState({
          fromChessBox,
          toChessBox,
        })
        sessionStorage.setItem(CHESS_BOX_CACHE, JSON.stringify({ fromChessBox, toChessBox }))
        setChessBox(fromChessBox, toChessBox)
      }
      else {
        const hiddenChessBox = { show: false }
        sessionStorage.removeItem(CHESS_BOX_CACHE)
        this.setState({
          fromChessBox: hiddenChessBox,
          toChessBox: hiddenChessBox,
        })
        setChessBox(hiddenChessBox, hiddenChessBox)
        setChessTips([])
        if (wasFromChessSelected) {
          unCapChess(lastFromChessBox.id)
        }
      }
    }
    this.startCountTime = () => {
      console.log('已开启游戏计时')

      this.intervalId = setInterval(() => {
        const { timePause, user, enemy, isRedMove } = this.state
        const { battleId, roomId, userId } = this.props

        if (!timePause && user && enemy) {
          const currentPlayer = isRedMove === user.first ? user : enemy

          // 如果当前玩家的步时结束
          if (currentPlayer.stepTime <= 0) {
            this.setState({ timePause: true })

            SocketEvent.emit('gameWinApi', {
              userId,
              roomId,
              battleId,
              overUserId: currentPlayer.userId,
            }, (response) => {
              console.log('结算请求发送完成，resp：', response)
              if (response.code === 'fail') {
                Toast.show(response.msg)
              }
            })
          }

          // 更新步时和总时间
          if (currentPlayer.stepTime >= 0 || currentPlayer.allTime >= 0) {
            if (currentPlayer.stepTime > 0) {
              currentPlayer.stepTime -= 1
            }
            if (currentPlayer.allTime === 1) {
              currentPlayer.stepTime = currentPlayer.readSeconds
            }
            if (currentPlayer.allTime > 0) {
              currentPlayer.allTime -= 1
            }

            // 显示超时警告
            if (currentPlayer.userId === userId) {
              if (currentPlayer.stepTime === config.stepTimeoutTips) {
                Toast.show('请注意，步时即将超时')
              }
              if (currentPlayer.allTime === config.allTimeoutTips) {
                Toast.show('请注意，局时即将超时')
              }
            }

            const stepTime = currentPlayer.allTime > 0 ? currentPlayer.basicStepTime : currentPlayer.readSeconds

            if (isRedMove === user.first) {
              this.setState({
                user: currentPlayer,
              })
              updateAnimation(user.userId, stepTime, currentPlayer.allTime, currentPlayer.stepTime)
            }
            else {
              this.setState({
                enemy: currentPlayer,
              })
              updateAnimation(enemy.userId, stepTime, currentPlayer.allTime, currentPlayer.stepTime)
            }
          }
        }
      }, 1000)
    }
    this.boardClick = (event) => {
      // 提取状态中的变量
      const { gameMap, from, gameOver } = this.state
      // 如果游戏已结束，则直接返回
      if (gameOver) {
        this.setState({
          winShow: true,
        })
        return false
      }

      // 获取点击位置相对于棋盘的坐标
      const clickedPos = calculateCursorPosition(event, this.boardRef)
      // 处理选中的棋子
      if (this.handleChessSelected(clickedPos)) {
        // 检查是否能够落子
        const isValidMove = validateMovement(JSON.stringify(gameMap), from, clickedPos)
        if (!isValidMove) {
          return false
        }

        // 检查是否有长将情况
        const isLongFighting = this.handleLongFighting(JSON.stringify(gameMap), from, clickedPos)
        if (!isLongFighting) {
          return false
        }
        // 处理棋子的移动
        this.handleChessMove(gameMap, from, clickedPos)
        // 向对手发送落子信息
        this.sendChessDataToEnemy(from, clickedPos)
      }

      return true
    }

    this.handleLongFighting = (gameMap, fromChessBox, toPosition) => {
      // 检查是否将军
      const updatedGameMap = updateArrayWithNewPosition(gameMap, fromChessBox, toPosition)
      const isCheck = killBossCheck(updatedGameMap, fromChessBox.isBlackColor)

      if (isCheck) {
        // 检查单子强攻次数
        if (getOneLongFightData(fromChessBox.id) >= config.ONE_LONG_FIGHTING_COUNT) {
          Toast.show('禁止长将(单子强攻)')
          return false
        }

        // 检查多子围攻次数
        if (getMultipleLongFightData() >= config.MULTIPLE_LONG_FIGHTING_COUNT) {
          Toast.show('禁止长将(多子围攻)')
          return false
        }

        // 更新单子强攻计数
        updateLongFighting(fromChessBox.id, 1)
      }
      else {
        // 重置或更新其他状态
        clearLongFightCount()
      }

      return true
    }
    this.handleChessMove = (gameMap, fromChessBox, toPosition) => {
      // 获取当前组件状态中的相关数据
      const { user, enemy, stepCount, isRedMove, historyMoveStep, fromChessBox: prevFromChessBox } = this.state

      // 清空棋子提示
      setChessTips([])

      // 复制即将移动的棋子信息，避免直接修改原始数据
      const movingChess = JSON.parse(JSON.stringify(fromChessBox))
      let isCapture = false

      // 在游戏地图中查找目标位置的棋子
      const targetChess = gameMap.find(chess => chess.x === toPosition.x && chess.y === toPosition.y)
      const targetChessIndex = gameMap.findIndex(chess => chess.x === toPosition.x && chess.y === toPosition.y)

      if (targetChessIndex !== -1) {
        // 如果目标位置有棋子，执行吃子操作
        playSound(eatChessSound)
        gameMap.splice(targetChessIndex, 1)
        movingChess.x = toPosition.x
        movingChess.y = toPosition.y
        const currentChessIndex = gameMap.findIndex(chess => chess.id === movingChess.id)
        gameMap.splice(currentChessIndex, 1, movingChess)
        isCapture = true
        console.log(`[吃棋] 棋子位置: [${toPosition.x}, ${toPosition.y}]`)
      }
      else {
        // 如果目标位置没有棋子，执行走棋操作

        playSound(moveSound)
        const currentChessIndex = gameMap.findIndex(chess => chess.id === movingChess.id)
        movingChess.x = toPosition.x
        movingChess.y = toPosition.y
        gameMap.splice(currentChessIndex, 1, movingChess)
        console.log(`[走棋] 到达位置: [${movingChess.x}, ${movingChess.y}]`)
      }

      // 检查是否将军
      const isChecking = killBossCheck(gameMap, movingChess.isBlackColor)
      if (isChecking) {
        playSound(killBossSound)
        show('将军')
      }
      else if (isCapture) {
        playSound(peopleEatSound)
        show('吃')
      }

      // 设置当前玩家和对手的步数时间
      user.stepTime = user.allTime > 0 ? user.basicStepTime : user.readSeconds
      enemy.stepTime = enemy.allTime > 0 ? enemy.basicStepTime : enemy.readSeconds

      // 设置目标棋子框的显示信息
      const chessColor = movingChess.isBlackColor ? 'boxColorBlack' : 'boxColorRed'
      const toChessBoxInfo = {
        show: true,
        x: movingChess.x,
        y: movingChess.y,
        color: chessColor,
      }

      // 更新组件状态
      this.setState({
        toChessBox: toChessBoxInfo,
        fromChessSelected: false,
        user,
        enemy,
        stepCount: stepCount + 1,
        isRedMove: !isRedMove,
        gameMap,
      })

      // 执行棋子移动的相关操作（可能是动画或其他逻辑）
      move(fromChessBox, targetChess || toPosition, prevFromChessBox, toChessBoxInfo, gameMap)

      // 通知相关操作（具体作用根据 Yd 函数的定义确定）
      stopAnimation((user.first === isRedMove ? user : enemy).userId)

      // 记录历史移动步骤
      historyMoveStep.push({
        gameFen: generateString(gameMap),
        lastFrom: fromChessBox,
        lastTo: toPosition,
        fromChessBox: prevFromChessBox,
        toChessBox: toChessBoxInfo,
      })
      this.setState({
        historyMoveStep,
      })

      // 输出当前玩家是否先手以及当前是否红方移动的信息
      console.log(`我方是否先手: ${this.state.user.first} - isRedMove: ${this.state.isRedMove}`)

      // 检查游戏是否结束，如果结束则更新状态
      if (isMoveValidForPieces(gameMap, movingChess, isChecking)) {
        this.setState({
          gameOver: true,
        })
      }
    }
    this.sendChessDataToEnemy = (from, to) => {
      const { fromChessBox, user, enemy } = this.state
      const { roomId, battleId, userId } = this.props
      const toChessBox = {
        show: true,
        x: to.x,
        y: to.y,
        color: fromChessBox.color,
      }

      // 发送移动棋子请求
      SocketEvent.emit('moveChessApi', {
        from,
        to,
        fromChessBox,
        toChessBox,
        stepExplain: generateMoveNotation(user.first, from, to),
        roomId,
        battleId,
        userId,
      }, (response) => {
        if (response.code === 'fail') {
          // 如果失败，更新状态并显示错误信息
          this.setState({
            loading: true,
            text: response.msg,
            timePause: true,
          })

          // 延迟1秒后尝试同步战斗数据
          setTimeout(() => {
            SocketEvent.emit('syncBattleDataApi', {
              userId,
              roomId,
              battleId,
            }, (syncResponse) => {
              removeCanvas(enemy.userId)
              removeCanvas(user.userId)

              this.setState({
                loading: false,
                timePause: false,
              })

              if (syncResponse.code !== 'success') {
                Toast.show(syncResponse.msg)
                this.handleBackMove()
              }
            })
          }, 1000)
        }
      })
    }
    this.handleChessSelected = (selectedPosition) => {
      // 从状态中获取相关数据
      const { gameMap, fromChessBox, from, isRedMove, fromChessSelected } = this.state

      // 检查当前落子方是否为我方
      if (isRedMove !== this.state.user.first) {
        console.log('当前落子方不为我方')
        return false
      }

      // 在游戏地图中查找选中位置的棋子
      const selectedChess = gameMap.find(chess => chess.x === selectedPosition.x && chess.y === selectedPosition.y)

      if (fromChessSelected) {
        if (selectedChess) {
          // 获取选中棋子的颜色
          const selectedChessColor = selectedChess.isBlackColor ? 'boxColorBlack' : 'boxColorRed'

          // 如果已选中的棋子颜色和当前选中棋子颜色相同
          if (fromChessBox.color === selectedChessColor) {
            // 如果是同一个棋子再次被选中
            if (from.id === selectedChess.id) {
              // 执行取消选中操作
              playSound(moveSound)
              setChessTips([])
              unCapChess(from.id)

              // 尝试从 sessionStorage 中恢复之前的棋子框状态
              const storedData = sessionStorage.getItem(CHESS_BOX_CACHE)
              if (storedData) {
                const { fromChessBox: storedFrom, toChessBox: storedTo } = JSON.parse(storedData)
                setChessBox(storedFrom, storedTo)
              }

              // 更新状态，取消棋子选中状态
              this.setState({
                fromChessSelected: false,
              })
            }
            else {
              // 切换选中的棋子
              playSound(captureSound)
              // 根据配置设置有效移动提示
              setChessTips(config.chessValidMoveSwitch ? getValidMoves(gameMap, selectedChess) : [])
              capChess(selectedChess.id)

              // 更新棋子框状态
              const newFromChessBox = {
                show: true,
                x: selectedChess.x,
                y: selectedChess.y,
                color: selectedChessColor,
              }
              const newToChessBox = {
                show: false,
              }
              setChessBox(newFromChessBox, newToChessBox)

              // 更新状态，选中新的棋子
              this.setState({
                fromChessBox: newFromChessBox,
                toChessBox: newToChessBox,
                from: selectedChess,
                fromChessSelected: true,
              })
            }
            return false
          }
        }
        return true
      }

      // 如果未选中棋子且选中的是我方棋子
      if (selectedChess && selectedChess.isBlackColor !== isRedMove && selectedChess.isBlackColor !== this.state.user.first) {
        // 选中棋子操作
        playSound(captureSound)
        // 根据配置设置有效移动提示
        setChessTips(config.chessValidMoveSwitch ? getValidMoves(gameMap, selectedChess) : [])
        capChess(selectedChess.id)

        // 获取选中棋子的颜色
        const selectedChessColor = selectedChess.isBlackColor ? 'boxColorBlack' : 'boxColorRed'
        // 更新棋子框状态
        const newFromChessBox = {
          show: true,
          x: selectedChess.x,
          y: selectedChess.y,
          color: selectedChessColor,
        }
        const newToChessBox = {
          show: false,
        }
        setChessBox(newFromChessBox, newToChessBox)

        // 更新状态，选中棋子
        this.setState({
          fromChessBox: newFromChessBox,
          toChessBox: newToChessBox,
          from: selectedChess,
          fromChessSelected: true,
        })
      }
      return false
    }

    this.userAdmitDefeat = () => {
      const { userId, battleId, roomId } = this.props

      SocketEvent.emit('userAdmitDefeatApi', {
        userId,
        battleId,
        roomId,
      }, (response) => {
        if (response.code === 'success') {
          this.setState({
            handleBattleData: true,
          })
        }
        else {
          Toast.show(response.msg)
          console.error(`用户认输失败: ${response.msg}`)
        }
      })
    }

    this.handleBackMove = () => {
      const { historyMoveStep, isRedMove, user, enemy } = this.state

      if (historyMoveStep.length === 0) {
        Toast.show('空棋盘，无法悔棋')
      }
      else {
        // 如果历史步骤多于一个，则移除最后一个步骤
        if (historyMoveStep.length > 1) {
          historyMoveStep.pop()
        }

        const lastStep = historyMoveStep[historyMoveStep.length - 1]
        console.log(`悔棋，isRedMove: ${isRedMove}, 长度为：${historyMoveStep.length} 回退到：`, lastStep)

        const gameFen = gameMap(lastStep.gameFen)
        const fromChessBox = historyMoveStep.length > 1 ? lastStep.fromChessBox : { show: false }
        const toChessBox = historyMoveStep.length > 1 ? lastStep.toChessBox : { show: false }

        this.setState({
          historyMoveStep,
          isRedMove: !isRedMove,
          gameMap: gameFen,
          fromChessBox,
          toChessBox,
          stepCount: historyMoveStep.length - 1,
          fromChessSelected: false,
          timePause: false,
        })

        setMap(gameFen)
        sessionStorage.setItem(CHESS_BOX_CACHE, JSON.stringify({ fromChessBox, toChessBox }))
        setChessBox(fromChessBox, toChessBox)
        setChessTips([])
        stopAnimation((user.first === isRedMove ? user : enemy).userId)
      }
    }
    this.resetSkinMap = () => {
      const { gameMap, fromChessBox, toChessBox } = this.state

      // Initialize the game map
      initMap(gameMap)

      // Set the chess boxes (from and to)
      setChessBox(fromChessBox, toChessBox)
    }

    this.state = {
      loading: false,
      text: null,
      gameMap: null,
      fromChessBox: {
        show: false,
        color: null,
        x: 0,
        y: 0,
      },
      toChessBox: {
        show: false,
        color: null,
        x: 0,
        y: 0,
      },
      from: {
        id: null,
        x: null,
        y: null,
      },
      fromChessSelected: false,
      historyMoveStep: [],
      isRedMove: !0,
      handleBattleData: false,
      gameOver: false,
      stepCount: 0,
      gameScore: {
        winScore: 0,
        failScore: 0,
      },
      winShow: false,
      user: null,
      enemy: null,
      userIsKick: false,
      timePause: false,
      isOffline: false,
    }
    // this.red = 'red'
    // this.black = 'black'
    this.childPlayOneRef = null
    this.childPlayTwoRef = null
    this.moduleId = 'boardPlatform'
  }

  handleUserAvatar() {
    // 设置一个定时器，每隔10毫秒检查一次用户头像是否加载条件满足
    this.loadUserAvatarInterId = setInterval(() => {
      const { user, enemy } = this.state

      // 检查用户和敌人的userId是否存在
      if (user && user.userId && enemy && enemy.userId) {
        // 如果条件满足，则清除定时器
        clearInterval(this.loadUserAvatarInterId)

        // 创建一个包含用户信息和对应DOM元素引用的数组
        const avatarElementsInfo = [
          {
            userId: enemy.userId,
            el: this.childPlayOneRef, // 敌人头像对应的DOM元素引用
          },
          {
            userId: user.userId,
            el: this.childPlayTwoRef, // 用户头像对应的DOM元素引用
          },
        ]

        // 来处理用户头像的加载或显示逻辑
        initializeCanvas(avatarElementsInfo)
      }
    }, 10) // 定时器间隔时间设为10毫秒
  }

  componentDidMount() {
    setTimeout(async () => {
      const { userId, roomId, roomUser, roomEnemy } = this.props
      console.log('进入棋盘页面，入参：', { userId, roomId, roomUser, roomEnemy })

      await sleep(2)
      try {
        if (this.boardRef) {
          const map = await fetchSkin()
          initBinds(this.boardRef, map)

          this.initBattleData(roomUser, roomEnemy)
          this.handleUserAvatar()
          this.startCountTime()
          this.startEventListen()
          this.userOfflineBattleOver()
          this.onlineEventHandle()
          playSound(startSound)
        }
      }
      catch (e) {
        console.error('棋盘页面初始化失败：', e)
      }
    })
    window.addEventListener('online', this.onlineEventHandle)
    window.addEventListener('offline', this.offlineEventHandle)
  }

  componentWillUnmount() {
    clearCanvas()
    destroyAllCtx()
    this.boardRef.remove()
    clearInterval(this.intervalId)
    sessionStorage.removeItem(CHESS_BOX_CACHE)
    SocketEvent.off(this.moduleId)
    window.removeEventListener('online', this.onlineEventHandle)
    window.removeEventListener('offline', this.offlineEventHandle)
  }

  render() {
    const { user, enemy, winShow, userIsKick, isRedMove, gameOver, handleBattleData, historyMoveStep } = this.state
    const { roomId, userId, battleId, goBack, goPlatformView } = this.props

    return (
      <div className={styles.bg}>
        {/* 棋盘 */}
        <div
          className={styles.board}
          ref={e => this.boardRef = e}
          onClick={e => this.boardClick(e)}
        />

        {/* 游戏组件 */}
        <PlayerBoardUser
          playOne={enemy || {}}
          playTwo={user || {}}
          roomId={roomId}
          isRedMove={isRedMove}
          gameOver={gameOver}
          handleBattleData={handleBattleData}
          userId={userId}
          battleId={battleId}
          historyMoveStep={historyMoveStep}
          callAndSetPlayDom={(playOneRef, playTwoRef) => {
            this.childPlayOneRef = playOneRef
            this.childPlayTwoRef = playTwoRef
          }}
          showGameOverWindow={() => this.setState({ winShow: gameOver })}
          exitPk={() => this.userAdmitDefeat()}
          handleBackMove={() => this.handleBackMove()}
          resetSkinMap={this.resetSkinMap}
        />

        {/* 胜利显示窗口 */}
        {winShow && (
          <WinShow
            user={user}
            enemy={enemy}
            gameScore={this.state.gameScore}
            userIsKick={userIsKick}
            goBack={() => userIsKick ? goPlatformView() : goBack()}
            closeWin={() => this.setState({ winShow: false })}
          />
        )}

        {/* 加载指示器 */}
        <AdvancedSpin text={this.state.text} show={this.state.loading} />
      </div>
    )
  }
}

export default BoardView
