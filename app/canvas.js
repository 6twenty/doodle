class Canvas extends Eventable {

  constructor(app) {
    super()

    this.app = app

    this.layers = []

    this.render()
  }

  render() {
    this.el = document.createElement('div')

    this.el.id = 'draw-canvas'

    const layer = new CanvasRenderLayer(this)

    this.layers.push(layer)

    this.drawLayer = new CanvasDrawLayer(this)

    this.el.appendChild(layer.el)
    this.el.appendChild(this.drawLayer.el)
    this.app.el.appendChild(this.el)
  }

}
