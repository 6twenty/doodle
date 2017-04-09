class PenSizePanel extends Panel {

  constructor(button) {
    super()

    this.button = button
    this.app = this.button.app

    this.render('pen-size-panel')

    this.on('pen:ready', this.update)
    this.on('slider:change', this.sliderChange)
  }

  renderPanel() {
    this.slider = new Slider(Pen.sizes)

    const left = document.createElement('div')
    const right = document.createElement('div')

    left.classList.add('pen-size-slider-left')
    right.classList.add('pen-size-slider-right')

    left.style.height = '5px'
    left.style.width = '5px'
    right.style.height = '50px'
    right.style.width = '50px'

    this.el.appendChild(left)
    this.el.appendChild(right)
    this.el.appendChild(this.slider.el)
  }

  update(changes) {
    this.slider.setStep(changes.size)
  }

  sliderChange(change) {
    this.app.pen.size = change.step
  }

}
