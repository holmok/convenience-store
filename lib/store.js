const Cache = require('lru-cache')
const { createHash } = require('crypto')

const internals = {
  createKey (bucket, key) {
    return createHash('sha256').update(`${bucket}:${key}`).digest()
  }
}

class Store {
  constructor (path, compress = false, cryptoKey = null, cacheOptions = 100) {
    this.cache = new Cache(cacheOptions)
    this.path = path || process.cwd()
  }
  createBucket (bucket, type) {}
  deleteBucket (bucket) {}
  creatItem (bucket, id, item) {}
  getItem (bucket, id) {}
  getItems (bucket, offset = 0, take = 10, reverse = false) {}
  filterItems (bucket, filter, offset = 0, take = 10, reverse = false) {}
  updateItem (bucket, id, item) {}
  deleteItem (bucket, id) {}
}

module.exports = Store
