class ShareButton extends Button {

  constructor(app) {
    super(app)

    this.title = 'Share'

    this.on('canvas:change', this.update)
  }

  render() {
    this.el = document.createElement('div')

    this.el.id = 'button-share'
    this.el.classList.add('button')
    this.el.appendChild(document.createElement('div'))

    if (this.app.canvas.paths.length === 0) {
      this.el.classList.add('hidden')
    }

    this.app.el.appendChild(this.el)
  }

  click(e) {
    if (this.app.canvas.paths.length === 0) {
      return
    }

    const canvas = this.app.canvas.snapshot()
    const ref = this.app.storage.ref(`/doodles/${this.app.id}/doodle.png`)

    canvas.toBlob(blob => {
      const task = ref.put(blob)

      task.on('state_changed', snapshot => {
        // Progress
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100

        console.log('Upload is ' + progress + '% done')
      }, snapshot => {
        // Fail
        console.log('Upload failed')
      }, snapshot => {
        // Complete
        console.log('Upload finished')
      })
    })
  }

  update(data) {
    if (data.paths.length > 0) {
      this.el.classList.remove('hidden')
    } else {
      this.el.classList.add('hidden')
    }
  }

}
