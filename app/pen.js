class Pen extends Eventable {

  constructor() {
    super()

    // this.on('pen:size', data => { this.size = data.size })
    // this.on('pen:colour', data => { this.colour = data.colour })
    // this.on('pen:opacity', data => { this.opacity = data.opacity })

    this.render()
  }

  render() {
    this.el = document.createElement('div')

    this.el.id = 'pen'

    document.body.appendChild(this.el)
  }

  set mode(val) {
    this._mode = val

    this.trigger('pen:mode', { mode: this._mode })
  }

  set size(val) {
    this._size = val

    let width = (60 - (50 * ((this._size * 2) / 100))) / 2

    if (width < 0) {
      width = 0
    }

    this.el.style.borderWidth = width + 'px'

    this.trigger('pen:size', { mode: this._size })
  }

  set colour(val) {
    this._colour = val

    this.el.style.backgroundColor = this._colour
    this.opacity = this._opacity

    this.trigger('pen:colour', { mode: this._colour })
  }

  set opacity(val) {
    this._opacity = val

    const current = window.getComputedStyle(this.el)['background-color']
    const split = current.replace(/[^\d,]/g, '').split(',')

    split[3] = this._opacity

    this.el.style.backgroundColor = 'rgba(' + split.join(',') + ')'

    this.trigger('pen:opacity', { mode: this._opacity })
  }

}
