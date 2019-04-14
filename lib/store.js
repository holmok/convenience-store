const Cache = require('lru-cache')
const { createHash } = require('crypto')
const { BUCKETS_TYPE, Buckets } = require('./buckets')
const Items = require('./items')
const { Serializer } = require('./serializer')
const { Compresser } = require('./serializer/compresser')
const { Cipher } = require('./serializer/cipher')
const Avro = require('avsc')
const Uuid = require('uuid62')

const internals = {
  createKey (bucket, key) {
    return createHash('sha256').update(`${bucket}:${key}`).digest()
  },
  getList (bucket) {
    let list = this.lists[bucket]
    if (!list) {
      const { type, path } = this.buckets.get(bucket)
      const items = new Items(path)
      const serializer = new Serializer(type, { compresser: this.compresser, cipher: this.cipher })
      list = { path, items, serializer }
      this.list[bucket] = list
    }
    return list
  },
  saveItem (item, path, serializer) {
    const start = 0
    const length = 1
    return { start, length }
  }
}

class Store {
  constructor (path, { compress = false, password, salt, algorithm = 'AES-256-CBC', cacheOptions = 100 }) {
    this.cache = new Cache(cacheOptions)
    this.path = path || process.cwd()
    this.compresser = compress ? new Compresser() : undefined
    this.cipher = password && salt ? new Cipher(password, salt, algorithm) : undefined
    const bucketSerializer = new Serializer(BUCKETS_TYPE, { compresser: this.compresser, cipher: this.cipher })
    this.buckets = new Buckets(path, bucketSerializer)
    this.lists = {}
  }
  createBucket (bucket, type) {
    let avroType = null
    if (!type) {
      throw new Error('`type` must be an Avro type or an example object')
    } else if (Avro.Type.isType(type)) {
      avroType = type
    } else {
      avroType = Avro.Type.forValue(type)
    }
    this.buckets.create(bucket, avroType)
  }
  deleteBucket (bucket) {
    this.buckets.delete(bucket)
  }
  creatItem (bucket, id, item) {
    id = id || Uuid.v4()
    const { path, items, serializer } = internals.getList.call(this, bucket)
    const key = internals.createKey(bucket, id)
    if (typeof items.get(key) !== 'undefined') {
      throw new Error(`Item with the id=${id} already exists.`)
    }
    const { start, length } = internals.saveItem(item, path, serializer)
    items.create(key, start, length)
    this.cache.set(key, item)
    return id
  }
  getItem (bucket, id) {}
  getItems (bucket, offset = 0, take = 10, reverse = false) {}
  filterItems (bucket, filter, offset = 0, take = 10, reverse = false) {}
  updateItem (bucket, id, item) {}
  deleteItem (bucket, id) {}
}

module.exports = Store
