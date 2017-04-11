class PenMode extends Button {

  constructor(app) {
    super(app)

    this.panel = new PenModePanel(this)

    this.el.onclick = this.click.bind(this)

    this.on('pen:change', this.update)
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

  update(attrs) {
    this.el.classList.remove('draw-mode')
    this.el.classList.remove('erase-mode')
    this.el.classList.add(`${attrs.mode}-mode`)
  }

}
