class Canvas extends Eventable {

  constructor(app) {
    super()

    this.app = app

    this.renderLayer = new CanvasRenderLayer(this)
    this.drawLayer = new CanvasDrawLayer(this)
    this.layers = [this.renderLayer]

    this.render()
  }

  render() {
    this.el = document.createElement('div')

    this.el.id = 'draw-canvas'

    this.el.appendChild(this.renderLayer.el)
    this.el.appendChild(this.drawLayer.el)
    this.app.el.appendChild(this.el)
  }

}
