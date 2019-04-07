const Avro = require('avsc')
const Fs = require('fs')
const Path = require('path')
const { BaseSerializer } = require('./serializer')

const BUCKETS_TYPE = Avro.Type.forSchema({
  type: 'array',
  items: {
    type: 'record',
    fields: [
      { name: 'bucket', type: 'string' },
      { name: 'path', type: 'string' },
      { name: 'type', type: 'string' }
    ]
  }
})

const internals = {
  readBuckets () {
    if (Fs.existsSync(this.file)) {
      const buffer = Fs.readFileSync(this.file)
      const list = this.serializer.deserialize(buffer)
      const buckets = {}
      for (const item of list) {
        buckets[item.bucket] = { bucket: item.bucket, path: item.path, type: Avro.parse(item.type) }
      }
      this.buckets = buckets
    } else {
      this.buckets = {}
    }
  },
  writeBuckets () {
    const list = []
    const items = Object.values(this.buckets)
    for (const item of items) {
      list.push({ bucket: item.bucket, path: item.path, type: item.type.toString() })
    }
    const buffer = this.serializer.serialize(list)
    Fs.writeFileSync(this.file, buffer)
  }
}

class Buckets {
  constructor (path, serializer) {
    if (!serializer || !(serializer instanceof BaseSerializer)) {
      throw new Error('`serializer` must be an instance of Serializer')
    }
    this.path = path
    this.file = Path.join(this.path, 'bucket.list')
    this.serializer = serializer
    internals.readBuckets.call(this)
  }
  get (bucket) {
    if (!this.buckets[bucket]) {
      throw new Error('`bucket` is not available in store')
    } else {
      return this.buckets[bucket]
    }
  }
  create (bucket, type) {
    if (this.buckets[bucket]) {
      throw new Error('`bucket` already exists in store')
    } else if (!Avro.Type.isType(type)) {
      throw new Error('`type` must be an instance of Avro.Type')
    } else {
      const path = Path.join(this.path, `${bucket}.${new Date().getTime()}`)
      this.buckets[bucket] = { bucket, path, type }
      internals.writeBuckets.call(this)
    }
  }
  delete (bucket) {
    if (!this.buckets[bucket]) {
      throw new Error('`bucket` is not available in store')
    } else {
      const list = `${this.buckets[bucket].path}.list`
      const data = `${this.buckets[bucket].path}.data`
      if (Fs.existsSync(list)) Fs.unlinkSync(list)
      if (Fs.existsSync(data)) Fs.unlinkSync(data)
      delete this.buckets[bucket]
      internals.writeBuckets.call(this)
    }
  }
}

module.exports = { Buckets, BUCKETS_TYPE }
