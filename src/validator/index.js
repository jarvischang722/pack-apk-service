const Joi = require('joi')
const errors = require('../error')

const ERRORS = {
  ValidationFailed: 400,
}
errors.register(ERRORS)

const validate = (data, schema, ext) => {
  if (typeof schema === 'object') {
    schema = Joi.object(schema)
  }
  if (ext) {
    if (Array.isArray(ext)) {
      const required = {}
      /* eslint-disable no-restricted-syntax */
      for (const r of ext) {
        required[r] = Joi.required()
      }
      ext = Joi.object(required)
    } else if (typeof ext === 'object') {
      ext = Joi.object(ext)
    }
    schema = schema.concat(ext)
  }
  const result = Joi.validate(data, schema)
  if (result.error) {
    throw new Error(result.error.details[0].message)
  }
  if (result.value && Object.keys(data).length > 0) {
    for (const key of Object.keys(data)) {
      if (result.value[key]) {
        data[key] = result.value[key]
      }
    }
  }
  return result.value
}

const getSchema = (schema, ...keys) => {
  const schemaKeys = []
  for (const key of keys) {
    if (Array.isArray(key)) {
      schemaKeys.push(...key)
    } else {
      schemaKeys.push(key)
    }
  }
  const sub = {}
  for (const key of schemaKeys) {
    sub[key] = schema[key]
  }
  return sub
}

module.exports = { validate, getSchema, T: Joi }
