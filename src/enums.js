/**
 * 游戏结束的类型
 */
export const GAME_OVER_TYPE = {
  // 0001-绝杀，0002-认输，0003-逃跑,
  // 0004-超时, 0005-双方议和
  BATTLE: '0001',
  ADMIT_DEFEAT: '0002',
  USER_LEAVE: '0003',
  USER_TIMEOUT: '0004',
  USER_PEACE: '0005',
}
/**
 * 用户状态
 */
export const USER_STATUS = {
  // 平台
  PLATFORM: '0001',
  // 房间
  IN_ROOM: '0002',
  // 观战
  WATCH: '0003',
  // 对战
  BATTLE: '0004',
}
/**
 * 用户类型
 */
export const USER_TYPE = {
  // 注册用户
  REGISTER_USER: '0001',
  // 游客
  TOURIST_USER: '0002',
}

/**
 * 房间状态
 */
export const ROOM_STATUS = {
  // 空房间
  EMPTY: 'EMPTY',
  // 有人在房间中等待(仅1个人)
  WAIT: 'WAIT',
  // 多个人在房间中等待
  MULTIPLE_WAIT: 'MULTIPLE_WAIT',
  // 匹配成功
  MATCH_SUCCESS: 'MATCH_SUCCESS',
  // 对战中
  BATTLE: 'BATTLE',
  // 对战有一方超时了
  TIMEOUT: 'TIMEOUT',
  // 对战结束，等待结算
  BATTLE_OVER: 'BATTLE_OVER',
}

/**
 * 加入房间的类型
 */
export const ROOM_JOIN_TYPE = {
// 匹配对战
  RANDOM: 'random',
  // 开房约战
  FREEDOM: 'freedom',
}
