class CanvasLayer extends Eventable {

  constructor(canvas) {
    super()

    this.canvas = canvas

    this.build()
  }

  build() {
    this.el = document.createElement('canvas')

    this.el.height = window.innerHeight
    this.el.width = window.innerWidth
  }

}
