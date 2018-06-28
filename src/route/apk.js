const multer = require('multer')
const fs = require('fs')
const errors = require('../error')
const { validate, getSchema, T } = require('../validator')
const { generateToken } = require('../authorization')
const APK = require('../schema/apk')

const SCHEMA = {
  id: T.number().integer(),
  role: T.number().integer().valid(1, 2).default(1),
  name: T.string(),
  expireIn: T.date().timestamp('unix').raw().allow(null, ''),
  username: T.string().required(),
  password: T.string().required(),
  homeUrl: T.alternatives().try(
    T.array().items(T.string().uri()),
    T.string().uri()
  ).required(),
  icon: T.string(),
  page: T.number().integer().min(1).default(1),
  pagesize: T.number().integer().min(1).default(10),
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
    if (global.isAPKBuilding !== undefined && global.isAPKBuilding) {
      res.status(201).json({ success: false, errorMsg: 'There are others in the build, please wait' })
    }
    // It take 2 minnuts  to build  the APK . In order to  allow   user's request  to timeout more time,
    // so it must set the timeout to 3 mins (defualt 2 mins )
    req.setTimeout(360000)
    res.setTimeout(360000)
    try {
      APK.build(req, (errorMsg) => {
        global.isAPKBuilding = false
        res.status(201).json({ success: errorMsg === null, errorMsg, params: req.body })
      })
    } catch (err) {
      return next(err)
    }
  }

  const getBuildedList = (req, res, next) => {
    const buildedAPKList = []
    const deployPath = `${global.appRoot}/deploy`
    try {
      fs.readdirSync(`${deployPath}`).forEach((apkName) => {
        // The latest version in the top
        const allVersionAPK = fs.readdirSync(`${deployPath}/${apkName}`).sort().reverse()
        if (allVersionAPK.length > 0) {
          buildedAPKList.push([apkName, allVersionAPK[0].replace(/\.apk/g, ''), `${req.protocol}://${req.headers.host}/deploy/${apkName}/${allVersionAPK[0]}`])
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
