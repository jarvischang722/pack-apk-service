const exempt = require('../authorization/exemptions').add
const logger = require('log4js').getLogger()

const bind = (route, config) => {
  require('./apk')(route, config, exempt)
  route.get('/', (req, res) => {
    logger.info(11111)
    res.render('index')
  })
}

exempt('/')

module.exports = { bind }
