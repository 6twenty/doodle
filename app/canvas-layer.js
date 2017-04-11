class CanvasLayer extends Eventable {

  constructor(canvas) {
    super()

    this.canvas = canvas

    this.build()
  }

  build() {
    this.el = document.createElement('canvas')

    this.el.height = document.documentElement.clientHeight
    this.el.width = document.documentElement.clientWidth

    this.ctx = this.el.getContext('2d')
  }

}
