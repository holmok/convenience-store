
const Fs = require('fs')
const Path = require('path')
const Rimraf = require('rimraf')
const { BUCKETS_TYPE, Buckets } = require('../../lib/buckets')
const { Serializer } = require('../../lib/serializer')
const { Store } = require('../../lib/store')

function setup () {
  const path = Path.join(process.cwd(), 'test-data')
  if (Fs.existsSync(path)) Rimraf.sync(path)
  Fs.mkdirSync(path)
  return path
}

function bucketPath (path, bucket) {
  const bucketSerializer = new Serializer(BUCKETS_TYPE, { compresser: this.compresser, cipher: this.cipher })
  const buckets = new Buckets(path, bucketSerializer)
  return buckets.get(bucket).path
}

function allMethods (t, store) {
  t.ok(store, `New instance of store`)
  const object = { name: 'string', active: true, age: 49 }
  const bucket = 'bucket'
  store.createBucket(bucket, object)
  t.pass('(createBucket)   Worked')
  const id = store.create(bucket, object)
  t.ok(id, `(create)  Got id=${id}`)
  const result1 = store.get(bucket, id)
  t.ok(result1, `(get)   Got result=${JSON.stringify(result1)}`)
  object.name = 'bob'
  store.update(bucket, id, object)
  t.pass('(update)   Worked')
  const result2 = store.get(bucket, id)
  t.ok(result2.name === 'bob', `(get/after update)   Got result=${JSON.stringify(result2)}`)
  const results1 = store.getItems(bucket)
  t.ok(results1.items.length > 0, `(getItems)  Got results=${JSON.stringify(results1)}`)
  const results2 = store.filterItems(bucket, (i) => i.active)
  t.ok(results2.items.length > 0, `(filterItems/true)  Got result=${JSON.stringify(results2)}`)
  const results3 = store.filterItems(bucket, (i) => !i.active)
  t.ok(results3.items.length === 0, `(filterItems/false)  Got result=${JSON.stringify(results3)}`)
  store.delete(bucket, id)
  t.pass('(delete)   Worked')
  const results4 = store.getItems(bucket)
  t.ok(results4.count === 0, `(getItems/after delete)  Got results=${JSON.stringify(results4)}`)
  store.compress(bucket)
  t.pass('(compress)   Worked')
}

function createItems (path, t) {
  const store = new Store(path)
  t.ok(store, `New instance of store`)
  const list = []
  for (let i = 0; i < 20; i++) {
    list.push({ id: i, name: 'string', active: i % 2 === 0, age: 49 + i })
  }
  const bucket = 'bucket'
  store.createBucket(bucket, list[0])
  t.pass('(createBucket)   Worked')
  const basePath = bucketPath(path, bucket)
  const listPath = `${basePath}.list`
  const dataPath = `${basePath}.data`
  for (const item of list) {
    store.create(bucket, item)
  }
  t.pass('create all items worked')
  return { listPath, dataPath, store, bucket }
}

module.exports = { createItems, allMethods, setup }
