class NewCanvas extends Button {

  constructor(app) {
    super(app)

    this.title = 'Clear'
    this.el.onclick = this.click.bind(this)
  }

  render() {
    this.el = document.createElement('div')

    this.el.id = 'new-canvas'
    this.el.classList.add('button')

    this.app.el.appendChild(this.el)
  }

  click() {
    this.app.confirm('Clear the canvas?').then(() => {
      this.app.reset()
    })
  }

}
