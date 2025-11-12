import { Dialog, Grid, Toast } from 'antd-mobile'
import { merge } from 'lodash'
import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import req from 'umi-request'
import AdvancedBtn from '@/button/index.jsx'
import { show } from '@/circle/index.js'
import config from '@/config.js'
import styles from '@/pages/share/index.module.less'
import User from '@/pages/share/user/index.jsx'
import AdvancedSpin from '@/spinner/index.jsx'
import { killBossCheck } from '@/utils/board-canvas-utils.js'
import { gameMap } from '@/utils/board-utils.js'
import {
  backMove,
  initBinds,
  initMap,
  move,
  setChessBox,
  setChessTips,
} from '@/utils/chess.js'
import { AesEncryption } from '@/utils/cipher.js'
import { fetchSkin } from '@/utils/map-res.js'
import {
  btnSound,
  eatChessSound,
  killBossSound,
  moveSound,
  peopleEatSound,
  playSound,
} from '@/utils/sounds-res.js'

const aes = new AesEncryption()
function withRouter(Component) {
  return (props) => {
    const location = useLocation() // 获取当前 URL 相关信息
    const navigate = useNavigate() // 用于跳转页面
    return <Component {...props} location={location} navigate={navigate} />
  }
}
class ShareBoard extends React.Component {
  constructor(props) {
    super(props)

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
      userId: null,
      battleId: null,
      viewCount: null,
    }
  }

  componentDidMount() {
    console.log(this.props)
    const queryParams = new URLSearchParams(this.props.location.search)
    console.log('参数 code:', queryParams.get('code'))
    const code = queryParams.get('code')

    if (code) {
      this.setState({
        loading: true,
        text: '请稍候',
      })
      req.post(`${config.serviceUri}share/${code}`, {}).then((response) => {
        const data = aes.decryptByAES(response)
        console.log('查询分享的棋盘详情的resp：', data)
        this.setState({ loading: false })
        if (data.code === 'success') {
          const { battleData, stepData, userId, viewCount, battleId } = data.data
          const { list, total } = stepData
          this.setState({
            battleData,
            stepData: list,
            total: total || 0,
            userId,
            battleId,
            viewCount,
          }, async () => {
            const map = await fetchSkin()
            initBinds(this.boardRef, map)
            this.handleBattleStepData(false, true)
          })
        }
        else {
          Dialog.alert({
            title: '系统提示',
            content: data.msg,
            confirmText: '首页',
            onConfirm: () => {
              playSound(btnSound)
              this.props.navigate('/')
            },
          })
        }
      }).catch(() => {
        this.setState({ loading: false })
        Dialog.alert({
          title: '系统提示',
          content: '数据请求失败',
          confirmText: '首页',
          onConfirm: () => {
            playSound(btnSound)
            this.props.navigate('/')
          },
        })
      })
      this.autoMakeInterId = setInterval(() => {
        const { step, total, autoMake } = this.state
        if (autoMake) {
          this.setState({ step: Math.min(step + 1, total) }, () => {
            this.handleBattleStepData(true)
          })
        }
      }, 2000)
    }
    else {
      Dialog.alert({
        title: '系统提示',
        content: '参数错误',
        confirmText: '首页',
        onConfirm: () => {
          playSound(btnSound)
          this.props.navigate('/')
        },
      })
    }
  }

  componentWillUnmount() {
    clearInterval(this.autoMakeInterId)
    if (this.boardRef) {
      this.boardRef.remove()
    }
  }

  render() {
    const { step, total, autoMake, currStepExplain, viewCount, battleData, thinkTime, loading, text } = this.state
    return (
      <div className={styles.bg}>
        <div className={styles.board} ref={ref => this.boardRef = ref} />
        <User
          thinkTime={thinkTime}
          stepExplain={currStepExplain}
          battleData={battleData}
          step={step}
          total={total}
          viewCount={viewCount}
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
                text="首页"
                onClick={() => {
                  playSound(btnSound)
                  Dialog.confirm({
                    title: '系统提示',
                    content: '确定返回首页吗?',
                    confirmText: '确认',
                    cancelText: '取消',
                    onConfirm: () => {
                      playSound(btnSound)
                      this.props.navigate('/')
                    },
                    onCancel: () => {
                      playSound(btnSound)
                    },
                  })
                }}
              />
            </Grid.Item>
          </Grid>
        </div>
        <AdvancedSpin
          text={text}
          show={loading}
        />
      </div>
    )
  }
}

export default withRouter(ShareBoard)
