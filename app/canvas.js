class Canvas extends Eventable {

  constructor(app) {
    super()

    this.app = app

    this.render()
  }

  render() {
    this.el = document.createElement('div')

    this.el.id = 'draw-canvas'

    this.app.el.appendChild(this.el)
  }

}
