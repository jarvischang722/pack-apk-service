const client = require('./lib/client')

const apkName = `newagent_${Date.now()}`
const apkFileName = 'jun-20180716-v304'
describe('Build APK', () => {
  // it('No required fields.', (done) => {
  //   client()
  //   .post('/apk/build')
  //   .set('Content-Type', 'multipart/form-data')
  //   .set('Accept', 'application/json')
  //   .field('apk_name', apkName)
  //   .attach('logo', 'test/files/logo_url.png')
  //   .expect(201)
  //   .end((err, res) => {
  //     should.not.exist(err)
  //     should.not.equal(res.body.errorMsg, '')
  //     res.body.should.have.property('success')
  //     res.body.should.have.property('errorMsg')
  //     done()
  //   })
  // })

  it('Get Apk list', (done) => {
    client()
    .post('/apk/getBuildedList')
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .expect(201)
    .end((err, res) => {
      should.not.exist(err)
      res.body.should.have.property('data')
      res.body.data.should.to.be.an('array')
      done()
    })
  })

  it('Get APK information', (done) => {
    client()
    .post('/apk/getApkInfo')
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .send({
      apkFileName
    })
    .expect(201)
    .end((err, res) => {
      should.not.exist(err)
      res.body.should.have.property('success')
      res.body.should.have.property('apkInfo')
      res.body.success.should.to.equal(true)

      done()
    })
  })

  it('Get APK information without parameter - apkFileName', (done) => {
    client()
    .post('/apk/getApkInfo')
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .expect(201)
    .end((err, res) => {
      should.not.exist(err)
      res.body.should.have.property('success')
      res.body.success.should.to.equal(false)

      done()
    })
  })
})
