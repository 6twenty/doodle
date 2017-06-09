class Canvas extends Eventable {

  constructor(app) {
    super()

    this.app = app
    this.state = {}
    this.state.redoPaths = []

    const svg = document.querySelector('svg')

    this.matrix = svg.createSVGMatrix()
    this.point = svg.createSVGPoint()

    // Scale to the device's pixel ratio
    this.matrix = this.matrix.scale(window.devicePixelRatio)

    // Start off by panning so that 0,0 is in the center of the viewport
    this.matrix = this.matrix.translate(document.documentElement.clientWidth / 2, document.documentElement.clientHeight / 2)

    this.layers = [
      new CanvasLayer(this, 1),
      new CanvasLayer(this, 2),
      new CanvasLayer(this, 3)
    ]

    this._drawLayer = new CanvasLayer(this)
    this._renderLayer = this.layers[1] // Default to the middle layer

    this.render()
    this.renderAll()
  }

  // For erasing, the render layer is drawn on directly
  get drawLayer() {
    if (this.app.pen.mode === 'erase') {
      return this._renderLayer
    } else {
      return this._drawLayer
    }
  }

  set drawLayer(layer) {
    this._drawLayer = layer
  }

  get renderLayer() {
    return this._renderLayer
  }

  set renderLayer(layer) {
    layer.el.classList.add('render-layer')
    this._renderLayer.el.classList.remove('render-layer')
    this._renderLayer = layer
    this.el.insertBefore(this._drawLayer.el, this.renderLayer.el.nextSibling)
    this.trigger('layer:change', { layer: layer })
  }

  get paths() {
    const paths = this.layers.map(layer => layer.paths)

    // Flatten and sort
    return [].concat.apply([], paths).sort((a, b) => {
      return a.timestamp - b.timestamp
    })
  }

  pointer(x, y) {
    if (!x) x = this.app.state.x
    if (!y) y = this.app.state.y

    this.point.x = x * window.devicePixelRatio
    this.point.y = y * window.devicePixelRatio

    const pt = this.point.matrixTransform(this.matrix.inverse())

    return new Point(pt.x, pt.y)
  }

  render() {
    this.el = document.createElement('div')

    this.el.id = 'draw-canvas'

    this.drawLayer.el.classList.add('draw-layer')
    this.renderLayer.el.classList.add('render-layer')

    this.layers.forEach(layer => {
      this.el.appendChild(layer.el)
    })

    this.el.insertBefore(this.drawLayer.el, this.renderLayer.el.nextSibling)

    this.app.el.appendChild(this.el)
  }

  resize() {
    this._drawLayer.resize()
    this.layers.forEach(layer => layer.resize())
    this.renderAll()
  }

  fit(paths) {
    const box = this.boundingBox(paths)
    const x = box.left + (box.width / 2)
    const y = box.top + (box.height / 2)

    this.matrix = this.matrix.translate(-x, -y)
  }

  // Get the approx bounding box of the given paths
  boundingBox(paths) {
    const box = {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    }

    paths.forEach(path => {
      const top = path.bounds.top - path.size
      const right = path.bounds.right + path.size
      const bottom = path.bounds.bottom + path.size
      const left = path.bounds.left - path.size

      if (left < box.left) box.left = left
      if (right > box.right) box.right = right
      if (top < box.top) box.top = top
      if (bottom > box.bottom) box.bottom = bottom
    })

    box.width = box.right - box.left
    box.height = box.bottom - box.top

    return box
  }

  startPanning() {
    this.state.panOrigin = this.pointer().clone()
    this.app.state.momentum = false

    delete this.state.momentum
  }

  pan() {
    const pointer = this.pointer().clone()
    const point = pointer.subtract(this.state.panOrigin)

    this.state.momentum = {
      x: pointer.x - this.state.panOrigin.x,
      y: pointer.y - this.state.panOrigin.y
    }

    if (pointer.getDistance(this.state.panOrigin) === 0) {
      return
    }

    this.matrix = this.matrix.translate(point.x, point.y)
    this.state.panOrigin = this.pointer().clone()

    this.renderAll()
  }

  finishPanning() {
    if (this.state.momentum.x !== 0 || this.state.momentum.y !== 0) {
      this.app.state.momentum = true
      this.state.momentum.timestamp = this.app.state.timestamp
    } else {
      delete this.state.momentum
    }

    delete this.state.panOrigin
  }

  momentum() {
    const duration = 600
    const momentum = this.state.momentum
    const time = this.app.state.timestamp - momentum.timestamp

    if (time > duration) {
      this.app.state.momentum = false

      delete this.state.momentum

      return
    }

    const factor = 1 - App.easeOutQuint(time / duration)
    const point = new Point(momentum.x * factor, momentum.y * factor)

    this.matrix = this.matrix.translate(point.x, point.y)

    this.renderAll()
  }

  scale() {
    // To scale centered on the pointer the canvas is first translated
    // so that the pointer is at 0,0; then after scaling it is translated
    // back again.

    const point = this.pointer()

    let scale = this.app.state.scale
    let factor = 0

    if (this.matrix.a > 1) {
      factor = App.easeOutQuad((this.matrix.a - 1) / 20)
    } else if (this.matrix.a < 1) {
      factor = App.easeOutQuad(1 - this.matrix.a)
    }

    if (scale > 1) {
      scale = ((scale - 1) * (1 - factor)) + 1
    } else if (scale < 1) {
      scale = scale + ((1 - scale) * factor)
    }

    this.matrix = this.matrix.translate(point.x, point.y)
    this.matrix = this.matrix.scale(scale)
    this.matrix = this.matrix.translate(-point.x, -point.y)

    this.renderAll()
  }

  renderAll() {
    this.drawLayer.transform()
    this.layers.forEach(layer => {
      layer.clear()
      layer.transform()
      layer.redraw()
    })
  }

  save(path) {
    const ref = this.app.db.ref(`/doodles/${this.app.id}/paths`)

    if (!path.key) {
      path.key = ref.push().key
    }

    ref.child(path.key).set(path.attrs())

    this.trigger('canvas:change', { paths: this.paths })
  }

  unsave(path) {
    this.app.db.ref(`/doodles/${this.app.id}/paths/${path.key}`).remove()

    this.trigger('canvas:change', { paths: this.paths })
  }

  addPaths(paths) {
    const existingKeys = this.paths.map(path => path.key)

    // Filter to only paths that don't already exist, then add them
    paths.filter(path => existingKeys.indexOf(path.key) < 0).forEach(path => {
      this.layers.find(layer => layer.id === path.layer).paths.push(path)
    })

    if (existingKeys.length === 0) {
      this.fit(this.paths)
    }

    this.renderAll()

    this.trigger('canvas:change', { paths: this.paths })
  }

  removeKeys(keys) {
    const existingKeys = this.paths.map(path => path.key)

    // Filter to only paths that currently exist, and remove them
    keys.filter(key => existingKeys.indexOf(key) >= 0).forEach(key => {
      const path = this.paths.filter(path => path.key === key)[0]
      const layer = this.layers.find(layer => layer.id === path.layer)
      const index = layer.paths.map(path => path.key).indexOf(path.key)

      // Remove this path
      layer.paths.splice(index, 1)
    })

    this.renderAll()

    this.trigger('canvas:change', { paths: this.paths })
  }

  command(command) {
    switch (command) {
      case 'undo':
        this.undo()
        break
      case 'redo':
        this.redo()
        break
      case 'esc':
        this.closePanel()
        break
    }
  }

  undo() {
    const path = this.paths.pop()

    if (!path) {
      return
    }

    const layer = this.layers.find(layer => {
      return layer.id === path.layer
    })

    this.state.redoPaths.push(path)
    layer.paths.splice(layer.paths.length - 1, 1)
    layer.clear()
    layer.redraw()
    this.unsave(path)
  }

  redo() {
    const path = this.state.redoPaths.pop()

    if (!path) {
      return
    }

    const layer = this.layers.find(layer => {
      return layer.id === path.layer
    })

    layer.paths.push(path)
    layer.clear()
    layer.redraw()
    this.save(path)
  }

  closePanel() {
    if (Panel.active) {
      Panel.active.close()
    }
  }

  snapshot() {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const box = this.boundingBox(this.paths)
    const svg = document.querySelector('svg')
    const isDebugging = this.app.debug

    let matrix = svg.createSVGMatrix()

    // Disable debugging for the snapshot
    this.app.debug = false

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

    this.layers.forEach(layer => {
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

    // Resume debugging if need be
    this.app.debug = isDebugging

    return canvas
  }

}
