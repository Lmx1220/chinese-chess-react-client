import { Dialog, Grid, Toast } from 'antd-mobile'
import { Modal } from 'antd-mobile-v2'
import ClipboardJS from 'clipboard'
import { merge } from 'lodash'
import React from 'react'
import backImg from '@/assets/back.png'
import AdvancedBtn from '@/button/index.jsx'
import { show } from '@/circle/index.js'
import styles from '@/pages/review/board/index.module.less'
import User from '@/pages/review/board/user/index.jsx'
/**
 * 复盘棋盘
 */
// 假设这些是从其他文件导入的模块，需要根据实际情况修改路径
import SocketEvent from '@/service/event.js'
import AdvancedSpin from '@/spinner/index.jsx'
import { killBossCheck } from '@/utils/board-canvas-utils.js'
import { gameMap } from '@/utils/board-utils.js'
import {
  backMove,
  destroyAllCtx,
  initBinds,
  initMap,
  move,
  setChessBox,
  setChessTips,
} from '@/utils/chess.js'
import { fetchSkin } from '@/utils/map-res.js'
import {
  btnSound,
  eatChessSound,
  killBossSound,
  peopleEatSound,
  playSound,
  startSound,
} from '@/utils/sounds-res.js'
import { moveSound } from '../../../utils/sounds-res.js'

class ReviewBoard extends React.Component {
  constructor(props) {
    super(props)
    this.loadReviewDetailData = () => {
      const userId = this.props.userId
      const { battleData, total } = this.state
      SocketEvent.emit('battleReviewDetailApi', {
        userId,
        battleId: battleData.battleId,
        pageSize: total,
      }, (response) => {
        console.log('(全量)查询复盘详情的resp：', response)
        this.setState({
          loading: false,
        })
        if (response.code === 'success') {
          const stepData = response.data.list
          this.setState({
            stepData,
          })
        }
        else {
          Toast.show(response.msg)
        }
      })
    }

    this.shareBattleToClipboard = () => {
      playSound(btnSound)
      const userId = this.props.userId
      const battleData = this.state.battleData
      const battleId = battleData.battleId
      SocketEvent.emit('getShareLinkApi', {
        userId,
        battleId,
      }, (response) => {
        console.log('获取分享链接返回：', response)
        if (response.code === 'success') {
          const copyContent = (
            <div style={{ lineHeight: '22px', color: 'red', fontSize: '15px', marginTop: '10px' }}>
              *点击内容进行复制*
            </div>
          )
          const shareBox = (
            <div style={{ border: 'dashed 1px #bebebe', borderRadius: '5px' }}>
              {response.data}
            </div>
          )
          const copyBox = (
            <div
              style={{
                fontSize: '16px',
                fontWeight: 400,
              }}
              data-clipboard-text={response.data}
              className="copy"
              onClick={() => playSound(btnSound)}
            >
              {shareBox}
              {copyContent}
            </div>
          )
          const alertInstance = Modal.alert('分享内容', copyBox, [])

          const clipboard = new ClipboardJS('.copy')

          clipboard.on('success', () => {
            Toast.show('已复制，去分享吧~')
            alertInstance.close()
          })

          clipboard.on('error', () => {
            Toast.show('链接复制失败')
            alertInstance.close()
          })
        }
        else {
          Toast.show(response.msg)
        }
      })
    }

    this.handleBattleStepData = function (e, n = false) {
      const { step, total, stepData, battleData } = this.state
      // 判断是否到达终局
      if (step + 1 <= total) {
        if (step + 1 === total) {
          const { winCode, winUserId } = battleData
          const isUserWinner = winUserId === this.props.userId
          let resultMessage = ''

          switch (winCode) {
            case '0006':
              resultMessage = '双方无可进攻棋子，判和'
              break
            case '0005':
              resultMessage = '双方协议和棋'
              break
            case '0002':
              resultMessage = `${isUserWinner ? '对方' : '我方'} 认输`
              break
            case '0003':
              resultMessage = `${isUserWinner ? '对方' : '我方'} 逃跑判负`
              break
            case '0004':
              resultMessage = `${isUserWinner ? '对方' : '我方'} 超时判负`
              break
            default:
              resultMessage = `${isUserWinner ? '我方胜利' : '我方失败'}`
          }

          Toast.show(resultMessage)
          this.setState({ autoMake: false })
        }

        const currentStepData = stepData[step]

        if (!currentStepData) {
          // 数据未加载，进入加载状态
          this.setState({
            loading: true,
            text: '正在加载数据，请稍等',
            step: e ? step - 1 : step + 1,
          })

          return this.loadReviewDetailData()
        }

        // 解析棋局数据
        const lastFrom = JSON.parse(currentStepData.lastFrom)
        const lastTo = JSON.parse(currentStepData.lastTo)
        const newGameMap = gameMap(currentStepData.gameFen)
        const fromChessBox = JSON.parse(currentStepData.fromChessBox)
        const toChessBox = JSON.parse(currentStepData.toChessBox)

        // 处理棋步逻辑
        if (!e || n) {
          this.setState({
            gameMap: newGameMap,
            fromChessBox,
            toChessBox,
            currStepExplain: currentStepData.stepExplain,
            thinkTime: currentStepData.thinkTime,
          })

          if (n) {
            initMap(newGameMap)
            setChessBox()
          }
          else {
            const nextStepData = stepData[step + 1]
            const nextLastFrom = JSON.parse(nextStepData.lastFrom)
            const nextLastTo = JSON.parse(nextStepData.lastTo)
            const targetPiece = newGameMap.find(piece => piece.x === nextLastTo.x && piece.y === nextLastTo.y)

            backMove(nextLastFrom, targetPiece || nextLastTo, fromChessBox, toChessBox, gameMap)
          }
        }
        else {
          try {
            this.handleChessMove(lastFrom, lastTo, currentStepData)
          }
          catch (e) {
            console.log(e)
          }
        }

        // 清理 UI 提示
        setChessTips([])
        this.setState({ showAllMakeChessId: null })
      }
    }
    this.handleChessMove = (startPosition, targetPosition, moveInfo) => {
      const gameMap = this.state.gameMap
      try {
        const startChessPiece = gameMap.find(piece => piece.x === startPosition.x && piece.y === startPosition.y)
        const targetChessPiece = gameMap.find(piece => piece.x === targetPosition.x && piece.y === targetPosition.y) || targetPosition
        const currentChessPiece = gameMap.find(piece => piece.x === startChessPiece.x && piece.y === startChessPiece.y)
        const targetIndex = gameMap.findIndex(piece => piece.x === targetChessPiece.x && piece.y === targetChessPiece.y)

        if (targetIndex !== -1) {
          playSound(eatChessSound)
          const movedChessPiece = gameMap.find(piece => piece.x === currentChessPiece.x && piece.y === currentChessPiece.y)
          movedChessPiece.x = targetChessPiece.x
          movedChessPiece.y = targetChessPiece.y
          gameMap.splice(targetIndex, 1)
          const isCheck = killBossCheck(gameMap, startChessPiece.isBlackColor)
          if (isCheck) {
            playSound(killBossSound)
            show('将军')
          }
          else {
            playSound(peopleEatSound)
            show('吃')
          }
        }
        else {
          playSound(moveSound)
          const movedChessPiece = gameMap.find(piece => piece.x === currentChessPiece.x && piece.y === currentChessPiece.y)
          movedChessPiece.x = targetChessPiece.x
          movedChessPiece.y = targetChessPiece.y
          const isCheck = killBossCheck(gameMap, startChessPiece.isBlackColor)
          if (isCheck) {
            playSound(killBossSound)
            show('将军')
          }
        }

        const parsedFromChessBox = JSON.parse(moveInfo.fromChessBox)
        const parsedToChessBox = JSON.parse(moveInfo.toChessBox)

        this.setState({
          gameMap,
          fromChessBox: parsedFromChessBox,
          toChessBox: parsedToChessBox,
          currStepExplain: moveInfo.stepExplain,
          thinkTime: moveInfo.thinkTime,
        })

        move(merge({
          id: startChessPiece.id,
        }, startPosition), targetChessPiece, parsedFromChessBox, parsedToChessBox, gameMap)
      }
      catch (e) {
        console.error(e)
      }
    }
    // this.boardClick = (event) => {
    //   playSound(btnSound);
    //   const {gameMap, showAllMakeChessId} = this.state;
    //   const position = calculateCursorPosition(event, this.boardRef);
    //   const piece = gameMap.find((item) => item.x === position.x && item.y === position.y);
    //   if (piece && piece.id !== showAllMakeChessId) {
    //     setChessTips(getValidMoves(gameMap, piece));
    //     setChessBox({
    //       show: true,
    //       x: piece.x,
    //       y: piece.y,
    //       color: piece.isBlackColor ? 'boxColorBlack' : 'boxColorRed'
    //     });
    //     capChess(piece.id);
    //     this.setState({
    //       showAllMakeChessId: piece.id
    //     });
    //   } else {
    //     setChessTips([]);
    //     setChessBox();
    //     unCapChess(showAllMakeChessId);
    //     this.setState({
    //       showAllMakeChessId: null
    //     });
    //   }
    // };

    this.goBack = () => {
      playSound(btnSound)
      Dialog.confirm({
        title: '系统提示',
        content: '确认退出吗?',
        confirmText: '确认',
        cancelText: '取消',
        onConfirm: () => {
          playSound(btnSound)
          this.props.goBack()
        },
        onCancel: () => {
          playSound(btnSound)
        },
      })
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
      stepData: [],
      battleData: null,
      currStepExplain: null,
      thinkTime: null,
      step: 0,
      total: 0,
      autoMake: false,
      showAllMakeChessId: null,
    }
  }

  componentDidMount() {
    const { reviewData } = this.props
    const { stepData: { total, list }, battleData } = reviewData

    this.setState({
      stepData: list,
      total: total || 0,
      battleData,
    })

    setTimeout(async () => {
      const map = await fetchSkin()
      initBinds(this.boardRef, map)
      this.handleBattleStepData(false, true)

      this.autoMakeInterId = setInterval(() => {
        const { step, total, autoMake } = this.state
        if (autoMake) {
          this.setState({
            step: Math.min(step + 1, total),
          })
          this.handleBattleStepData(true)
        }
      }, 2000)

      playSound(startSound)
      this.loadReviewDetailData()
    }, 0)
  }

  componentWillUnmount() {
    clearInterval(this.autoMakeInterId)
    destroyAllCtx()
    this.boardRef.remove()
  }

  render() {
    const { step, total, autoMake, currStepExplain, battleData, thinkTime, loading, text } = this.state
    return (
      <div className={styles.bg}>
        <div className={styles.board} ref={ref => this.boardRef = ref} />
        <User
          thinkTime={thinkTime}
          stepExplain={currStepExplain}
          battleData={battleData}
          step={step}
          total={total}
        />
        <div className={styles.floor}>
          <Grid columns={24} gap={1}>
            <Grid.Item span={5}>
              <AdvancedBtn
                type="normal"
                text="后退"
                disabled={step === 0}
                onClick={() => {
                  this.setState({
                    step: Math.max(step - 1, 0),
                  }, () => {
                    this.handleBattleStepData(false)
                  })
                }}
              />
            </Grid.Item>
            <Grid.Item span={1} />
            <Grid.Item span={5}>
              <AdvancedBtn
                type="normal"
                text="前进"
                disabled={step + 1 === total}
                onClick={() => {
                  this.setState({
                    step: Math.min(step + 1, total - 1),
                  }, () => {
                    this.handleBattleStepData(true)
                  })
                }}
              />
            </Grid.Item>
            <Grid.Item span={1} />
            <Grid.Item span={5}>
              <AdvancedBtn
                type="normal"
                text={autoMake ? '关闭' : '自动'}
                disabled={step + 1 === total}
                onClick={() => {
                  this.setState({
                    autoMake: !autoMake,
                  })
                }}
              />
            </Grid.Item>
            <Grid.Item span={1} />
            <Grid.Item span={6}>
              <AdvancedBtn
                type="danger"
                text="分享"
                onClick={this.shareBattleToClipboard}
              />
            </Grid.Item>
          </Grid>
        </div>
        <div className={styles.page} onClick={this.goBack}>
          <img src={backImg} width="100%" height="100%" alt="" />
        </div>
        <AdvancedSpin
          text={text}
          show={loading}
        />
      </div>
    )
  }
}

export default ReviewBoard
