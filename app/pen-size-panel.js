class PenSizePanel extends Panel {

  constructor(button) {
    super()

    this.button = button
    this.app = this.button.app

    this.render('pen-size-panel')
  }

}
