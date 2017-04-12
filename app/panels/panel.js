class Panel extends Eventable {

  constructor() {
    super()
  }

  render(name) {
    this.el = document.createElement('div')

    this.el.id = name
    this.el.classList.add('panel')
    this.el.classList.add(name)
    this.el.style.display = 'none'

    const close = document.createElement('button')

    close.classList.add('panel-close')

    this.el.appendChild(close)

    close.onclick = this.close.bind(this)

    this.renderPanel()

    this.el.addEventListener('mousedown', this.stopPropagation)
    this.el.addEventListener('mouseup', this.stopPropagation)
    this.el.addEventListener('mousemove', this.stopPropagation)

    this.app.el.appendChild(this.el)
  }

  stopPropagation(e) {
    e.stopPropagation()
  }

  open() {
    if (Panel.active) {
      Panel.active.close()
    }

    Panel.active = this

    this.el.style.display = 'block'

    this.button.el.classList.add('active')
  }

  close() {
    delete Panel.active

    this.el.style.display = 'none'

    this.button.el.classList.remove('active')
  }

}