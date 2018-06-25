const exempt = require('../authorization/exemptions').add

const bind = (route, config) => {
  require('./apk')(route, config, exempt)
  route.get('/', (req, res) => {
    res.render('index')
  })
}

exempt('/')

module.exports = { bind }
