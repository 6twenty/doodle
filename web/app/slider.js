class Slider extends Eventable {

  constructor(root, steps) {
    super()

    this.root = root

    this.steps = steps
    this.step = this._step = this.steps[0]

    this.startDragging = this.startDragging.bind(this)
    this.stopDragging = this.stopDragging.bind(this)
    this.drag = this.drag.bind(this)

    this.build()
  }

  get width() {
    const width = document.documentElement.clientWidth - 280

    return width > 300 ? 300 : width
  }

  get stepSize() {
    return this.width / (this.steps.length - 1)
  }

  get stepToPosition() {
    const map = {}

    this.steps.forEach((step, index) => {
      map[step] = index * this.stepSize
    })

    return map
  }

  build() {
    this.el = document.createElement('div')
    this.handle = document.createElement('div')

    this.el.classList.add('slider')

    this.handle.addEventListener('mousedown', this.startDragging.bind(this))
    window.addEventListener('resize', this.setPosition.bind(this))

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
    e.stopPropagation()

    this.dragging = true

    this._startPosition = Math.floor(e.x)

    this.root.addEventListener('mousemove', this.drag)
    this.root.addEventListener('mouseup', this.stopDragging)
    this.root.addEventListener('mouseleave', this.stopDragging)
  }

  stopDragging(e) {
    e.stopPropagation()

    delete this._startPosition

    this.step = this._step

    this.root.removeEventListener('mousemove', this.drag)
    this.root.removeEventListener('mouseup', this.stopDragging)
    this.root.removeEventListener('mouseleave', this.stopDragging)
  }

  drag(e) {
    e.stopPropagation()

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

    const step = this.steps[targetIndex]
    const hasChanged = this._step !== step

    if (hasChanged) {
      this._step = step
      this.setPosition()
    }
  }

}
