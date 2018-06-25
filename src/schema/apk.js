const errors = require('../error')
const config = require('../config')
const fs = require('fs')
const sharp = require('sharp')


// Resize user uploaded app logo
const resizeLogo = async (apk_name_en) => {
  const logoDeployPath = `${global.appRoot}/upload/logo/${apk_name_en}`
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
    await runBatchAndBuildApk(req)
    return { success: true, errorMsg: '', params: req.body }
  } catch (err) {
    return { success: false, errorMsg: err, params: req.body }
  }
}

module.exports = { build }
