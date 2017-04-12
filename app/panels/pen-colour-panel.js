class PenColourPanel extends Panel {

  constructor(button) {
    super()

    this.button = button
    this.app = this.button.app

    this.buttons = {}

    this.render('pen-colour-panel')

    this.on('pen:change', this.update)
  }

  renderPanel() {
    Pen.colours.forEach(hex => {
      const el = document.createElement('div')

      el.classList.add('pen-colour')
      el.style.backgroundColor = hex
      el.onclick = this.penColourClick.bind(this, hex)

      this.buttons[hex] = el

      this.el.appendChild(el)
    })
  }

  penColourClick(hex) {
    this.app.pen.colour = hex

    this.close()
  }

  update(attrs) {
    const active = this.el.querySelector('.pen-colour.active')
    const target = this.buttons[attrs.colour]

    if (active) {
      active.classList.remove('active')
    }

    if (target){
      target.classList.add('active')
    }
  }

}
