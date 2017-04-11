class CanvasDrawLayer extends CanvasLayer {

  setup() {
    if (this.canvas.app.state.momentum) {
      this.canvas.app.state.momentum = false
    }

    this.path = new Path(this)
  }

  draw() {
    this.path.update()
    this.render()
  }

  finish() {
    this.canvas.renderLayer.render(this.path)
    this.path = null
    this.clear()
  }

  render() {
    this.clear()
    this.beginPath(this.path)

    this.path.points.forEach((point, i, points) => {
      if (i === 0) {
        this.ctx.moveTo(point.x, point.y)
      }

      if (i < points.length - 1) {
        this.ctx.lineTo(point.x, point.y)
      }
    })

    this.ctx.stroke()
  }

  clear() {
    this.ctx.clearRect(0, 0, this.el.width, this.el.height)
  }

}
