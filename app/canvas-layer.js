class CanvasLayer extends Eventable {

  constructor(canvas) {
    super()

    this.canvas = canvas

    this.paths = []

    this.build()
  }

  build() {
    this.el = document.createElement('canvas')

    this.el.height = document.documentElement.clientHeight
    this.el.width = document.documentElement.clientWidth

    this.ctx = this.el.getContext('2d')

    this.ctx.lineJoin = "round"
    this.ctx.lineCap = "round"
  }

  beginPath() {
    this.ctx.beginPath()
  }

  setProps() {
    this.ctx.globalCompositeOperation = this.path.mode === 'draw' ? 'source-over' : 'destination-out'
    this.ctx.strokeStyle = this.path.colour
    this.ctx.globalAlpha = this.path.opacity
    this.ctx.lineWidth = this.path.size
  }

  setup() {
    this.path = new Path(this)
  }

  draw() {
    this.setProps()
    this.path.update()
    this.renderProgress()
  }

  finish() {
    this.path.update()
    this.path.simplify()

    if (this === this.canvas._drawLayer) {
      this.clear()
    }

    this.canvas.renderLayer.path = this.path
    this.canvas.renderLayer.paths.push(this.path)
    this.canvas.renderLayer.setProps()
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
    this.renderSegments(this.path.segments)
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

      if (!next) {
        return
      }

      if (i === 0) {
        this.ctx.moveTo(segment.point.x, segment.point.y)
      }

      this.ctx.bezierCurveTo(segment.handleOut.x, segment.handleOut.y, next.handleIn.x, next.handleIn.y, next.point.x, next.point.y)
    })

    this.ctx.stroke()
  }

  clear() {
    this.ctx.clearRect(0, 0, this.el.width, this.el.height)
  }

}
