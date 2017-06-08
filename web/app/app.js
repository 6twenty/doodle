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

    this.db = firebase.database()

    this.debug = location.hash === '#debug'
    this.id = location.pathname.replace(/^\//, '')

    if (this.id === '') {
      // Create a new ID
      this.id = this.db.ref('/doodles').push().key
      history.replaceState(null, null, `/${this.id}`)
    }

    this.pen = {}
    this.state = {}
    this.state.coords = []
    this.state.addPaths = []
    this.state.removeKeys = []

    this.render()

    this.canvas = new Canvas(this)

    new PenMode(this)
    new PenSize(this)
    new PenColour(this)
    new PenOpacity(this)
    new DrawLayer(this)
    new NewCanvas(this)
    new Download(this)

    this.pen = new Pen(this)

    this.tick = this.tick.bind(this)
    this.visibility = this.visibility.bind(this)
    this.resize = this.resize.bind(this)
    this.keyEvent = this.keyEvent.bind(this)
    this.mouseDown = this.mouseDown.bind(this)
    this.mouseMove = this.mouseMove.bind(this)
    this.mouseUp = this.mouseUp.bind(this)
    this.mouseWheel = this.mouseWheel.bind(this)
    this.touchStart = this.touchStart.bind(this)
    this.touchMove = this.touchMove.bind(this)
    this.touchStop = this.touchStop.bind(this)

    this.listen()
    this.loop()
    this.connect()
  }

  confirm(message) {
    return new Promise((resolve, reject) => {
      const didConfirm = window.confirm(message)

      if (didConfirm) {
        resolve()
      }
    })
  }

  reset() {
    this.state.resetting = true
    this.canvas.paths.forEach(path => this.canvas.unsave(path))
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
    this.el.addEventListener('mouseleave', this.mouseUp)

    this.el.addEventListener('touchstart', this.touchStart)
    this.el.addEventListener('touchmove', this.touchMove)
    this.el.addEventListener('touchend', this.touchStop)
    this.el.addEventListener('touchcancel', this.touchStop)
  }

  stopListening() {
    document.removeEventListener('visibilitychange', this.visibility)

    window.removeEventListener('resize', this.resize)

    window.removeEventListener('mousewheel', this.mouseWheel)

    window.removeEventListener('keydown', this.keyEvent)
    window.removeEventListener('keyup', this.keyEvent)

    this.el.removeEventListener('mousedown', this.mouseDown)
    this.el.removeEventListener('mousemove', this.mouseMove)
    this.el.removeEventListener('mouseup', this.mouseUp)
    this.el.removeEventListener('mouseleave', this.mouseUp)

    this.el.removeEventListener('touchstart', this.touchStart)
    this.el.removeEventListener('touchmove', this.touchMove)
    this.el.removeEventListener('touchend', this.touchStop)
    this.el.removeEventListener('touchcancel', this.touchStop)
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

    if (e.type === 'keydown') {
      this.keyCommand(e)
    }
  }

  keyCommand(e) {
    if ((e.metaKey || e.ctrlKey) && e.keyCode === 90) {
      this.state.command = e.shiftKey ? 'redo' : 'undo'
    }

    if (e.keyCode === 27) {
      this.state.command = 'esc'
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

    if (this.state.drawing) {
      this.state.coords.push({
        x: this.state.x,
        y: this.state.y
      })
    }
  }

  mouseUp(e) {
    this.state.active = false
    this.state.shift = false
  }

  mouseWheel(e) {
    this.state.scale = Math.round(Math.pow(1.1, (e.detail / 100)) * 1000) / 1000
    this.state.scaling = true
  }

  touchStart(e) {
    e.preventDefault()

    if (e.touches.length === 2 && !this.state.distance) {
      const a = Math.abs(e.touches[1].pageX - e.touches[0].pageX)
      const b = Math.abs(e.touches[1].pageY - e.touches[0].pageY)
      const distance = Math.sqrt((a * a) + (b * b))

      this.state.distance = distance
    }
  }

  touchMove(e) {
    e.preventDefault()

    this.state.shift = e.touches.length === 2
    this.state.active = e.touches.length === 1 || e.touches.length === 2
    this.state.x = this.state.drawing ? e.touches[0].pageX : e.pageX
    this.state.y = this.state.drawing ? e.touches[0].pageY : e.pageY

    if (this.state.drawing) {
      this.state.coords.push({
        x: this.state.x,
        y: this.state.y
      })
    }

    if (e.touches.length === 2) {
      const a = Math.abs(e.touches[1].pageX - e.touches[0].pageX)
      const b = Math.abs(e.touches[1].pageY - e.touches[0].pageY)
      const distance = Math.sqrt((a * a) + (b * b))

      if (this.state.distance) {
        this.state.scale = distance / this.state.distance
        this.state.scaling = true
      }

      this.state.distance = distance
    }
  }

  touchStop(e) {
    e.preventDefault()

    this.state.shift = e.touches.length === 2
    this.state.active = e.touches.length === 1 || e.touches.length === 2

    delete this.state.distance
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

    // Key commands
    if (this.state.command) {
      this.canvas.command(this.state.command)

      delete this.state.command
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
    if (this.state.active && !this.state.shift && !this.state.moving && !this.state.momentum) {

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

    if (this.state.addPaths.length > 0) {
      this.canvas.addPaths(this.state.addPaths)
      this.state.addPaths = []
    }

    if (this.state.removeKeys.length > 0) {
      this.canvas.removeKeys(this.state.removeKeys)
      this.state.removeKeys = []
    }

    if (!this.state.resetting) {
      this.loop()
    }
  }

  connect() {
    const ref = this.db.ref(`/doodles/${this.id}/paths`)

    ref.on('child_added', snapshot => {
      const path = new Path(this.canvas, snapshot.val())

      path.key = snapshot.key
      this.state.addPaths.push(path)
    })

    ref.on('child_removed', snapshot => {
      this.state.removeKeys.push(snapshot.key)
    })
  }

}
