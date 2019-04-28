const { BaseCache, DefaultCache } = require('../cache')
const { createHash } = require('crypto')

class CacheManager {
  constructor (options) {
    if (options instanceof BaseCache) {
      this.cache = options
    } else {
      this.cache = new DefaultCache(options)
    }
  }
  get (key) { return this.cache.get(key) }
  set (key, item) { this.cache.set(key, item) }
  del (key) { this.cache.del(key) }
  clear () { this.cache.clear() }
  createKey (bucket, key) {
    return createHash('sha256').update(`${bucket}:${key}`).digest()
  }
}

module.exports = CacheManager
