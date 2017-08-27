const functions = require('firebase-functions')
const puppeteer = require('puppeteer')

exports.renderer = functions.https.onRequest((req, res) => {
  const url = [
    req.protocol,
    '://',
    req.hostname,
    ':',
    req.hostname === 'localhost' ? 5000 : '',
    req.path.replace(/\.png/, '')
  ].join('')

  const onError = (browser, func, error) => {
    console.log(`ERROR: ${func}`, error)
    browser.close()
    res.status(500).send('FAIL')
  }

  const sendPng = (browser, png) => {
    browser.close()

    png = png.split(',')[1]

    const buffer = new Buffer(png, 'base64')

    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': buffer.length
    })

    res.end(buffer)
  }

  puppeteer.launch({ headless: false }).then(browser => {
    browser.newPage().then(page => {
      page.exposeFunction('rendered', png => {
        sendPng(browser, png)
      }).then(() => {
        page.goto(url).then(() => {

        }).catch(e => onError(browser, 'page.goto', e))
      }).catch(e => onError(browser, 'page.exposeFunction', e))
    }).catch(e => onError(browser, 'browser.newPage', e))
  })
})
