class Button extends Eventable {

  constructor(app) {
    super()

    this.app = app

    this.render()
    this.tooltip()

    this.el.addEventListener('mousedown', this.stopPropagation)
    this.el.addEventListener('mouseup', this.stopPropagation)
    this.el.addEventListener('mousemove', this.stopPropagation)
    this.el.addEventListener('touchstart', this.stopPropagation)
    this.el.addEventListener('touchmove', this.stopPropagation)
    this.el.addEventListener('touchend', this.touchEnd.bind(this))
  }

  set title(title) {
    this.tooltip.textContent = title
  }

  tooltip() {
    this.tooltip = document.createElement('div')

    this.tooltip.classList.add('tooltip')

    this.el.appendChild(this.tooltip)
  }

  stopPropagation(e) {
    e.stopPropagation()
  }

  touchEnd(e) {
    e.stopPropagation()
    e.target.click()
  }

}
