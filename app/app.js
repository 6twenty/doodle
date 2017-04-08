class App extends Eventable {

  constructor() {
    super()

    new PenMode(this)
    new PenSize(this)
    new PenColour(this)
    new PenOpacity(this)

    this.pen = new Pen(this)
  }

}
