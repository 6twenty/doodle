class Canvas extends Eventable {

  constructor(app) {
    super()

    this.app = app
    this.state = {}

    this._renderLayer = new CanvasLayer(this)
    this._drawLayer = new CanvasLayer(this)

    this.render()
  }

  get renderLayer() {
    return this._renderLayer
  }

  // For erasing, the render layer is drawn on directly
  get drawLayer() {
    if (this.app.pen.mode === 'erase') {
      return this._renderLayer
    } else {
      return this._drawLayer
    }
  }

  render() {
    this.el = document.createElement('div')

    this.el.id = 'draw-canvas'

    this.el.appendChild(this.renderLayer.el)
    this.el.appendChild(this.drawLayer.el)
    this.app.el.appendChild(this.el)
  }

  resize() {
    this.drawLayer.resize()
    this.renderLayer.resize()
    this.renderLayer.redraw()
  }

  startPanning() {
    this.state.panOrigin = this.app.pointer.clone()
  }

  pan() {
    const point = this.app.pointer.subtract(this.state.panOrigin)

    this.renderLayer.clear()
    this.drawLayer.pan(point)
    this.renderLayer.pan(point)
    this.renderLayer.redraw()

    this.app.matrix = this.app.matrix.translate(point.x, point.y);

    this.startPanning()
  }

  finishPanning() {
    delete this.state.moveOrigin
  }

}
