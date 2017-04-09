class Pen extends Eventable {

  static get colours() {
    return [
      '#46648e',
      '#8bbbff',
      '#89ad48',
      '#d1d642',
      '#8c5ba7',
      '#ca76bf',
      '#d7503c',
      '#f49f14',
      '#fae014',
      '#000000',
      '#ffffff'
    ]
  }

  static get sizes() {
    return [ 5, 14, 23, 32, 41, 50 ]
  }

  static get opacities() {
    return [ 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1 ]
  }

  constructor(app) {
    super()

    this.app = app

    this.render()

    this.mode = 'draw'
    this.size = 14
    this.colour = '#000000'
    this.opacity = 1

    this.trigger('pen:ready', {
      mode: this.mode,
      size: this.size,
      colour: this.colour,
      opacity: this.opacity
    })
  }

  render() {
    this.el = document.createElement('div')

    this.el.id = 'pen'

    this.app.el.appendChild(this.el)
  }

  get mode() {
    return this._mode
  }

  set mode(val) {
    if (this._mode === val) {
      return
    }

    this._mode = val

    this.trigger('pen:mode', { mode: this._mode })
  }

  get size() {
    return this._size
  }

  set size(val) {
    if (this._size === val) {
      return
    }

    this._size = val

    let width = (60 - (50 * ((this._size * 2) / 100))) / 2

    if (width < 0) {
      width = 0
    }

    this.el.style.borderWidth = `${width}px`

    this.trigger('pen:size', { size: this._size })
  }

  get colour() {
    return this._colour
  }

  set colour(val) {
    if (this._colour === val) {
      return
    }

    this._colour = val

    this.el.style.backgroundColor = this._colour
    this.opacity = this._opacity

    this.trigger('pen:colour', { colour: this._colour })
  }

  get opacity() {
    return this._opacity
  }

  set opacity(val) {
    if (this._opacity === val) {
      return
    }

    this._opacity = val

    const current = window.getComputedStyle(this.el)['background-color']
    const split = current.replace(/[^\d,]/g, '').split(',')

    split[3] = this._opacity

    this.el.style.backgroundColor = 'rgba(' + split.join(',') + ')'

    this.trigger('pen:opacity', { opacity: this._opacity })
  }

}
