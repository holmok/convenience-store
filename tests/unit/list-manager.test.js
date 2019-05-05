const Tape = require('tape')
const Sinon = require('sinon')
const Proxyquire = require('proxyquire').noCallThru()
const Items = require('../../lib/items')

Tape('ListManager constructor and methods', (t) => {
  t.plan(7)
  const context = {}
  const sandbox = context.sandbox = Sinon.createSandbox()
  const SerializerFake = class {}
  context.items = { compress () {} }
  context.itemsMock = sandbox.mock(context.items)
  context.bucket = { get () {} }
  context.bucketsMock = sandbox.mock(context.bucket)
  context.itemsStub = sandbox.stub(Items, 'Items').returns(context.items)
  context.ListManager = Proxyquire('../../lib/store/list-manager', { '../serializer': { Serializer: SerializerFake } }).ListManager

  context.bucketsMock.expects('get').twice().returns({ type: 'type', path: 'path' })
  context.itemsMock.expects('compress').once().returns()

  const list = new context.ListManager(context.bucket)

  const first = list.get('bucket')

  t.equals(first.path, 'path.data', 'path is correct')
  t.deepEquals(first.items, context.items, 'items is correct')
  t.ok(first.serializer instanceof SerializerFake, 'serializer is correct')

  const second = list.get('bucket')

  t.equals(second.path, 'path.data', 'path is correct (2nd)')
  t.deepEquals(second.items, context.items, 'items is correct (2nd)')
  t.ok(second.serializer instanceof SerializerFake, 'serializer is correct (2nd)')

  list.compress()

  context.sandbox.verifyAndRestore()
  t.pass('success')
})
