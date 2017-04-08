class PenColour extends Eventable {

  constructor(app) {
    super()

    this.app = app

    this.render()

    this.panel = new PenColourPanel(this.app)

    this.el.onclick = this.click.bind(this)
  }

  render() {
    this.el = document.createElement('div')

    const icon = `
      <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 100 100" enable-background="new 0 0 100 100" xml:space="preserve"><path fill-rule="evenodd" clip-rule="evenodd" d="M49.999,6.738c-24.708,0-44.738,18.749-44.738,42.179  c0,23.43,20.03,44.346,44.738,44.346c3.561,0,9.95-0.537,10.746-5.05c1.052-5.962-4.546-7.55-7.654-10.662  c-5.075-5.082-2.388-13.012,6.455-13.012c12.683,0,12.612,0,21.532,0c4.016,0,13.798,0.775,13.658-15.133  C94.737,25.976,74.707,6.738,49.999,6.738z M24.275,62.786c-3.887,0-7.038-3.155-7.038-7.047c0-3.892,3.151-7.047,7.038-7.047  c3.887,0,7.038,3.155,7.038,7.047C31.313,59.63,28.162,62.786,24.275,62.786z M32.294,39.168c-3.887,0-7.038-3.155-7.038-7.047  c0-3.892,3.151-7.047,7.038-7.047c3.887,0,7.038,3.155,7.038,7.047C39.333,36.013,36.182,39.168,32.294,39.168z M57.768,33.028  c-3.887,0-7.038-3.155-7.038-7.047c0-3.892,3.151-7.047,7.038-7.047c3.887,0,7.038,3.155,7.038,7.047  C64.807,29.872,61.655,33.028,57.768,33.028z M75.694,51.449c-3.887,0-7.038-3.155-7.038-7.047s3.151-7.047,7.038-7.047  s7.038,3.155,7.038,7.047S79.582,51.449,75.694,51.449z"/></svg>
    `

    this.el.id = 'pen-colour'
    this.el.classList.add('button')
    this.el.innerHTML = icon

    document.body.appendChild(this.el)
  }

  click() {
    this.panel.open()
  }

}
