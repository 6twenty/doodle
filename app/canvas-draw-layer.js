class CanvasDrawLayer extends CanvasLayer {

  constructor(canvas) {
    super(canvas)

    this.startDrawing = this.startDrawing.bind(this)
    this.stopDrawing = this.stopDrawing.bind(this)
    this.draw = this.draw.bind(this)

    this.canvas.app.el.addEventListener('mousedown', this.startDrawing);
  }

  startDrawing(e) {
    console.log('starting drawing')

    this.canvas.app.el.addEventListener('mousemove', this.draw);
    this.canvas.app.el.addEventListener('mouseup', this.stopDrawing);
    this.canvas.app.el.addEventListener('mouseleave', this.stopDrawing);
  }

  stopDrawing(e) {
    console.log('stopping drawing')

    this.canvas.app.el.removeEventListener('mousemove', this.draw)
    this.canvas.app.el.removeEventListener('mouseup', this.stopDrawing)
    this.canvas.app.el.removeEventListener('mouseleave', this.stopDrawing)
  }

  draw(e) {
    console.log('drawing')

  }

}
