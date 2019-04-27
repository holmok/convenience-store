const LruCache = require('lru-cache')

class BaseCache {
  constructor (options) {
    this.options = options
  }
  get (key) {}
  set (key, item) {}
  del (key) {}
  clear () {}
}

class DefaultCache extends BaseCache {
  constructor (options) {
    super(options)
    this.cache = new LruCache(this.options)
  }
  get (key) { this.cache.get(key) }
  set (key, item) { this.cache.set(key, item) }
  del (key) { this.cache.get(key) }
  clear () { this.cache.reset() }
}

module.exports = { BaseCache, DefaultCache }
