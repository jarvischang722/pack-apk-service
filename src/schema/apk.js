const config = require('../config')
const fs = require('fs')
const sharp = require('sharp')
const shell = require('shelljs')
const moment = require('moment')
const logger = require('log4js').getLogger()
const url = require('url')
/**
 * Resize user uploaded app logo
 * @param {String} apk_name_en : App English name
 */
const resizeLogo = async (apk_name_en) => {
  const logoDeployPath = `${config.apk.logoPath}`
  const sizeObj = {
    'mipmap-xxxhdpi': 192,
    'mipmap-xxhdpi': 144,
    'mipmap-xhdpi': 96,
    'mipmap-hdpi': 72,
    'mipmap-mdpi': 48,
    'mipmap-ldpi': 36
  }
  try {
    if (!fs.existsSync(`${logoDeployPath}`)) {
      fs.mkdirSync(`${logoDeployPath}`)
    }

    const resizeArr = Object.keys(sizeObj).map((sizeName) => new Promise((resolve, reject) => {
      if (!fs.existsSync(`${logoDeployPath}/${sizeName}`)) {
        fs.mkdirSync(`${logoDeployPath}/${sizeName}`)
      }
      sharp(`${global.appRoot}/upload/logo/${apk_name_en}.png`)
        .resize(sizeObj[sizeName], sizeObj[sizeName])
        .toFile(`${logoDeployPath}/${sizeName}/client_build_icon.png`, (err, info) => {
          if (err) {
            logger.error(err)
            reject(err)
          } else {
            resolve(info)
          }
        })
    }))

    Promise.all(resizeArr).then(res => {
      // logger.info(res)
    }).catch(err => {
      logger.error(err)
      throw new Error(err)
    })
  } catch (err) {
    throw new Error(err)
  }
}

/**
 * Replace these words [appenglishname, appchinesename, appurl, appdomain]  with  user input
 * @param {Object} postData
 */
const reloadGradleFile = async (postData) => {
  try {
    const { apk_name_en, apk_name, apk_url } = postData
    let gradleFileCont = fs.readFileSync(`${global.appRoot}/src/build/buildcopy.gradle`, 'utf8')
    const urlParseRes = url.parse(apk_url, true)
    if (!urlParseRes.protocol || !urlParseRes.hostname) {
      throw new Error(`APK URL illegal (${apk_url}) `)
    }
    let appDomain = urlParseRes.hostname.split('.')[1]
    if (urlParseRes.hostname.split('.').length < 3) {
      appDomain = urlParseRes.hostname.split('.')[0]
    }

    gradleFileCont = gradleFileCont.replace(/\@\[appenglishname\]/g, apk_name_en)
    gradleFileCont = gradleFileCont.replace(/\@\[appchinesename\]/g, apk_name)
    gradleFileCont = gradleFileCont.replace(/\@\[appurl\]/g, apk_url)
    gradleFileCont = gradleFileCont.replace(/\@\[appdomain\]/g, appDomain)

    fs.writeFileSync(`${config.apk.rootPath}/app/build.gradle`, gradleFileCont, 'utf8')

    return gradleFileCont
  } catch (err) {
    throw new Error(err)
  }
}

/**
 * Start building process
 */
const runBatchAndBuildApk = async () => new Promise((resolve, reject) => {
  const { spawn } = require('child_process')
  try {
    if (process.platform.indexOf('win') > -1) {
      const buildApkProcess = spawn('cmd', ['/c', `${config.apk.buildBatPath}`], { windowsHide: true, timeout: 180000 })
      buildApkProcess.stdout.on('data', (data) => {
        logger.info(data.toString())
      })

      resolve(buildApkProcess)
    } else {
      reject(new Error('Support  "Windows" only.'))
    }
  } catch (err) {
    reject(err)
  }
})

/**
 * convert .gradle file to json 
 */
const convGradleToJson = async (path) => new Promise((resolve, reject) => {
  try {
    require('gradle-to-js/lib/parser').parseFile(path).then((gradleObj) => {
      resolve(gradleObj)
    })
  } catch (err) {
    reject(err)
  }
})

/**
 * APk name  change a new name that follows the pattern [app name]-[create date YYYYMMDD]-[version without '.'] 
 * @param {String} apkNameEN 
 * @param {String} apkPath 
 */
const getAPKNewName = async (apkNameEN, apkPath) => {
  try {
    const gradleObj = await convGradleToJson(`${global.appRoot}/src/build/buildcopy.gradle`)
    const version = gradleObj.android.productFlavors['@[appenglishname]'].versionName.replace(/\./g, '')
    const createDate = moment(fs.statSync(`${apkPath}`).birthtime).utc().format('YYYYMMDD')
    const apkNewName = `${apkNameEN}_${createDate}_v${version}`
    return apkNewName
  } catch (err) {
    throw new Error(err)
  }
}

/**
 * update apk Info 
 * @param {Object} postData 
 */
const updAPKInfoJSONFile = (postData) => {
  const apkNewName = postData.apkNewName
  const apkNameEN = postData.apk_name_en
  let allAPKInfo = {}
  const apkInfo = {
    name: postData.apk_name,
    name_en: postData.apk_name_en,
    url: postData.apk_url,
    version:apkNewName.split('_')[2],
    hidden_action_btn: postData.hidden_action_btn || false,
    auto_connect_vpn: postData.auto_connect_vpn || false
  }
  const apkDir = `${global.appRoot}/deploy/${apkNameEN}`

  if (fs.existsSync(`${apkDir}/${apkNameEN}.json`)) {
    allAPKInfo = fs.readFileSync(`${apkDir}/${apkNameEN}.json`, 'utf8')
    if (typeof (allAPKInfo) === 'string') allAPKInfo = JSON.parse(allAPKInfo)
  }

  allAPKInfo[apkNewName] = apkInfo

  // check every file that if  the APK does not exist  in apkDir then delete this apk name item in the object.  
  Object.keys(allAPKInfo).forEach((apkVerNam) => {
    if (!fs.existsSync(`${apkDir}/${apkVerNam}.apk`)) {
      delete allAPKInfo[apkVerNam]
    }
  })

  fs.writeFileSync(`${apkDir}/${apkNameEN}.json`, JSON.stringify(allAPKInfo), 'utf8')

}


/**
 *  Start Building APK
 */
const build = async (req, callback) => {
  const apkNameEN = req.body.apk_name_en
  let timeoutSecs = 180
  try {
    global.isAPKBuilding = true
    const apkBuildDirPath = `${config.apk.rootPath}/app/build/outputs/apk/${apkNameEN}/debug`
    const apkPath = `${apkBuildDirPath}/app-${apkNameEN}-debug.apk`

    shell.rm('-rf', `${config.apk.rootPath}/app/build/outputs/apk/*`)
    shell.mkdir('-p', `${apkBuildDirPath}`)

    await resizeLogo(apkNameEN)
    await reloadGradleFile(req.body)

    const buildApkProcess = await runBatchAndBuildApk(req)

    const countIntv = setInterval(async () => {
      try {
        if (timeoutSecs === 0) {

          clearInterval(countIntv)
          buildApkProcess.kill()
          callback('The builder is timeout. Please retry later.')

        } else if (timeoutSecs > 0 && fs.readdirSync(apkBuildDirPath).length > 1
          && fs.existsSync(apkPath) && fs.statSync(apkPath).size > 0) {

          clearInterval(countIntv)
          buildApkProcess.kill()

          const apkNewName = await getAPKNewName(apkNameEN, apkPath)
          const apkDownloadUrl = `${req.protocol}://${req.headers.host}/download/${apkNameEN}/${apkNewName}.apk`

          shell.mkdir('-p', `${global.appRoot}/deploy/${apkNameEN}`)
          shell.cp('-f', apkPath, `${global.appRoot}/deploy/${apkNameEN}/${apkNewName}.apk`)

          updAPKInfoJSONFile(Object.assign({}, req.body, { apkNewName }))

          logger.info(`===== [${apkNameEN}] APK is successfully established! =====`)
          callback(null, apkDownloadUrl)
        }

        timeoutSecs--
      } catch (err) {
        clearInterval(countIntv)
        buildApkProcess.kill()
        callback(err.message, '')
      }
    }, 1000)
  } catch (err) {
    callback(typeof err === 'string' ? err : err.message, '')
  }
}

/**
 * Get apk detail information from json file
 * @param {Object} req 
 */
const getApkInfo = (req) => {
  let apkInfo = {}
  const apkFileName = req.body.apkFileName
  const apkName = apkFileName.split('_')[0]
  const apkInfoPath = `${global.appRoot}/deploy/${apkName}/${apkName}.json`
  if (fs.existsSync(apkInfoPath)) {
    const allInfo = JSON.parse(fs.readFileSync(apkInfoPath,'utf8'))
    apkInfo = allInfo[apkFileName] || {}
  }
  return apkInfo
}

module.exports = { build, getApkInfo }
