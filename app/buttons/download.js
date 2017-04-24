class Download extends Button {

  constructor(app) {
    super(app)

    this.el.onclick = this.click.bind(this)
  }

  render() {
    this.el = document.createElement('a')

    this.el.id = 'download'
    this.el.classList.add('button')
    this.el.download = 'doodle.png'

    this.app.el.appendChild(this.el)
  }

  click() {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const box = this.app.canvas.boundingBox()
    const margin = Math.max(box.width * 0.1, box.height * 0.1)

    canvas.width = box.width + margin
    canvas.height = box.height + margin
    ctx.fillStyle = 'white'

    ctx.translate(-(box.left - (margin / 2)), -(box.top - (margin / 2)))
    ctx.fillRect(box.left - margin, box.top - margin, canvas.width + margin, canvas.height + margin)

    this.app.canvas.layers.forEach(layer => {
      const layerCtx = layer.ctx

      layer.ctx = ctx
      layer.redraw()
      layer.ctx = layerCtx
    })

    this.el.href = canvas.toDataURL('image/png')
  }

}
