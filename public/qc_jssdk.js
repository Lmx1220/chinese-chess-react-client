const QC = (function () {
  function o() {
  }

  const a = window.ActiveXObject && ~~navigator.userAgent.match(/MSIE\s+(\d+)/)[1]; const t = (e._reg = /\{(\w+)\}/g, {
    str2dom(t) {
      const n = []; const e = arguments.callee._temp = arguments.callee._temp || document.createElement('div')
      for (e.innerHTML = t; e.firstChild;) n.push(e.removeChild(e.firstChild))
      return n.length > 1
        ? (function () {
            for (var t = document.createDocumentFragment(), e = 0; e < n.length; e++) t.appendChild(n[e])
            return t
          }())
        : n[0]
    },
    format: e,
    extend(t, e) {
      const n = o
      return n.prototype = e.prototype, t.prototype = new n(), t.constructor = t
    },
  })

  function e(t, n) {
    return t.replace(arguments.callee._reg, (t, e) => {
      return n[e] !== null ? n[e] : e
    })
  }

  let r; let s
  const n = (r = /[\\"\x00-\x1F\x7F-\x9F\u00AD\u0600-\u0604\u070F\u17B4\u17B5\u200C-\u200F\u2028-\u202F\u2060-\u206F\uFEFF\uFFF0-\uFFFF]/g, s = {
    '\b': '\\b',
    '\t': '\\t',
    '\n': '\\n',
    '\f': '\\f',
    '\r': '\\r',
    '"': '\\"',
    '\\': '\\\\',
  }, {
    stringify: window.JSON && JSON.stringify ? JSON.stringify : c,
    parse(e) {
      e = e || '{}'
      let t = {}
      try {
        t = new Function(`return (${e})`)()
      }
      catch (t) {
        w.error(`JSON.parse => parse数据格式错误:${e}`)
      }
      return t
    },
  })

  function c(t) {
    let e; let n; const o = []; let i = ''
    for (e in t) {
      switch (typeof (i = void 0 !== (i = t[e]) ? i : '')) {
        case 'string':
          n = i, r.lastIndex = 0, i = r.test(n)
            ? `"${n.replace(r, (t) => {
              const e = s[t]
              return typeof e == 'string' ? e : `\\u${(`0000${t.charCodeAt(0).toString(16)}`).slice(-4)}`
            })}"`
            : `"${n}"`
          break
        case 'object':
          i = c(i)
          break
        case 'function':
          continue
      }
      o.push(`"${e}":${i}`)
    }
    return `{${o}}`
  }

  let d; let i; let p; let u; let l; let h; let f; const m = (function () {
    document.implementation.hasFeature('XPath', '3.0') && (XMLDocument.prototype.selectNodes = function (t, e) {
      e = e || this
      for (var n = this.createNSResolver(this.documentElement), o = this.evaluate(t, e, n, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null), i = [], r = 0; r < o.snapshotLength; r++) i[r] = o.snapshotItem(r)
      return i
    }, Element.prototype.selectNodes = function (t) {
      if (this.ownerDocument.selectNodes)
        return this.ownerDocument.selectNodes(t, this)
      throw 'For XML Elements Only'
    })
    return {
      stringify(t) {
        return t.xml || (new XMLSerializer()).serializeToString(t)
      },
      parse(t) {
        const e = a ? new ActiveXObject('Microsoft.XMLDOM') : document.implementation.createDocument('text/xml', '', null)
        if (a)
          return e.loadXML(t) ? e : null
        try {
          for (let n = e.childNodes, o = n.length - 1; o >= 0; o--) e.removeChild(n[o])
          const i = (new DOMParser()).parseFromString(t, 'text/xml'); const r = e.importNode(i.documentElement, !0)
          return e.appendChild(r), e
        }
        catch (t) {
          return null
        }
      },
    }
  }()); const g = {
    extend() {
      let t; let e; let n; const o = arguments; const i = arguments.length; let r = !1; let a = 1; let s = o[0]
      for (typeof s == 'boolean' && (r = s, s = arguments[1] || {}, a = 2), typeof s != 'object' && typeof s != 'function' && (s = {}), i === a && (s = {}, --a); a < i; a++) {
        if ((t = arguments[a]) != null) {
          for (const c in t) e = s[c], s !== (n = t[c]) && (r && n && typeof n == 'object' && !n.nodeType ? (e = e || (Array.isArray(n) ? [] : typeof n == 'object' ? {} : n), s[c] = object.extend(r, e, n)) : void 0 !== n && (s[c] = n))
        }
      }
      return s
    },
  }; const _ = (d = /"/g, i = {
    genHttpParamString(t) {
      return this.commonDictionaryJoin(t, null, null, null, window.encodeURIComponent)
    },
    splitHttpParamString(t) {
      return this.commonDictionarySplit(t, null, null, null, window.decodeURIComponent)
    },
    commonDictionarySplit(t, e, n, o, i) {
      let r; let a; let s; const c = {}
      if (!t || typeof t != 'string')
        return c
      if (typeof n != 'string' && (n = ''), typeof o != 'string' && (o = '='), (r = t.split(e = typeof e != 'string' ? '&' : e)) && r.length) {
        for (let d = 0, p = r.length; d < p; ++d) (a = r[d].split(o)).length > 1 ? (s = (s = a.slice(1).join(o).split(n)).slice(n.length, s.length - n.length).join(n), c[a[0]] = typeof i == 'function' ? i(s) : s) : a[0] && (c[a[0]] = !0)
      }
      return c
    },
    commonDictionaryJoin(t, e, n, o, i) {
      let r; let a; const s = []
      if (!t || typeof t != 'object')
        return ''
      if (typeof t == 'string')
        return t
      for (a in typeof e != 'string' && (e = '&'), typeof n != 'string' && (n = ''), typeof o != 'string' && (o = '='), t) r = (`${t[a]}`).replace(d, '\\"'), s.push(a + o + n + (typeof i == 'function' ? i(r) : r) + n)
      return s.join(e)
    },
  }, {
    stringify(t) {
      return i.genHttpParamString(t)
    },
    parse(t) {
      return i.splitHttpParamString(t)
    },
    getParameter(t) {
      t = new RegExp(`(\\?|#|&)${t}=([^&#]*)(&|#|$)`), t = location.href.match(t)
      return decodeURIComponent(t ? t[2] : '')
    },
  })
  const y = (p = [/&(?!amp;|lt;|gt;|#039;|quot;|#39;)/g, /</g, />/g, /\x27/g, /\x22/g], u = ['&amp;', '&lt;', '&gt;', '&#039;', '&quot;'], {
    escHTML(t) {
      for (var e = t, n = 0, o = p.length; n < o; n++) e = e.replace(p[n], u[n])
      return e
    },
    format: t.format,
  }); const v = (l = document.domain || '', {
    set(t, e, n, o, i) {
      let r
      return i && (r = new Date()).setTime(r.getTime() + 36e5 * i), document.cookie = `${t}=${e}; ${i ? `expires=${r.toGMTString()}; ` : ''}${o ? `path=${o}; ` : 'path=/; '}${n ? `domain=${n};` : `domain=${l};`}`, !0
    },
    get(t) {
      t = new RegExp(`(?:^|;+|\\s+)${t}=([^;]*)`), t = document.cookie.match(t)
      return t ? t[1] : ''
    },
    del(t, e, n) {
      document.cookie = `${t}=; expires=Mon, 26 Jul 1997 05:00:00 GMT; ${n ? `path=${n}; ` : 'path=/; '}${e ? `domain=${e};` : `domain=${l};`}`
    },
  }); var w = (f = (h = { log: 3, info: 2, warn: 1, error: 0 }).info, {
    log: C('log'),
    info: C('info'),
    warn: C('warn'),
    error: C('error'),
    setLevel(t) {
      return f = h[t] || f
    },
  })

  function C(e) {
    return function (t) {
      window.console && console[e] && ~~(f || h.info) >= h[e] && console[e](` :: [QQConnect] > ${t}`)
    }
  }

  var q
  var q = (k.list = [], k.fired = !1, q || (q = !0, document.addEventListener
    ? document.addEventListener('DOMContentLoaded', function () {
        document.removeEventListener('DOMContentLoaded', arguments.callee, !1), k()
      }, !1)
    : document.attachEvent && (document.attachEvent('onreadystatechange', function () {
      document.readyState !== 'complete' && document.readyState !== 'loaded' || (document.detachEvent('onreadystatechange', arguments.callee), k())
    }), document.documentElement.doScroll && (function () {
      try {
        document.documentElement.doScroll('left'), document.body.appendChild
      }
      catch (t) {
        return k.fired || setTimeout(arguments.callee, 0)
      }
      k()
    }()))), {
    domReady(t) {
      typeof t == 'function' && (k.fired || document.readyState === 'complete' || document.readyState === 'loaded' ? (k(), t()) : k.list.push(t))
    },
    add(t, e, n) {
      t && e && n && (t && t.addEventListener ? t.addEventListener(e, n, !1) : t.attachEvent(`on${e}`, n))
    },
    remove(t, e, n) {
      t && e && n && (t && t.removeEventListener ? t.removeEventListener(e, n, !1) : t.detachEvent(`on${e}`, n))
    },
  })

  function k() {
    let t
    for (k.fired = !0; t = k.list.shift();) t()
  }

  function x(t, e, n) {
    setTimeout(() => {
      x.send(t, e, n)
    }, 0)
  }

  x.send = function (t, e, n) {
  }

  function b(t, e, n, o) {
    setTimeout(() => {
      b.send(t, e, n, o)
    }, 0)
  }

  b.send = function () {
  }
  return {
    Like: { _insertButton: o },
    Share: {},
    Toolkit: t,
    JSON: n,
    XML: m,
    Object: g,
    QueryString: _,
    String: y,
    Cookie: v,
    Console: w,
    Event: q,
    pv: x,
    valueStat: b,
    reportBNL(t, e) {
    },
    getVersion() {
      return '1.0.1'
    },
  }
}())
!(function (g) {
  function _(t) {
    return typeof t == 'string' ? document.getElementById(t) : t
  }

  function t(t) {
    return e && (e.dataset && e.dataset[t] || e.getAttribute(`data-${t}`))
  }

  let e; let n; const o = QC.getVersion()
  ~~g.QueryString.getParameter('__qc_wId') || ~~g.Cookie.get('__qc_wId') || (n = +new Date() % 1e3, document.cookie = [`__qc_wId=${n}`, '; path=/'].join(';'))
  for (var i, r = /qc_jssdk/i, a = document.getElementsByTagName('script'), s = 0, c = a.length; s < c; s++) {
    if (((i = a[s]).src || '').match(r)) {
      e = i
      break
    }
  }
  const y = g.Toolkit; const v = g.JSON; const w = (g.XML, g.Object); const C = (g.QueryString, g.String, g.Cookie); const q = g.Console
  const k = function () {
  }; const x = window.ActiveXObject && ~~navigator.userAgent.match(/MSIE\s+(\d+)/)[1]; const d = {
    PMCrossPage: `https://graph.qq.com/jsdkproxy/PMProxy.html#${o}`,
    FLACrossPage: 'https://graph.qq.com/jsdkproxy/FLAProxy.swf',
    getCrossSolution() {
      const t = window.postMessage
        ? 'PMProxy'
        : window.ActiveXObject && (function () {
          let e = !0
          try {
            new ActiveXObject('ShockwaveFlash.ShockwaveFlash')
          }
          catch (t) {
            e = !1
          }
          return e
        }()) || navigator.plugins && navigator.plugins['Shockwave Flash']
          ? 'FLAProxy'
          : (g.Console.error('未找到可用的跨域通信方案'), 'EMPProxy')
      return g.Console.info(`确定跨域代理策略：${t}`), t
    },
  }; let p = 1e3
  g.getConfig = function () {
    return d
  }

  function u(t, e, n, o) {
    this.uri = t, this.paras = e || {}, this.fmt = n || 'json', this.method = (o || 'get').toLocaleLowerCase(), this.successPool = [], this.errorPool = [], this.completePool = [], this.seq = p++
  }

  u.prototype.success = function (t) {
    return this.successPool.push(t), this
  }, u.prototype.error = function (t) {
    return this.errorPool.push(t), this
  }, u.prototype.complete = function (t) {
    return this.completePool.push(t), this
  }, u.prototype.send = k, u.prototype._onCallback = function (t, e, n) {
    let o
    t.status == 200 || t.status == 204 ? (o = t.responseText, ~~(o = new l(o, t.status, e, n)).code ? this.onError(o) : this.onSuccess(o)) : this.onError(new l('', t.status, e, n))
  }, u.prototype.onSuccess = function (t) {
    for (let e = this.successPool, n = 0; n < e.length; n++) e[n](t)
    this.onComplete(t)
  }, u.prototype.onError = function (t) {
    for (let e = this.errorPool, n = 0; n < e.length; n++) e[n](t)
    this.onComplete(t)
  }, u.prototype.onComplete = function (t) {
    for (let e = this.completePool, n = 0; n < e.length; n++) e[n](t)
  }
  var l = function (t, e, n, o) {
    this.status = e || -1, this.fmt = n || 'json', this.code = this.ret = -1, this.data = null, this.seq = o || -1, this.parseData(t), this.code && l[this.code] && l[this.code](this.data, this.dataText)
  }
  l.prototype.parseData = function (t) {
    let e
    this.dataText = t, this.fmt === 'xml' ? (this.data = g.XML.parse(t || '<root></root>'), e = this.data.selectNodes('//ret')[0], this.code = this.ret = e && e.firstChild.nodeValue || -1) : (this.data = g.JSON.parse(t || '{}'), this.code = this.ret = void 0 !== this.data.ret ? ~~this.data.ret : this.data.data && void 0 !== this.data.data.ret ? ~~this.data.data.ret : -1)
  }, l.prototype.stringifyData = function () {
    return this.dataText
  }, l[100013] = function (t, e) {
    g.Login.signOut(), g.Console.warn('api返回token失效')
  }
  var h = g.Toolkit.extend(function () {
    u.apply(this, arguments), this.xhr = h.createInstance()
  }, u)
  g.Object.extend(h.prototype, {
    send() {
      const t = this.xhr; const e = this.method; const n = this.fmt; const o = this; const i = g.QueryString.stringify(o.paras)
      const r = e == 'post' ? this.uri : !this.uri.includes('?') ? `${this.uri}?${i}` : `${this.uri.replace(/[&?]*/g, '')}&${i}`
      t.open(e, r, !!this.async)
      try {
        t.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'), t.setRequestHeader('X-Requested-From', '_TC_QC_jsProxy_')
      }
      catch (t) {
      }
      t.onreadystatechange = function () {
        t.readyState === 4 && o._onCallback(t, n, o.seq)
      }, t.send(i || null)
    },
  }), h.createInstance = window.XMLHttpRequest
    ? function () {
      return new window.XMLHttpRequest()
    }
    : function () {
      return new window.ActiveXObject('Microsoft.XMLHTTP')
    }

  function f() {
    this.requests = [], this.invokes = [], this.readyPool = [], this.isReady = !1, this.timeStamp = +new Date(), this.init()
  }

  let m, b
  f.prototype.init = k, f.prototype.ready = function (t) {
    this.readyPool.push(t)
  }, f.prototype.onReady = function () {
    this.isReady = !0
    for (let t = this.readyPool, e = 0; e < t.length; e++) t[e]()
  }, f.prototype.send = function (t) {
    let e
    for (t && this.requests.push(t); this.isReady && (e = this.requests.shift());) f.pendingRequests.push(e), QC.Console.log(`seq no :${e.seq}请求发起  ts -> ${+new Date()}`), this._doSend(e)
  }, f.prototype._doSend = function (t) {
  }, f.prototype._preDispatch = function (t, e, n, o) {
    const i = (e.data || e.currentTarget && e.currentTarget.data || {}).split('@@@')
    i[0] === 'invoke' ? this.invoke(i[1]) : this.dispatch(i[1] || e, n, o)
  }, f.prototype.invoke = function (t) {
    let e
    for (t && this.invokes.push(t); this.isReady && (e = this.invokes.shift());) this._doInvoke(e)
  }, f.prototype._doInvoke = function (t) {
  }, f.prototype.dispose = function () {
    b = null, this.onDispose()
  }, f.prototype.onDispose = function () {
  }, f.pendingRequests = [], f.dispatchReceive = function (t, e, n, o) {
    for (let i = f.pendingRequests, r = 0; r < i.length; r++) {
      if (i[r].seq == t) {
        return QC.Console.log(`seq no :${t}响应收到  ts -> ${+new Date()}`), i[r]._onCallback({
          status: n,
          responseText: e,
        }, o, t), void i.splice(r, 1)
      }
    }
  }, f.invoke = (m = [], function (t) {
    if (t && m.push(t), !b)
      return g.Console.info('Proxy未初始化，invoke入栈'), void f.generateProxy()
    for (var e; e = m.shift();) b._doInvoke(e)
  }), f.generateProxy = function (t) {
    const e = { PMProxy: S, FLAProxy: I, EMPProxy: E }
    return t ? new e[t]() : b = b || new e[d.getCrossSolution()]()
  }, f.getFunction = function (t) {
    let e
    t = t.split('.')
    for (let n = 0; n < t.length; n++) e = (e || window)[t[n]]
    return e
  }, g._create_fla_proxy = function () {
    g._create_fla_proxy = k, document._qc_cross_request_flash_proxy || _('_qc_cross_request_flash_proxy') || new I()
  }
  var I = g.Toolkit.extend(function () {
    f.apply(this, arguments)
  }, f)
  g.Object.extend(I.prototype, {
    prefix: '_TC_QC_flaProxy_',
    init() {
      let t; let e; const o = this
      var n = (t = window.name.match(/oauth2Login_(\d+)/), e = ~~g.Cookie.get('__qc_wId'), t && t[1] ? n = t[1] : window._b_is_qc_cb_win ? n = 1e4 + e : (n = e, document.cookie = [`__qc_wId=${n}`, '; path=/'].join(';')), g.Console.info(`跨域窗口标识号 __qc_wId : ${n}`), n)
      var n = I.getFlashHtml({
        src: d.FLACrossPage,
        width: '100%',
        height: '100%',
        allowScriptAccess: 'always',
        id: '_qc_cross_request_flash_proxy',
        name: '_qc_cross_request_flash_proxy',
        flashVars: `suffix=${this.timeStamp}&conId=${n}&conId_receive=${n < 1e4 ? n + 1e4 : n - 1e4}`,
      }); const i = this.cot = document.createElement('div')
      i.style.cssText = 'position:fixed; _position:absolute; top:-999px; left: -999px; width:1px; height:1px; margin:0; padding:0; display:none;', i.innerHTML = n, QC.Event.domReady(() => {
        document.body.appendChild(i), i.style.display = 'block'
      }), window[`${this.prefix}onFlashReady_${this.timeStamp}`] = function () {
        g.Console.info(`FLAProxy代理创建成功，耗时${new Date() - o.timeStamp}`), setTimeout(() => {
          o.isReady = !0, o.send(), o.invoke()
        }), g.Login._check() || document._qc_cross_request_flash_proxy.initConn()
      }, window[`${this.prefix}onFlashRequestComplete_${this.timeStamp}`] = function (t, e, n) {
        setTimeout(() => {
          o._preDispatch(o, t, e, n)
        })
      }, window[`${this.prefix}onFlashInvokeBack_${this.timeStamp}`] = function () {
        const n = arguments
        setTimeout(() => {
          const t = f.getFunction(n[0]); const e = n[1]
          n[0].includes('.') ? t.apply(null, e) : t(e)
        })
      }
    },
    _doSend(t) {
      const e = t.uri; const n = g.QueryString.stringify(t.paras); const o = t.seq; const i = t.fmt; const r = t.method
      var t = document._qc_cross_request_flash_proxy.httpRequest || _('_qc_cross_request_flash_proxy').httpRequest
      t
        ? t(e, n, r, i, o)
        : (function () {
            throw new Error('flash proxy 初始化失败')
          }())
    },
    dispatch(t, e, n) {
      const o = t.currentTarget.data; var t = t.type != 'complete' ? 404 : 200
      f.dispatchReceive(e, o, t, n)
    },
    _doInvoke(t) {
      const e = document._qc_cross_request_flash_proxy.jsCallSwf || _('_qc_cross_request_flash_proxy').jsCallSwf
      e && e.apply(null, t)
    },
  }), I.getFlashHtml = function (t, e, n) {
    let o; const i = []; const r = []; const a = !!window.ActiveXObject
    for (o in e = e || 9, t) {
      switch (o) {
        case 'noSrc':
        case 'movie':
          continue
        case 'id':
        case 'name':
        case 'width':
        case 'height':
        case 'style':
          void 0 !== t[o] && i.push(' ', o, '="', t[o], '"')
          break
        case 'src':
          a ? r.push('<param name="movie" value="', t.noSrc ? '' : t[o], '"/>') : i.push(' data="', t.noSrc ? '' : t[o], '"')
          break
        default:
          r.push('<param name="', o, '" value="', t[o], '" />')
      }
    }
    return a ? i.push(' classid="clsid:', n || 'D27CDB6E-AE6D-11cf-96B8-444553540000', '"') : i.push(' type="application/x-shockwave-flash"'), location && !location.protocol.includes('https') && i.push(' codeBase="http://fpdownload.macromedia.com/get/flashplayer/current/swflash.cab#version=', e, '"'), `<object${i.join('')}>${r.join('')}</object>`
  }
  const L = 'https://graph.qq.com'; var S = g.Toolkit.extend(function () {
    f.apply(this, arguments)
  }, f)
  g.Object.extend(S.prototype, {
    init() {
      const e = this
      e._connFrame = document.createElement('iframe'), e._connFrame.style.cssText = 'width:0px; height:0px; display:none; overflow:hidden;'
      const t = function () {
        t.fire(), t.fire = k
      }
      t.fire = function () {
        g.Console.info(`PMProxy代理创建成功，耗时${new Date() - e.timeStamp}`), e.isReady = !0, e.send(), e.invoke()
      }, e._connFrame.onload = t, e._connFrame.addEventListener && e._connFrame.addEventListener('load', t, !1), e._connFrame.attachEvent && e._connFrame.attachEvent('onload', t), e._connFrame.src = d.PMCrossPage, QC.Event.domReady(() => {
        document.body.appendChild(e._connFrame)
      })

      function n(t) {
        !t.origin || t.origin != L && t.origin != 'https://qzonestyle.gtimg.cn' || e._preDispatch(e, t)
      }

      window.addEventListener ? window.addEventListener('message', n, !1) : window.attachEvent('onmessage', n)
    },
    _doSend(t) {
      t = g.QueryString.stringify({ uri: t.uri, paras: g.QueryString.stringify(t.paras), fmt: t.fmt, method: t.method })
      this._connFrame.contentWindow.postMessage(t, L)
    },
    dispatch(t) {
      var e = t.data.split(':<.<<#:'); const n = e[0]; const o = e[1]; var t = e[2]; var e = e[3]
      g.Console.log(`data:\t${e}`), f.dispatchReceive(n, e, o, t)
    },
    _doInvoke(t) {
      let e
      g.Console.log(`invoke:\t${t}`), typeof t == 'string' && (t = (e = t.split('#'))[0], e = e[1] && e[1].split(','), f.getFunction(t).apply(null, e))
    },
    onDispose() {
      this._connFrame.parentNode.removeChild(this._connFrame), this._connFrame = null
    },
  })
  var E = g.Toolkit.extend(function () {
    f.apply(this, arguments)
  }, f)
  g.Object.extend(E.prototype, {
    init() {
      g.Console.info(`init:${arguments}`)
    },
    _doSend(t) {
      g.Console.info(`_doSend:${arguments}`)
    },
    dispatch(t) {
      g.Console.info(`dispatch:${arguments}`)
    },
  }), g.XHRRequest = h, g.request = function (t, e, n, o) {
    return new h(t, e, n, o)
  }
  let Q; let T; const P = []

  function M(t) {
    const e = g.Login._getTokenKeys()
    if (R <= 0)
      throw new Error('意外的调用了绑定token到req的方法 bindTokenPara')
    return t.paras.oauth_consumer_key = R, t.paras.access_token = e.accessToken, t.paras.openid = e.openid, t.paras.format = t.fmt, t
  }

  function j(e, t, n, o) {
    b = f.generateProxy()
    const i = B(e)
    e = i.api || e, o = o || i.method
    const r = new u(e, t = t || {}, n, o)
    return R > 0
      ? setTimeout(() => {
          const t = g.Login._getTokenKeys()
          t.openid && t.accessToken ? b.send(M(r)) : (T.push(r), g.Console.log(`openid与accessToken丢失，调用请求入栈 : [${e}]，栈大小：${T.length}`))
        }, 10)
      : (T.push(r), g.Console.log(`${b.isReady && R < 0 ? 'token获取失败，请调用用户登录流程' : 'api代理尚未初始化成功'}，调用请求入栈 : [${e}]，栈大小：${T.length}`)), r.success(() => {
      QC.valueStat(i.statId, 1, 0)
    }).error((t) => {
      t = t || {}
      QC.valueStat(i.statId, 1, typeof t.ret == 'number' ? t.ret : 1)
    }), r
  }

  g.api = (T = [], j._ready = function () {
    let t
    for (g.Console.info('init成功，开始触发api调用堆栈'); t = T.shift();) b.send(M(t))
  }, j.getDoc = (Q = null, function (t, e) {
    let n, o, i
    Q && e
      ? e(Q[t])
      : (n = t, o = e || k, (i = document.createElement('script')).type = 'text/javascript', i.src = 'https://qzonestyle.gtimg.cn/qzone/openapi/qc_jsdkdoc.js', document.body.appendChild(i), window.on_qc_jsdkdoc_loaded = function (t) {
          Q = t, o && o(Q[n]), document.body.removeChild(i), i = null
        })
  }), j)
  g.Login = (function () {
    let d; let p; let u; const l = {
      A_XL: { styleId: 5, size: '230*48' },
      A_L: { styleId: 4, size: '170*32' },
      A_M: { styleId: 3, size: '120*24' },
      A_S: { styleId: 2, size: '105*16' },
      B_M: { styleId: 7, size: '63*24' },
      B_S: { styleId: 6, size: '50*16' },
      C_S: { styleId: 1, size: '16*16' },
    }

    function s(n) {
      n.clientId && QC.init({ appId: n.clientId })
      const o = QC.getAppId()
      if (o < 0) {
        QC.getAppId(arguments)
      }
      else {
        n.size = n.size || 'B_M'
        const t = _(n.btnId); const e = (l[n.size] || l.B_M).styleId; var i = n.fullWindow || !1; var r = n.btnMode || 'standard'
        n.redirectURI = n.redirectURI || O
        let a; var s; var i = { size: e, fullWindow: i, url: arguments.callee._getPopupUrl(n) }
        if (n && n.btnId) {
          if (!t)
            throw new Error('未找到插入节点:')
          t.innerHTML = arguments.callee.getBtnHtml(i, r, n)
          let c; var r = t.firstChild.onclick
          n.showModal
            ? ((c = document.createElement('DIV')).style = 'position: absolute; visibility: hidden; width: 500px;height: 620px; padding: 0px; margin: 0px;border:1px #ddd solid; background: white;', c.innerHTML = '<iframe id="qq_login_iframe" frameborder="0" width="100%" height="100%"></iframe>', c.style.top = 0, c.style.left = `${window.innerWidth / 2 - 250}px`, document.body.appendChild(c), t.firstChild.onclick = function () {
                let t; const e = document.getElementById('qq_login_iframe')
                e.src || (t = '?', t += 'response_type=token&', t += `client_id=${o}&`, t += `redirect_uri=${n.redirectURI}`, e.src = `https://graph.qq.com/oauth2.0/authorize${t}`), c.style.visibility = 'visible'
              })
            : t.firstChild.onclick = (a = r, window.addEventListener ? window.addEventListener('unload', d, !1) : window.attachEvent('onunload', d), function () {
              return s && s.close(), s = a(), g._create_fla_proxy(), QC.pv('graph.qq.com', '/open/connect/click'), !1
            })
        }
      }

      function d() {
        s && s.close(), QC.Cookie.del('__qc_wId')
      }
    }

    s.TEMPLATE = ['<a href="javascript:;" onclick="{onclick};"><img src="{src}" alt="{alt}" border="0"/></a>'].join(''), (s.getBtnHtml = function (t, e, n) {
      return arguments.callee.MODE[e] && arguments.callee.MODE[e](t, n)
    }).MODE = {
      standard(t) {
        const e = 1e4 + ~~C.get('__qc_wId')
        return y.format(s.TEMPLATE, {
          src: `https://qzonestyle.gtimg.cn/qzone/vas/opensns/res/img/Connect_logo_${t.size}.png`,
          onclick: t.fullWindow ? `return window.open('${t.url}', 'oauth2Login_${e}');` : `return window.open('${t.url}', 'oauth2Login_${e}' ,'height=525,width=585, toolbar=no, menubar=no, scrollbars=no, status=no, location=yes, resizable=yes')`,
          alt: 'QQ登录',
        })
      },
      showUserAfterLogin(t, e) {
        const n = v.stringify(e); var e = (l[e.size] || l.B_M).size.split('*')
        return `<iframe frameBorder="0" scrolling="no" src="https://qzs.qq.com/qzone/openapi/frames/login_button.html#para=${encodeURIComponent(n)}" width="${Math.max(200, e[0])}" height="${e[1]}" allowTransparency="true"></iframe>`
      },
    }, s._getPopupUrl = function (t) {
      const e = t.scope || 'all'; var n = t.redirectURI || ''; const o = t.display || ''; var t = t.appId || QC.getAppId()
      var n = n || 'http%3A%2F%2Fqzonestyle.gtimg.cn%2Fqzone%2Fopenapi%2Fredirect-1.0.1.html'
      x <= 6 && (n = `https://graph.qq.com/jsdkproxy/redirect_ie6.html#${encodeURIComponent(n)}`)
      t = [`client_id=${t}`, 'response_type=token']
      return e && t.push(`scope=${e}`), n && (n.indexOf('://') > 0 && (n = encodeURIComponent(n)), t.push(`redirect_uri=${n}`)), o == 'mobile' && t.push(`display=${o}`), `https://graph.qq.com/oauth2.0/authorize?${t.join('&')}`
    }

    function t(e, n, t, o) {
      let i, r

      function a() {
        for (let t = 0; t < f.length; t++) (0, f[t])(c)
      }

      return p = p || e.access_token, o || t === null || m.push((i = e, function () {
        (t || k)(i), s(i)
      })), o || n === null || f.push((r = e, function (t) {
        (n || function (t, e) {
          QC.Login.fillUserInfo(e.btnId, t)
        })(t, r)
      })), c
        ? a()
        : p
          ? h((t) => {
              t
                ? QC.api('get_user_info').success((t) => {
                    c = t.data, a()
                  }).error((t) => {
                    QC.Console.error(`Login => getMe 获取数据失败${t}`)
                  })
                : s(e)
            })
          : s(e), QC.valueStat(350368, 1, 0), null
    }

    let c; const o = function () {
      return p || (function () {
        let t; let e; const n = location && location.hash.match(/access_token=([^&]*)/i)
        if ((e = C.get('__qc__k')) && (t = e.split('='), e.length && t.length != 2))
          throw new Error('QQConnect -> cookie : __qc__k 格式非法')
        p = n && n[1] || t && t[1]
      }())
    }; var h = (function () {
      let i; const r = []
      o()

      function n(e, n, o) {
        for (var t; t = r.shift();) {
          setTimeout(function (t) {
            return function () {
              t(e, n, o)
            }
          }(t))
        }
      }

      let a; let s; const e = function (t) {
        q.error(`${t} : _getMeError`), window.callback({ error_description: t })
      }; const c = function (t) {
        s = s || window.callback, t && c.cbPool.push(t), window.callback = function (t) {
          if (clearTimeout(i), t.openid) {
            let e; const n = d = (u = t).openid; const o = p
            for (q.log(` getMe => openId & accessToken ${[n, o, a ? '通过me接口' : '通过本地']}`); e = c.cbPool.shift();) e(n, p, t)
            a = null, window.callback = s
          }
        }, o()
          ? u
            ? window.callback(u)
            : a || ((a = document.createElement('script')).type = 'text/javascript', a.src = `https://graph.qq.com/oauth2.0/me?access_token=${p}`, a.onerror = function () {
              e('me接口返回格式错误')
            }, (t = document.getElementsByTagName('head')[0]) && t.appendChild(a), i = setTimeout(() => {
              e('me接口超时')
            }, 5e3))
          : e('access_token丢失')
      }
      return c.cbPool = [], function (t, e) {
        e ? r.unshift(t) : r.push(t), c(n), QC.valueStat(350371, 1, 0)
      }
    }()); var f = []; var m = []
    return w.extend(t, {
      insertButton: s,
      getMe: h,
      showPopup(t) {
        t = s._getPopupUrl(t || {})
        return QC.valueStat(350369, 1, 0), window.open(t)
      },
      signOut() {
        d = '', document.cookie = ['__qc__k=', 'path=/;'].join(';'), (function () {
          p = void 0, c = u = null
          for (let t = 0; t < m.length; t++) (0, m[t])()
          QC.valueStat(350370, 1, 0)
        }())
      },
      _getTokenKeys() {
        return { openid: d, accessToken: p }
      },
      check() {
        return QC.valueStat(350372, 1, 0), !!p
      },
      _check() {
        return !!(u && p && c)
      },
      _onLoginBack(t, e, n) {
        t && e && (d = t, document.cookie = [`__qc__k=${['TC_MK', e].join('=')}`, 'path=/'].join(';')), u = {
          client_id: u && u.client_id || -1,
          openid: d,
        }, o(), QC.Event.domReady(() => {
          QC.init(), n || QC.Login({}, null, null, 1)
        })
      },
      reset() {
        f = [], m = []
      },
      fillUserInfo(t, e) {
        const n = _(t)
        var t = ['<span class="qc_item figure"><img src="{figureurl}" class="{size_key}"/></span>', '<span class="qc_item nickname" style="margin-left:6px;">{nickname}</span>', '<span class="qc_item logout"><a href="javascript:QC.Login.signOut();" style="margin-left:6px;">退出</a></span>'].join('')
        n && (n.innerHTML = QC.String.format(t, { nickname: QC.String.escHTML(e.nickname), figureurl: e.figureurl }))
      },
    }), t
  }())
  var R = -1; let F = null; var O = ''
  g.init = function (o) {
    F = o = o || F || {}
    const t = g.Login._getTokenKeys()
    if (R = o.appId, O = o.redirectURI, t.openid) {
      g.Login.getMe((t, e, n) => {
        !~~n.error && (n.client_id <= 0 || n.client_id % 1e6 == o.appId % 1e6) ? (R = n.client_id = o.appId || o.clientId || o.app_id || o.client_id || -1, g.api._ready && g.api._ready()) : g.Console.error(n.error_description || 'appId/client_id 不匹配')
      }, !0)
    }
    else if (f.invoke(), P.length && o.appId > -1) {
      for (let e = 0; e < P.length; e++) P[e]()
    }
  }, g.getAppId = function (t) {
    return t && P.push(() => {
      t.callee.apply(null, t)
    }), R
  }, g.invoke = function () {
    f.generateProxy('FLAProxy').invoke(arguments)
  }
  let D; let A; let z; var B = (D = {
    get_user_info: { api: 'https://graph.qq.com/user/get_user_info', method: 'get', statId: 350373 },
    add_topic: { api: 'https://graph.qq.com/shuoshuo/add_topic', method: 'post', statId: 350374 },
    add_one_blog: { api: 'https://graph.qq.com/blog/add_one_blog', method: 'post', statId: 350375 },
    add_album: { api: 'https://graph.qq.com/photo/add_album', method: 'post', statId: 350376 },
    upload_pic: { api: 'https://graph.qq.com/photo/upload_pic', method: 'post', statId: 350377 },
    list_album: { api: 'https://graph.qq.com/photo/list_album', method: 'get', statId: 350391 },
    add_share: { api: 'https://graph.qq.com/share/add_share', method: 'post', statId: 350378 },
    check_page_fans: { api: 'https://graph.qq.com/user/check_page_fans', method: 'get', statId: 350379 },
    add_t: { api: 'https://graph.qq.com/t/add_t', method: 'post', statId: 350380 },
    add_pic_t: { api: ' https://graph.qq.com/t/add_pic_t', method: 'post', statId: 350381 },
    del_t: { api: 'https://graph.qq.com/t/del_t', method: 'post', statId: 350382 },
    get_repost_list: { api: 'https://graph.qq.com/t/get_repost_list', method: 'get', statId: 350383 },
    get_info: { api: 'https://graph.qq.com/user/get_info', method: 'get', statId: 350384 },
    get_other_info: { api: 'https://graph.qq.com/user/get_other_info', method: 'get', statId: 350385 },
    get_fanslist: { api: 'https://graph.qq.com/relation/get_fanslist', method: 'get', statId: 350386 },
    get_idollist: { api: 'https://graph.qq.com/relation/get_idollist', method: 'get', statId: 350387 },
    add_idol: { api: 'https://graph.qq.com/relation/add_idol', method: 'post', statId: 350388 },
    del_idol: { api: 'https://graph.qq.com/relation/del_idol', method: 'post', statId: 350389 },
    get_tenpay_addr: { api: 'https://graph.qq.com/cft_info/get_tenpay_addr', method: 'get', statId: 350390 },
  }, function (t) {
    return D[t] || {}
  })
  A = t('appid'), z = t('redirecturi'), A && (g.Console.info(`检测到自动初始化参数\nappId:${A}\nrUri:${z}`), isNaN(A)
    ? g.Console.error('参数appid错误')
    : z && z.indexOf('http') != 0
      ? g.Console.error('参数rediectURI错误')
      : g.Event.domReady(() => {
          g.init({ appId: A, redirectURI: z })
        })), t('callback')
    ? (window._b_is_qc_cb_win = !0, QC.Login.getMe((e, n, t) => {
        if (window.opener) {
          QC.Console.info('cb_method_1:window.opener.QC.Login._onLoginBack')
          try {
            window.opener.QC.Login._onLoginBack(e, n)
          }
          catch (t) {
            QC.Console.info('cb_method_2:window.opener.postMessage')
            try {
              window.opener.postMessage(`invoke@@@QC.Login._onLoginBack#${[e, n].join(',')}`, '*')
            }
            catch (t) {
              QC.Console.info('cb_method_3:QC.invoke')
              try {
                QC.invoke('QC.Login._onLoginBack', e, n)
              }
              catch (t) {
                QC.Console.info('cb_method_5:[empty]')
              }
            }
          }
        }
        else {
          QC.Console.info('cb_method_4:QC.invoke')
          try {
            QC.invoke('QC.Login._onLoginBack', e, n)
          }
          catch (t) {
          }
        }
        setTimeout(() => {
          (x > 7 ? window.open('about:blank', '_self') : window).close()
        }, 1e3)
      }), QC.pv('graph.qq.com', '/open/connect/channel/pv'))
    : (A && QC.Login.check()
        ? (QC.Event.domReady(() => {
            QC.Login.getMe((t, e) => {
              QC.Login._onLoginBack(t, e, 1)
            })
          }), QC.pv('graph.qq.com', '/open/connect/logged_in/pv'))
        : QC.pv('graph.qq.com', '/open/connect/pv'), QC.reportBNL(11236, A))
}(QC)), window.qc = QC, typeof Object.freeze == 'function' && Object.freeze(QC)
