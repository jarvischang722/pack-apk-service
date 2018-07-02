const config = require('../config')
const fs = require('fs')
const sharp = require('sharp')
const shell = require('shelljs')
const moment = require('moment')

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
            console.error(err)
            reject(err)
          } else {
            resolve(info)
          }
        })
    }))

    Promise.all(resizeArr).then(res => {
      // console.log(res)
    }).catch(err => {
      console.error(err)
      throw new Error(err)
    })
  } catch (err) {
    throw new Error(err)
  }
}

/**
 * Replace these words [appenglishname, appchinesename, appurl, appdomain]  with  user input
 * @param {Object} req
 */
const reloadGradleFile = async (req) => {
  try {
    let gradleFileCont = fs.readFileSync(`${global.appRoot}/src/buildcopy.gradle`, 'utf8')
    const { apk_name_en, apk_name, apk_url } = req.body
    let appDomain = req.hostname.split('.')[1]
    if (req.hostname.split('.').length === 2) {
      appDomain = req.hostname.split('.')[0]
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
 * Start build app
 */
const runBatchAndBuildApk = async () => new Promise((resolve, reject) => {
  const { spawn } = require('child_process')
  try {
    if (process.platform.indexOf('win') > -1) {
      const buildApkProcess = spawn('cmd', ['/c', `${config.apk.buildBatPath}`], { windowsHide: true, timeout: 180000 })
      buildApkProcess.stdout.on('data', (data) => {
        console.log(data.toString())
      })

      resolve(buildApkProcess)
    } else {
      reject(new Error('Support  "Windows" only.'))
    }
  } catch (err) {
    reject(err)
  }
})

const convGradleToJson = async (path) => new Promise((resolve, reject) => {
  try {
    require('gradle-to-js/lib/parser').parseFile(path).then((gradleObj) => {
      resolve(gradleObj)
    })
  } catch (err) {
    reject(err)
  }
})


const getAPKNewName = async (apkNameEN, apkPath) => {
  const gradleObj = await convGradleToJson(`${global.appRoot}/src/buildcopy.gradle`)
  const version = gradleObj.android.productFlavors['@[appenglishname]'].versionName.replace(/\./g, '')
  const createDate = moment(fs.statSync(`${apkPath}`).birthtime).utc().format('YYYYMMDD')
  const apkNewName = `${apkNameEN}_${createDate}_v${version}.apk`
  return apkNewName
}


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
    await reloadGradleFile(req)
    const buildApkProcess = await runBatchAndBuildApk(req)
    const countIntv = setInterval(async () => {
      if (timeoutSecs === 0) {
        clearInterval(countIntv)
        buildApkProcess.kill()
        callback('The builder is timeout. Please retry later.')
      } else if (timeoutSecs > 0 && fs.existsSync(apkPath)) {
        clearInterval(countIntv)
        buildApkProcess.kill()

        const apkNewName = await getAPKNewName(apkNameEN, apkPath)
        shell.mkdir('-p', `${global.appRoot}/deploy/${apkNameEN}`)
        shell.cp('-f', apkPath, `${global.appRoot}/deploy/${apkNameEN}/${apkNewName}`)

        console.log(`===== [${apkNameEN}] APK is successfully established! =====`)
        callback(null)
      }
      timeoutSecs--
    }, 1000)
  } catch (err) {
    callback(typeof err === 'string' ? err : err.message)
  }
}

module.exports = { build }
