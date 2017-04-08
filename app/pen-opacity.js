class PenOpacity extends Eventable {

  constructor() {
    super()

    this.render()

    this.panel = new PenOpactyPanel()

    this.el.onclick = this.click.bind(this)
  }

  render() {
    this.el = document.createElement('div')

    this.el.id = 'pen-opacity'
    this.el.classList.add('button')

    document.body.appendChild(this.el)
  }

  click() {
    this.panel.open()
  }

}
