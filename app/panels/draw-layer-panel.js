class DrawLayerPanel extends Panel {

  constructor(button) {
    super()

    this.button = button
    this.app = this.button.app

    this.layers = {}

    this.render('draw-layer-panel')

    this.on('layer:change', this.update);
  }

  renderPanel() {
    this.app.canvas.layers.forEach(layer => {
      const el = document.createElement('div')
      const canvas = document.createElement('canvas')

      canvas.height = canvas.width = 50

      el.dataset.id = layer.id
      el.classList.add('canvas-layer')

      if (layer === this.app.canvas.renderLayer) {
        el.classList.add('active')
      }

      el.onclick = this.canvasLayerClick.bind(this, layer)

      this.layers[layer.id] = {
        layer: layer,
        el: el,
        thumb: canvas
      }

      el.appendChild(canvas)
      this.el.appendChild(el)
    })
  }

  renderThumbs() {
    Object.keys(this.layers).forEach(id => {
      const layer = this.layers[id].layer
      const canvas = this.layers[id].thumb
      const ctx = canvas.getContext('2d')

      ctx.imageSmoothingQuality = 'high'

      // Maintain aspect ratio
      const thumbWidth = layer.el.width > layer.el.height ? 50 : 50 * (layer.el.width / layer.el.height)
      const thumbHeight = layer.el.height > layer.el.width ? 50 : 50 * (layer.el.height / layer.el.width)
      const x = (50 - thumbWidth) / 2
      const y = (50 - thumbHeight) / 2

      ctx.clearRect(0, 0, 50, 50)
      ctx.drawImage(layer.el, Math.floor(x), Math.floor(y), Math.floor(thumbWidth), Math.floor(thumbHeight))
    })
  }

  open() {
    super.open()
    this.renderThumbs()
  }

  canvasLayerClick(layer) {
    this.app.canvas.renderLayer = layer

    this.close()
  }

  update(attrs) {
    const id = attrs.layer.id
    const target = this.layers[id].el
    const active = this.el.querySelector('.canvas-layer.active')

    if (active) {
      active.classList.remove('active')
    }

    if (target){
      target.classList.add('active')
    }
  }

}
