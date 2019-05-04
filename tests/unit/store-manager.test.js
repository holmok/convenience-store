const Tape = require('tape')
const Sinon = require('sinon')
const Proxyquire = require('proxyquire').noCallThru()

function pre () {
  const context = {}
  const sandbox = context.sandbox = Sinon.createSandbox()
  context.lists = {
    get () {}
  }
  context.listMock = sandbox.mock(context.lists)

  const Fs = {
    existsSync () {},
    statSync () {},
    openSync () {},
    writeSync () {},
    readSync () {},
    closeSync () {},
    unlinkSync () {},
    renameSync () {}
  }
  context.fsMock = sandbox.mock(Fs)

  context.serializer = { serialize () {}, deserialize () {} }
  context.serializerMock = sandbox.mock(context.serializer)

  const StoreManager = Proxyquire('../../lib/store/store-manager', { fs: Fs })

  context.StoreManager = StoreManager.StoreManager
  context.ORDER = StoreManager.ORDER

  return context
}

function post (context) {
  context.sandbox.verifyAndRestore()
}

Tape('StoreManager getAll default order', (t) => {
  t.plan(5)
  const context = pre()

  context.listMock.expects('get').once().withArgs('bucket').returns(
    { items: { list: [1, 2, 3] }, path: 'path', serializer: 'serializer' }
  )

  const store = new context.StoreManager(context.lists)
  t.ok(store, 'store created')

  const { list, path, serializer } = store.getAll('bucket')

  t.deepEquals(list, [1, 2, 3], 'list returned')
  t.equals(path, 'path', 'path returned')
  t.equals(serializer, 'serializer', 'serializer returned')

  post(context)
  t.pass('success')
})

Tape('StoreManager getAll desc order', (t) => {
  t.plan(5)
  const context = pre()

  context.listMock.expects('get').once().withArgs('bucket').returns(
    { items: { list: [1, 2, 3] }, path: 'path', serializer: 'serializer' }
  )

  const store = new context.StoreManager(context.lists)
  t.ok(store, 'store created')

  const { list, path, serializer } = store.getAll('bucket', context.ORDER.DESCENDING)

  t.deepEquals(list, [3, 2, 1], 'list returned')
  t.equals(path, 'path', 'path returned')
  t.equals(serializer, 'serializer', 'serializer returned')

  post(context)
  t.pass('success')
})

Tape('StoreManager create (existing file)', (t) => {
  t.plan(4)
  const context = pre()

  context.fsMock.expects('existsSync').once().withArgs('path').returns(true)
  context.fsMock.expects('statSync').once().withArgs('path').returns({ size: 12 })
  const buffer = Buffer.alloc(15)
  context.serializerMock.expects('serialize').once().withArgs({ item: true }).returns(buffer)
  context.fsMock.expects('openSync').once().withArgs('path', 'a').returns(1)
  context.fsMock.expects('writeSync').once().withArgs(1, buffer).returns(1)
  context.fsMock.expects('closeSync').once().withArgs(1).returns()

  const store = new context.StoreManager(context.lists)
  t.ok(store, 'store created')

  const { start, length } = store.create({ item: true }, 'path', context.serializer)

  t.equals(start, 12, 'start returns')
  t.equals(length, 15, 'lentgh returns')

  post(context)
  t.pass('success')
})

Tape('StoreManager create (new file)', (t) => {
  t.plan(4)
  const context = pre()

  context.fsMock.expects('existsSync').once().withArgs('path').returns(false)
  context.fsMock.expects('statSync').never()
  const buffer = Buffer.alloc(15)
  context.serializerMock.expects('serialize').once().withArgs({ item: true }).returns(buffer)
  context.fsMock.expects('openSync').once().withArgs('path', 'a').returns(1)
  context.fsMock.expects('writeSync').once().withArgs(1, buffer).returns(1)
  context.fsMock.expects('closeSync').once().withArgs(1).returns()

  const store = new context.StoreManager(context.lists)
  t.ok(store, 'store created')

  const { start, length } = store.create({ item: true }, 'path', context.serializer)

  t.equals(start, 0, 'start returns')
  t.equals(length, 15, 'lentgh returns')

  post(context)
  t.pass('success')
})

Tape('StoreManager get', (t) => {
  t.plan(3)
  const context = pre()

  const buffer = Buffer.alloc(15)
  context.fsMock.expects('openSync').once().withArgs('path', 'r').returns(1)
  context.fsMock.expects('readSync').once().withArgs(1, buffer, 0, 15, 0).returns()
  context.serializerMock.expects('deserialize').once().withArgs(buffer).returns({ item: true })
  context.fsMock.expects('closeSync').once().withArgs(1).returns()

  const store = new context.StoreManager(context.lists)
  t.ok(store, 'store created')

  const item = store.get(0, 15, 'path', context.serializer)

  t.deepEquals(item, { item: true }, 'item returned')

  post(context)
  t.pass('success')
})

Tape('StoreManager update (same size)', (t) => {
  t.plan(4)
  const context = pre()

  const buffer = Buffer.alloc(15)
  context.serializerMock.expects('serialize').once().withArgs({ item: true }).returns(buffer)
  context.fsMock.expects('openSync').once().withArgs('path', 'w').returns(1)
  context.fsMock.expects('writeSync').once().withArgs(1, buffer, 0, 15, 0).returns()
  context.fsMock.expects('closeSync').once().withArgs(1).returns()

  context.fsMock.expects('openSync').once().withArgs('path', 'w').returns(1)
  context.fsMock.expects('writeSync').once().withArgs(1, buffer, 0).returns()
  context.fsMock.expects('closeSync').once().withArgs(1).returns()

  const store = new context.StoreManager(context.lists)
  t.ok(store, 'store created')

  const { start, length } = store.update({ start: 0, length: 15 }, { item: true }, 'path', context.serializer)

  t.equals(start, 0, 'start returns')
  t.equals(length, 15, 'lentgh returns')

  post(context)
  t.pass('success')
})

Tape('StoreManager update (larger size)', (t) => {
  t.plan(4)
  const context = pre()

  const buffer = Buffer.alloc(15)
  const oldBuffer = Buffer.alloc(12)
  context.serializerMock.expects('serialize').once().withArgs({ item: true }).returns(buffer)
  context.fsMock.expects('openSync').once().withArgs('path', 'w').returns(1)
  context.fsMock.expects('writeSync').once().withArgs(1, oldBuffer, 0, 12, 0).returns()
  context.fsMock.expects('closeSync').once().withArgs(1).returns()

  context.fsMock.expects('statSync').once().withArgs('path').returns({ size: 12 })

  context.fsMock.expects('openSync').once().withArgs('path', 'a').returns(1)
  context.fsMock.expects('writeSync').once().withArgs(1, buffer, 0, 15).returns()
  context.fsMock.expects('closeSync').once().withArgs(1).returns()

  const store = new context.StoreManager(context.lists)
  t.ok(store, 'store created')

  const { start, length } = store.update({ start: 0, length: 12 }, { item: true }, 'path', context.serializer)

  t.equals(start, 12, 'start returns')
  t.equals(length, 15, 'lentgh returns')

  post(context)
  t.pass('success')
})

Tape('StoreManager delete', (t) => {
  t.plan(3)
  const context = pre()

  const buffer = Buffer.alloc(15)
  context.fsMock.expects('openSync').once().withArgs('path', 'w').returns(1)
  context.fsMock.expects('writeSync').once().withArgs(1, buffer, 0, 15, 0).returns()
  context.fsMock.expects('closeSync').once().withArgs(1).returns()

  const store = new context.StoreManager(context.lists)
  t.ok(store, 'store created')

  store.delete(0, 15, 'path')

  t.pass('item deleted')

  post(context)
  t.pass('success')
})

Tape('StoreManager compress', (t) => {
  t.plan(3)
  const context = pre()

  context.listMock.expects('get').once().withArgs('bucket').returns(
    { items: { list: [{ length: 15, position: 0 }] }, path: 'path' }
  )

  const buffer = Buffer.alloc(15)
  context.fsMock.expects('openSync').once().withArgs('path.new', 'w').returns(1)
  context.fsMock.expects('openSync').once().withArgs('path', 'r').returns(2)
  context.fsMock.expects('readSync').once().withArgs(2, buffer, 0, 15, 0).returns()
  context.fsMock.expects('writeSync').once().withArgs(1, buffer, 0, 15).returns()
  context.fsMock.expects('closeSync').once().withArgs(1).returns()
  context.fsMock.expects('closeSync').once().withArgs(2).returns()
  context.fsMock.expects('unlinkSync').once().withArgs('path').returns()
  context.fsMock.expects('renameSync').once().withArgs('path.new', 'path').returns()

  const store = new context.StoreManager(context.lists)
  t.ok(store, 'store created')

  store.compress('bucket')
  t.pass('store compressed')

  post(context)
  t.pass('success')
})
