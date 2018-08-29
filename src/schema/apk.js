const config = require('../config')
const fs = require('fs')
const sharp = require('sharp')
const shell = require('shelljs')
const moment = require('moment')
const logger = require('log4js').getLogger()
const url = require('url')
/**
 * Resize user uploaded app logo
 * @param {Object} postData
 */
const resizeLogo = async postData => {
  const { kernel, apk_name_en } = postData
  const logoDeployPath = `${config.apk.rootPath[kernel]}/app/src/main/res`
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

    const resizeArr = Object.keys(sizeObj).map(
      sizeName =>
        new Promise((resolve, reject) => {
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
        })
    )

    Promise.all(resizeArr)
      .then(res => {
        // logger.info(res)
      })
      .catch(err => {
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
const reloadGradleFile = async postData => {
  try {
    const { apk_name_en, apk_name, apk_url, hidden_action_btn, auto_connect_vpn, kernel } = postData

    let gradleFileCont = fs.readFileSync(
      `${global.appRoot}/src/build/buildcopy_${kernel}.gradle`,
      'utf8'
    )
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
    gradleFileCont = gradleFileCont.replace(/\@\[hiddenactionbtn\]/g, hidden_action_btn || false)
    gradleFileCont = gradleFileCont.replace(/\@\[autoconnectvpn\]/g, auto_connect_vpn || false)

    fs.writeFileSync(`${config.apk.rootPath[kernel]}/app/build.gradle`, gradleFileCont, 'utf8')

    return gradleFileCont
  } catch (err) {
    throw new Error(err)
  }
}

/**
 * Start building process
 */
const runBatch = async postData =>
  new Promise((resolve, reject) => {
    const { spawn } = require('child_process')
    const { kernel } = postData
    try {
      if (process.platform.indexOf('win') > -1) {
        const buildApkProcess = spawn(
          'cmd',
          ['/c', `${config.apk.rootPath[kernel]}/buildapp.bat`],
          {
            windowsHide: true,
            timeout: 180000
          }
        )
        buildApkProcess.stdout.on('data', data => {
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
const convGradleToJson = async path =>
  new Promise((resolve, reject) => {
    try {
      require('gradle-to-js/lib/parser')
        .parseFile(path)
        .then(gradleObj => {
          resolve(gradleObj)
        })
    } catch (err) {
      reject(err)
    }
  })

/**
 * APk name  change a new name that follows the pattern
 * [app name]-[create date YYYYMMDD]-[version without '.']
 * @param {String} apkNameEN
 * @param {String} apkPath
 * @param {String} kernel
 */
const getAPKNewName = async (apkNameEN, apkPath, kernel) => {
  try {
    const gradleObj = await convGradleToJson(
      `${global.appRoot}/src/build/buildcopy_${kernel}.gradle`
    )
    const version = gradleObj.android.productFlavors['@[appenglishname]'].versionName.replace(
      /\./g,
      ''
    )

    const createDate = moment(fs.statSync(`${apkPath}`).birthtime)
      .utc()
      .format('YYYYMMDD')
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
const updApkInfoToJsonFile = postData => {
  const { filename, apk_name, apk_name_en, apk_url, logo, kernel } = postData
  let allAPKInfo = {}
  const apkInfo = {
    name: apk_name,
    name_en: apk_name_en,
    url: apk_url,
    version: filename.split('_')[2],
    filename,
    hidden_action_btn: postData.hidden_action_btn || false,
    auto_connect_vpn: postData.auto_connect_vpn || false,
    logo,
    kernel
  }
  const apkDir = `${global.appRoot}/deploy/${apk_name_en}`

  if (fs.existsSync(`${apkDir}/${apk_name_en}.json`)) {
    allAPKInfo = fs.readFileSync(`${apkDir}/${apk_name_en}.json`, 'utf8')
    if (typeof allAPKInfo === 'string') allAPKInfo = JSON.parse(allAPKInfo)
  }

  allAPKInfo[filename] = apkInfo

  // check all file that if the APK does not exist in apkDir,
  // then delete this apk name item in the object.
  Object.keys(allAPKInfo).forEach(apkVerNam => {
    if (!fs.existsSync(`${apkDir}/${apkVerNam}.apk`)) {
      delete allAPKInfo[apkVerNam]
    }
  })

  fs.writeFileSync(`${apkDir}/${apk_name_en}.json`, JSON.stringify(allAPKInfo), 'utf8')
}

/**
 *  Start Building APK
 */
const build = async (req, callback) => {
  const postData = req.body
  const { kernel, apk_name_en: apkNameEN } = postData
  let timeoutSecs = 180
  try {
    global.isAPKBuilding = true
    const apkBuildDirPath = `${
      config.apk.rootPath[kernel]
    }/app/build/outputs/apk/${apkNameEN}/debug`
    const apkPath = `${apkBuildDirPath}/app-${apkNameEN}-debug.apk`

    shell.rm('-rf', `${config.apk.rootPath[kernel]}/app/build/outputs/apk/*`)
    shell.mkdir('-p', `${apkBuildDirPath}`)

    await resizeLogo(postData)
    await reloadGradleFile(postData)

    const buildApkProcess = await runBatch(postData)

    const countIntv = setInterval(async () => {
      try {
        if (timeoutSecs === 0) {
          clearInterval(countIntv)
          buildApkProcess.kill()
          callback('The builder is timeout. Please retry later.')
        } else if (
          timeoutSecs > 0 &&
          fs.readdirSync(apkBuildDirPath).length > 1 &&
          fs.existsSync(apkPath) &&
          fs.statSync(apkPath).size > 0
        ) {
          clearInterval(countIntv)
          buildApkProcess.kill()

          const filename = await getAPKNewName(apkNameEN, apkPath, kernel)
          const filePath = `${req.protocol}://${req.headers.host}/download/${apkNameEN}/${filename}`
          const apkUrl = `${filePath}.apk`
          const logo = `${filePath}.png`

          shell.mkdir('-p', `${global.appRoot}/deploy/${apkNameEN}`)
          shell.cp('-f', apkPath, `${global.appRoot}/deploy/${apkNameEN}/${filename}.apk`)
          shell.cp(
            '-f',
            `${global.appRoot}/upload/logo/${apkNameEN}.png`,
            `${global.appRoot}/deploy/${apkNameEN}/${filename}.png`
          )

          const apkData = Object.assign({}, req.body, { filename, apkUrl, kernel, logo })
          updApkInfoToJsonFile(apkData, req)

          logger.info(`===== [${apkNameEN}] APK is successfully established! =====`)
          callback(null, apkUrl)
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
const getApkInfo = req => {
  let apkInfo = {}
  const apkFileName = req.body.apkFileName
  const apkName = apkFileName.split('_')[0]
  const apkInfoPath = `${global.appRoot}/deploy/${apkName}/${apkName}.json`
  if (fs.existsSync(apkInfoPath)) {
    const allInfo = JSON.parse(fs.readFileSync(apkInfoPath, 'utf8'))
    apkInfo = allInfo[apkFileName] || {}
  }
  return apkInfo
}

/**
 * Get build apk list
 * @param {Object} req
 */
const getBuildedList = req => {
  const buildedAPKList = []
  const deployPath = `${global.appRoot}/deploy`
  try {
    fs.readdirSync(`${deployPath}`).forEach(apkName => {
      if (fs.existsSync(`${deployPath}/${apkName}/${apkName}.json`)) {
        const apkList = JSON.parse(fs.readFileSync(`${deployPath}/${apkName}/${apkName}.json`, 'utf8'))
        for (const apkname of Object.keys(apkList)) {
          const apk = apkList[apkname]
          const name_en = apk.name_en
          const filename = apk.filename || name_en
          const kernel = apk.kernel || ''
          const logo = apk.logo || ''
          const apkUrl = `${req.protocol}://${req.headers.host}/download/${apkName}/${filename}.apk`
          const createTime = moment(fs.statSync(`${deployPath}/${apkName}/${filename}.apk`)
                             .birthtime).utc().format('YYYY/MM/DD HH:mm:ss')
          buildedAPKList.push([name_en, filename, apkUrl, createTime, kernel, logo])
        }
      }
    })
  } catch (err) {
    throw err
  }
  return buildedAPKList
}

module.exports = { build, getApkInfo, getBuildedList }
