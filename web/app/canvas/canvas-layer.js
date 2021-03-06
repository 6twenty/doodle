class CanvasLayer extends Eventable {

  static get VARIANCE() {
    return 0.2
  }

  constructor(canvas, id) {
    super()

    this.canvas = canvas
    this.id = id
    this.visible = true
    this.paths = []

    this.build()
  }

  build() {
    this.el = document.createElement('canvas')

    if (this.id) {
      this.el.dataset.id = this.id
    }

    this.ctx = this.el.getContext('2d')

    this.resize()
    this.transform()
  }

  setProps(path) {
    this.ctx.lineJoin = "round"
    this.ctx.lineCap = "round"

    this.ctx.globalCompositeOperation = path.mode === 'erase' ? 'destination-out' : 'source-over'
    this.ctx.strokeStyle = path.colour
    this.ctx.fillStyle = path.colour
    this.ctx.globalAlpha = path.opacity
    this.ctx.lineWidth = path.size
  }

  setDebugProps(colour) {
    this.ctx.globalCompositeOperation = 'source-over'
    this.ctx.strokeStyle = colour
    this.ctx.fillStyle = 'black'
    this.ctx.globalAlpha = 1
    this.ctx.lineWidth = 0.5
  }

  setup() {
    this.path = new Path(this.canvas)
  }

  draw() {
    this.setProps(this.path)
    this.path.update()
    this.renderProgress()
  }

  finish() {
    this.path.update()
    this.path.setBounds()
    this.path.simplify()
    this.pathOffset()

    this.clear()

    this.canvas.renderLayer.path = this.path
    this.canvas.renderLayer.paths.push(this.path)
    this.canvas.renderLayer.renderFinal()

    this.canvas.save(this.path)

    this.path = null
  }

  pathOffset() {
    if (this.path.segments.length === 1) {
      return
    }

    const maxWidth = Math.round(this.ctx.lineWidth * CanvasLayer.VARIANCE)

    let width = 0

    this.path.segments.forEach((segment, i, segments) => {
      let angleOffset = undefined

      if (segment.handleOut) {
        angleOffset = segment.handleOut.subtract(segment.point)
      } else if (segment.handleIn) {
        angleOffset = segment.point.subtract(segment.handleIn)
      }

      const remaining = segments.length - (i + 1)
      const change = Math.random() > 0.5 ? width++ : width--

      // Can't be less than 0 or greater than maxWidth
      width = Math.min(Math.max(0, width), maxWidth)

      // Force reducing to 0 near the end
      if (remaining < width) {
        width = remaining
      }

      const angle = Math.atan2(angleOffset.y, angleOffset.x) + (Math.PI / 2)
      const offset = new Point(Math.cos(angle), Math.sin(angle)).normalize(width)

      segment.offset = offset
    })
  }

  renderProgress() {
    if (this.path.opacity < 1) {
      this.clear()
      this.renderProgressAll()
    } else {
      // Better performance: only render what's changed
      this.renderProgressRecent()
    }
  }

  renderProgressAll() {
    this.renderPoints(this.path.points)
  }

  renderProgressRecent() {
    this._index = this._index || 1

    this.renderPoints(this.path.points.slice(this._index - 1))

    this._index = this.path.points.length
  }

  renderFinal() {
    // If drawing directly onto the render layer, the layer needs to be
    // cleared and re-drawn. Otherwise, only the last path needs to be drawn
    if (this.canvas.drawLayer === this.canvas.renderLayer) {
      this.clear()
      this.redraw()
    } else {
      this.canvas.renderLayer.setProps(this.path)
      this.renderSegments(this.path)
    }
  }

  redraw() {
    this.paths.forEach(path => {
      this.setProps(path)
      this.renderSegments(path)
    })
  }

  renderPoints(points) {
    this.ctx.beginPath()

    if (points.length === 1) {
      this.ctx.moveTo(points[0].x, points[0].y)
      this.ctx.arc(points[0].x, points[0].y, this.ctx.lineWidth / 2, 0, 2 * Math.PI)
      this.ctx.fill()

      return
    }

    points.forEach((point, i, points) => {
      if (i === 0) {
        this.ctx.moveTo(point.x, point.y)
      }

      this.ctx.lineTo(point.x, point.y)
    })

    this.ctx.stroke()
  }

  renderSegments(path) {
    this.ctx.beginPath()

    if (path.segments.length > 1) {
      this.ctx.lineWidth *= (1 - CanvasLayer.VARIANCE)

      this.renderSegmentsForward(path)
      this.renderSegmentsBackward(path)
      this.ctx.closePath()
      this.ctx.stroke()
    } else {
      // Just draw a circle
      this.ctx.moveTo(path.segments[0].point.x, path.segments[0].point.y)
      this.ctx.arc(path.segments[0].point.x, path.segments[0].point.y, this.ctx.lineWidth / 2, 0, 2 * Math.PI)
      this.ctx.fill()
    }

    if (this.canvas.app.debug) {
      this.renderSegmentsDebug(path)
    }
  }

  renderSegmentsForward(path) {
    path.segments.forEach((segment, i, segments) => {
      const point = segment.point.subtract(segment.offset)

      if (i > 0) {
        const prev = segments[i - 1]
        const cp1 = prev.handleOut.subtract(prev.offset)
        const cp2 = segment.handleIn.subtract(segment.offset)

        this.ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, point.x, point.y)
      } else {
        this.ctx.moveTo(point.x, point.y)
      }
    })
  }

  renderSegmentsBackward(path) {
    path.segments.slice().reverse().forEach((segment, i, segments) => {
      const point = segment.point.add(segment.offset)

      if (i > 0) {
        const prev = segments[i - 1]
        const cp1 = prev.handleIn.add(prev.offset)
        const cp2 = segment.handleOut.add(segment.offset)

        this.ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, point.x, point.y)
      } else {
        this.ctx.lineTo(point.x, point.y)
      }
    })
  }

  renderSegmentsDebug(path) {
    // Bounding box in blue
    this.setDebugProps('blue')

    this.ctx.beginPath()
    this.ctx.moveTo(path.bounds.left, path.bounds.top)
    this.ctx.lineTo(path.bounds.right, path.bounds.top)
    this.ctx.lineTo(path.bounds.right, path.bounds.bottom)
    this.ctx.lineTo(path.bounds.left, path.bounds.bottom)
    this.ctx.closePath()
    this.ctx.stroke()

    // Curves in red
    this.setDebugProps('red')

    this.ctx.beginPath()

    path.segments.forEach((segment, i, segments) => {
      const point = segment.point

      if (i > 0) {
        const prev = segments[i - 1]
        const cp1 = prev.handleOut
        const cp2 = segment.handleIn

        // Destination point
        this.ctx.moveTo(point.x + 2, point.y)
        this.ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI)
        // Path to destination point
        this.ctx.moveTo(prev.point.x, prev.point.y)
        this.ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, point.x, point.y)
        // Control point 1
        this.ctx.moveTo(prev.point.x, prev.point.y)
        this.ctx.lineTo(cp1.x, cp1.y)
        // Control point 2
        this.ctx.moveTo(point.x, point.y)
        this.ctx.lineTo(cp2.x, cp2.y)
      } else {
        this.ctx.moveTo(point.x + 2, point.y)
        this.ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI)
      }
    })

    this.ctx.stroke()
  }

  clear() {
    this.ctx.save()
    this.ctx.setTransform(1, 0, 0, 1, 0, 0)
    this.ctx.clearRect(0, 0, this.el.width, this.el.height)
    this.ctx.restore()
  }

  resize() {
    const height = document.documentElement.clientHeight
    const width = document.documentElement.clientWidth

    this.el.style.height = `${height}px`
    this.el.style.width = `${width}px`

    this.el.height = height * window.devicePixelRatio
    this.el.width = width * window.devicePixelRatio
  }

  transform() {
    const matrix = this.canvas.matrix

    this.ctx.setTransform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f)
  }

  hide() {
    this.el.style.display = 'none'
    this.visible = false
  }

  show () {
    this.el.style.display = ''
    this.visible = true
  }

}
