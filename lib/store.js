const Cache = require('lru-cache')
const { createHash } = require('crypto')
const { BUCKETS_TYPE, Buckets } = require('./buckets')
const Items = require('./items')
const { Serializer } = require('./serializer')
const { Compresser } = require('./serializer/compresser')
const { Cipher } = require('./serializer/cipher')
const Avro = require('avsc')
const Uuid = require('uuid62')
const ORDER = { ASCENDING: 1, DESCENDING: 2 }

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
  getAll (bucket, order = ORDER.ASCENDING) {
    const { items, path, serializer } = internals.getList(bucket)
    const all = Object.values(items.list)
    const list = ORDER.ASCENDING ? all : all.reverse()
    return { list, path, serializer }
  },
  create (item, path, serializer) {
    const start = 0
    const length = 1
    return { start, length }
  },
  update (key, item, path, serializer) {
    const start = 0
    const length = 1
    const position = 2
    return { start, length, position }
  },
  get (start, length, path, serializer) {

  },
  delete (key, path, serializer) {
  },
  compress (items, path, serializer) {

  }
}

class Store {
  constructor (path, { compress = false, password, salt, algorithm = 'AES-256-CBC', cacheOptions = 100 }) {
    this.cache = new Cache(cacheOptions)
    this.path = path || process.cwd()
    this.compresser = compress ? new Compresser() : undefined
    if ((password && !salt) || (!password && salt)) {
      throw new Error('To use a cipher `password` and `salt` are required')
    } else if (password && salt) {
      if (!algorithm) {
        throw new Error('To use a cipher `algorithm` is required')
      }
      this.cipher = new Cipher(password, salt, algorithm)
    }
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
  compress (bucket) {
    const { path, items, serializer } = internals.getList.call(this, bucket)
    internals.compress(items, path, serializer)
  }
  create (bucket, id, item) {
    id = id || Uuid.v4()
    const { path, items, serializer } = internals.getList.call(this, bucket)
    const key = internals.createKey(bucket, id)
    if (typeof items.get(key) !== 'undefined') {
      throw new Error(`Item with the id=${id} already exists.`)
    }
    const { start, length } = internals.save.create(this, item, path, serializer)
    items.create(key, start, length)
    this.cache.set(key, item)
    return id
  }
  get (bucket, id) {
    const key = internals.createKey(bucket, id)
    let item = this.cache.get(key)
    if (!item) {
      const { items, path, serializer } = internals.getList.call(this, bucket)
      const { start, length } = items.get(key)
      item = internals.get.call(this, start, length, path, serializer)
      this.cache(key, item)
    }
    return item
  }
  update (bucket, id, item) {
    const { path, items, serializer } = internals.getList.call(this, bucket)
    const key = internals.createKey(bucket, id)
    if (typeof items.get(key) === 'undefined') {
      throw new Error(`Item with the id=${id} does not exist.`)
    }
    const { start, length, position } = internals.call(this, key, item, path, serializer)
    items.update(key, start, length, position)
    this.cache.set(key, item)
  }
  delete (bucket, id) {
    const key = internals.createKey(bucket, id)
    this.cache.get(key)
    const { path, items } = internals.getList.call(this, bucket)
    internals.delete.call(this, key, path)
    items.delete(key)
  }
  getItems ({ bucket, offset = 0, take = 10, order = ORDER.ASCENDING }) {
    const { list, path, serializer } = internals.getAll(bucket, order)
    const count = list.length
    const items = list.slice(offset, offset + take)
    const output = []
    for (const item of items) {
      let i = this.cache.get[item.key]
      if (!i) {
        i = internals.get.call(this, item.start, item.length, path, serializer)
        this.cache.set(item.key, i)
      }
      output.push(i)
    }
    return { count, items: output }
  }
  filterItems ({ bucket, filter, offset = 0, take = 10, order = ORDER.ASCENDING }) {
    const { list, path, serializer } = internals.getAll(bucket, order)
    const output = []
    let more = false
    let count = 0
    for (const item of list) {
      let i = this.cache.get[item.key]
      if (!i) {
        i = internals.get.call(this, item.start, item.length, path, serializer)
      }
      const valid = filter.call(i)
      if (valid && offset >= count && take < output.length) { // valid to add to output
        this.cache.set(item.key, i)
        output.push(i)
        count = +1
      } else if (valid && offset >= count) { // valid, all taken so there is more, and stop looking
        more = true
        break
      } else if (valid) { // valid, but not to offset
        count = +1
      }
    }
    return { more, items: output }
  }
}

module.exports = { Store, ORDER }
