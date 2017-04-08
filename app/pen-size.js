class PenSize extends Eventable {

  constructor(app) {
    super()

    this.app = app

    this.render()

    this.panel = new PenSizePanel(this.app)

    this.el.onclick = this.click.bind(this)
  }

  render() {
    this.el = document.createElement('div')

    this.el.id = 'pen-size'
    this.el.classList.add('button')

    document.body.appendChild(this.el)
  }

  click() {
    this.panel.open()
  }

}
