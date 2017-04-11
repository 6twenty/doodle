class CanvasDrawLayer extends CanvasLayer {

  setup() {
    if (this.canvas.app.state.momentum) {
      this.canvas.app.state.momentum = false
    }

    this.path = new Path(this)

    // this.ctx.save()
  }

  draw() {
    this.path.update()
    this.render()
  }

  finish() {
    // STATE.paths.push(STATE.path)
    this.canvas.renderLayer.render(this.path)
    this.clear()
  }

  render() {
    this.ctx.beginPath()

    this.path.points.forEach((point, i, points) => {
      if (i === 0) {
        this.ctx.moveTo(point.x, point.y)
      }

      if (i < points.length - 1) {
        this.ctx.lineTo(point.x, point.y)
      }
    })

    this.ctx.stroke()
    this.ctx.closePath()
  }

  clear() {
    this.path = null
    // this.ctx.restore()
    this.ctx.clearRect(0, 0, this.el.width, this.el.height)
  }

}
