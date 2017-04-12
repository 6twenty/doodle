class Canvas extends Eventable {

  constructor(app) {
    super()

    this.app = app

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

}
