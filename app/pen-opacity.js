class PenOpacity extends Eventable {

  constructor(app) {
    super()

    this.app = app

    this.render()

    this.panel = new PenOpactyPanel(this)

    this.el.onclick = this.click.bind(this)
  }

  render() {
    this.el = document.createElement('div')

    this.el.id = 'pen-opacity'
    this.el.classList.add('button')

    this.app.el.appendChild(this.el)
  }

  click() {
    this.panel.open()
  }

}
