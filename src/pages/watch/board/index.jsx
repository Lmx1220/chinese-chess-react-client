import { Toast } from 'antd-mobile'
import lodash from 'lodash'
import React from 'react'
import { show } from '@/circle/index.js'
import { GAME_OVER_TYPE } from '@/enums.js'
import styles from '@/pages/watch/board/index.module.less'
import User from '@/pages/watch/board/user'
import SocketEvent, { sleep } from '@/service/event'
import AdvancedSpin from '@/spinner'
import { calculateNewPositions, killBossCheck } from '@/utils/board-canvas-utils.js'
import { gameMap } from '@/utils/board-utils.js'
import { destroyAllCtx, initBinds, initMap, move, setChessBox, setMap } from '@/utils/chess.js'
import { clearCanvas, initializeCanvas, removeCanvas, stopAnimation, updateAnimation } from '@/utils/const-utils.js'
import { fetchSkin } from '@/utils/map-res.js'
import { isMoveValidForPieces } from '@/utils/rule-check.js'
import {
  eatChessSound,
  killBossSound,
  moveSound,
  peaceSound,
  peopleEatSound,
  playSound,
  startSound,
} from '@/utils/sounds-res.js'

/**
 * 观战棋盘
 */
class WatchBoard extends React.Component {
  constructor(props) {
    super(props)
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
    this.offlineEventHandle = () => {
      // 网络断开，更新离线状态
      this.setState({
        isOffline: true,
      })
    }

    this.joinWatchHandle = () => {
      const { userId, roomId } = this.props
      console.log(`用户[${userId}]请求获取房间[${roomId}]的观战数据`)
      // 发送加入观战请求
      SocketEvent.emit('joinWatchApi', {
        userId,
        roomId,
      }, (response) => {
        console.log(`申请加入观战返回：`, response)
        if (response.code === 'success') {
          // 成功加入观战，开始计时，初始化一些状态
          this.startCountTime()
          // playSound(btnSound)
          this.setState({
            gameOver: false,
          })
        }
        else {
          Toast.show(response.msg)
        }
      })
    }

    this.initBattleData = (battleId, userData, enemyData) => {
      let { swapChessBoard } = this.state
      const { watchUserId } = this.props
      const players = [userData, enemyData]
      const watchedPlayer = players.find(player => player.userId === watchUserId)
      if (watchedPlayer) {
        // 根据观战用户信息更新棋盘交换状态
        swapChessBoard = !watchedPlayer.first
        this.setState({
          swapChessBoard,
        })
      }
      const isRedMove = userData.isRedMove
      const gameFen = swapChessBoard ? enemyData.gameFen : userData.gameFen
      const gameState = gameMap(gameFen)
      // 初始化战斗数据状态
      this.setState({
        user: userData,
        enemy: enemyData,
        gameMap: gameState,
        isRedMove,
        battleId,
        fromChessBox: {
          show: false,
        },
        toChessBox: {
          show: false,
        },
      })
      const lastFrom = swapChessBoard ? enemyData.lastFrom : userData.lastFrom
      const lastTo = swapChessBoard ? enemyData.lastTo : userData.lastTo
      setMap(gameState)
      setChessBox()
      if (lastFrom && lastTo) {
        const color = isRedMove ? 'boxColorBlack' : 'boxColorRed'
        const fromChessBox = {
          show: true,
          x: lastFrom.x,
          y: lastFrom.y,
          color,
        }
        const toChessBox = {
          show: true,
          x: lastTo.x,
          y: lastTo.y,
          color,
        }
        // 更新棋子移动的起始和目标位置状态
        this.setState({
          fromChessBox,
          toChessBox,
        })
        setChessBox(fromChessBox, toChessBox)
      }
    }
    this.startCountTime = () => {
      console.log('已开启观战游戏计时')
      this.intervalId = setInterval(() => {
        const { user, enemy, isRedMove, swapChessBoardRun } = this.state
        if (!swapChessBoardRun && user && enemy) {
          const currentPlayer = user.first === isRedMove ? user : enemy
          if (currentPlayer.stepTime >= 0 || currentPlayer.allTime >= 0) {
            if (currentPlayer.stepTime > 0) {
              currentPlayer.stepTime--
            }
            if (currentPlayer.allTime === 1) {
              currentPlayer.stepTime = currentPlayer.readSeconds
            }
            if (currentPlayer.allTime > 0) {
              currentPlayer.allTime--
            }
            const basicStepTime = currentPlayer.allTime > 0 ? currentPlayer.basicStepTime : currentPlayer.readSeconds
            if (user.first === isRedMove) {
              // 更新用户状态并调用 Kd 函数
              this.setState({
                user: currentPlayer,
              })
              updateAnimation(user.userId, basicStepTime, currentPlayer.allTime, currentPlayer.stepTime)
            }
            else {
              // 更新对手状态并调用 Kd 函数
              this.setState({
                enemy: currentPlayer,
              })
              updateAnimation(enemy.userId, basicStepTime, currentPlayer.allTime, currentPlayer.stepTime)
            }
          }
        }
      }, 1000)
    }

    this.startEventListen = () => {
      // 监听会话恢复通知
      SocketEvent.on('sessionRecoverNotifyApi', this.moduleId, (response) => {
        console.log('(观战)会话恢复结果通知返回：', response)
        if (response.code === 'success') {
          const { battleId, isNewBattle } = response.data
          this.setState({ battleId })
          if (isNewBattle) {
            Toast.show('双方已重新开局')
          }
          const { gameOver } = this.state
          if (gameOver) {
            this.setState({ gameOver: false })
            this.startCountTime()
          }
        }
      })

      // 监听对手离开房间响应
      SocketEvent.on('enemyLeaveRoomRespApi', this.moduleId, (response) => {
        console.log('(观战)选手离开房间：', response)
        const { user, enemy } = this.state
        const leavingUserId = response.data.userId
        if (user && user.userId === leavingUserId) {
          this.setState({ user: null })
          Toast.show(`[${user.userName || leavingUserId}]离开了房间`)
        }
        else if (enemy && enemy.userId === leavingUserId) {
          this.setState({ enemy: null })
          Toast.show(`[${enemy.userName || leavingUserId}]离开了房间`)
        }
        if (!user && !enemy) {
          Toast.show('双方已离开房间')
        }
      })

      // 监听服务器允许双方进入对局
      SocketEvent.on('allowInBattleApi', this.moduleId, (response) => {
        console.log('(观战)服务器允许双方进入对局，resp: ', response)
        if (response.code === 'success') {
          const { swapChessBoard } = this.state
          const { playOne, playTwo } = response.data
          const firstPlayer = playOne.first ? playOne : playTwo
          const secondPlayer = playOne.first ? playTwo : playOne
          const gameFen = swapChessBoard ? secondPlayer.gameFen : firstPlayer.gameFen
          const newGameMap = gameMap(gameFen)
          const fromChessBox = { show: false }
          const toChessBox = { show: false }
          console.log('(观战)即将重新开局，开局数据：', {
            roomUser: firstPlayer,
            roomEnemy: secondPlayer,
          })
          this.setState({
            user: firstPlayer,
            enemy: secondPlayer,
            isRedMove: true,
            gameOver: false,
            gameMap: newGameMap,
            fromChessBox,
            toChessBox,
          })
          initMap(newGameMap)
          setChessBox(fromChessBox, toChessBox)
          this.handleUserAvatar()
          this.startCountTime()
          playSound(startSound)
          Toast.show('双方已准备，对局开始')
        }
        else {
          Toast.show(response.msg)
        }
      })

      // 监听用户时间响应
      SocketEvent.on('userTimeRespApi', this.moduleId, (response) => {
        console.log('观战倒计时返回：', response)
        if (response.code === 'success') {
          const { user, enemy } = this.state
          const userList = response.data.userList || []
          const userData = userList.find(item => item.userId === user.userId)
          if (userData) {
            user.stepTime = userData.stepTime
            user.allTime = userData.allTime
          }
          const enemyData = userList.find(item => item.userId === enemy.userId)
          if (enemyData) {
            enemy.stepTime = enemyData.stepTime
            enemy.allTime = enemyData.allTime
          }
          this.setState({ user, enemy })
        }
      })

      // 监听同步战斗数据响应
      SocketEvent.on('syncBattleDataRespApi', this.moduleId, (response) => {
        console.log('观战用户同步房间数据返回：', response)
        if (response.code === 'success') {
          const { battleDataList, battleId } = response.data
          const firstPlayer = battleDataList.find(player => player.first)
          const secondPlayer = battleDataList.find(player => !player.first)
          this.initBattleData(battleId, firstPlayer, secondPlayer)
          removeCanvas(firstPlayer.userId)
          removeCanvas(secondPlayer.userId)
        }
      })

      // 监听同步房间数据响应
      SocketEvent.on('syncRoomDataRespApi', this.moduleId, (response) => {
        console.log('观战-房间数据变化同步：', response)
        const { gameOver } = this.state
        if (gameOver && response.code === 'success') {
          const roomDataList = response.data.roomDataList
          const firstPlayer = roomDataList.find(player => player.first)
          const secondPlayer = roomDataList.find(player => !player.first)
          this.setState({ user: firstPlayer, enemy: secondPlayer })
        }
      })

      // 监听棋子移动响应
      SocketEvent.on('moveChessRespApi', this.moduleId, async (response) => {
        console.log(`观战用户[${this.props.userId}]棋子移动, resp: `, response)
        if (response.code === 'success') {
          if (this.state.swapChessBoardRun) {
            await new Promise(resolve => setTimeout(resolve, 10))
          }
          const { user, enemy, swapChessBoard } = this.state
          const { from, to, chessFromUserId } = response.data
          const movingPlayer = user.userId === chessFromUserId ? user : enemy
          const color = movingPlayer.first ? 'boxColorBlack' : 'boxColorRed'
          let newFrom = from
          let newTo = to
          if (swapChessBoard !== movingPlayer.first) {
            const { from: newFromPos, to: newToPos } = calculateNewPositions(from, to)
            newFrom = newFromPos
            newTo = newToPos
          }
          const fromChessBox = {
            show: true,
            x: newFrom.x,
            y: newFrom.y,
            color,
          }
          const toChessBox = {
            show: true,
            x: newTo.x,
            y: newTo.y,
            color,
          }
          this.handleChessMove(newFrom, newTo, fromChessBox, toChessBox)
        }
        else {
          Toast.show(response.msg)
        }
      })

      // 监听游戏胜利响应
      SocketEvent.on('gameWinRespApi', this.moduleId, (response) => {
        console.log('观战游戏结束，resp: ', response)
        if (response.code === 'success') {
          playSound(peaceSound)
          const { type, isRedColorWin } = response.data
          let resultMsg
          if (type === '0006') {
            resultMsg = '双方无可进攻棋子'
          }
          else if (type === GAME_OVER_TYPE.USER_PEACE) {
            resultMsg = '双方议和'
          }
          else if (type === GAME_OVER_TYPE.ADMIT_DEFEAT) {
            resultMsg = `${isRedColorWin ? '黑棋' : '红棋'}认输`
          }
          else if (type === GAME_OVER_TYPE.USER_LEAVE) {
            resultMsg = `${isRedColorWin ? '黑棋' : '红棋'}逃跑判负`
          }
          else if (type === GAME_OVER_TYPE.USER_TIMEOUT) {
            resultMsg = `${isRedColorWin ? '黑棋' : '红棋'}超时判负`
          }
          else {
            resultMsg = isRedColorWin ? '红棋胜利' : '黑棋胜利'
          }
          clearInterval(this.intervalId)
          clearCanvas()
          this.setState({
            gameOver: true,
            gameOverMsg: resultMsg,
          })
        }
      })

      // 监听悔棋响应
      SocketEvent.on('backMoveRespApi', this.moduleId, (response) => {
        console.log('[观战]对方发起悔棋，返回：', response)
        if (response.code === 'success') {
          const { user } = this.state
          const requesterId = response.data.userId
          const side = user.userId === requesterId ? (user.first ? '红方' : '黑方') : (user.first ? '黑方' : '红方')
          Toast.show(`${side}请求悔棋`)
        }
      })

      // 监听悔棋结果响应
      SocketEvent.on('backMoveResultRespApi', this.moduleId, (response) => {
        console.log('[观战]对手方处理了悔棋意愿，返回：', response)
        if (response.code === 'success') {
          const { userId, result, battleDataList } = response.data
          const { user } = this.state
          const side = user.userId === userId ? (user.first ? '红方' : '黑方') : (user.first ? '黑方' : '红方')
          if (result === 'reject') {
            Toast.show(`${side}拒绝悔棋`)
          }
          else {
            Toast.show(`${side}同意悔棋`)
            this.handleBackMove(battleDataList)
          }
        }
        else if (response.code === 'fail') {
          Toast.show(response.msg)
        }
      })
    }

    this.handleBackMove = (players) => {
      const { swapChessBoard } = this.state
      // 找到先手玩家和后手玩家
      const firstPlayer = players.find(player => player.first)
      const secondPlayer = players.find(player => !player.first)
      const isRedMove = firstPlayer.isRedMove
      const gameFen = swapChessBoard ? secondPlayer.gameFen : firstPlayer.gameFen
      const newGameFen = gameMap(gameFen)
      // 更新状态
      this.setState({
        user: firstPlayer,
        enemy: secondPlayer,
        gameMap: newGameFen,
        isRedMove,
      })
      setMap(newGameFen)
      const lastFrom = swapChessBoard ? secondPlayer.lastFrom : firstPlayer.lastFrom
      const lastTo = swapChessBoard ? secondPlayer.lastTo : firstPlayer.lastTo
      if (lastFrom && lastTo) {
        const color = isRedMove ? 'boxColorBlack' : 'boxColorRed'
        const fromChessBox = {
          show: true,
          x: lastFrom.x,
          y: lastFrom.y,
          color,
        }
        const toChessBox = {
          show: true,
          x: lastTo.x,
          y: lastTo.y,
          color,
        }
        // 更新棋子位置状态
        this.setState({
          fromChessBox,
          toChessBox,
        })
        setChessBox(fromChessBox, toChessBox)
      }
      else {
        setChessBox()
        // 重置棋子位置显示状态
        this.setState({
          fromChessBox: { show: true },
          toChessBox: { show: true },
        })
      }
    }

    this.handleChessMove = (fromPosition, toPosition, fromChessBox, toChessBox) => {
      const { user, enemy, gameMap, isRedMove } = this.state
      // 找到起始位置的棋子
      const fromPiece = gameMap.find(piece => piece.x === fromPosition.x && piece.y === fromPosition.y)
      const targetPosition = toPosition
      let isPieceCaptured = false
      // 找到目标位置的棋子
      const targetPiece = gameMap.find(piece => piece.x === targetPosition.x && piece.y === targetPosition.y)
      const targetIndex = gameMap.findIndex(piece => piece.x === targetPosition.x && piece.y === targetPosition.y)
      if (targetIndex !== -1) {
        playSound(eatChessSound)
        const movingPiece = gameMap.find(piece => piece.x === fromPiece.x && piece.y === fromPiece.y)
        movingPiece.x = targetPosition.x
        movingPiece.y = targetPosition.y
        gameMap.splice(targetIndex, 1)
        isPieceCaptured = true
      }
      else {
        playSound(moveSound)
        const movingPiece = gameMap.find(piece => piece.x === fromPiece.x && piece.y === fromPiece.y)
        movingPiece.x = targetPosition.x
        movingPiece.y = targetPosition.y
      }
      const isCheck = killBossCheck(gameMap, fromPiece.isBlackColor)
      if (isCheck) {
        playSound(killBossSound)
        show('将军')
      }
      else if (isPieceCaptured) {
        playSound(peopleEatSound)
        show('吃')
      }
      move(fromPiece, targetPiece || targetPosition, fromChessBox, toChessBox, gameMap)
      user.stepTime = user.allTime > 0 ? user.basicStepTime : user.readSeconds
      enemy.stepTime = enemy.allTime > 0 ? enemy.basicStepTime : enemy.readSeconds
      stopAnimation((user.first === isRedMove ? user : enemy).userId)
      isMoveValidForPieces(gameMap, fromPiece, isCheck)
      // 更新游戏状态
      this.setState({
        gameMap,
        isRedMove: !isRedMove,
        fromChessBox,
        toChessBox,
      })
    }

    this.handleSwapChessBoard = () => {
      const { swapChessBoard } = this.state
      this.setState({
        swapChessBoard: !swapChessBoard,
        swapChessBoardRun: true,
      })
      setTimeout(() => {
        const { fromChessBox, toChessBox, gameMap } = this.state
        const newGameMap = gameMap.map((piece) => {
          const { from } = calculateNewPositions(piece, {})
          return { ...piece, x: from.x, y: from.y }
        })
        setMap(newGameMap)
        const { from, to } = calculateNewPositions(fromChessBox, toChessBox)
        const newFromChessBox = { ...fromChessBox, x: from.x, y: from.y }
        const newToChessBox = { ...toChessBox, x: to.x, y: to.y }
        setChessBox(newFromChessBox, newToChessBox)
        clearCanvas()
        this.handleUserAvatar()
        // 更新棋盘交换后的状态
        this.setState({
          gameMap: newGameMap,
          fromChessBox: newFromChessBox,
          toChessBox: newToChessBox,
          swapChessBoardRun: false,
        })
      })
    }

    this.resetSkinMap = () => {
      const { gameMap, fromChessBox, toChessBox } = this.state
      initMap(gameMap)
      setChessBox(fromChessBox, toChessBox)
    }

    this.state = {
      loading: false,
      text: '',
      gameMap: [],
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
      isRedMove: !0,
      gameOver: !0,
      gameOverMsg: null,
      swapChessBoard: false,
      swapChessBoardRun: false,
      battleId: null,
      user: null,
      enemy: null,
    }
    this.childPlayOneRef = null
    this.childPlayTwoRef = null
    this.moduleId = 'watchBoard'
  }

  componentDidMount() {
    setTimeout(async () => {
      while (true) {
        await sleep(2)
        if (this.boardRef !== null)
          break
      }

      const map = await fetchSkin()
      initBinds(this.boardRef, map)

      this.startEventListen()
      // 加入观察处理
      this.joinWatchHandle()
      // 处理用户头像
      this.handleUserAvatar()
    })

    window.addEventListener('online', this.onlineEventHandle)
    window.addEventListener('offline', this.offlineEventHandle)
  }

  handleUserAvatar() {
    this.loadUserAvatarInterId = setInterval(() => {
      const { user, enemy, swapChessBoard } = this.state
      if (user && user.userId && enemy && enemy.userId) {
        const firstUser = swapChessBoard ? user : enemy
        const secondUser = swapChessBoard ? enemy : user
        clearInterval(this.loadUserAvatarInterId)
        const userData = [
          {
            userId: firstUser.userId,
            el: this.childPlayOneRef,
          },
          {
            userId: secondUser.userId,
            el: this.childPlayTwoRef,
          },
        ]
        initializeCanvas(userData)
      }
    }, 10)
  }

  componentWillUnmount() {
    clearInterval(this.intervalId)
    destroyAllCtx()
    clearCanvas()
    this.boardRef.remove()
    SocketEvent.off(this.moduleId)
    window.removeEventListener('online', this.onlineEventHandle)
    window.removeEventListener('offline', this.offlineEventHandle)
  }

  render() {
    const { user, enemy, swapChessBoard } = this.state
    return (
      <div className={styles.bg}>
        <div className={styles.board} ref={ref => this.boardRef = ref} />
        {/* 对局人物组件 */}
        <User
          playOne={(swapChessBoard ? user : enemy) || {}}
          playTwo={(swapChessBoard ? enemy : user) || {}}
          userId={this.props.userId}
          userDetail={this.props.userDetail}
          isRedMove={this.state.isRedMove}
          gameOver={this.state.gameOver}
          gameOverMsg={this.state.gameOverMsg}
          roomId={this.props.roomId}
          battleId={this.state.battleId}
          handleSwapChessBoard={this.handleSwapChessBoard}
          resetSkinMap={this.resetSkinMap}
          callAndSetPlayDom={(playOneRef, playTwoRef) => {
            this.childPlayOneRef = playOneRef
            this.childPlayTwoRef = playTwoRef
          }}
          goBack={() => this.props.goBack()}
        />
        <AdvancedSpin text={this.state.text} show={this.state.loading} />
      </div>
    )
  }
}

export default WatchBoard
