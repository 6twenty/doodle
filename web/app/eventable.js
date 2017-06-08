class Eventable {

  on(name, handler) {
    const fn = this.__handleEvent.bind(this, handler.bind(this))

    if (this.el) {
      this.el.addEventListener(name, fn)
    }

    document.addEventListener(name, fn)
  }

  trigger(name, data) {
    const e = new CustomEvent(name, {
      detail: data,
      bubbles: true,
      cancelable: true
    })

    if (window.app.debug) {
      console.log(this, name, data)
    }

    this.el.dispatchEvent(e)
  }

  // If the event gets triggered on this component's element then it's
  // handled and propagation is halted. Otherwise the event propagates
  // to document and is handled there.
  __handleEvent(handler, e) {
    if (e.currentTarget === this.el) {
      e.stopPropagation()
      handler(e.detail)
    } else {
      handler(e.detail)
    }
  }

}
