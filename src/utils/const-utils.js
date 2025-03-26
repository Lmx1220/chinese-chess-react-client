import oCanvas from 'ocanvas'

let canvasReferences = []
const canvasContexts = new Map()
const arcAnimations = new Map()
const canvasAnimations = new Map()
const canvasElements = []
export function initializeCanvas(elements) {
  clearCanvas()
  createCanvas(elements)
  setupResizeListener()
}

export function updateAnimation(userId, totalSteps, totalTime, stepTime) {
  if (canvasContexts.has(userId) && !canvasAnimations.has(userId)) {
    const { context, width, height, pixelRatio } = canvasContexts.get(userId)
    if (context) {
      const animationElement = arcAnimations.get(userId)
      if (animationElement) {
        animationElement.opacity = 1
        animationElement.stop().animate({ start: 360 }, {
          easing: 'linear',
          duration: 1000 * stepTime,
          queue: 'head-canvas-move',
        })
        canvasAnimations.set(userId, { allTime: totalTime })
      }
      else {
        context.reset()
        const strokeWidth = 3 * pixelRatio
        const arc = context.display.arc({
          x: Math.floor(width / 2),
          y: Math.floor(height / 2),
          radius: Math.ceil(Math.floor(width / 2) - strokeWidth / 2),
          start: 360 / totalSteps * (totalSteps - stepTime),
          end: 360,
          stroke: `${strokeWidth}px linear-gradient(180deg, #6089e8, #41D8DD)`,
          opacity: 1,
        })
        arc.rotate(-90)
        context.addChild(arc)
        canvasElements.push(arc)
        arcAnimations.set(userId, arc)
      }
    }
  }
}

export function stopAnimation(userId) {
  canvasAnimations.delete(userId)
  const animationElement = arcAnimations.get(userId)
  if (animationElement) {
    animationElement.opacity = 0
    animationElement.stop().animate({ start: 0 }, { easing: 'linear', duration: 0 })
  }
}
export function removeCanvas(userId) {
  stopAnimation(userId)
  arcAnimations.delete(userId)
  canvasAnimations.delete(userId)
}
export function clearCanvas() {
  clearAnimations()
  canvasContexts.clear()
  arcAnimations.clear()
  canvasAnimations.clear()
}
export function createCanvas(elements) {
  const pixelRatio = window.devicePixelRatio || 1
  elements.forEach(({ userId, el: element, ctx: context }) => {
    const canvasId = `canvas-${userId}`
    element.innerHTML = ''
    context && context.destroy()
    const width = element.clientWidth
    const height = element.clientHeight
    const canvas = document.createElement('canvas')
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    canvas.style.position = 'absolute'
    canvas.style.zIndex = '1'
    canvas.style.top = '0px'
    canvas.id = canvasId
    canvas.width = width * pixelRatio
    canvas.height = height * pixelRatio
    element.appendChild(canvas)
    const ctx = oCanvas.create({ canvas: `#${canvasId}`, fps: 10 })
    ctx.events.enabled = false
    canvasContexts.set(userId, { context: ctx, width: width * pixelRatio, height: height * pixelRatio, pixelRatio })
    arcAnimations.delete(userId)
  })
  canvasReferences = elements
}
function setupResizeListener() {
  window.addEventListener('resize', (_e) => {
    createCanvas(canvasReferences)
  })
}
function clearAnimations() {
  canvasElements.forEach(element => element.remove(false))
  canvasContexts.forEach(({ context }) => context.destroy())
}
