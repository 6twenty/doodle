class Slider extends Eventable {

  constructor(steps) {
    super()

    this.steps = steps
    this.stepToPosition = {}
    this.step = this._step = this.steps[0]
    this.stepSize = 300 / (this.steps.length - 1)

    this.steps.forEach((step, index) => {
      this.stepToPosition[step] = index * this.stepSize
    })

    this.startDragging = this.startDragging.bind(this)
    this.stopDragging = this.stopDragging.bind(this)
    this.drag = this.drag.bind(this)

    this.build()
  }

  build() {
    this.el = document.createElement('div')
    this.handle = document.createElement('div')

    this.el.classList.add('slider')

    this.handle.addEventListener('mousedown', this.startDragging.bind(this))

    this.el.appendChild(this.handle)
  }

  setStep(step) {
    this.step = step
    this._step = this.step

    this.setPosition()
  }

  setPosition() {
    const position = this.stepToPosition[this._step]

    this.handle.style.transform = `translateX(${position}px)`

    this.trigger('slider:change', { step: this._step })
  }

  startDragging(e) {
    this.dragging = true

    this._startPosition = Math.floor(e.x)

    document.body.addEventListener('mousemove', this.drag)
    document.body.addEventListener('mouseup', this.stopDragging)
    document.body.addEventListener('mouseleave', this.stopDragging)
  }

  stopDragging(e) {
    delete this._startPosition

    this.step = this._step

    document.body.removeEventListener('mousemove', this.drag)
    document.body.removeEventListener('mouseup', this.stopDragging)
    document.body.removeEventListener('mouseleave', this.stopDragging)
  }

  drag(e) {
    const distance = Math.floor(e.x) - this._startPosition
    const stepsMoved = Math.round(distance / this.stepSize)
    const index = this.steps.indexOf(this.step)

    let targetIndex = index + stepsMoved

    // Cap to the min and max values
    if (targetIndex >= this.steps.length) {
      targetIndex = this.steps.length - 1
    } else if (targetIndex < 0) {
      targetIndex = 0
    }

    this._step = this.steps[targetIndex]

    this.setPosition()
  }

}
