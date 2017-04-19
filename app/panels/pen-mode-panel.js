class PenModePanel extends Panel {

  constructor(button) {
    super()

    this.button = button
    this.app = this.button.app

    this.render('pen-mode-panel')

    this.on('pen:ready', this.update)
    this.on('pen:change', this.update)
  }

  renderPanel() {
    const drawMode = document.createElement('div')
    const eraseMode = document.createElement('div')

    drawMode.classList.add('draw-mode')
    eraseMode.classList.add('erase-mode')

    drawMode.onclick = this.drawModeClick.bind(this)
    eraseMode.onclick = this.eraseModeClick.bind(this)

    this.el.appendChild(drawMode)
    this.el.appendChild(eraseMode)
  }

  drawModeClick() {
    this.app.pen.mode = 'draw'

    this.close()
  }

  eraseModeClick() {
    this.app.pen.mode = 'erase'

    this.close()
  }

  update(attrs) {
    const active = this.el.querySelector('.draw-mode.active, .erase-mode.active')

    if (active) {
      active.classList.remove('active')
    }

    this.el.querySelector(`.${attrs.mode}-mode`).classList.add('active')
  }

}
