class App extends Eventable {

  constructor() {
    super()

    this.pen = {}

    this.render()

    new PenMode(this)
    new PenSize(this)
    new PenColour(this)
    new PenOpacity(this)

    new DrawLayer(this)

    new Canvas(this)

    this.pen = new Pen(this)
  }

  render() {
    this.el = document.createElement('main')

    document.body.appendChild(this.el)
  }

}
