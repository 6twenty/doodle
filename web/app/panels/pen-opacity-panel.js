class PenOpactyPanel extends Panel {

  constructor(button) {
    super()

    this.button = button
    this.app = this.button.app

    this.render('pen-opacity-panel')

    this.on('pen:ready', this.update)
    this.on('slider:change', this.sliderChange)
  }

  renderPanel() {
    this.slider = new Slider(this.el, Pen.opacities)

    this.slider.el.classList.add('opacity-slider')

    this.el.appendChild(this.slider.el)
  }

  update(changes) {
    this.slider.setStep(changes.opacity)
  }

  sliderChange(change) {
    this.app.pen.opacity = change.step
  }

}
