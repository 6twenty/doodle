class Button extends Eventable {

  constructor(app) {
    super()

    this.app = app

    this.render()

    this.el.addEventListener('mousedown', this.stopPropagation)
    this.el.addEventListener('mouseup', this.stopPropagation)
    this.el.addEventListener('mousemove', this.stopPropagation)
  }

  stopPropagation(e) {
    e.stopPropagation()
  }

}
