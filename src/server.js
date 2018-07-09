const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const helmet = require('helmet')
const log4js = require('log4js')
const config = require('./config')
const route = require('./route')
const errors = require('./error')
const authorization = require('./authorization')
const cors = require('cors')
const path = require('path')
const https = require('https')
const fs = require('fs')

const logger = log4js.getLogger()

global.appRoot = path.resolve()

const server = async () => {
  const app = express()

  app.use(helmet())

  app.use(cors({
    origin: (origin, callback) => {
      callback(null, true)
    },
    allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, X-Auth-Key, If-None-Match',
    credentials: true,
  }))

  app.use('/download', express.static('deploy'))
  app.use('/upload', express.static('upload'))

  // TODO  Test page ,  Can be deleted when done.
  app.set('views', path.join(__dirname, 'views'))
  app.engine('html', require('ejs').renderFile)
  app.set('view engine', 'html')
  // --------------------------------------------

  const apiRouter = new express.Router()
  apiRouter.use(cookieParser(config.secret.cookie))

  apiRouter.use(bodyParser.urlencoded({ extended: false }))
  apiRouter.use(bodyParser.json())
  apiRouter.use(authorization.authorize(config))

  route.bind(apiRouter, config)

  /* eslint-disable no-unused-vars */
  apiRouter.use((err, req, res, next) => {
    let error = {}
    let statusCode = 500
    if (typeof err === 'string') {
      const e = new errors.InternalError()
      error.code = e.name
      error.message = `${errors.lang(e)} (${err})` || e.name
    } else if (err.failedValidation) {
      statusCode = 400
      error = err
    } else if (err.name) {
      error.code = err.name
      error.message = errors.lang(err) || err.name
      statusCode = err.statusCode || statusCode
    } else {
      error.code = err.code
      error.message = err.message
      statusCode = err.statusCode || statusCode
    }
    // res.status(statusCode).send({ error })
  })

  app.use('/', apiRouter)

  const port = config.server.port
  const sslOptions = {
    key: fs.readFileSync(`${__dirname}/sslEncryption/androidapk.tripleonetech.net.key`, 'utf8'),
    cert: fs.readFileSync(`${__dirname}/sslEncryption/androidapk.tripleonetech.net.crt`, 'utf8')
  }


  https.createServer(sslOptions, app).listen(port, () => {
    logger.info(`The https server [${config.name}] running on port: ${port}`)
  })

  return app
}

module.exports = () => {
  const handleErr = (e) => {
    logger.error(e)
    throw e
  }
  return server().catch(handleErr)
}
