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
  context.id = 'aaaaaaaaaaaaaaaaaaaaaa'
  context.uuidMock = sandbox.mock(Uuid)
  context.itemsFake = { get () {}, create () {} }
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
  context.uuidMock.expects('v4').once().returns(context.id)
  const { Store } = require('../../../lib/store')
  const store = new Store('path')
  const id = store.create('bucket', { item: true })
  t.equals(id, context.id, 'got id')
  t.ok(context.listManagerStubs.get.calledOnce, 'listManagerStubs.get called')
  t.ok(context.cacheManagerStubs.createKey.calledOnce, 'cacheManagerStubs.createKey called')
  t.ok(context.storeManagerStubs.create.calledOnce, 'storeManagerStubs.create')
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
  t.throws(() => { store.create('bucket', { item: true, id: 1 }) }, 'id exists')
  post(context)
  t.pass('success')
})
