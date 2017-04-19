class App extends Eventable {

  // https://gist.github.com/gre/1650294
  static easeOutQuint(t) {
    return 1+(--t)*t*t*t*t
  }

  // https://gist.github.com/gre/1650294
  static easeOutQuad(t) {
    return t*(2-t)
  }

  constructor(context) {
    super()

    this.context = context
    this.context.app = this

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

    this.state = {}

    this.tick = this.tick.bind(this)
    this.visibility = this.visibility.bind(this)
    this.resize = this.resize.bind(this)
    this.keyEvent = this.keyEvent.bind(this)
    this.mouseDown = this.mouseDown.bind(this)
    this.mouseMove = this.mouseMove.bind(this)
    this.mouseUp = this.mouseUp.bind(this)
    this.mouseLeave = this.mouseLeave.bind(this)
    this.mouseWheel = this.mouseWheel.bind(this)

    this.listen()
    this.loop()
  }

  reset() {
    this.state.resetting = true
    this.stopListening()
    this.el.parentNode.removeChild(this.el)
    new App(this.context)
  }

  render() {
    this.el = document.createElement('main')

    document.body.appendChild(this.el)
  }

  listen() {
    document.addEventListener('visibilitychange', this.visibility)

    window.addEventListener('resize', this.resize)

    window.addEventListener('mousewheel', this.mouseWheel)

    window.addEventListener('keydown', this.keyEvent)
    window.addEventListener('keyup', this.keyEvent)

    this.el.addEventListener('mousedown', this.mouseDown)
    this.el.addEventListener('mousemove', this.mouseMove)
    this.el.addEventListener('mouseup', this.mouseUp)
    this.el.addEventListener('mouseleave', this.mouseLeave)
  }

  stopListening() {
    document.removeEventListener('visibilitychange', this.visibility)

    window.removeEventListener('resize', this.resize)

    window.removeEventListener('keydown', this.keyEvent)
    window.removeEventListener('keyup', this.keyEvent)

    this.el.removeEventListener('mousedown', this.mouseDown)
    this.el.removeEventListener('mousemove', this.mouseMove)
    this.el.removeEventListener('mouseup', this.mouseUp)
    this.el.removeEventListener('mouseleave', this.mouseLeave)
  }

  visibility(e) {
    if (document.hidden) {
      this.state.moving = false
      this.state.drawing = false
      this.state.shift = false
      this.state.active = false

      this.el.classList.remove('panning-intent')
      this.el.classList.remove('panning')
      this.el.classList.remove('drawing')
    } else {
      this.state.redraw = true
    }
  }

  resize(e) {
    this.state.resizing = true
  }

  keyEvent(e) {
    if (e.shiftKey) {
      this.state.shift = true
      this.el.classList.add('panning-intent')
    } else {
      this.state.shift = false
      this.el.classList.remove('panning-intent')
    }
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

  mouseWheel(e) {
    this.state.scale = Math.round(Math.pow(1.1, (e.detail / 100)) * 1000) / 1000
    this.state.scaling = true
  }

  loop() {
    requestAnimationFrame(this.tick)
  }

  tick(timestamp) {

    this.state.timestamp = timestamp

    if (this.state.redraw) {
      this.canvas.renderLayer.redraw()
      this.state.redraw = false
    }

    // Sizing
    if (this.state.resizing) {
      this.canvas.resize()
      this.state.resizing = false
    }

    // Set scale
    if (this.state.shift && this.state.scaling) {
      this.canvas.scale()
      this.state.scaling = false
    } else if (this.state.scaling) {
      this.state.scaling = false
    }

    // Momentum panning
    if (this.state.momentum) {
      this.canvas.momentum()
    }

    // Is drawing if mousedown (but not shiftdown)
    if (this.state.active && !this.state.shift && !this.state.moving) {

      // If not previously drawing, set up path
      if (!this.state.drawing) {
        this.el.classList.add('drawing')
        this.canvas.drawLayer.setup()
        this.state.drawing = true
      }

      this.canvas.drawLayer.draw()

    // Is moving if mousedown (with shiftdown)
    } else if (this.state.active && this.state.shift && !this.state.drawing) {

      if (!this.state.moving) {
        this.el.classList.add('panning')
        this.canvas.startPanning()
        this.state.moving = true
      }

      this.canvas.pan()

    } else if (this.state.drawing) {

      this.el.classList.remove('drawing')
      this.canvas.drawLayer.finish()
      this.state.drawing = false

    } else if (this.state.moving) {

      this.el.classList.remove('panning')
      this.canvas.finishPanning()
      this.state.moving = false

    }

    if (!this.state.resetting) {
      this.loop()
    }
  }

}
