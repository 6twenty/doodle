class PenMode extends Eventable {

  constructor(app) {
    super()

    this.app = app

    this.render()

    this.panel = new PenModePanel(this)

    this.el.onclick = this.click.bind(this)

    this.on('pen:mode', this.update)
  }

  render() {
    this.el = document.createElement('div')

    this.el.id = 'pen-mode'
    this.el.classList.add('draw-mode')
    this.el.classList.add('button')

    this.app.el.appendChild(this.el)
  }

  click() {
    this.panel.open()
  }

  update(change) {
    this.el.classList.remove('draw-mode')
    this.el.classList.remove('erase-mode')
    this.el.classList.add(`${change.mode}-mode`)
  }

}
