class PenSize extends Button {

  constructor(app) {
    super(app)

    this.title = 'Size'
    this.panel = new PenSizePanel(this)
  }

  render() {
    this.el = document.createElement('div')

    this.el.id = 'pen-size'
    this.el.classList.add('button')

    this.app.el.appendChild(this.el)
  }

}
