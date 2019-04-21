const Tape = require('Tape')
const Fs = require('fs')
const Rimraf = require('rimraf')

const { setup, allMethods, createItems } = require('./store.utils')
const { Store, ORDER } = require('../../lib/store')

Tape('store test / compression and cipher / all methods', (t) => {
  const path = setup()
  const store = new Store({ path, compress: true, password: 'password', salt: 'this is a salt' })
  allMethods(t, store)
  Rimraf.sync(path)
  t.pass('Success')
  t.end()
})

Tape('store test / no compression and cipher / all methods', (t) => {
  const path = setup()
  const store = new Store({ path })
  allMethods(t, store)
  Rimraf.sync(path)
  t.pass('Success')
  t.end()
})

Tape('store test / compression / all methods', (t) => {
  const path = setup()
  const store = new Store({ path, compress: true })
  allMethods(t, store)
  Rimraf.sync(path)
  t.pass('Success')
  t.end()
})

Tape('store test / cipher / all methods', (t) => {
  const path = setup()
  const store = new Store({ path, password: 'password', salt: 'this is a salt' })
  allMethods(t, store)
  Rimraf.sync(path)
  t.pass('Success')
  t.end()
})

Tape('store test compress and filter', (t) => {
  const path = setup()
  const { listPath, dataPath, store, bucket } = createItems(path, t)

  const listStart = Fs.statSync(listPath).size
  const dataStart = Fs.statSync(dataPath).size

  const { items } = store.filterItems({ bucket, filter: (i) => i.active, take: 20 })
  t.equal(items.length, 10, 'Items to delete = 10 items')
  for (const item of items) {
    store.delete({ bucket, id: item.id })
  }
  t.pass('Delete active items worked')

  store.compress({ bucket })
  t.pass('Compress worked')

  const listEnd = Fs.statSync(listPath).size
  const dataEnd = Fs.statSync(dataPath).size

  t.ok(listStart > listEnd, `List start (${listStart} bytes) > List end (${listEnd} bytes)`)
  t.ok(dataStart > dataEnd, `List start (${dataStart} bytes) > List end (${dataEnd} bytes)`)

  t.pass('Success')
  t.end()
})

Tape('store test order', (t) => {
  const path = setup()
  const { store, bucket } = createItems(path, t)

  let item1 = store.getItems({ bucket }).items[0]
  t.equal(item1.id, 0, 'default order works')

  let item2 = store.getItems({ bucket, order: ORDER.ASCENDING }).items[0]
  t.equal(item2.id, 0, 'ORDER.ASCENDING order works')

  let item3 = store.getItems({ bucket, order: ORDER.DESCENDING }).items[0]
  t.equal(item3.id, 19, 'ORDER.DESCENDING order works')

  t.pass('Success')
  t.end()
})

Tape('store test getItems paging', (t) => {
  const path = setup()
  const { store, bucket } = createItems(path, t)

  let items1 = store.getItems({ bucket, offset: 0, take: 2 })
  t.equal(items1.count, 20, 'got total count')
  t.equal(items1.items.length, 2, 'got 2 item on take 2')

  let items2 = store.getItems({ bucket, offset: 2, take: 3 })
  t.equal(items2.items.length, 3, 'got 3 item on take 3')
  t.equal(items2.items[0].id, 2, 'got first item id=2 on offset 2')

  t.pass('Success')
  t.end()
})

Tape('store test filter paging', (t) => {
  const path = setup()
  const { store, bucket } = createItems(path, t)

  let items1 = store.filterItems({ bucket, filter: (i) => i.active, offset: 0, take: 2 })
  t.equal(items1.more, true, 'got more when only taking 2')
  t.equal(items1.items.length, 2, 'got 2 item on taking 2')

  let items2 = store.filterItems({ bucket, filter: (i) => i.active, offset: 8, take: 2 })
  t.equal(items2.more, false, 'got no more when only taking 2 with and offset = 8')
  t.equal(items2.items.length, 2, 'got 2 item on taking 2')

  let items3 = store.filterItems({ bucket, filter: (i) => i.active, offset: 9, take: 2 })
  t.equal(items3.more, false, 'got no more when only taking 2 with and offset = 8')
  t.equal(items3.items.length, 1, 'got only 1 item on taking 2  and offset = 8')

  t.pass('Success')
  t.end()
})
