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
const Fs = require('fs')

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
      list = { path: `${path}.data`, items, serializer }
      this.lists[bucket] = list
    }
    return list
  },
  getAll (bucket, order = ORDER.ASCENDING) {
    const { items, path, serializer } = internals.getList.call(this, bucket)
    const all = Object.values(items.list)
    const list = order === ORDER.ASCENDING ? all : all.reverse()
    return { list, path, serializer }
  },
  create (item, path, serializer) {
    let size = 0
    if (Fs.existsSync(path)) {
      size = Fs.statSync(path).size
    }
    const buffer = serializer.serialize(item)
    const start = size
    const length = buffer.length
    const file = Fs.openSync(path, 'a')
    Fs.writeSync(file, buffer)
    Fs.closeSync(file)
    return { start, length }
  },
  update (key, prev, item, path, serializer) {
    const buffer = serializer.serialize(item)
    internals.delete.call(this, prev.start, prev.length, path)
    let start = prev.start
    if (buffer.length <= prev.length) {
      const file = Fs.openSync(path, 'w')
      Fs.writeSync(file, buffer, prev.start)
      Fs.closeSync(file)
    } else {
      const { size } = Fs.statSync(path)
      start = size
      const file = Fs.openSync(path, 'a')
      Fs.writeSync(file, buffer, 0, buffer.length)
      Fs.closeSync(file)
    }
    return { start, length: buffer.length }
  },
  get (start, length, path, serializer) {
    const file = Fs.openSync(path, 'r')
    const buffer = Buffer.alloc(length)
    Fs.readSync(file, buffer, 0, length, start)
    Fs.closeSync(file)
    const item = serializer.deserialize(buffer)
    return item
  },
  delete (start, length, path) {
    const buffer = Buffer.alloc(length)
    const file = Fs.openSync(path, 'w')
    Fs.writeSync(file, buffer, 0, buffer.length, start)
    Fs.closeSync(file)
  },
  compress (items, path, serializer) {
    const backup = `${this.path}.new`
    const newFile = Fs.openSync(backup, 'w')
    const oldFile = Fs.openSync(path, 'r')
    const list = Object.values(items.list)
    for (const item of list) {
      const buffer = Buffer.alloc(item.length)
      Fs.readSync(oldFile, buffer, 0, item.length, item.position)
      Fs.writeSync(newFile, buffer, 0, buffer.length)
    }
    Fs.closeSync(newFile)
    Fs.closeSync(oldFile)
    Fs.unlinkSync(path)
    Fs.copyFileSync(backup, path)
  }
}

class Store {
  constructor ({ path, compress = false, password, salt, algorithm = 'AES-256-CBC', cacheOptions = 100 }) {
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
  createBucket ({ bucket, type }) {
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
  deleteBucket ({ bucket }) {
    this.buckets.delete(bucket)
  }
  compress ({ bucket, includeIndex = true }) {
    const { path, items, serializer } = internals.getList.call(this, bucket)
    internals.compress(items, path, serializer)
    if (includeIndex) items.compress()
  }
  create ({ bucket, id, item }) {
    id = typeof id === 'undefined' ? Uuid.v4() : id
    const { path, items, serializer } = internals.getList.call(this, bucket)
    const key = internals.createKey(bucket, id)
    if (typeof items.get(key) !== 'undefined') {
      throw new Error(`Item with the id=${id} already exists.`)
    }
    const { start, length } = internals.create.call(this, item, path, serializer)
    items.create(key, start, length)
    this.cache.set(key, item)
    return id
  }
  get ({ bucket, id }) {
    const key = internals.createKey(bucket, id)
    let item = this.cache.get(key)
    if (!item) {
      const { items, path, serializer } = internals.getList.call(this, bucket)
      const { start, length } = items.get(key)
      item = internals.get.call(this, start, length, path, serializer)
      this.cache.set(key, item)
    }
    return item
  }
  update ({ bucket, id, item }) {
    const { path, items, serializer } = internals.getList.call(this, bucket)
    const key = internals.createKey(bucket, id)
    const prev = items.get(key)
    if (typeof prev === 'undefined') {
      throw new Error(`Item with the id=${id} does not exist.`)
    }
    const { start, length } = internals.update.call(this, key, prev, item, path, serializer)
    items.update(key, start, length, prev.position)
    this.cache.set(key, item)
  }
  delete ({ bucket, id }) {
    const key = internals.createKey(bucket, id)
    const { items, path } = internals.getList.call(this, bucket)
    const { start, length } = items.get(key)
    internals.delete.call(this, start, length, path)
    items.delete(key)
    this.cache.del(key)
  }
  getItems ({ bucket, offset = 0, take = 10, order = ORDER.ASCENDING }) {
    const { list, path, serializer } = internals.getAll.call(this, bucket, order)
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
    const { list, path, serializer } = internals.getAll.call(this, bucket, order)
    const output = []
    let more = false
    let count = 0
    for (const item of list) {
      let i = this.cache.get[item.key]
      if (!i) {
        i = internals.get.call(this, item.start, item.length, path, serializer)
      }
      const valid = filter(i)
      if (valid && offset <= count && take > output.length) { // valid to add to output
        this.cache.set(item.key, i)
        output.push(i)
        count += 1
      } else if (valid && offset <= count) { // valid, all taken so there is more, and stop looking
        more = true
        break
      } else if (valid) { // valid, but not to offset
        count += 1
      }
    }
    return { more, items: output }
  }
}

module.exports = { Store, ORDER }
