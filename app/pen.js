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

  constructor() {
    super()

    // this.on('pen:size', data => { this.size = data.size })
    // this.on('pen:colour', data => { this.colour = data.colour })
    // this.on('pen:opacity', data => { this.opacity = data.opacity })

    this.render()

    this.mode = 'draw'
    this.size = 10
    this.colour = Pen.colours[0]
    this.opacity = 1
  }

  render() {
    this.el = document.createElement('div')

    this.el.id = 'pen'

    document.body.appendChild(this.el)
  }

  get mode() {
    return this._mode
  }

  set mode(val) {
    this._mode = val

    this.trigger('pen:mode', { mode: this._mode })
  }

  get size() {
    return this._size
  }

  set size(val) {
    this._size = val

    let width = (60 - (50 * ((this._size * 2) / 100))) / 2

    if (width < 0) {
      width = 0
    }

    this.el.style.borderWidth = width + 'px'

    this.trigger('pen:size', { size: this._size })
  }

  get colour() {
    return this._colour
  }

  set colour(val) {
    this._colour = val

    this.el.style.backgroundColor = this._colour
    this.opacity = this._opacity

    this.trigger('pen:colour', { colour: this._colour })
  }

  get opacity() {
    return this._opacity
  }

  set opacity(val) {
    this._opacity = val

    const current = window.getComputedStyle(this.el)['background-color']
    const split = current.replace(/[^\d,]/g, '').split(',')

    split[3] = this._opacity

    this.el.style.backgroundColor = 'rgba(' + split.join(',') + ')'

    this.trigger('pen:opacity', { opacity: this._opacity })
  }

}
