const multer = require('multer')
const errors = require('../error')
const { validate, getSchema, T } = require('../validator')
const APK = require('../schema/apk')
const logger = require('log4js').getLogger()

const SCHEMA = {
  apk_name: T.string()
    .required()
    .trim(),
  apk_name_en: T.string()
    .required()
    .trim()
    .replace(/_/g, '-'),
  apk_url: T.string().required(),
  apkFileName: T.string().required(),
  hidden_action_btn: T.boolean(),
  auto_connect_vpn: T.boolean(),
  isHiddenTabHome: T.boolean(),
  isHiddenTabReload: T.boolean(),
  isHiddenTabVpn: T.boolean(),
  isHiddenTabUpdate: T.boolean(),
  isHiddenTabAbout: T.boolean(),
  isHiddenTabPrepage: T.boolean(),
  version_name: T.string().required().empty('').trim(),
  kernel: T.string().allow('chromium', 'Chromium', 'webview', 'Webview'),
  isClient: T.boolean(),
  email: T.string().email()
}

const ERRORS = {
  NoPermission: 403,
  UserNotFound: 404,
  ExpireInRequired: 400,
  InvalidExpireIn: 400
}

errors.register(ERRORS)

module.exports = (route, config, exempt) => {
  const build = (req, res) => {
    // It take 2 minutes to build the APK. In order to  allow  user's request to timeout more time,
    // so it must set the timeout to 3 mins (defualt 2 mins )
    req.setTimeout(180000)
    res.setTimeout(180000)
    try {
      validate(
        req.body,
        getSchema(
          SCHEMA,
          'apk_name',
          'apk_name_en',
          'apk_url',
          'hidden_action_btn',
          'auto_connect_vpn',
          'isHiddenTabHome',
          'isHiddenTabReload',
          'isHiddenTabVpn',
          'isHiddenTabUpdate',
          'isHiddenTabAbout',
          'isHiddenTabPrepage',
          'version_name',
          'kernel',
          'isClient',
          'email'
        )
      )

      const isBuildOverTime = APK.checkBuildTimeIsOver(req.body.kernel)

      if (!isBuildOverTime && global.isAPKBuilding) {
        return res.json({ success: false, message: 'There are others in the build, please wait' })
      }

      APK.build(req, (error, apkUrl) => {
        const message = error ? error.message : null
        res.json({ success: error === null, message, apkUrl })
      })
    } catch (err) {
      global.isAPKBuilding = false
      res.json({ success: false, message: err.message })
    }
  }

  const getBuildedList = (req, res) => {
    try {
      const buildedAPKList = APK.getBuildedList(req)
      res.json({ data: buildedAPKList })
    } catch (err) {
      logger.error(err)
      res.json({ success: false, message: err.message })
    }
  }

  const getApkInfo = (req, res) => {
    try {
      validate(req.body, getSchema(SCHEMA, 'apkFileName'))
      const apkInfo = APK.getApkInfo(req)
      res.json({ success: true, apkInfo })
    } catch (err) {
      res.json({ success: false, message: err.message })
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

  /**
* @api {post} /apk/build  Build client apk
* @apiVersion 1.0.0
* @apiGroup APK
*
* @apiParam {String} apk_name APK name
* @apiParam {String} apk_name_en APK english name
* @apiParam {File} logo APK's logo
* @apiParam {String} apk_url URL
* @apiParam {Boolean} [hidden_action_btn=false]  Whether to hidden Floating Action Button
* @apiParam {Boolean} [auto_connect_vpn=false] Whether to enable auto connect vpn
* @apiParam {Boolean} [isHiddenTabHome=false]
* @apiParam {Boolean} [isHiddenTabReload=false]
* @apiParam {Boolean} [isHiddenTabPrepage=false]
* @apiParam {Boolean} [isHiddenTabVpn=false]
* @apiParam {Boolean} [isHiddenTabUpdate=false]
* @apiParam {Boolean} [isHiddenTabAbout=false]
* @apiParam {String} version_name  APK version name
*
* @apiSuccess {Boolean} success
* @apiSuccess {String} message
* @apiSuccess {String} apkUrl Build API url completed
*
* @apiSuccessExample Success-Response:
* HTTP Status: 200
{
  "success": true,
  "message": '',
  "apkUrl": 'https://www.xxx.yyy/build/xxxx.apk',

}
*/
  route.post('/apk/build', multer({ storage }).single('logo'), build)

  /**
* @api {post} /apk/getBuildedList  Get APK download url
* @apiVersion 1.0.0
* @apiGroup APK
*
* @apiSuccess (Success 200) {Array[]} data
* @apiSuccess (Success 200) {String} data.name
* @apiSuccess (Success 200) {String} data.filename
* @apiSuccess (Success 200) {String} data.url
* @apiSuccess (Success 200) {String} data.createTime
* @apiSuccess (Success 200) {String} data.kernel
* @apiSuccess (Success 200) {String} data.logo_url
*
* @apiSuccessExample {json} Success-Response:
* HTTP Status: 200
{
 "data": [
   [
     "lanhai",
     "lanhai_20180829_v306",
     "http://127.0.0.1:7102/download/lanhai/lanhai_20180829_v306.apk",
     "2018/08/29 06:32:05",
     "chromium",
     "http://127.0.0.1:7102/download/lanhai/lanhai_20180829_v306.png"
   ],
   [
     "lanhai",
     "lanhai_20180829_v306",
     "http://127.0.0.1:7102/download/lanhai/lanhai_20180829_v306.apk",
     "2018/08/29 06:32:05",
     "chromium",
     "http://127.0.0.1:7102/download/lanhai/lanhai_20180829_v306.png"
   ]
 ]
   ....
}
*/
  route.post('/apk/getBuildedList', getBuildedList)

  /**
* @api {post} /apk/getApkInfo  Get APK detail  information
* @apiVersion 1.0.0
* @apiGroup APK
*
* @apiParam {String} apkFileName APK name
*
* @apiSuccess {Boolean} success
* @apiSuccess {Object} apkInfo

* @apiSuccessExample Success-Response:
* HTTP Status: 200
{
    "success": true,
    "apkInfo": {
        "name": "tripleoneTest",
        "name_en": "tripleoneTest",
        "url": "http://www.tripleone.com",
        "version": "v307",
        "fileName": "tripleoneTest_20181003_v307",
        "hidden_action_btn": true,
        "auto_connect_vpn": true,
        "isHiddenTabHome": true,
        "isHiddenTabReload": true,
        "isHiddenTabPrpage": true,
        "isHiddenTabVpn": true,
        "isHiddenTabUpdate": true,
        "isHiddenTabAbout": true,
        "logo": "http://35.201.204.2:7101/download/tripleoneTest/tripleoneTest_20181003_v307.png",
        "kernel": "chromium"
    }
}
*/
  route.post('/apk/getApkInfo', getApkInfo)
}
