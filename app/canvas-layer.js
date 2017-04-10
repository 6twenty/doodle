class CanvasLayer extends Eventable {

  constructor(canvas) {
    super()

    this.canvas = canvas

    this.build()
  }

  build() {
    this.el = document.createElement('canvas')

    this.el.height = 5000
    this.el.width = 5000

    this.ctx = this.el.getContext('2d')
  }

}
