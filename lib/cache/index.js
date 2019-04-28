const LruCache = require('lru-cache')

class BaseCache {
  constructor (options) {
    this.options = options
  }
  get (key) {
    throw new Error('not implemented')
  }
  set (key, item) {
    throw new Error('not implemented')
  }
  del (key) {
    throw new Error('not implemented')
  }
  clear () {
    throw new Error('not implemented')
  }
}

class DefaultCache extends BaseCache {
  constructor (options) {
    super(options)
    this.cache = new LruCache(this.options)
  }
  get (key) { return this.cache.get(key) }
  set (key, item) { this.cache.set(key, item) }
  del (key) { this.cache.del(key) }
  clear () { this.cache.reset() }
}

module.exports = { BaseCache, DefaultCache }
