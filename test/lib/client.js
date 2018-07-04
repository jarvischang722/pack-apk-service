const supertest = require('supertest')

module.exports = () => {
  const client = supertest(global.server)
  return client
}
