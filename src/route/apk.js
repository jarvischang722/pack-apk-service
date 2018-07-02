const multer = require('multer')
const fs = require('fs')
const errors = require('../error')
const { validate, getSchema, T } = require('../validator')
const moment = require('moment')
const APK = require('../schema/apk')

const SCHEMA = {
  apk_name: T.string().required().trim(),
  apk_name_en: T.string().required().trim(),
  apk_url: T.string().required()
}

const ERRORS = {
  NoPermission: 403,
  UserNotFound: 404,
  CreateUserFailed: 400,
  UserDuplicated: 400,
  ExpireInRequired: 400,
  InvalidExpireIn: 400,
  UserExpired: 400,
}

errors.register(ERRORS)

module.exports = (route, config, exempt) => {
  const build = (req, res, next) => {
// It take 2 minnuts  to build  the APK . In order to  allow   user's request  to timeout more time,
// so it must set the timeout to 3 mins (defualt 2 mins )
    req.setTimeout(360000)
    res.setTimeout(360000)
    try {
      validate(req.body, getSchema(SCHEMA, 'apk_name', 'apk_name_en', 'apk_url'))

      if (global.isAPKBuilding !== undefined && global.isAPKBuilding) {
        return res.status(201).json({ success: false, errorMsg: 'There are others in the build, please wait' })
      }

      APK.build(req, (errorMsg) => {
        global.isAPKBuilding = false
        res.status(201).json({ success: errorMsg === null, errorMsg, params: req.body })
      })
    } catch (err) {
      console.error(err)
      res.status(201).json({ success: false, errorMsg: err.message, params: req.body })
    }
  }

  const getBuildedList = (req, res, next) => {
    const buildedAPKList = []
    const deployPath = `${global.appRoot}/deploy`
    try {
      fs.readdirSync(`${deployPath}`).forEach((apkName) => {
        const allVerAPK = fs.readdirSync(`${deployPath}/${apkName}`).sort().reverse() // The latest version in the top
        if (allVerAPK.length > 0) {
          const apkInfo = {
            apkName,
            apkFileName: allVerAPK[0].replace(/\.apk/g, ''),
            apkUrl: `${req.protocol}://${req.headers.host}/download/${apkName}/${allVerAPK[0]}`,
            apkCreateTime: moment(fs.statSync(`${deployPath}/${apkName}/${allVerAPK[0]}`).birthtime).utc().format('YYYY/MM/DD HH:mm:ss'),
          }
          buildedAPKList.push(Object.values(apkInfo))
        }
      })
    } catch (err) {
      console.error(err)
    } finally {
      res.status(201).json({ data: buildedAPKList })
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

  route.post('/apk/build', multer({ storage }).single('logo'), build)
  route.post('/apk/getBuildedList', getBuildedList)
}
