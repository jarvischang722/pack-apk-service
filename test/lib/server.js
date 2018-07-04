const server = require('../../src/server')

/* eslint-disable no-underscore-dangle */
global.__DEV__ = true
global.__TEST__ = true

let app = null

module.exports = async () => {
  if (app === null) {
    app = await server()
  }
  return app
}
