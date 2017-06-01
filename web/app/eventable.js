class Eventable {

  static get handlers() {
    Eventable._handlers = Eventable._handlers || {}
    return Eventable._handlers
  }

  static on(name, handler, context) {
    Eventable.handlers[name] = Eventable.handlers[name] || []
    Eventable.handlers[name].push({
      fn: handler,
      context: context
    })
  }

  static off(name) {
    delete Eventable.handlers[name]
  }

  static trigger(name, data) {
    if (!Eventable.handlers[name]) {
      return
    }

    Eventable.handlers[name].forEach(handler => {
      handler.fn.call(handler.context, data || {})
    })
  }

  on(name, handler, context) {
    this.constructor.on(name, handler, this)
  }

  off(name) {
    this.constructor.off(name, handler)
  }

  trigger(name, data) {
    this.constructor.trigger(name, data)
  }

}
