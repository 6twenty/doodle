class CanvasLayer extends Eventable {

  constructor(canvas) {
    super()

    this.canvas = canvas
    this.paths = []

    this.build()
  }

  build() {
    this.el = document.createElement('canvas')

    this.resize()

    this.ctx = this.el.getContext('2d')
  }

  beginPath() {
    this.ctx.beginPath()
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
    this.path = new Path(this)
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
    this.beginPath()

    points.forEach((point, i, points) => {
      if (i === 0) {
        this.ctx.moveTo(point.x, point.y)
      }

      this.ctx.lineTo(point.x, point.y)
    })

    this.ctx.stroke()
  }

  renderSegments(segments) {
    this.beginPath()

    segments.forEach((segment, i, segments) => {
      const next = segments[i + 1]

      if (i === 0) {
        this.ctx.moveTo(segment.point.x, segment.point.y)
      }

      if (next) {
        this.ctx.bezierCurveTo(segment.handleOut.x, segment.handleOut.y, next.handleIn.x, next.handleIn.y, next.point.x, next.point.y)
      } else {
        this.ctx.lineTo(segment.point.x, segment.point.y)
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
    this.el.height = document.documentElement.clientHeight
    this.el.width = document.documentElement.clientWidth
  }

  pan() {
    const matrix = this.canvas.app.matrix

    this.ctx.setTransform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f)
  }

}
