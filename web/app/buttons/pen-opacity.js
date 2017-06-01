class PenOpacity extends Button {

  constructor(app) {
    super(app)

    this.title = 'Opacity'
    this.panel = new PenOpactyPanel(this)
  }

  render() {
    this.el = document.createElement('div')

    this.el.id = 'pen-opacity'
    this.el.classList.add('button')

    this.app.el.appendChild(this.el)
  }

}
