class CanvasLayer extends Eventable {

  constructor(canvas) {
    super()

    this.canvas = canvas

    this.build()
  }

  build() {
    this.el = document.createElement('canvas')

    this.el.height = 10000
    this.el.width = 10000
  }

}
