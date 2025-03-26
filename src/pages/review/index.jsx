import noDataImg from '@/assets/no-data.png'
import ReviewBoard from '@/pages/review/board/index'
import styles from '@/pages/review/index.module.less'
import SocketEvent from '@/service/event.js'
import { btnSound, playSound } from '@/utils/sounds-res.js'
import { NavBar, Toast } from 'antd-mobile'
import { ListView } from 'antd-mobile-v2'
import React from 'react'

// 假设这些是从其他文件导入的模块，需要根据实际情况修改路径

class ReviewPlatform extends React.Component {
  navBarRef = React.createRef(null)
  constructor(props) {
    super(props)

    this.handleScrollStop = () => {
      let prevScrollTop = 0
      setInterval(() => {
        const currentScrollTop = this.state.scrollTop
        if (this.state.isScroll && prevScrollTop === currentScrollTop) {
          this.setState({
            isScroll: false,
          })
        }
        prevScrollTop = currentScrollTop
      }, 3000)
    }

    this.queryDataList = () => {
      const userId = this.props.userId
      const { pageNum, pageSize, dataSource, data } = this.state
      this.setState({
        listviewLoading: true,
      })
      console.log(`开始获取复盘数据列表, userId: ${userId} pageNum: ${pageNum} pageSize: ${pageSize}`)
      SocketEvent.emit('battleReviewApi', {
        userId,
        pageNum,
        pageSize,
      }, (response) => {
        console.log('复盘数据列表resp: ', response)
        this.setState({
          loading: false,
        })
        if (response.code === 'success') {
          const { list, dataTotal } = response.data
          const updatedData = [...data, ...list]
          this.setState({
            data: updatedData,
            dataTotal,
            dataSource: dataSource.cloneWithRows(Object.assign({}, updatedData)),
            listviewLoading: false,
            pageNum: pageNum + 1,
          })
        }
        else {
          Toast.show(response.msg)
          this.setState({
            listviewLoading: false,
          })
        }
      })
    }

    this.handleLeaveReviewList = () => {
      playSound(btnSound)
      const userId = this.props.userId
      SocketEvent.emit('leaveReviewListApi', {
        userId,
      }, (response) => {
        console.log('离开复盘列表, resp: ', response)
        if (response.code === 'success') {
          this.props.goBack()
        }
        else {
          Toast.show(response.msg)
        }
      })
    }

    this.selectedBattle = (event, battle) => {
      playSound(btnSound)
      const userId = this.props.userId
      const pageSize = this.state.pageSize
      const battleId = battle.battleId
      console.log(`用户[${userId}]开始请求对战区[${battleId}]复盘数据`)
      SocketEvent.emit('battleReviewDetailApi', {
        userId,
        battleId,
        pageSize,
      }, (response) => {
        console.log('查询复盘详情的resp：', response)
        this.setState({
          loading: false,
        })
        if (response.code === 'success') {
          this.setState({
            pageView: this.reviewBoard,
            reviewData: {
              battleData: battle,
              stepData: response.data,
            },
          })
        }
        else {
          Toast.show(response.msg)
        }
      })
    }

    this.reviewListView = () => {
      const {
        data,
        listviewLoading,
        dataSource,
        pageView,
        listViewHeight,
        scrollTop,
        isScroll,
        pageSize,
        dataTotal,
      } = this.state

      const renderRow = (battle, event, index) => {
        const margin = 4
        return (
          <div
            className={styles.rowBody}
            style={{
              height: `${listViewHeight / pageSize - margin}px`,
              margin: `${margin}px 0`,
            }}
            onClick={e => this.selectedBattle(e, battle)}
          >
            <div className={styles.serial}>
              {Number(index) + 1}
              .
            </div>
            <div className={styles.left}>
              <div className={styles.oneLine}>
                <span>{battle?.firstUserName}</span>
                <span>:</span>
                <span>{battle?.lastUserName}</span>
              </div>
              <div className={styles.twoLine}>
                <span>{battle?.createTime}</span>
                <span>{battle?.winCodeName}</span>
              </div>
            </div>
            <div className={styles.right}>
              <div
                className={styles.score}
                style={{
                  color: battle?.resultMsg === '失败' ? 'rgb(255, 180, 0)' : 'rgb(255, 255, 0)',
                }}
              >
                <span>
                  {String(battle?.changeScore).startsWith('-') ? '' : '+'}
                  <label>{battle?.changeScore}</label>
                </span>
              </div>
              <div
                className={styles.result}
                style={{
                  color: battle?.resultMsg === '失败' ? 'rgb(255, 180, 0)' : 'rgb(255, 255, 0)',
                }}
              >
                {battle?.resultMsg}
              </div>
            </div>
          </div>
        )
      }

      return (
        <div
          className={styles.review}
          style={{
            display: pageView === this.reviewList ? 'inline-block' : 'none',
          }}
        >
          <div
            className={styles.navbar}
            ref={this.navBarRef}
          >
            <NavBar onBack={this.handleLeaveReviewList}>对局列表</NavBar>
          </div>
          <ListView
            dataSource={dataSource}
            renderRow={renderRow}
            renderFooter={() => data.length > 0 || listviewLoading
              ? (
                  <div className={styles.listviewLoad}>
                    {listviewLoading ? '正在请求数据...' : '~ 我也是有底线的 ~'}
                  </div>
                )
              : (
                  <div className={styles.emptyData}>
                    <img src={noDataImg} alt="" />
                    <span>暂无数据</span>
                  </div>
                )}
            pageSize={this.state.pageSize}
            initialListSize={this.state.pageSize}
            onScroll={(e) => {
              this.setState({
                scrollTop: e.target.scrollTop,
                isScroll: true,
              })
            }}
            scrollRenderAheadDistance={500}
            onEndReached={this.queryDataList}
            onEndReachedThreshold={500}
            style={{
              height: listViewHeight,
              overflow: 'auto',
            }}
          />
          <div
            className={styles.page}
            style={{
              display: isScroll ? 'flex' : 'none',
            }}
          >
            <span>{Math.ceil(scrollTop / listViewHeight + 1)}</span>
            <div>&nbsp;</div>
            <span>{1 + Math.floor((dataTotal - 1) / pageSize)}</span>
          </div>
        </div>
      )
    }

    this.reviewList = 'reviewList'
    this.reviewBoard = 'reviewBoard'
    const dataSource = new ListView.DataSource({
      rowHasChanged: (a, b) => a !== b,
    })
    this.state = {
      loading: false,
      text: null,
      data: [],
      listviewLoading: false,
      dataSource,
      pageNum: 1,
      pageSize: 10,
      dataTotal: 1,
      pageView: this.reviewList,
      reviewData: {
        battleData: {},
        stepData: [],
      },
      listViewHeight: 1,
      listLineHeight: 0,
      scrollTop: 0,
      isScroll: true,
    }
  }

  componentDidMount() {
    this.queryDataList()
    setTimeout(() => {
      const clientHeight = document.documentElement.clientHeight
      const navBarHeight = this.navBarRef.current.clientHeight
      this.setState({
        listViewHeight: clientHeight - navBarHeight,
      })
    }, 10)
    this.handleScrollStop()
  }

  componentWillUnmount() {
    this.setState = () => false
  }

  render() {
    const { pageView } = this.state
    return (
      <>
        {this.reviewListView()}
        {pageView === this.reviewBoard && (
          <ReviewBoard
            reviewData={this.state.reviewData}
            userId={this.props.userId}
            goBack={() => this.setState({
              pageView: this.reviewList,
            })}
          />
        )}
      </>
    )
  }
}

export default ReviewPlatform
