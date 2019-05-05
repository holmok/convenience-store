
const { ListManager } = require('./list-manager')
const { BucketManager } = require('./bucket-manager')
const { CacheManager } = require('./cache-manager')
const { StoreManager, ORDER } = require('./store-manager')
const Uuid = require('uuid62')

class Store {
  constructor (path, { compress = false, password, cache, serializer = undefined } = {}) {
    this.cache = new CacheManager(cache)
    this.buckets = new BucketManager(path, { compress, password, serializer })
    this.lists = new ListManager(this.buckets, path)
    this.store = new StoreManager(this.lists, path)
  }
  existsBucket (bucket) {
    return this.buckets.exists(bucket)
  }
  createBucket (bucket, type) {
    this.buckets.create(bucket, type)
  }
  deleteBucket (bucket) {
    this.buckets.delete(bucket)
  }
  compress (bucket) {
    this.lists.compress(bucket)
    this.store.compress(bucket)
  }

  create (bucket, item) {
    const id = typeof item.id === 'undefined' ? Uuid.v4() : item.id
    const data = Object.assign(item, { id })
    const { path, items, serializer } = this.lists.get(bucket)
    const key = this.cache.createKey(bucket, id)
    if (items.exists(key)) {
      throw new Error(`Item with the id=${id} already exists.`)
    }
    const { start, length } = this.store.create(data, path, serializer)
    items.create(key, start, length)
    this.cache.set(key, item)
    return id
  }
  exists (bucket, id) {
    const key = this.cache.createKey(bucket, id)
    let item = this.cache.get(key)
    if (typeof item === 'undefined') {
      const { items } = this.lists.get(bucket)
      item = items.exists(key)
    }
    return !!item
  }
  get (bucket, id) {
    const key = this.cache.createKey(bucket, id)
    let item = this.cache.get(key)
    if (typeof item === 'undefined') {
      const { items, path, serializer } = this.lists.get(bucket)
      const { start, length } = items.get(key)
      item = this.store.get(start, length, path, serializer)
      this.cache.set(key, item)
    }
    return item
  }
  update (bucket, id, item) {
    const { path, items, serializer } = this.lists.get(bucket)
    const key = this.cache.createKey(bucket, id)
    const prev = items.get(key)
    if (typeof prev === 'undefined') {
      throw new Error(`Item with the id=${id} does not exist.`)
    }
    const data = Object.assign(item, { id })
    const { start, length } = this.store.update(prev, data, path, serializer)
    items.update(key, start, length, prev.position)
    this.cache.set(key, item)
  }
  delete (bucket, id) {
    const key = this.cache.createKey(bucket, id)
    const { items, path } = this.lists.get(bucket)
    const { start, length } = items.get(key)
    this.store.delete(start, length, path)
    items.delete(key)
    this.cache.del(key)
  }
  getItems (bucket, { offset = 0, take = 10, order = ORDER.ASCENDING } = {}) {
    const { list, path, serializer } = this.store.getAll(bucket, order)
    const count = list.length
    const items = list.slice(offset, offset + take)
    const output = []
    for (const item of items) {
      let i = this.cache.get(item.key)
      if (typeof i === 'undefined') {
        i = this.store.get(item.start, item.length, path, serializer)
        this.cache.set(item.key, i)
      }
      output.push(i)
    }
    return { count, items: output }
  }
  filterItems (bucket, filter, { offset = 0, take = 10, order = ORDER.ASCENDING } = {}) {
    const { list, path, serializer } = this.store.getAll(bucket, order)
    const output = []
    let more = false
    let count = 0
    for (const item of list) {
      let i = this.cache.get(item.key)
      if (typeof i === 'undefined') {
        i = this.store.get(item.start, item.length, path, serializer)
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
  resetCache () {
    this.cache.clear()
  }
}

module.exports = { Store, ORDER }
