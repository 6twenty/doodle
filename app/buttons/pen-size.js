class PenSize extends Button {

  constructor(app) {
    super(app)

    this.panel = new PenSizePanel(this)

    this.el.onclick = this.click.bind(this)
  }

  render() {
    this.el = document.createElement('div')

    this.el.id = 'pen-size'
    this.el.title = 'Size'
    this.el.classList.add('button')

    this.app.el.appendChild(this.el)
  }

  click() {
    this.panel.open()
  }

}
