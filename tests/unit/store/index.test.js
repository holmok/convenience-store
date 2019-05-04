const Tape = require('tape')
const Sinon = require('sinon')

const ListManager = require('../../../lib/store/list-manager')
const StoreManager = require('../../../lib/store/store-manager')
const BucketManager = require('../../../lib/store/bucket-manager')
const CacheManager = require('../../../lib/store/cache-manager')

const Uuid = require('uuid62')

function pre () {
  delete require.cache[require.resolve('../../../lib/store')]
  const context = {}
  const sandbox = context.sandbox = Sinon.createSandbox()
  context.listManagerStubs = sandbox.createStubInstance(ListManager.ListManager)
  context.listManagerCtorStub = sandbox.stub(ListManager, 'ListManager').returns(context.listManagerStubs)
  context.storeManagerStubs = sandbox.createStubInstance(StoreManager.StoreManager)
  context.storeManagerCtorStub = sandbox.stub(StoreManager, 'StoreManager').returns(context.storeManagerStubs)
  context.bucketManagerStubs = sandbox.createStubInstance(BucketManager.BucketManager)
  context.bucketManagerCtorStub = sandbox.stub(BucketManager, 'BucketManager').returns(context.bucketManagerStubs)
  context.cacheManagerStubs = sandbox.createStubInstance(CacheManager.CacheManager)
  context.cacheManagerCtorStub = sandbox.stub(CacheManager, 'CacheManager').returns(context.cacheManagerStubs)
  context.uuidMock = sandbox.mock(Uuid)
  context.itemsFake = { get () {}, create () {}, update () {}, delete () {} }
  context.itemsMock = sandbox.mock(context.itemsFake)
  return context
}
function post (context) {
  context.sandbox.verifyAndRestore()
}
Tape('Store constructor', (t) => {
  t.plan(6)
  const context = pre()
  const { Store } = require('../../../lib/store')
  const store = new Store('path')
  t.ok(store, 'store created')
  t.ok(context.listManagerCtorStub.calledOnce, 'listManagerCtorStub called')
  t.ok(context.storeManagerCtorStub.calledOnce, 'storeManagerCtorStub called')
  t.ok(context.bucketManagerCtorStub.calledOnce, 'bucketManagerCtorStub called')
  t.ok(context.cacheManagerCtorStub.calledOnce, 'cacheManagerCtorStub called')
  post(context)
  t.pass('success')
})

Tape('Store createBucket/deleteBucket', (t) => {
  t.plan(3)
  const context = pre()
  const { Store } = require('../../../lib/store')
  const store = new Store('path')
  store.createBucket('bucket', 'type')
  store.deleteBucket('bucket', 'type')
  t.ok(context.bucketManagerStubs.create.calledOnce, 'bucketManagerStubs.create called')
  t.ok(context.bucketManagerStubs.delete.calledOnce, 'bucketManagerStubs.delete called')
  post(context)
  t.pass('success')
})

Tape('Store compress', (t) => {
  t.plan(3)
  const context = pre()
  const { Store } = require('../../../lib/store')
  const store = new Store('path')
  store.compress()
  t.ok(context.listManagerStubs.compress.calledOnce, 'listManagerStubs.compress called')
  t.ok(context.storeManagerStubs.compress.calledOnce, 'storeManagerStubs.compress called')
  post(context)
  t.pass('success')
})

Tape('Store resetCache', (t) => {
  t.plan(2)
  const context = pre()
  const { Store } = require('../../../lib/store')
  const store = new Store('path')
  store.resetCache()
  t.ok(context.cacheManagerStubs.clear.calledOnce, 'cacheManagerStubs.clear called')
  post(context)
  t.pass('success')
})

Tape('Store create (no id)', (t) => {
  t.plan(6)
  const context = pre()
  context.listManagerStubs.get.returns({ path: 'path', items: context.itemsFake, serializer: 'serializer' })
  context.storeManagerStubs.create.returns({ start: 0, length: 0 })
  context.itemsMock.expects('get').once().returns(undefined)
  context.itemsMock.expects('create').once().returns()
  context.uuidMock.expects('v4').once().returns('aa')
  const { Store } = require('../../../lib/store')
  const store = new Store('path')
  const id = store.create('bucket', { item: true })
  t.equals(id, 'aa', 'got id')
  t.ok(context.listManagerStubs.get.calledOnce, 'listManagerStubs.get called')
  t.ok(context.cacheManagerStubs.createKey.calledOnce, 'cacheManagerStubs.createKey called')
  t.ok(context.storeManagerStubs.create.calledOnce, 'storeManagerStubs.create called')
  t.ok(context.cacheManagerStubs.set.calledOnce, 'cacheManagerStubs.set called')
  post(context)
  t.pass('success')
})

Tape('Store create (with id that exists)', (t) => {
  t.plan(2)
  const context = pre()
  context.listManagerStubs.get.returns({ path: 'path', items: context.itemsFake, serializer: 'serializer' })
  context.itemsMock.expects('get').once().returns(true)
  context.itemsMock.expects('create').never()
  context.uuidMock.expects('v4').never()
  const { Store } = require('../../../lib/store')
  const store = new Store('path')
  t.throws(() => { store.create('bucket', { item: true, id: 1 }) }, /already exists/, 'id exists')
  post(context)
  t.pass('success')
})

Tape('Store get with item in cache', (t) => {
  t.plan(4)
  const context = pre()
  context.cacheManagerStubs.get.returns({ item: true })
  const { Store } = require('../../../lib/store')
  const store = new Store('path')
  const item = store.get('bucket', 1)
  t.deepEquals(item, { item: true }, 'got item')
  t.ok(context.cacheManagerStubs.createKey.calledOnce, 'cacheManagerStubs.createKey called')
  t.ok(context.cacheManagerStubs.get.calledOnce, 'cacheManagerStubs.get called')
  post(context)
  t.pass('success')
})

Tape('Store get with item not in cache', (t) => {
  t.plan(7)
  const context = pre()
  context.cacheManagerStubs.get.returns(undefined)
  context.listManagerStubs.get.returns({ path: 'path', items: context.itemsFake, serializer: 'serializer' })
  context.itemsMock.expects('get').once().returns({ start: 0, length: 0 })
  context.storeManagerStubs.get.returns({ item: true })
  const { Store } = require('../../../lib/store')
  const store = new Store('path')
  const item = store.get('bucket', 1)
  t.deepEquals(item, { item: true }, 'got item')
  t.ok(context.cacheManagerStubs.createKey.calledOnce, 'cacheManagerStubs.createKey called')
  t.ok(context.cacheManagerStubs.get.calledOnce, 'cacheManagerStubs.get called')
  t.ok(context.listManagerStubs.get.calledOnce, 'listManagerStubs.get called')
  t.ok(context.storeManagerStubs.get.calledOnce, 'storeManagerStubs.get called')
  t.ok(context.cacheManagerStubs.set.calledOnce, 'cacheManagerStubs.set called')
  post(context)
  t.pass('success')
})

Tape('Store update (exists)', (t) => {
  t.plan(5)
  const context = pre()
  context.listManagerStubs.get.returns({ path: 'path', items: context.itemsFake, serializer: 'serializer' })
  context.storeManagerStubs.update.returns({ start: 0, length: 0 })
  context.itemsMock.expects('get').once().returns({ start: 0, length: 0 })
  context.itemsMock.expects('update').once().returns()
  const { Store } = require('../../../lib/store')
  const store = new Store('path')
  store.update('bucket', 1, { item: true })
  t.ok(context.cacheManagerStubs.createKey.calledOnce, 'cacheManagerStubs.createKey called')
  t.ok(context.listManagerStubs.get.calledOnce, 'listManagerStubs.get called')
  t.ok(context.storeManagerStubs.update.calledOnce, 'storeManagerStubs.update called')
  t.ok(context.cacheManagerStubs.set.calledOnce, 'cacheManagerStubs.set called')
  post(context)
  t.pass('success')
})

Tape('Store update (does not exists)', (t) => {
  t.plan(4)
  const context = pre()
  context.listManagerStubs.get.returns({ path: 'path', items: context.itemsFake, serializer: 'serializer' })
  context.storeManagerStubs.update.returns({ start: 0, length: 0 })
  context.itemsMock.expects('get').once().returns(undefined)
  context.itemsMock.expects('update').never()
  const { Store } = require('../../../lib/store')
  const store = new Store('path')
  t.throws(() => { store.update('bucket', 1, { item: true }) }, /does not exist/, 'does not exist throws')
  t.ok(context.cacheManagerStubs.createKey.calledOnce, 'cacheManagerStubs.createKey called')
  t.ok(context.listManagerStubs.get.calledOnce, 'listManagerStubs.get called')
  post(context)
  t.pass('success')
})

Tape('Store delete', (t) => {
  t.plan(5)
  const context = pre()
  context.listManagerStubs.get.returns({ path: 'path', items: context.itemsFake })
  context.storeManagerStubs.update.returns({ start: 0, length: 0 })
  context.itemsMock.expects('get').once().returns({ start: 0, length: 0 })
  context.itemsMock.expects('delete').once().returns()
  const { Store } = require('../../../lib/store')
  const store = new Store('path')
  store.delete('bucket', 1)
  t.ok(context.cacheManagerStubs.createKey.calledOnce, 'cacheManagerStubs.createKey called')
  t.ok(context.listManagerStubs.get.calledOnce, 'listManagerStubs.get called')
  t.ok(context.storeManagerStubs.delete.calledOnce, 'storeManagerStubs.delete called')
  t.ok(context.cacheManagerStubs.del.calledOnce, 'cacheManagerStubs.del called')
  post(context)
  t.pass('success')
})

Tape('Store getItems (no cache)', (t) => {
  t.plan(4)
  const context = pre()
  context.storeManagerStubs.getAll.returns({ list: [1, 2] })
  context.storeManagerStubs.get.returns({ item: true })
  context.cacheManagerStubs.get.returns(undefined)
  const { Store } = require('../../../lib/store')
  const store = new Store('path')
  const { count, items } = store.getItems('bucket')
  t.equals(count, 2, 'got two count')
  t.equals(items.length, 2, 'got two items')
  t.deepEquals(items, [{ item: true }, { item: true }], 'got actual items')
  post(context)
  t.pass('success')
})
Tape('Store getItems (with cache)', (t) => {
  t.plan(4)
  const context = pre()
  context.storeManagerStubs.getAll.returns({ list: [1, 2] })
  context.cacheManagerStubs.get.returns({ item: true })
  const { Store } = require('../../../lib/store')
  const store = new Store('path')
  const { count, items } = store.getItems('bucket')
  t.equals(count, 2, 'got two count')
  t.equals(items.length, 2, 'got two items')
  t.deepEquals(items, [{ item: true }, { item: true }], 'got actual items')
  post(context)
  t.pass('success')
})

Tape('Store filterItems (no cache, good filter)', (t) => {
  t.plan(4)
  const context = pre()
  context.storeManagerStubs.getAll.returns({ list: [1, 2] })
  context.storeManagerStubs.get.returns({ item: true })
  context.cacheManagerStubs.get.returns(undefined)
  const { Store } = require('../../../lib/store')
  const store = new Store('path')
  const { more, items } = store.filterItems('bucket', t => t.item)
  t.equals(more, false, 'no more')
  t.equals(items.length, 2, 'got two items')
  t.deepEquals(items, [{ item: true }, { item: true }], 'got actual items')
  post(context)
  t.pass('success')
})

Tape('Store filterItems (no cache, bad filter)', (t) => {
  t.plan(4)
  const context = pre()
  context.storeManagerStubs.getAll.returns({ list: [1, 2] })
  context.storeManagerStubs.get.returns({ item: true })
  context.cacheManagerStubs.get.returns(undefined)
  const { Store } = require('../../../lib/store')
  const store = new Store('path')
  const { more, items } = store.filterItems('bucket', t => !t.item)
  t.equals(more, false, 'no more')
  t.equals(items.length, 0, 'got 0 items')
  t.deepEquals(items, [], 'got no items')
  post(context)
  t.pass('success')
})

Tape('Store filterItems (with cache, good filter)', (t) => {
  t.plan(4)
  const context = pre()
  context.storeManagerStubs.getAll.returns({ list: [1, 2] })
  context.cacheManagerStubs.get.returns({ item: true })
  const { Store } = require('../../../lib/store')
  const store = new Store('path')
  const { more, items } = store.filterItems('bucket', t => t.item)
  t.equals(more, false, 'no more')
  t.equals(items.length, 2, 'got two items')
  t.deepEquals(items, [{ item: true }, { item: true }], 'got actual items')
  post(context)
  t.pass('success')
})

Tape('Store filterItems (with cache, good filter, only first)', (t) => {
  t.plan(4)
  const context = pre()
  context.storeManagerStubs.getAll.returns({ list: [1, 2] })
  context.cacheManagerStubs.get.returns({ item: true })
  const { Store } = require('../../../lib/store')
  const store = new Store('path')
  const { more, items } = store.filterItems('bucket', t => t.item, { take: 1 })
  t.equals(more, true, 'there is more')
  t.equals(items.length, 1, 'got 1 items')
  t.deepEquals(items, [{ item: true }], 'got first items')
  post(context)
  t.pass('success')
})

Tape('Store filterItems (with cache, good filter, only second)', (t) => {
  t.plan(4)
  const context = pre()
  context.storeManagerStubs.getAll.returns({ list: [1, 2] })
  context.cacheManagerStubs.get.returns({ item: true })
  const { Store } = require('../../../lib/store')
  const store = new Store('path')
  const { more, items } = store.filterItems('bucket', t => t.item, { offset: 1 })
  t.equals(more, false, 'there is more')
  t.equals(items.length, 1, 'got 1 items')
  t.deepEquals(items, [{ item: true }], 'got first items')
  post(context)
  t.pass('success')
})
