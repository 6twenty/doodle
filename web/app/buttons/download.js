class Download extends Button {

  constructor(app) {
    super(app)

    this.title = 'Download'
    this.el.onclick = this.click.bind(this)

    this.on('canvas:save', this.update)
  }

  render() {
    this.el = document.createElement('a')

    this.el.id = 'download'
    this.el.classList.add('button')
    this.el.download = 'doodle.png'

    if (this.app.canvas.paths.length === 0) {
      this.el.classList.add('hidden')
    }

    this.app.el.appendChild(this.el)
  }

  click(e) {
    if (this.el.href) {
      return
    }

    e.preventDefault()

    const canvas = this.buildCanvas()

    canvas.toBlob(blob => {
      this.el.href = URL.createObjectURL(blob)
      this.el.click()
      URL.revokeObjectURL(this.el.href)
      this.el.removeAttribute('href')
    })
  }

  buildCanvas() {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const box = this.app.canvas.boundingBox(this.app.canvas.paths)
    const svg = document.querySelector('svg')

    let matrix = svg.createSVGMatrix()

    matrix = matrix.scale(window.devicePixelRatio)
    matrix = matrix.translate(box.width / 2, box.height / 2)
    matrix = matrix.translate(-(box.left + (box.width / 2)), -(box.top + (box.height / 2)))

    canvas.style.height = `${box.height}px`
    canvas.style.width = `${box.width}px`

    canvas.height = box.height * window.devicePixelRatio
    canvas.width = box.width * window.devicePixelRatio

    ctx.setTransform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f)

    // White background
    ctx.fillStyle = 'white'
    ctx.fillRect(box.left, box.top, canvas.width, canvas.height)

    this.app.canvas.layers.forEach(layer => {
      if (layer.paths.length === 0) {
        return
      }

      const layerCanvas = document.createElement('canvas')
      const layerCtx = layerCanvas.getContext('2d')
      const layerCtxOriginal = layer.ctx

      layerCanvas.width = canvas.width
      layerCanvas.height = canvas.height

      // Same transformation as the main canvas
      layerCtx.setTransform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f)

      // Draw paths to the new context
      layer.ctx = layerCtx
      layer.redraw()
      layer.ctx = layerCtxOriginal

      // Render onto the main canvas
      ctx.drawImage(layerCanvas, box.left, box.top, box.width, box.height)
    })

    return canvas
  }

  update(data) {
    if (data.paths.length > 0) {
      this.el.classList.remove('hidden')
    } else {
      this.el.classList.add('hidden')
    }
  }

}
