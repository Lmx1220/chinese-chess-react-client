import AsyncLock from 'async-lock'
import lodash from 'lodash'
import oCanvas from 'ocanvas'

const lock = new AsyncLock()
let _ctxObjs = {}
const w = []
let _gameMap = []
let _boxObjs = {}
let _tipNodes = []
let _canvasMap = new Map()
let _elCacheMap = new Map()
let j = new Map()
let _CapChess = new Map()
let chessMap = new Map()
let _elWidth = 0
let _elHeight = 0
let _dpr = 0
const LOCK_KEY = 'lockKey'
const S = 521
let _chessSize = 0
let _topSpan = 0
let _leftSpan = 0
const M = 57
const Z = 16
const E = 20
let _elObj = null
const P = 1.1
/**
 * @description: 初始化绑定事件
 * @param el div(此节点承载canvas)
 * @param boardImg 棋盘图片
 * @param gameMap 地图对象 @see images-res.js
 */
export function initBinds(el, boardImg, gameMap) {
  destroyAllCtx()
  te()
  resize(el)
  initCanvas(el)
  setChessMap(boardImg)
  initMap(gameMap)
  window.removeEventListener('resize', listenResize)
}

function setChessMap(map) {
  chessMap = map
}

/**
 * 初始化地图
 * @param gameMap
 */
export function initMap(gameMap = []) {
  const { mapCtx } = _ctxObjs

  mapCtx.reset()
  _elCacheMap.clear()
  j.clear()
  gameMap.forEach((e) => {
    addChes(chessMap.get(e.id), e, mapCtx)
  },
  )
  // 保存棋盘，方便在界面大小变化时重新绘制
  _gameMap = gameMap
}

export function setMap(gameMap = []) {
  const { mapCtx } = _ctxObjs
  // 空地图直接初始化
  if (!_gameMap.length || _gameMap.length === 0) {
    initMap(gameMap)
  }
  else {
    // 要删除的节点
    const newChessIds = gameMap.map(chess => chess.id)
    const delNodes = _gameMap.filter(chess => !newChessIds.includes(chess.id))
    delNodes.forEach(chess => removeChess(chess.id, mapCtx))

    // 要新增的节点
    const oldChessIds = _gameMap.map(chess => chess.id)
    const createNodes = gameMap.filter(chess => !oldChessIds.includes(chess.id))
    createNodes.forEach(chess => addChes(chessMap.get(chess.id), chess, mapCtx))

    // 位置不相同的点
    const animationNodes = gameMap.filter((_new) => {
      return _gameMap.some(_old =>
        _new.id === _old.id && (_new.x !== _old.x || _new.y !== _old.y),
      )
    })
    animationNodes.forEach(chess => doAnimation(chess.id, { x: chess.x, y: chess.y }))

    // 替换棋盘
    _gameMap = gameMap
  }
}

function addChes(imgUrl, chess, ctx) {
  lock.acquire(LOCK_KEY, (down) => {
    const mapCtx = ctx || _ctxObjs.mapCtx
    // _chessSize = 75
    const displayImage = mapCtx.display.image({
      x: _chessSize * chess.y + _leftSpan,
      y: _chessSize * chess.x + _topSpan,

      image: imgUrl,
      width: _chessSize,
      height: _chessSize,
      opacity: 0.5,
      zIndex: 'back',
    })
    _elCacheMap.set(chess.id, displayImage)
    w.push(displayImage)
    mapCtx.addChild(displayImage)

    displayImage.fadeIn('short', 'linear', () => mapCtx.redraw())

    down()
  })
}

// function restChess() {
//
// }

export function destroyAllCtx() {
  const { mapCtx, boxCtx, tipCtx } = _ctxObjs
  w.forEach(e => e.remove(false))
  mapCtx && mapCtx.destroy()
  boxCtx && boxCtx.destroy()
  tipCtx && tipCtx.destroy()
}
function te() {
  _ctxObjs = {}
  _boxObjs = {}
  _tipNodes = []
  _canvasMap = new Map()
  _elCacheMap = new Map()
  j = new Map()
  _CapChess = new Map()
  window.removeEventListener('resize', listenResize)
}

function resize(el) {
  _elObj = el
  _elWidth = el.clientWidth
  _elHeight = el.clientHeight
  _dpr = Math.max(window.devicePixelRatio || 1, 2)
  const t = _elWidth / S
  _chessSize = M * t * _dpr
  _topSpan = Math.floor(Z * t / 2)
  _leftSpan = Math.floor(E * t / 2)
}

export function setChessBox(fromBox, toBox) {
  const { boxCtx } = _ctxObjs
  boxCtx.reset()
  if (fromBox || toBox) {
    const toColor = fromBox.color === 'boxColorRed' ? 'rBox' : 'bBox'
    const toBoxList = []
    fromBox && toBoxList.push({
      x: fromBox.x,
      y: fromBox.y,
      isShow: fromBox.show,
    })

    toBox && toBoxList.push({
      x: toBox.x,
      y: toBox.y,
      isShow: toBox.show,
    })

    toBoxList.length && toBoxList.filter(e => e.isShow).forEach((e) => {
      const dispLayImage = boxCtx.display.image({
        x: _chessSize * e.y + _leftSpan,
        y: _chessSize * e.x + _topSpan,
        image: chessMap.get(toColor),
        width: _chessSize,
        height: _chessSize,
      })
      boxCtx.addChild(dispLayImage)
      w.push(dispLayImage)
    },
    )

    _boxObjs = {
      fromBox,
      toBox,
    }
  }
}

export function setChessTips(tipNodes = []) {
  const { tipCtx } = _ctxObjs
  tipCtx.reset()
  const id = 'tips'
  const width = _chessSize / 2
  const height = _chessSize / 2
  tipNodes.forEach((tip) => {
    const dispLayImage = tipCtx.display.image({
      x: _chessSize * tip.y + _leftSpan,
      y: _chessSize * tip.x + _topSpan,
      image: chessMap.get(id),
      width,
      height,
      origin: { x: -(width / 2), y: -(height / 2) },
      opacity: 0.5,
    })
    tipCtx.addChild(dispLayImage)
    w.push(dispLayImage)
  })
  _tipNodes = tipNodes
}

export function move(srcChess, targetChess, srcBox, targetBox, gameMap) {
  const { mapCtx } = _ctxObjs
  if (_elCacheMap.has(targetChess.id)) {
    removeChess(targetChess.id, mapCtx)
  }
  doAnimation(srcChess.id, targetChess)
  setChessBox(srcBox, targetBox)
  _gameMap = gameMap
}

function removeChess(chessId, ctx) {
  lock.acquire(LOCK_KEY, (down) => {
    const mapCtx = ctx || _ctxObjs.mapCtx
    const delObj = _elCacheMap.get(chessId)
    if (delObj) {
      delObj.fadeOut('short', 'linear', () => {
        _elCacheMap.delete(chessId)
        mapCtx.removeChild(delObj)
        down()
      })
    }
    else {
      down()
    }
  })
}

function doAnimation(chessId, to) {
  const cache = _elCacheMap.get(chessId)
  if (cache) {
    unCapChess(chessId)
    const y = _chessSize * to.y + _leftSpan
    const x = _chessSize * to.x + _topSpan
    cache.animate({
      x: y,
      y: x,
    }, {
      easing: 'ease-out',
      duration: 'short',
      callback: () => {
        unCapChess(chessId)
      },
    })
  }
}

export function unCapChess(id) {
  if (_CapChess.has(id)) {
    const { mapCtx } = _ctxObjs
    const capChess = _CapChess.get(id)
    capChess.setOrigin(0, 0)
    capChess.scale(1, 1)
    capChess.shadow = '0 0 0 transparent'
    capChess.zIndex = 'back'
    mapCtx.redraw()
  }
}

export function capChess(chessId) {
  const mapCtx = _ctxObjs.mapCtx

  for (const [key] of _CapChess) {
    key !== chessId && unCapChess(key)
  }
  const cache = _elCacheMap.get(chessId)
  if (cache) {
    const p = _chessSize * (P - 1) / 2
    cache.scale(P, P)
    cache.setOrigin(p, p)
    cache.shadow = '8px 10px 10px rgba(0,0,0,0.35)'
    cache.zIndex = 'front'
    mapCtx.redraw()
    _CapChess.set(chessId, cache)
  }
}

export function backMove(lastFrom, lastTo, fromChessBox, toChessBox, gameMap) {
  if (lastTo.id) {
    addChes(chessMap.get(lastTo.id), lastTo)
  }
  doAnimation(lastFrom.id, lastFrom)
  setChessBox(fromChessBox, toChessBox)
  _gameMap = gameMap
}

function initCanvas(el) {
  const map = 'mapCanvas'
  const box = 'boxCanvas'
  const tip = 'tipCanvas'

  function r(key, t) {
    const canvas = _canvasMap.get(key) || document.createElement('canvas')
    canvas.id = key
    canvas.style.zIndex = t
    canvas.style.width = `${_elWidth}px`
    canvas.style.height = `${_elHeight}px`
    canvas.style.position = 'absolute'
    canvas.style.top = '0'
    canvas.style.left = '0'
    canvas.width = _elWidth * _dpr
    canvas.height = _elHeight * _dpr
    return canvas
  }

  const boxCanvas = r(box, 1)
  const mapCanvas = r(map, 2)
  const tipCanvas = r(tip, 3)

  if (_canvasMap.has(map)) {
    const { mapCtx, boxCtx, tipCtx } = _ctxObjs
    const width = _elWidth * _dpr
    const height = _elHeight * _dpr;
    [mapCtx, boxCtx, tipCtx].forEach((ctx) => {
      ctx.width = width
      ctx.height = height
      ctx.style.width = _elWidth
      ctx.style.height = _elHeight
    })
  }
  else {
    el.innerHTML = ''
    el.appendChild(mapCanvas)
    el.appendChild(boxCanvas)
    el.appendChild(tipCanvas)
    const mapCtx = oCanvas.create({ canvas: '#mapCanvas', fps: 120 })
    const boxCtx = oCanvas.create({ canvas: '#boxCanvas', fps: 30 })
    const tipCtx = oCanvas.create({ canvas: '#tipCanvas', fps: 30 })
    mapCtx.events.enabled = false
    boxCtx.events.enabled = false
    tipCtx.events.enabled = false
    _ctxObjs = {
      mapCtx,
      boxCtx,
      tipCtx,
    }
  }
  _canvasMap.set(map, mapCanvas)
  _canvasMap.set(box, boxCanvas)
  _canvasMap.set(tip, tipCanvas)
}

function listenResize() {
  lodash.debounce(() => {
    resize(_elObj)
    initCanvas(_elObj)
    //     _(_gameMap)
    setChessBox(_boxObjs.fromBox, _boxObjs.toBox)
    setChessTips(_tipNodes)
  }, 1000)
}
