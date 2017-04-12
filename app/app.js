class App extends Eventable {

  // https://gist.github.com/gre/1650294
  static easeOutQuint(t) {
    return 1+(--t)*t*t*t*t
  }

  constructor() {
    super()

    this.pen = {}

    this.render()

    new PenMode(this)
    new PenSize(this)
    new PenColour(this)
    new PenOpacity(this)
    new DrawLayer(this)
    new NewCanvas(this)

    this.canvas = new Canvas(this)
    this.pen = new Pen(this)

    this.svg = document.querySelector('svg')
    this.matrix = this.svg.createSVGMatrix()
    this.point = this.svg.createSVGPoint()

    this.state = {}

    this.tick = this.tick.bind(this)
    this.mouseDown = this.mouseDown.bind(this)
    this.mouseMove = this.mouseMove.bind(this)
    this.mouseUp = this.mouseUp.bind(this)
    this.mouseLeave = this.mouseLeave.bind(this)

    this.listen()
    this.loop()
  }

  get pointer() {
    this.point.x = this.state.x
    this.point.y = this.state.y

    const pt = this.point.matrixTransform(this.matrix.inverse())

    return new Point(pt.x, pt.y)
  }

  render() {
    this.el = document.createElement('main')

    document.body.appendChild(this.el)
  }

  listen() {
    this.el.addEventListener('mousedown', this.mouseDown)
    this.el.addEventListener('mousemove', this.mouseMove)
    this.el.addEventListener('mouseup', this.mouseUp)
    this.el.addEventListener('mouseleave', this.mouseLeave)
  }

  mouseDown(e) {
    this.state.shift = e.shiftKey
    this.state.active = e.which === 1
    this.state.x = e.pageX
    this.state.y = e.pageY
  }

  mouseMove(e) {
    this.state.shift = e.shiftKey
    this.state.active = e.which === 1
    this.state.x = e.pageX
    this.state.y = e.pageY
  }

  mouseUp(e) {
    this.state.active = false
    this.state.shift = false
  }

  mouseLeave(e) {
    this.state.active = false
    this.state.shift = false
  }

  loop() {
    requestAnimationFrame(this.tick)
  }

  tick() {

    // Set zoom
    if (this.state.zooming) {
      // scale()
      console.log('scale')
    }

    // Is drawing if mousedown (but not shiftdown)
    if (this.state.active && !this.state.shift && !this.state.moving) {

      // If not previously drawing, set up path
      if (!this.state.drawing) {
        this.canvas.drawLayer.setup()
        this.state.drawing = true
      }

      this.canvas.drawLayer.draw()

    // Is moving if mousedown (with shiftdown)
    } else if (this.state.active && this.state.shift && !this.state.drawing) {

      if (!this.state.moving) {
        // setupMove()
        console.log('setupMove')
        this.state.moving = true
      }

      // handleMove()
      console.log('handleMove')

    // If was previously drawing, cache the path
    } else if (this.state.drawing) {

      this.canvas.drawLayer.finish()
      this.state.drawing = false

    } else if (this.state.moving) {

      // finishMove()
      console.log('finishMove')
      this.state.moving = false

    }

    this.loop()
  }

}
