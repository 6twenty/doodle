class Download extends Button {

  constructor(app) {
    super(app)

    this.title = 'Download'

    this.on('canvas:change', this.update)
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

    if (this.app.canvas.paths.length === 0) {
      return
    }

    e.preventDefault()

    const canvas = this.app.canvas.snapshot()

    canvas.toBlob(blob => {
      this.el.href = URL.createObjectURL(blob)
      this.el.click()
      URL.revokeObjectURL(this.el.href)
      this.el.removeAttribute('href')
    })
  }

  update(data) {
    if (data.paths.length > 0) {
      this.el.classList.remove('hidden')
    } else {
      this.el.classList.add('hidden')
    }
  }

}
