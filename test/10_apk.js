const client = require('./lib/client')
const moment = require('moment')
const shell = require('shelljs')
const fs = require('fs')
const config = require('../src/config')

const apk_name = 'tripleoneTest'
const apk_name_en = 'tripleoneTest'
const apk_url = 'http://www.tripleone.com'
const hidden_action_btn = true
const auto_connect_vpn = true
const apkFileName = `jun-${moment().format('YYYYMMDD')}-v304`
const apkDeployPath = `${__dirname}/../deploy/${apk_name_en}`

describe('APK test -', () => {
  it('build apk for webview', done => {
    const kernel = 'webview'
    client()
      .post('/apk/build')
      .set('Content-Type', 'multipart/form-data')
      .set('Accept', 'application/json')
      .field('apk_name', apk_name)
      .field('apk_name_en', apk_name_en)
      .field('apk_url', apk_url)
      .field('hidden_action_btn', hidden_action_btn)
      .field('auto_connect_vpn', auto_connect_vpn)
      .field('kernel', kernel)
      .attach('logo', 'test/files/logo_url.png')
      .end((err, res) => {
        // Check if the result is successful
        expect(err).to.not.exist
        expect(res.body).have.property('success')
        expect(res.body.success).to.be.true

        // Check if complete build apk exist
        expect(fs.existsSync(`${apkDeployPath}/${apk_name_en}.json`)).to.be.true
        const apkInfoList = JSON.parse(
          fs.readFileSync(`${apkDeployPath}/${apk_name_en}.json`),
          'utf8'
        )
        expect(Object.keys(apkInfoList).length).to.equal(1)
        const apkFileNam = Object.keys(apkInfoList)[0]
        const apkInfo = apkInfoList[apkFileNam]
        expect(apkInfo).have.property('name')
        expect(apkInfo).have.property('name_en')
        expect(apkInfo).have.property('url')
        expect(apkInfo).have.property('version')
        expect(apkInfo).have.property('fileName')
        expect(apkInfo).have.property('hidden_action_btn')
        expect(apkInfo).have.property('auto_connect_vpn')
        expect(apkInfo).have.property('logo')
        expect(apkInfo).have.property('kernel')
        expect(fs.existsSync(`${apkDeployPath}/${apkFileNam}.apk`)).to.be.true
        expect(fs.existsSync(`${apkDeployPath}/${apkFileNam}.png`)).to.be.true
        done()
      })
    setTimeout(() => {
      shell.cp(
        '-R',
        `${__dirname}/files/apk/app-tripleoneTest-debug.apk`,
        `${
          config.apk[kernel].rootPath
        }/app/build/outputs/apk/${apk_name_en}/debug/app-${apk_name_en}-debug.apk`
      )
      shell.cp(
        '-R',
        `${__dirname}/files/apk/output.json`,
        `${config.apk[kernel].rootPath}/app/build/outputs/apk/${apk_name_en}/debug/`
      )
    }, 1000)
  })

  it('incomplete param when build', done => {
    client()
      .post('/apk/build')
      .set('Content-Type', 'multipart/form-data')
      .set('Accept', 'application/json')
      .field('apk_name', apk_name)
      .attach('logo', 'test/files/logo_url.png')
      .end((err, res) => {
        expect(err).to.not.exist
        expect(res.body).have.property('success')
        expect(res.body.success).to.equal(false)
        done()
      })
  })

  it('get apk list', done => {
    client()
      .post('/apk/getBuildedList')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .end((err, res) => {
        expect(err).to.not.exist
        expect(res.body).have.property('data')
        expect(res.body.data).to.be.an('array')
        /**
         {
          "data": [
                  [
                      "lanhai",
                      "lanhai_20180829_v306",
                      "http://127.0.0.1:7102/download/lanhai/lanhai_20180829_v306.apk",
                      "2018/08/29 06:32:05",
                      "webview",
                      "http://127.0.0.1:7102/download/lanhai/lanhai_20180829_v306.png"
                  ]
              ]
          }
         */
        if (res.body.data.length > 0) {
          expect(res.body.data[0].length).to.equal(6)
        }
        done()
      })
  })

  it('get a specified apk information', done => {
    client()
      .post('/apk/getApkInfo')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send({ apkFileName })
      .end((err, res) => {
        expect(err).to.not.exist
        expect(res.body).have.property('success')
        expect(res.body.success).to.be.true
        expect(res.body).have.property('apkInfo')
        done()
      })
  })

  it('get APK information without parameter - apkFileName', done => {
    client()
      .post('/apk/getApkInfo')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .end((err, res) => {
        expect(err).to.not.exist
        expect(res.body).have.property('success')
        expect(res.body.success).to.be.false
        done()
      })
  })

  it('delete apk in deploy', done => {
    // shell.rm('-rf', apkDeployPath)
    done()
  })
})
