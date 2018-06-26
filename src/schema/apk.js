const errors = require('../error')
const config = require('../config')
const fs = require('fs')
const sharp = require('sharp')


// Resize user uploaded app logo
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
      console.log(res)
    }).catch(err => {
      console.error(err)
    })
  } catch (err) {
    console.error(err)
  }
}

// Replace these words [appenglishname, appchinesename, appurl, appdomain]  with  user input
const reloadGradleFile = async (req) => {
  try {
    // gradlePath defualt : AndroidSafetyBrowserChromium\app
    let gradleFileCont = fs.readFileSync(`${config.apk.gradlePath}/buildcopy.gradle`, 'utf8')
    const { apk_name_en, apk_name, apk_url } = req.body
    let appDomain = req.host.split('.')[1]
    if (req.host.split('.').length === 2) {
      appDomain = req.host.split('.')[0]
    }
    gradleFileCont = gradleFileCont.replace(/\@\[appenglishname\]/g, apk_name_en)
    gradleFileCont = gradleFileCont.replace(/\@\[appchinesename\]/g, apk_name)
    gradleFileCont = gradleFileCont.replace(/\@\[appurl\]/g, apk_url)
    gradleFileCont = gradleFileCont.replace(/\@\[appdomain\]/g, appDomain)

    fs.writeFileSync(`${config.apk.gradlePath}/build.gradle`, gradleFileCont, 'utf8')
  } catch (err) {
    throw new Error(err)
  }
}

// Start build app
const runBatchAndBuildApk = async (req) => new Promise((resolve, reject) => {
  try {
    require('child_process').exec(`cmd /c ${config.apk.buildBatPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(error)
        reject(error)
      }
      resolve(stdout)
    })
  } catch (err) {
    reject(err)
  }
})


const build = async (req) => {
  try {
    await resizeLogo(req.body.apk_name_en)
    await reloadGradleFile(req)
    await runBatchAndBuildApk(req)
    return { success: true, errorMsg: '', params: req.body }
  } catch (err) {
    return { success: false, errorMsg: typeof err === 'string' ? err : err.message, params: req.body }
  }
}

module.exports = { build }
