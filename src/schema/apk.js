const errors = require('../error')
const config = require('../config')
const fs = require('fs')
const sharp = require('sharp')
const shell = require('shelljs')
const chokidar = require('chokidar')

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
      sharp(`${global.appRoot}\\upload\\logo\\${apk_name_en}.png`)
        .resize(sizeObj[sizeName], sizeObj[sizeName])
        .toFile(`${logoDeployPath}\\${sizeName}\\${apk_name_en}.png`, (err, info) => {
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
  } catch (err) {
    throw new Error(err)
  }
}

/**
 * Start build app
 */
const runBatchAndBuildApk = async () => new Promise((resolve, reject) => {
  try {
    if (process.platform.indexOf('win') > -1) {
      const child = require('child_process').exec(`cmd /c ${config.apk.buildBatPath}`, (error, stdout, stderr) => {
        if (error) {
          console.error(error)
        }
      })

      child.stdout.on('data', (data) => {
        console.log(data.toString())
      })
      resolve()
    } else {
      reject(new Error('Support  "Windows" only.'))
    }
  } catch (err) {
    reject(err)
  }
})

const build = async (req, callback) => {
  const apkNameEN = req.body.apk_name_en
  try {
    shell.rm('-rf', `${config.apk.rootPath}/app/build/outputs/apk/*`)
    const apkBuildPath = `${config.apk.rootPath}/app/build/outputs/apk/${apkNameEN}/debug`
    shell.mkdir('-p', `${apkBuildPath}`)

    global.isAPKBuilding = true
    await resizeLogo(req.body.apk_name_en)
    await reloadGradleFile(req)
    await runBatchAndBuildApk(req)
    const watcherOptions = {
      persistent: true,
      ignoreInitial: true
    }

    const watcher = await chokidar.watch(`${apkBuildPath}/app-${apkNameEN}-debug.txt`, watcherOptions)

    watcher.on('add', (path) => {
      shell.mkdir('-p', `${global.appRoot}/deploy/${apkNameEN}`)
      shell.cp('-f', path, `${global.appRoot}/deploy/${apkNameEN}/`)
      watcher.close()
      callback(null)
    })
  } catch (err) {
    callback(typeof err === 'string' ? err : err.message)
  }
}

module.exports = { build }
