class DrawLayer extends Button {

  constructor(app) {
    super(app)

    this.title = 'Layer'
    this.panel = new DrawLayerPanel(this)
  }

  render() {
    this.el = document.createElement('div')

    this.el.id = 'draw-layer'
    this.el.classList.add('button')

    this.app.el.appendChild(this.el)
  }

}
