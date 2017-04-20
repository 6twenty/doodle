class CanvasLayer extends Eventable {

  static get VARIANCE() {
    return 0.3
  }

  constructor(canvas, id) {
    super()

    this.canvas = canvas
    this.id = id
    this.paths = []

    this.build()
  }

  build() {
    this.el = document.createElement('canvas')

    if (this.id) {
      this.el.dataset.id = this.id
    }

    this.resize()

    this.ctx = this.el.getContext('2d')
  }

  setProps(path) {
    this.ctx.lineJoin = "round"
    this.ctx.lineCap = "round"

    this.ctx.globalCompositeOperation = path.mode === 'draw' ? 'source-over' : 'destination-out'
    this.ctx.strokeStyle = path.colour
    this.ctx.globalAlpha = path.opacity
    this.ctx.lineWidth = path.size
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
    this.path.simplify()

    this.clear()

    this.canvas.renderLayer.path = this.path
    this.canvas.renderLayer.paths.push(this.path)
    this.canvas.renderLayer.renderFinal()

    this.path = null
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
      this.renderSegments(this.path.segments)
    }
  }

  redraw() {
    this.paths.forEach(path => {
      this.setProps(path)
      this.renderSegments(path.segments)
    })
  }

  renderPoints(points) {
    this.ctx.beginPath()

    points.forEach((point, i, points) => {
      if (i === 0) {
        this.ctx.moveTo(point.x, point.y)
      }

      this.ctx.lineTo(point.x, point.y)
    })

    this.ctx.stroke()
  }

  renderSegments(segments) {
    this.ctx.beginPath()

    if (segments.length > 1) {
      this.ctx.lineWidth *= (1 - CanvasLayer.VARIANCE)

      this.renderSegmentsForward(segments)
      this.renderSegmentsBackward(segments)
      this.ctx.closePath()
      this.ctx.stroke()
    } else {
      this.ctx.moveTo(segments[0].point.x, segments[0].point.y)
      this.ctx.lineTo(segments[0].point.x, segments[0].point.y)
      this.ctx.stroke()
    }
  }

  renderSegmentsForward(segments) {
    let width = this.ctx.lineWidth

    segments.forEach((segment, i, segments) => {
      let offset = undefined

      if (segment.handleOut) {
        offset = segment.handleOut.subtract(segment.point)
      } else if (segment.handleIn) {
        offset = segment.point.subtract(segment.handleIn)
      }

      if (offset) {
        const angle = Math.atan2(offset.y, offset.x) + (Math.PI / 2)
        segment.offset = new Point(Math.cos(angle), Math.sin(angle)).normalize(width * CanvasLayer.VARIANCE)
      } else {
        segment.offset = new Point(0, 0)
      }

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

  renderSegmentsBackward(segments) {
    segments.slice().reverse().forEach((segment, i, segments) => {
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

  clear() {
    this.ctx.save()
    this.ctx.setTransform(1, 0, 0, 1, 0, 0)
    this.ctx.clearRect(0, 0, this.el.width, this.el.height)
    this.ctx.restore()
  }

  resize() {
    this.el.height = document.documentElement.clientHeight
    this.el.width = document.documentElement.clientWidth
  }

  transform() {
    const matrix = this.canvas.matrix

    this.ctx.setTransform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f)
  }

}
