const config = require('../config')
const fs = require('fs')
const sharp = require('sharp')
const shell = require('shelljs')
const moment = require('moment')
const logger = require('log4js').getLogger()
const url = require('url')
const mailer = require('../mailer')

sharp.cache(false)

/**
 * Resize user uploaded app logo
 * @param {Object} postData
 */
const resizeLogo = async postData => {
  const { kernel, apk_name_en } = postData
  const logoDeployPath = `${config.apk[kernel].rootPath}/app/src/main/res`
  const defaultImgName = 'client_build_icon'
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
          const imagePath = `${logoDeployPath}/${sizeName}/${defaultImgName}.png`
          shell.rm('-f', `${imagePath}`)
          sharp(`${global.appRoot}/upload/logo/${apk_name_en}.png`)
            .resize(sizeObj[sizeName], sizeObj[sizeName])
            .toFile(`${imagePath}`, (err, info) => {
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
      .then(() => {
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
 * Replace these words
 * [appenglishname, appchinesename, appurl, appdomain, versionName]  by  user input
 * @param {Object} postData
 */
const reloadGradleFile = async postData => {
  try {
    const {
      apk_name_en,
      apk_name,
      apk_url,
      hidden_action_btn,
      auto_connect_vpn,
      isHiddenTabHome,
      isHiddenTabReload,
      isHiddenTabVpn,
      isHiddenTabUpdate,
      isHiddenTabAbout,
      isHiddenTabPrepage,
      kernel,
      version_name
    } = postData

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
    gradleFileCont = gradleFileCont.replace(/\@\[isHiddenFAB\]/g, hidden_action_btn || false)
    gradleFileCont = gradleFileCont.replace(/\@\[isTurnOnVpn\]/g, auto_connect_vpn || false)
    gradleFileCont = gradleFileCont.replace(/\@\[isHiddenTabHome\]/g, isHiddenTabHome || false)
    gradleFileCont = gradleFileCont.replace(/\@\[isHiddenTabReload\]/g, isHiddenTabReload || false)
    gradleFileCont = gradleFileCont.replace(
      /\@\[isHiddenTabPrepage\]/g,
      isHiddenTabPrepage || false
    )
    gradleFileCont = gradleFileCont.replace(/\@\[isHiddenTabVpn\]/g, isHiddenTabVpn || false)
    gradleFileCont = gradleFileCont.replace(/\@\[isHiddenTabUpdate\]/g, isHiddenTabUpdate || false)
    gradleFileCont = gradleFileCont.replace(/\@\[isHiddenTabAbout\]/g, isHiddenTabAbout || false)
    gradleFileCont = gradleFileCont.replace(/\@\[versionName\]/g, version_name)

    fs.writeFileSync(`${config.apk[kernel].rootPath}/app/build.gradle`, gradleFileCont, 'utf8')

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
          ['/c', `${config.apk[kernel].rootPath}/buildapp.bat`],
          {
            windowsHide: true,
            timeout: 180000
          }
        )
        resolve(buildApkProcess)
      } else {
        reject(new Error('Support Windows only.'))
      }
    } catch (err) {
      reject(err)
    }
  })

/**
 * APk name  change a new name that follows the pattern
 * @param {String} apkNameEN
 * @param {String} apkPath
 * @param {String} version_name
 * @returns {String} formate : [app name]-[create date YYYYMMDD]-[version without '.']
 */
const getAPKNewName = async (apkNameEN, apkPath, version_name) => {
  try {
    const version = version_name.replace(/\.|\"/g, '')
    const createDate = moment(fs.statSync(`${apkPath}`).birthtime)
      .utc()
      .format('YYYYMMDDHHmmss')
    const apkNewName = `${apkNameEN}_${createDate}_v${version}`
    return apkNewName
  } catch (err) {
    throw err
  }
}

/**
 * update apk Info
 * @param {Object} postData
 */
const updApkInfo = postData => {
  try {
    const { fileName, apk_name, apk_name_en, apk_url, logo, kernel } = postData
    let allAPKInfo = {}
    const apkInfo = {
      name: apk_name,
      name_en: apk_name_en,
      url: apk_url,
      version: fileName.split('_')[2],
      fileName,
      hidden_action_btn: postData.hidden_action_btn || false,
      auto_connect_vpn: postData.auto_connect_vpn || false,
      isHiddenTabHome: postData.isHiddenTabHome || false,
      isHiddenTabReload: postData.isHiddenTabReload || false,
      isHiddenTabVpn: postData.isHiddenTabVpn || false,
      isHiddenTabUpdate: postData.isHiddenTabUpdate || false,
      isHiddenTabAbout: postData.isHiddenTabAbout || false,
      isHiddenTabPrepage: postData.isHiddenTabPrepage || false,
      logo,
      kernel
    }
    const apkDir = `${global.appRoot}/deploy/${apk_name_en}`

    if (fs.existsSync(`${apkDir}/${apk_name_en}.json`)) {
      allAPKInfo = fs.readFileSync(`${apkDir}/${apk_name_en}.json`, 'utf8')
      if (typeof allAPKInfo === 'string') allAPKInfo = JSON.parse(allAPKInfo)
    }

    allAPKInfo[fileName] = apkInfo

    // check all file that if the APK does not exist in apkDir,
    // then delete this apk name item in the object.
    Object.keys(allAPKInfo).forEach(apkVerNam => {
      if (!fs.existsSync(`${apkDir}/${apkVerNam}.apk`)) {
        delete allAPKInfo[apkVerNam]
      }
    })

    fs.writeFileSync(`${apkDir}/${apk_name_en}.json`, JSON.stringify(allAPKInfo), 'utf8')
  } catch (err) {
    throw err
  }
}

/**
 * Move completed apk and apk's image to deploy dir.
 * If isClient is true, then just copy apk to '/deploy/fromClient/'
 * @param {String} fileName
 * @param {String} apkNameEN APK's English name
 * @param {String} apkPath Completed APK file path
 * @param {String} isClient Whether to build the apk from client page
 */
const moveFile = async (fileName, apkNameEN, apkSrcPath, isClient) => {
  const deployDir = `${global.appRoot}/deploy/${apkNameEN}`
  const clientDir = `${global.appRoot}/deploy/fromClient/`
  const apkTargetPath = isClient === true ? `${clientDir}/${fileName}.apk` : `${deployDir}/${fileName}.apk`
  if (isClient === true) {
    shell.mkdir('-p', clientDir)
  } else {
    shell.mkdir('-p', deployDir)
    shell.cp(
      '-f',
      `${global.appRoot}/upload/logo/${apkNameEN}.png`,
      `${deployDir}/${fileName}.png`
    )
  }
  shell.rm('-f', apkTargetPath)
  shell.cp('-f', apkSrcPath, apkTargetPath)

  // TODO Delete those expired files in clientDir.(About 3 days)
}

/**
 * Kill Java process by pid
 */
const killJavaProcess = () =>
  new Promise((resolve, reject) => {
    try {
      const { spawn } = require('child_process')
      const KillOfProcess = spawn('cmd', ['/c', 'taskkill /im java.exe /F'], {
        windowsHide: true,
        timeout: 180000
      })

      KillOfProcess.stdout.on('data', data => {
        logger.info(data.toString())
      })

      KillOfProcess.on('close', code => {
        if (code !== 0) {
          logger.log(`kill process exited with code ${code}`)
        }
        resolve()
      })
    } catch (err) {
      reject(err)
    }
  })

  /**
   * Stop all listeners
   * @param {Object} countIntv
   * @param {Object} buildApkProcess
   */
const stopListener = async (countIntv, buildApkProcess) => {
  try {
    global.isAPKBuilding = false
    clearInterval(countIntv)
    buildApkProcess.kill()
    await killJavaProcess()
  } catch (err) {
    throw err
  }
}

const sendToClient = async (downloadUrl, email) => {
  const title = 'Your App from Tripleonetech Builder'
  const content = `Congratulations. your app was done.<br>
  File only keep three days.<br>
  below is your app link. hope you like it.<br>
  Download URL : ${downloadUrl} 
  <br>
  <br>
  <br>
  <br>
  <br>
  <br>
  ========= <br>
  Tripleone Tech Pte. Ltd. Taiwan Branch<br>
  新加坡商合眾科技顧問有限公司台灣分公司<br>
  www.tripleonetech.net
  `
  const recipients = email

  mailer.send(title, content, recipients)
}

/**
 * Listening that whether build apk is completed
 * @param {Object} req
 * @param {Object} buildApkProcess
 * @param {*} callback
 */
const listenBuildApk = (req, buildApkProcess, callback) => {
  const { kernel, apk_name_en: apkNameEN, version_name, isClient, email } = req.body
  let timeoutSecs = 600
  const apkBuildDirPath = `${config.apk[kernel].rootPath}/app/build/outputs/apk/${apkNameEN}/debug`
  const apkPath = `${apkBuildDirPath}/app-${apkNameEN}-debug.apk`
  const countIntv = setInterval(async () => {
    try {
      if (timeoutSecs === 0) {
        stopListener(countIntv, buildApkProcess)
        if (kernel === 'webview') return callback('The builder is timeout. Please retry later.')
      } else if (
        timeoutSecs > 0 &&
        fs.readdirSync(apkBuildDirPath).length > 1 &&
        fs.existsSync(apkPath) &&
        fs.statSync(apkPath).size > 0
      ) {
        const fileName = await getAPKNewName(apkNameEN, apkPath, version_name)
        const filePath = isClient === true
                      ? `${req.protocol}://${req.headers.host}/download/fromClient/${fileName}`
                      : `${req.protocol}://${req.headers.host}/download/${apkNameEN}/${fileName}`
        const apkUrl = `${filePath}.apk`
        const logo = `${filePath}.png`

        moveFile(fileName, apkNameEN, apkPath, isClient)

        // 如果build APK是由client page生成，則只需要將結果寄送EMail就好
        if (isClient === true) {
          sendToClient(apkUrl, email)
        } else {
          updApkInfo(Object.assign({}, req.body, { fileName, apkUrl, kernel, logo }))
        }


        stopListener(countIntv, buildApkProcess)

        if (isClient === true) {
          sendToClient(apkUrl, email)
        }

        logger.info(`===== APK[${apkNameEN}] is successfully established. =====`)

        if (kernel === 'webview') return callback(null, apkUrl)
      }

      timeoutSecs--
    } catch (err) {
      logger.error(`===== APK[${apkNameEN}] built failed. =====`)
      logger.error(err)
      stopListener(countIntv, buildApkProcess)

      if (kernel === 'webview') return callback(err)
    }
  }, 1000)

  buildApkProcess.stdout.on('data', data => {
    const result = data.toString()
    logger.info(result)
    if (new RegExp(/FAILED/g).test(result)) {
      stopListener(countIntv, buildApkProcess)
      return callback(new Error('An error occurred during the build process.'))
    }
  })

  if (kernel === 'chromium') {
    return callback(null, '')
  }
}

/**
 *  Start Building APK
 */
const build = async (req, callback) => {
  const postData = req.body
  const { kernel, apk_name_en: apkNameEN } = postData

  try {
    global.isAPKBuilding = true
    const apkBuildDirPath = `${
      config.apk[kernel].rootPath
    }/app/build/outputs/apk/${apkNameEN}/debug`

    shell.rm('-rf', `${config.apk[kernel].rootPath}/app/build/outputs/apk/*`)
    shell.mkdir('-p', `${apkBuildDirPath}`)

    await resizeLogo(postData)
    await reloadGradleFile(postData)

    const buildApkProcess = await runBatch(postData)
    listenBuildApk(req, buildApkProcess, callback)
  } catch (err) {
    global.isAPKBuilding = false
    return callback(err, '')
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
        const apkList = JSON.parse(
          fs.readFileSync(`${deployPath}/${apkName}/${apkName}.json`, 'utf8')
        )
        for (const apkname of Object.keys(apkList)) {
          const apk = apkList[apkname]
          const name_en = apk.name_en.toUpperCase()
          const fileName = apkname
          const kernel = apk.kernel || ''
          const logo = apk.logo || ''
          const apkUrl = `${req.protocol}://${req.headers.host}/download/${apkName}/${fileName}.apk`
          const createTime = moment(
            fs.statSync(`${deployPath}/${apkName}/${fileName}.apk`).birthtime
          )
            .utc()
            .format('YYYY/MM/DD HH:mm:ss')
          buildedAPKList.push([name_en, fileName, apkUrl, createTime, kernel, logo])
        }
      }
    })
  } catch (err) {
    throw err
  }
  return buildedAPKList
}

/**
 *  Check build time whether exceeds 30 mins.
 *  Generally if exceeds 30 mins that is the process of build have failed.
 *  @param {String} kn  kernel of build. (Default webview)
 */
const checkBuildTimeIsOver = (kn) => {
  const kernel = kn || 'webview'
  let isOverTime = false
  const apkDir = `${config.apk[kernel].rootPath}/app/build/outputs/apk`
  const dirs = fs.readdirSync(apkDir)
  if (dirs.length > 0) {
    const apkDirStat = fs.statSync(`${apkDir}/${dirs[0]}`)
    const spentMins = moment(new Date()).diff(apkDirStat.ctime, 'minute')
    if (spentMins >= 30) {
      isOverTime = true
    }
  }
  return isOverTime
}

module.exports = { build, getApkInfo, getBuildedList, checkBuildTimeIsOver }
