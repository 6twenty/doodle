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

  beginPath(path) {
    this.ctx.beginPath()

    this.ctx.globalCompositeOperation = path.mode === 'draw' ? 'source-over' : 'destination-out'
    this.ctx.strokeStyle = path.colour
    this.ctx.globalAlpha = path.opacity
    this.ctx.lineWidth = path.size
    this.ctx.lineJoin = "round"
    this.ctx.lineCap = "round"
  }

}
