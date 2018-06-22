const url = require('url')
const mm = require('micromatch')

const routes = []

const add = (path) => {
  if (!path) return
  let p = path.toLowerCase()
  if (!path.startsWith('/')) {
    p = `/${path}`
  }
  routes.push(p)
}

const has = (path) => {
  if (!path) return false
  const pathname = url.parse(path).pathname.toLowerCase()
  return mm.any(pathname, routes)
}

module.exports = { add, has }
