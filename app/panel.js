class Panel extends Eventable {

  constructor() {
    super()


  }

  render(name) {
    this.el = document.createElement('div')

    this.el.id = name
    this.el.classList.add('panel')
    this.el.style.display = 'none'

    const close = document.createElement('div')

    close.classList.add('panel-close')

    this.el.appendChild(close)

    close.onclick = this.close.bind(this)

    document.body.appendChild(this.el)
  }

  open() {
    this.el.style.display = 'block'
  }

  close() {
    this.el.style.display = 'none'
  }

}
