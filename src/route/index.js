const exempt = require('../authorization/exemptions').add

const bind = (route, config) => {
  require('./apk')(route, config, exempt)
  route.get('/', (req, res) => { res.send('Tripleonetech APK api service 1.0') })
}

exempt('/')

module.exports = { bind }
