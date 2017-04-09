class DrawLayerPanel extends Panel {

  constructor(button) {
    super()

    this.button = button
    this.app = this.button.app

    this.render('draw-layer-panel')
  }

}
