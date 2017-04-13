class NewCanvas extends Button {

  constructor(app) {
    super(app)

    this.el.onclick = this.click.bind(this)
  }

  render() {
    this.el = document.createElement('div')

    this.el.id = 'new-canvas'
    this.el.classList.add('button')

    this.app.el.appendChild(this.el)
  }

  click() {
    // Total reset
    App.reset()
  }

}
