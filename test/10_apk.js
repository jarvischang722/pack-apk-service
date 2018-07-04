const client = require('./lib/client')

const apkName = `newagent_${Date.now()}`

describe('APK', () => {
  it('Build APK without required fields.', (done) => {
    client()
    .post('/apk/build')
    .set('Content-Type', 'multipart/form-data')
    .set('Accept', 'application/json')
    .field('apk_name', apkName)
    .attach('logo', 'test/files/logo_url.png')
    .expect(201)
    .end((err, res) => {
      should.not.exist(err)
      should.not.equal(res.body.errorMsg, '')
      res.body.should.have.property('success')
      res.body.should.have.property('errorMsg')
      done()
    })
  })
})
