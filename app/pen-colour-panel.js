class PenColourPanel extends Panel {

  constructor(button) {
    super()

    this.button = button
    this.app = this.button.app

    this.colours = [
      '#46648e',
      '#8bbbff',
      '#89ad48',
      '#d1d642',
      '#8c5ba7',
      '#ca76bf',
      '#d7503c',
      '#f49f14',
      '#fae014',
      '#000000',
      '#ffffff'
    ]

    this.render('pen-colour-panel')
  }

  renderPanel() {
    this.colours.forEach(hex => {
      const el = document.createElement('span')

      el.classList.add('pen-colour')
      el.style.backgroundColor = hex
      el.onclick = this.penColourClick.bind(this, hex)

      this.el.appendChild(el)
    })
  }

  penColourClick(hex) {
    this.app.pen.colour = hex

    this.close()
  }

}
