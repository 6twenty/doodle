class NewCanvas extends Button {

  constructor(app) {
    super(app)

    this.el.onclick = this.click.bind(this)

    this.on('canvas:save', this.update)
  }

  render() {
    this.el = document.createElement('div')

    this.el.id = 'new-canvas'
    this.el.classList.add('button')

    if (this.app.canvas.paths.length === 0) {
      this.el.classList.add('hidden')
    }

    this.app.el.appendChild(this.el)
  }

  click() {
    this.app.reset()
  }

  update(data) {
    if (data.paths.length > 0) {
      this.el.classList.remove('hidden')
    } else {
      this.el.classList.add('hidden')
    }
  }

}
