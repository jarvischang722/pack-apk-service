const errors = require('restify-errors')

function normalize(name) {
  if (!name.endsWith('Error')) {
    return `${name}Error`
  }
  return name
}

errors.localization = require('./locale.zh.json')

errors.lang = (error) => {
  if (error.message) return error.message
  const name = error.name.slice(0, -5)
  return errors.localization[name]
}

errors.register = (options) => {
  Object.keys(options).forEach((name) => {
    const config = options[name]
    const errorName = normalize(name)
    switch (typeof config) {
      case 'number':
        if (config % 1 === 0) {
          errors.makeConstructor(errorName, {
            statusCode: config,
          })
          return
        }
        break
      case 'object':
        errors.makeConstructor(errorName, config)
        return
      default:
    }
    throw new Error(`Invalid error config for ${errorName}`)
  })
}

module.exports = errors
