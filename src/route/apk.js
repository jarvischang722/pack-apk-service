const multer = require('multer')
const fs = require('fs')
const errors = require('../error')
const { validate, getSchema, T } = require('../validator')
const moment = require('moment')
const APK = require('../schema/apk')
const logger = require('log4js').getLogger()

const SCHEMA = {
  apk_name: T.string().required().trim(),
  apk_name_en: T.string().required().trim().replace(/_/g, '-'),
  apk_url: T.string().required(),
  apkFileName: T.string().required()
}

const ERRORS = {
  NoPermission: 403,
  UserNotFound: 404,
  ExpireInRequired: 400,
  InvalidExpireIn: 400
}

errors.register(ERRORS)

module.exports = (route, config, exempt) => {
  const build = (req, res, next) => {
    // It take 2 minutes to build the APK. In order to  allow  user's request to timeout more time,
    // so it must set the timeout to 3 mins (defualt 2 mins )
    req.setTimeout(180000)
    res.setTimeout(180000)
    try {
      if (global.isAPKBuilding !== undefined && global.isAPKBuilding) {
        return res.status(201).json({ success: false, errorMsg: 'There are others in the build, please wait' })
      }

      validate(req.body, getSchema(SCHEMA, 'apk_name', 'apk_name_en', 'apk_url'))

      APK.build(req, (errorMsg, apkUrl) => {
        global.isAPKBuilding = false
        res.status(201).json({ success: errorMsg === null, errorMsg, apkUrl })
      })
    } catch (err) {
      global.isAPKBuilding = false
      res.status(201).json({ success: false, errorMsg: err.message })
    }
  }

  const getBuildedList = (req, res, next) => {
    const buildedAPKList = []
    const deployPath = `${global.appRoot}/deploy`
    try {
      fs.readdirSync(`${deployPath}`).forEach((apkName) => {
        const allVerAPK = fs.readdirSync(`${deployPath}/${apkName}`).sort().reverse() // The latest version in the top
        if(allVerAPK.indexOf(`${apkName}.json`)>-1){
          allVerAPK.splice(allVerAPK.indexOf(`${apkName}.json`))
        }

        if (allVerAPK.length > 0) {
          allVerAPK.forEach((fileNam)=>{
            const tmeInfo = {
              apkName,
              apkFileName: fileNam.replace(/\.apk/g, ''),
              apkUrl: `${req.protocol}://${req.headers.host}/download/${apkName}/${fileNam}.`,
              apkCreateTime: moment(fs.statSync(`${deployPath}/${apkName}/${fileNam}`).birthtime).utc().format('YYYY/MM/DD HH:mm:ss'),
            }
            buildedAPKList.push(Object.values(tmeInfo))
          })
        }
      })
    } catch (err) {
      logger.error(err)
    } finally {
      res.status(201).json({ data: buildedAPKList })
    }
  }

  const getApkInfo = (req, res, next) => {

    try {
      validate(req.body, getSchema(SCHEMA, 'apkFileName'))
      const apkInfo = APK.getApkInfo(req)
      res.status(201).json({ success: true, apkInfo })

    } catch (err) {
      res.status(201).json({ success: false, errorMsg: err.message })
    }

  }

  const storage = multer.diskStorage({
    destination: 'upload/logo',
    filename: (req, file, cb) => {
      cb(null, `${req.body.apk_name_en}.png`)
    }
  })

  exempt('/apk/build')
  exempt('/apk/getBuildedList')
  exempt('/apk/getApkInfo')

  route.post('/apk/build', multer({ storage }).single('logo'), build)
  route.post('/apk/getBuildedList', getBuildedList)
  route.post('/apk/getApkInfo', getApkInfo)
}
