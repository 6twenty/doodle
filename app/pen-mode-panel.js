class PenModePanel extends Panel {

  constructor(app) {
    super()

    this.app = app

    this.render('pen-mode-panel')
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

}
