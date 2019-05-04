const { Items } = require('../items')
const { Serializer } = require('../serializer')

class ListManager {
  constructor (bucketManger) {
    this.buckets = bucketManger
    this.lists = {}
  }
  get (bucket) {
    let list = this.lists[bucket]
    if (!list) {
      const { type, path } = this.buckets.get(bucket)
      const items = new Items(path)
      const serializer = new Serializer(type, { compresser: this.compresser, cipher: this.cipher })
      list = { path: `${path}.data`, items, serializer }
      this.lists[bucket] = list
    }
    return list
  }
  compress (bucket) {
    const { path } = this.buckets.get(bucket)
    const items = new Items(path)
    items.compress()
  }
}

module.exports = { ListManager }
