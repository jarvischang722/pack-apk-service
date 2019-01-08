const nodemailer = require('nodemailer')
const config = require('./config')
const logger = require('log4js').getLogger()

const transporter = nodemailer.createTransport(
    Object.assign(
      config,
      { tls: { rejectUnauthorized: false } }
    )
  )


const send = (title, content, recipients) =>
  new Promise((resolve) => {
    const mailOptions = {
      from: config.auth.user,
      to: recipients,
      subject: title,
      html: content,
    }

    transporter.sendMail(
        mailOptions,
      (err, info) => {
        if (err) logger.error(err, false) // dont send email
        else logger.info(`Email提醒 <${title}> ${info.messageId} 已发送: ${info.response}`)
        resolve()
      }
    )
  })

module.exports = {
  send,
}

