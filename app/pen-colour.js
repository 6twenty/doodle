class PenColour extends Eventable {

  constructor(app) {
    super()

    this.app = app

    this.render()

    this.panel = new PenColourPanel(this)

    this.el.onclick = this.click.bind(this)
  }

  render() {
    this.el = document.createElement('div')

    this.el.id = 'pen-colour'
    this.el.classList.add('button')
    this.el.appendChild(document.createElement('div'))

    document.body.appendChild(this.el)
  }

  click() {
    this.panel.open()
  }

}
