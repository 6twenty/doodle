class Canvas extends Eventable {

  constructor(app) {
    super()

    this.app = app
    this.state = {}

    const svg = document.querySelector('svg')

    this.matrix = svg.createSVGMatrix()
    this.point = svg.createSVGPoint()

    this._renderLayer = new CanvasLayer(this)
    this._drawLayer = new CanvasLayer(this)

    this.render()
  }

  get pointer() {
    this.point.x = this.app.state.x
    this.point.y = this.app.state.y

    const pt = this.point.matrixTransform(this.matrix.inverse())

    return new Point(pt.x, pt.y)
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
    this.state.panOrigin = this.pointer.clone()
  }

  pan() {
    const point = this.pointer.subtract(this.state.panOrigin)

    this.matrix = this.matrix.translate(point.x, point.y);

    this.renderLayer.clear()
    this.drawLayer.transform()
    this.renderLayer.transform()
    this.renderLayer.redraw()

    this.startPanning()
  }

  finishPanning() {
    delete this.state.moveOrigin
  }

  scale() {
    // To scale centered on the pointer the canvas is first translated
    // so that the pointer is at 0,0; then after scaling it is translated
    // back again.

    const point = this.pointer

    this.matrix = this.matrix.translate(point.x, point.y)
    this.matrix = this.matrix.scale(this.app.state.scale)
    this.matrix = this.matrix.translate(-point.x, -point.y)

    this.renderLayer.clear()
    this.drawLayer.transform()
    this.renderLayer.transform()
    this.renderLayer.redraw()
  }

}
