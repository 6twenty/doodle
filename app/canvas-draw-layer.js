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
    this.path.update()
    // this.path.simplify()
    this.render()
    // STATE.paths.push(STATE.path)
    this.cleanup()
  }

  cleanup() {
    this.path = null
  }

  render() {
    this.path.points.forEach((point, i, points) => {
      if (i === 0) {
        this.ctx.moveTo(point.x, point.y)
        console.log('moveTo')
      }

      if (i < points.length - 1) {
        this.ctx.lineTo(point.x, point.y)
        console.log('lineTo')
      }
    })

    this.ctx.stroke()
  }

}
