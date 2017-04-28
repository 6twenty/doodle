class PenColour extends Button {

  constructor(app) {
    super(app)

    this.title = 'Colour'
    this.panel = new PenColourPanel(this)

    this.el.onclick = this.click.bind(this)
  }

  render() {
    this.el = document.createElement('div')

    this.el.id = 'pen-colour'
    this.el.classList.add('button')
    this.el.appendChild(document.createElement('div'))

    this.app.el.appendChild(this.el)
  }

  click() {
    this.panel.open()
  }

}
