import { Image, NavBar, PullToRefresh, Toast } from 'antd-mobile'
import { ListView } from 'antd-mobile-v2'
import React from 'react'
import noDataImg from '@/assets/no-data.png'
import WatchBoard from '@/pages/watch/board'
import styles from '@/pages/watch/index.module.less'
import SocketEvent from '@/service/event'
import { btnSound, playSound } from '@/utils/sounds-res'
// import { findDOMNode } from 'react-dom'

/**
 * 观战平台
 */
class WatchPlatform extends React.Component {
  navBarRef = React.createRef(null)
  constructor(props) {
    super(props)

    this.watchList = 'watchList'
    this.watchBoard = 'watchBoard'
    const dataSource = new ListView.DataSource({
      rowHasChanged: (e, t) => e !== t,
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
      page: this.watchList,
      emptyDataSwitch: false,
      listViewHeight: 1,
      listLineHeight: 0,
      scrollTop: 0,
      isScroll: !0,
    }
    this.moduleId = 'watchPlatform'
  }

  componentDidMount() {
    this.loadNavBarInterId = setInterval(() => {
      if (this.navBarRef) {
        clearInterval(this.loadNavBarInterId)
        const clientHeight = document.documentElement.clientHeight
        const rowHeight = this.navBarRef.current.clientHeight
        this.setState({
          listViewHeight: clientHeight - rowHeight,
        })
      }
    }, 10)
    this.handleScrollStop()
    this.props.roomId ? this.selectedRoom(this.props.roomId) : this.queryWatchUserList()
  }

  handleScrollStop = () => {
    // 存储定时器的引用，方便后续清除
    // 用于记录上一次的滚动位置
    let previousScrollTop = 0

    setInterval(() => {
      const currentScrollTop = this.state.scrollTop
      // 检查是否处于滚动状态且滚动位置未发生变化
      if (this.state.isScroll && previousScrollTop === currentScrollTop) {
        this.setState({
          isScroll: false,
        })
      }
      // 更新上一次的滚动位置
      previousScrollTop = currentScrollTop
    }, 3000)
  }

  /**
   * 查询观战数据
   */
  queryWatchUserList = () => {
    const { pageNum, pageSize, data, dataSource } = this.state
    console.log(`开始获取观战列表, pageNum: ${pageNum} pageSize: ${pageSize}`)
    this.setState({
      listviewLoading: true,
    })
    SocketEvent.emit('watchListApi', {
      userId: this.props.userId,
      pageNum,
      pageSize,
    }, (response) => {
      console.log('获取观战列表数据返回:', response)
      if (response.code === 'success') {
        const { list, dataTotal } = response.data
        const newData = [...data, ...list]
        this.setState({
          data: newData,
          dataTotal,
          dataSource: dataSource.cloneWithRows(Object.assign({}, newData)),
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

  /**
   * 离开对战平台
   */
  handleLeavePlatform = () => {
    playSound(btnSound)
    this.props.goBack()
  }

  /**
   * 观战模式已选择好房间
   * @param roomId
   */
  selectedRoom = (roomId) => {
    playSound(btnSound)
    this.setState({
      roomId,
      page: this.watchBoard,
    })
  }

  /**
   * 子页面退出
   */
  goBack = () => {
    const pageNum = this.state.pageNum
    this.setState({
      page: this.watchList,
      data: [],
      pageNum: Math.max(pageNum - 1, 1),
    })
    this.queryWatchUserList()
  }

  componentWillUnmount() {
    SocketEvent.off(this.moduleId)
  }

  /**
   * 查观战列表的视图
   */
  watchListView = () => {
    const {
      data,
      listviewLoading,
      dataSource,
      listViewHeight,
      scrollTop,
      isScroll,
      pageSize,
      dataTotal,
    } = this.state

    const renderRow = (item) => {
      const rowHeight = listViewHeight / pageSize - 4
      const margin = 4
      return (
        <div
          className={styles.rowBody}
          style={{ height: `${rowHeight}px`, margin: `${margin}px 0` }}
          onClick={() => this.selectedRoom(item.roomId)}
        >
          <div className={styles.serial}>
            {item?.roomId}
          </div>
          <div className={styles.left}>
            <div className={styles.line}>
              <div className={styles.firstTips}>
                <sup style={{ backgroundColor: item?.userFirst ? '#ff5b05' : '#1e1e1a' }}>
                  {item?.userFirst ? '先手' : '后手'}
                </sup>
              </div>
              <div className={styles.icon}>
                <Image
                  src={item?.userIcon}
                  style={{ borderRadius: 22, border: '1px solid #eee' }}
                  fit="cover"
                  width={44}
                  height={44}
                  lazy
                />
              </div>
              <div className={styles.content}>
                <div className={styles.title}>
                  {item?.userName}
                </div>
                <div className={styles.desc}>
                  {`积分: ${item?.userScore}`}
                </div>
              </div>
            </div>
          </div>
          <div className={styles.right}>
            <div className={styles.line}>
              <div className={styles.firstTips}>
                <sup style={{ backgroundColor: item?.enemyFirst ? '#ff5b05' : '#1e1e1a' }}>
                  {item?.enemyFirst ? '先手' : '后手'}
                </sup>
              </div>
              <div className={styles.content}>
                <div className={styles.title}>
                  {item?.enemyName}
                </div>
                <div className={styles.desc}>
                  {`积分: ${item?.enemyScore}`}
                </div>
              </div>
              <div className={styles.icon}>
                <Image
                  src={item?.enemyIcon}
                  style={{ borderRadius: 22, border: '1px solid #eee' }}
                  fit="cover"
                  width={44}
                  height={44}
                  lazy
                />
              </div>
            </div>
          </div>
        </div>
      )
    }

    const pullText = {
      pulling: '用力拉~',
      canRelease: '松开刷新',
      refreshing: '玩命加载中...',
      complete: '加载完成',
    }

    return (
      <div className={styles.watch}>
        <div
          className={styles.navbar}
          ref={this.navBarRef}
        >
          <NavBar onBack={this.handleLeavePlatform}>
            对战列表
          </NavBar>
        </div>
        <PullToRefresh
          onRefresh={() => {
            this.setState({
              pageNum: 1,
              data: [],
            })
            setTimeout(() => this.queryWatchUserList())
          }}
          renderText={e => <div>{pullText[e]}</div>}
        >
          <ListView
            dataSource={dataSource}
            renderRow={renderRow}
            renderFooter={() =>
              data.length > 0 || listviewLoading
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
            pageSize={pageSize}
            initialListSize={pageSize}
            onScroll={(e) => {
              this.setState({
                scrollTop: e.target.scrollTop,
                isScroll: true,
              })
            }}
            scrollRenderAheadDistance={500}
            onEndReached={() => this.queryWatchUserList()}
            onEndReachedThreshold={500}
            style={{ height: listViewHeight, overflow: 'auto' }}
          />
        </PullToRefresh>
        <div
          className={styles.page}
          style={{ display: isScroll ? 'flex' : 'none' }}
        >
          <span>{Math.ceil(scrollTop / listViewHeight + 1)}</span>
          <div>&nbsp;</div>
          <span>{1 + Math.floor((dataTotal - 1) / pageSize)}</span>
        </div>
      </div>
    )
  }

  render() {
    const { page } = this.state
    return (
      <>
        {(!page || page === this.watchList) && this.watchListView()}
        {
          (page === this.watchBoard)
          && (
            <WatchBoard
              watchUserId={this.props.watchUserId}
              userId={this.props.userId}
              roomId={this.state.roomId}
              goBack={() => this.goBack()}
            />
          )
        }
      </>
    )
  }
}

export default WatchPlatform
