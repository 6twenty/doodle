class PenMode extends Eventable {

  constructor() {
    super()

    this.render()

    this.panel = new PenModePanel()

    this.el.onclick = this.click.bind(this)
  }

  render() {
    this.el = document.createElement('div')

    this.el.id = 'pen-mode'
    this.el.classList.add('button')

    document.body.appendChild(this.el)
  }

  click() {
    this.panel.open()
  }

}
