class App extends Eventable {

  constructor() {
    super()

    new PenMode()
    new PenSize()
    new PenColour()
    new PenOpacity()

    this.pen = new Pen()
  }

}
