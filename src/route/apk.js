const multer = require('multer')
const errors = require('../error')
const { validate, getSchema, T } = require('../validator')
const { generateToken } = require('../authorization')

const SCHEMA = {
  id: T.number().integer(),
  role: T.number().integer().valid(1, 2).default(1),
  name: T.string(),
  expireIn: T.date().timestamp('unix').raw().allow(null, ''),
  username: T.string().required(),
  password: T.string().required(),
  homeUrl: T.alternatives().try(
    T.array().items(T.string().uri()),
    T.string().uri()
  ).required(),
  icon: T.string(),
  page: T.number().integer().min(1).default(1),
  pagesize: T.number().integer().min(1).default(10),
}

const ERRORS = {
  NoPermission: 403,
  UserNotFound: 404,
  CreateUserFailed: 400,
  UserDuplicated: 400,
  ExpireInRequired: 400,
  InvalidExpireIn: 400,
  UserExpired: 400,
}

errors.register(ERRORS)

module.exports = (route, config, exempt) => {
  const build = async (req, res, next) => {
    try {
      return res.send('hello~~~')
    } catch (err) {
      return next(err)
    }
  }

  exempt('/apk/build')

  route.get('/apk/build', build)
}
