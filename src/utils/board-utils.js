import { initializeGrid, X } from '@/utils/board-canvas-utils.js'

const prefixList = [
  {
    prefix: 'C',
    value: 'r',
  },
  {
    prefix: 'M',
    value: 'n',
  },
  {
    prefix: 'X',
    value: 'b',
  },
  {
    prefix: 'S',
    value: 'a',
  },
  {
    prefix: 'J',
    value: 'k',
  },
  {
    prefix: 'P',
    value: 'c',
  },
  {
    prefix: 'Z',
    value: 'p',
  },
]
const attachList = ['C', 'M', 'P', 'Z']
function getValueByPrefix(prefix, toUpperCase) {
  const foundItem = prefixList.find(item => item.prefix === prefix)
  return toUpperCase ? foundItem.value.toUpperCase() : foundItem.value
}

function findPrefix(value) {
  const data = prefixList.find(item => item.value === value)
  return data.prefix
}

export function gameMap(e) {
  const t = initializeGrid([])
  let n = 0
  let r = 0
  let o = 0

  let a = e.charAt(o)
  while (a !== ' ') {
    if (a === '/') {
      n++
      r = 0
      if (r >= X) {
        break
      }
    }
    else {
      if (a >= '0' && a <= '9') {
        r += Number.parseInt(a)
      }
      else if (a >= 'a' && a <= 'z') {
        t[n][r] = {
          prefix: findPrefix(a),
          isBlackColor: false,
        }
        ++r
      }
      else if (a >= 'A' && a <= 'Z') {
        t[n][r] = {
          prefix: findPrefix(a.toLowerCase()),
          isBlackColor: true,
        }
        ++r
      }
    }
    a = e.charAt(++o)
    if (!a) {
      break
    }
  }
  const l = e.charAt(++o)
  const c = e.substring(o + l.length + 1, e.length)
  return u(t, l, c)
}

function u(e, t, n) {
  const i = []
  const r = n.split('/')
  let o = 0

  for (let a = 0; a < e.length; ++a) {
    for (let s = 0; s < e[a].length; ++s) {
      const u = e[a][s]
      if (u) {
        const p = u.prefix
        const h = u.isBlackColor
        i.push({
          x: a,
          y: s,
          id: r[o++],
          prefix: p,
          isBlackColor: h,
          isAttach: isAttach(p),
          isBoss: isBoss(p),
        })
      }
    }
  }
  return i
}
export function generateString(data, isWhite) {
  const items = initializeGrid(data)
  // const count = 0
  let result = ''
  let prefixStr = ''

  for (const itemGroup of items) {
    let groupCount = 0

    for (const item of itemGroup) {
      if (item) {
        if (groupCount > 0) {
          result += `${groupCount}`
          groupCount = 0
        }
        prefixStr += `${item.id}/`
        result += `${getValueByPrefix(item.prefix, item.isBlackColor)}`
      }
      else {
        groupCount++
      }
    }

    if (groupCount > 0) {
      result += `${groupCount}`
    }
    result += '/'
  }

  const colorCode = isWhite ? 'w' : 'b'
  return `${result.substring(0, result.length - 1)} ${colorCode} ${prefixStr.substring(0, prefixStr.length - 1)}`
}

function isAttach(e) {
  return attachList.includes(e)
}

function isBoss(e) {
  return e === 'J'
}
