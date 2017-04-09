class App extends Eventable {

  constructor() {
    super()

    this.pen = {}

    new PenMode(this)
    new PenSize(this)
    new PenColour(this)
    new PenOpacity(this)
    new DrawLayer(this)

    this.pen = new Pen(this)
  }

}
