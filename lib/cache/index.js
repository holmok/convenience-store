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

class LRUCache extends BaseCache {
  constructor (options) {
    super(options)
    this.cache = new LruCache(this.options)
  }
  get (key) { return this.cache.get(key) }
  set (key, item) { this.cache.set(key, item) }
  del (key) { this.cache.del(key) }
  clear () { this.cache.reset() }
}

class MemoryCache extends BaseCache {
  constructor (options) {
    super(options)
    this.cache = {}
  }
  get (key) { return this.cache[key] }
  set (key, item) { this.cache[key] = item }
  del (key) { delete this.cache[key] }
  clear () { this.cache = {} }
}

class NoCache extends BaseCache {
  get (key) { return undefined }
  set (key, item) { /* noop */ }
  del (key) { /* noop */ }
  clear () { /* noop */ }
}

module.exports = { BaseCache, LRUCache, DefaultCache: MemoryCache, NoCache, MemoryCache }
