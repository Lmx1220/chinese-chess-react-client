import config from '@/config.js'
import { getItem, setItem } from '@/utils/storage-utils.js'

export const nameMap = new Map(
  [
    ['BRC', '车'],
    ['BRM', '马'],
    ['BRX', '象'],
    ['BRS', '士'],
    ['BBJ', '将'],
    ['BLS', '士'],
    ['BLX', '象'],
    ['BLM', '马'],
    ['BLC', '车'],
    ['BRP', '炮'],
    ['BLP', '炮'],
    ['BZ5', '卒'],
    ['BZ4', '卒'],
    ['BZ3', '卒'],
    ['BZ2', '卒'],
    ['BZ1', '卒'],
    ['RRC', '车'],
    ['RRM', '马'],
    ['RRX', '相'],
    ['RRS', '仕'],
    ['RBJ', '帅'],
    ['RLS', '仕'],
    ['RLX', '相'],
    ['RLM', '马'],
    ['RLC', '车'],
    ['RRP', '炮'],
    ['RLP', '炮'],
    ['RZ5', '兵'],
    ['RZ4', '兵'],
    ['RZ3', '兵'],
    ['RZ2', '兵'],
    ['RZ1', '兵'],
  ],
)
export const stepsMap = new Map(
  [
    [1, '一'],
    [2, '二'],
    [3, '三'],
    [4, '四'],
    [5, '五'],
    [6, '六'],
    [7, '七'],
    [8, '八'],
    [9, '九'],
  ],
)

function imagesList(type) {
  const skin = getSkin(type)
  return [
    {
      id: 'BRC',
      source: skin.bc,
    },
    {
      id: 'BRM',
      source: skin.bm,
    },
    {
      id: 'BRX',
      source: skin.bx,
    },
    {
      id: 'BRS',
      source: skin.bs,
    },
    {
      id: 'BBJ',
      source: skin.bj,
    },
    {
      id: 'BLS',
      source: skin.bs,
    },
    {
      id: 'BLX',
      source: skin.bx,
    },
    {
      id: 'BLM',
      source: skin.bm,
    },
    {
      id: 'BLC',
      source: skin.bc,
    },
    {
      id: 'BRP',
      source: skin.bp,
    },
    {
      id: 'BLP',
      source: skin.bp,
    },
    {
      id: 'BZ5',
      source: skin.bz,
    },
    {
      id: 'BZ4',
      source: skin.bz,
    },
    {
      id: 'BZ3',
      source: skin.bz,
    },
    {
      id: 'BZ2',
      source: skin.bz,
    },
    {
      id: 'BZ1',
      source: skin.bz,
    },
    {
      id: 'RRC',
      source: skin.rc,
    },
    {
      id: 'RRM',
      source: skin.rm,
    },
    {
      id: 'RRX',
      source: skin.rx,
    },
    {
      id: 'RRS',
      source: skin.rs,
    },
    {
      id: 'RBJ',
      source: skin.rj,
    },
    {
      id: 'RLS',
      source: skin.rs,
    },
    {
      id: 'RLX',
      source: skin.rx,
    },
    {
      id: 'RLM',
      source: skin.rm,
    },
    {
      id: 'RLC',
      source: skin.rc,
    },
    {
      id: 'RRP',
      source: skin.rp,
    },
    {
      id: 'RLP',
      source: skin.rp,
    },
    {
      id: 'RZ5',
      source: skin.rz,
    },
    {
      id: 'RZ4',
      source: skin.rz,
    },
    {
      id: 'RZ3',
      source: skin.rz,
    },
    {
      id: 'RZ2',
      source: skin.rz,
    },
    {
      id: 'RZ1',
      source: skin.rz,
    },
    {
      id: 'board',
      source: skin.board,
    },
    {
      id: 'bBox',
      source: skin.bBox,
    },
    {
      id: 'rBox',
      source: skin.rBox,
    },
    {
      id: 'tips',
      source: skin.tips,
    },
  ]
}

function getImageUrl(number = 1, type) {
  return new URL(`../assets/skins/${number}/${type}`, import.meta.url).href
}

function getSkin(type = 1) {
  return {
    // bc => black c => 黑色的车
    bc: getImageUrl(type, 'b_c.png'),
    bm: getImageUrl(type, 'b_m.png'),
    bx: getImageUrl(type, 'b_x.png'),
    bs: getImageUrl(type, 'b_s.png'),
    bj: getImageUrl(type, 'b_j.png'),
    bp: getImageUrl(type, 'b_p.png'),
    bz: getImageUrl(type, 'b_z.png'),
    // // rc => red c => 红色的车
    rc: getImageUrl(type, 'r_c.png'),
    rm: getImageUrl(type, 'r_m.png'),
    rx: getImageUrl(type, 'r_x.png'),
    rs: getImageUrl(type, 'r_s.png'),
    rj: getImageUrl(type, 'r_j.png'),
    rp: getImageUrl(type, 'r_p.png'),
    rz: getImageUrl(type, 'r_z.png'),
    // 选棋框
    rBox: getImageUrl(type, 'r_box.png'),
    bBox: getImageUrl(type, 'b_box.png'),
    // 棋盘
    board: getImageUrl(type, 'board.png'),
    // 棋子可着点
    tips: getImageUrl(type, 'tips.png'),

  }
}
const imgMap = new Map()

export function loadImage(type) {
  imgMap.clear()
  const promises = []

  imagesList(type).forEach((item) => {
    // imgMap.set(e.id, e.source);
    const promise = new Promise((resolve) => {
      const img = new Image()
      img.src = item.source
      img.onload = () => {
        imgMap.set(item.id, img)
        resolve(img)
      }
    })
    promises.push(promise)
  })

  return Promise.all(promises).then(() => imgMap)
}

export async function changeSkin() {
  const [skinType] = await Promise.all([getItem('skinType')])
  const t = Number(skinType) || 1
  const type = t + 1 > config.skinTotal ? 1 : t + 1

  await loadImage(type)
  setItem('skinType', type)
}

export async function fetchSkin() {
  const [skinType] = await Promise.all([getItem('skinType')])
  await loadImage(skinType)
  return imgMap
}
