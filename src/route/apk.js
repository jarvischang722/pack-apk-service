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
  auto_connect_vpn: T.boolean()
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
        return res.json({ success: false, errorMsg: 'There are others in the build, please wait' })
      }

      validate(
        req.body,
        getSchema(
          SCHEMA,
          'apk_name',
          'apk_name_en',
          'apk_url',
          'hidden_action_btn',
          'auto_connect_vpn'
        )
      )
      req.body.kernel = req.body.kernel || 'chromium'

      APK.build(req, (errorMsg, apkUrl) => {
        global.isAPKBuilding = false
        res.json({ success: errorMsg === null, errorMsg, apkUrl })
      })
    } catch (err) {
      global.isAPKBuilding = false
      res.json({ success: false, errorMsg: err.message })
    }
  }

  const getBuildedList = (req, res, next) => {
    try {
      const buildedAPKList = APK.getBuildedList(req)
      res.json({ data: buildedAPKList })
    } catch (err) {
      logger.error(err)
      res.json({ success: false, errorMsg: err.message })
    }
  }

  const getApkInfo = (req, res, next) => {
    try {
      validate(req.body, getSchema(SCHEMA, 'apkFileName'))
      const apkInfo = APK.getApkInfo(req)
      res.json({ success: true, apkInfo })
    } catch (err) {
      res.json({ success: false, errorMsg: err.message })
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
* @apiParam {Boolean} [hidden_action_btn=false]  Whether to  hidden Floating Action Button
* @apiParam {Boolean} [auto_connect_vpn=false] Whether to enable auto connect vpn
*
* @apiSuccess {Boolean} success
* @apiSuccess {String} errorMsg
* @apiSuccess {String} apkUrl Build API url completed
*
* @apiSuccessExample Success-Response:
* HTTP Status: 200
{
  "success": true,
  "errorMsg": '',
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
        "name": "xxxx",
        "name_en": "xxxx",
        "url": "https://www.xxxx.com/",
        "hidden_action_btn": true,
        "auto_connect_vpn": false
    }
}
*/
  route.post('/apk/getApkInfo', getApkInfo)
}
