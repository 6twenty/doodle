class Canvas extends Eventable {

  constructor(app) {
    super()

    this.app = app
    this.state = {}
    this.state.redoPaths = []

    const paths = this.load()
    const svg = document.querySelector('svg')

    this.matrix = svg.createSVGMatrix()
    this.point = svg.createSVGPoint()

    // Start off by panning so that 0,0 is in the center of the viewport
    this.matrix = this.matrix.translate(document.documentElement.clientWidth / 2, document.documentElement.clientHeight / 2);

    this.layers = [
      new CanvasLayer(this, 1),
      new CanvasLayer(this, 2),
      new CanvasLayer(this, 3)
    ]

    this._drawLayer = new CanvasLayer(this)
    this._renderLayer = this.layers[1] // Default to the middle layer

    this.layers.forEach(layer => {
      layer.paths = paths.filter(path => {
        return path.layer == layer.id
      })
    })

    this.render()
    this.renderAll()
  }

  get pointer() {
    this.point.x = this.app.state.x
    this.point.y = this.app.state.y

    const pt = this.point.matrixTransform(this.matrix.inverse())

    return new Point(pt.x, pt.y)
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

  startPanning() {
    this.state.panOrigin = this.pointer.clone()
    this.app.state.momentum = false

    delete this.state.momentum
  }

  pan() {
    const pointer = this.pointer.clone()
    const point = pointer.subtract(this.state.panOrigin)

    this.state.momentum = {
      x: pointer.x - this.state.panOrigin.x,
      y: pointer.y - this.state.panOrigin.y
    }

    if (pointer.getDistance(this.state.panOrigin) === 0) {
      return
    }

    this.matrix = this.matrix.translate(point.x, point.y)
    this.state.panOrigin = this.pointer.clone()

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

    const point = this.pointer

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

  save() {
    const paths = this.paths.map(path => path.attrs())

    localStorage.paths = JSON.stringify(paths)
  }

  load() {
    let cache = localStorage.paths

    if (cache) {
      return JSON.parse(cache).map(data => {
        return new Path(this, data)
      })
    } else {
      return []
    }
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
    const paths = this.paths

    if (paths.length === 0) {
      return
    }

    const path = paths.splice(this.paths.length - 1, 1)[0]
    const layer = this.layers.find(layer => {
      return layer.id === path.layer
    })

    this.state.redoPaths.push(path)
    layer.paths.splice(layer.paths.length - 1, 1)
    layer.clear()
    layer.redraw()
    this.save()
  }

  redo() {
    const path = this.state.redoPaths.shift()

    if (!path) {
      return
    }

    const layer = this.layers.find(layer => {
      return layer.id === path.layer
    })

    layer.paths.push(path)
    layer.clear()
    layer.redraw()
    this.save()
  }

  closePanel() {
    if (Panel.active) {
      Panel.active.close()
    }
  }

}
