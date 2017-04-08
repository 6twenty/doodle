class Eventable {

  static get handlers() {
    Eventable._handlers = Eventable._handlers || {}
    return Eventable._handlers
  }

  static on(name, handler) {
    Eventable.handlers[name] = Eventable.handlers[name] || []
    Eventable.handlers[name].push(handler)
  }

  static off(name) {
    delete Eventable.handlers[name]
  }

  static trigger(name, data, context) {
    if (!Eventable.handlers[name]) {
      return
    }

    Eventable.handlers[name].forEach(handler => {
      handler.call(context || this, data || {})
    })
  }

  on(name, handler) {
    this.constructor.on(name, handler)
  }

  off(name) {
    this.constructor.off(name, handler)
  }

  trigger(name, data) {
    this.constructor.trigger(name, data, context)
  }

}
