const config = ({
  /** -- 系统层面 相关配置 -- */
  // 版本
  version: '2.0.5.b2',
  // 是否播放音效
  music: true,
  // 调试模式
  debug: false,
  // 皮肤的总数量
  skinTotal: 4,

  /** -- 匹配界面 相关配置 -- */
  // 对手已准备而我方未准备倒计时（单位：秒）
  noReadyTimeout: 10,
  // 我方未准备倒计时（单位：秒）
  normalReadyTimeout: 30,

  /** -- 对局 相关配置 -- */
  // 选择棋子后智能提示可走的点
  chessValidMoveSwitch: true,
  // 步时即将超时提醒时间（单位：秒）
  stepTimeoutTips: 10,
  // 局时即将超时提醒时间（单位：秒）
  allTimeoutTips: 30,
  // 多个棋子持续长将限定次数
  MULTIPLE_LONG_FIGHTING_COUNT: 10,
  // 单个棋子持续长将限定次数
  ONE_LONG_FIGHTING_COUNT: 6,

  /** -- socket 相关配置 -- */
  // 服务器地址（http和socket共享一个地址，只能是http或https，禁用ws和wss）
  // serviceUri: 'https://chess.kpui.top/',
  serviceUri: '/',
  // 服务器指定的命名空间
  path: '/chinese-chess',
  // 是否开启自动重连
  reconnection: true,
  // 自动重连次数
  reconnectionAttempts: 5,
  // 尝试自动重连前等待时间（单位：毫秒）
  reconnectionDelay: 1000,
  // 单次重连最大的等待时间（单位：毫秒）
  reconnectionDelayMax: 5000,
  // socket 连接方式 'polling'
  transports: [/* 'polling', */'websocket'],
  // socket连接到服务器的最大超时时间（单位：毫秒）
  requestTimeout: 20 * 1000,

  /** -- QQ登录 相关配置 -- */
  APP_ID: 102006686,
  LOGIN_CALL_PATH: 'https://chess.kpui.top:88/',
  GET_USER_INFO: 'https://graph.qq.com/user/get_user_info',
  QQ_OAUTH_URI: 'https://graph.qq.com/oauth2.0/authorize',
})

export default config
