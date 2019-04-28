/* eslint no-new: 0 */
const Tape = require('Tape')
const Sinon = require('sinon')
const Avro = require('avsc')
const Proxyquire = require('proxyquire').noCallThru()

function pre () {
  const sandbox = Sinon.createSandbox()
  const fs = { existsSync () {},
    unlinkSync () {},
    closeSync () {},
    openSync () {},
    readSync (file, buffer) {
      buffer.writeUInt8(1, 56)
      buffer.writeUInt8(2, 57)
    },
    writeSync () {},
    renameSync () {} }
  class AvroType extends Avro.Type {
    toBuffer () {}
    fromBuffer () {}
  }
  const avroType = new AvroType()
  return {
    sandbox,
    fs,
    avroType,
    fsMock: sandbox.mock(fs),
    avroTypeMock: sandbox.mock(avroType)
  }
}
function post (context) {
  context.sandbox.verifyAndRestore()
}

Tape('Items constructor and create item (no file) happy path', (t) => {
  t.plan(2)
  const context = pre()
  const path = 'test'
  const pathList = 'test.list'
  const key = '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
  const start = 0
  const length = 0
  const item = { key: Buffer.from(key, 'hex'), start: Buffer.alloc(8), length: Buffer.alloc(8), position: Buffer.alloc(8) }
  const buffer = Buffer.alloc(56)
  context.fsMock.expects('existsSync').once().withArgs(pathList).returns(false)
  context.fsMock.expects('closeSync').once().withArgs(1).returns()
  context.fsMock.expects('openSync').once().withArgs(pathList, 'w').returns(1)
  context.fsMock.expects('openSync').once().withArgs(pathList, 'a').returns(2)
  context.avroTypeMock.expects('toBuffer').once().withArgs(item).returns(buffer)
  context.fsMock.expects('writeSync').once().withArgs(2).returns()
  context.fsMock.expects('closeSync').once().withArgs(2).returns()

  const { Items } = Proxyquire('../../lib/items', { fs: context.fs })
  const items = new Items(path, context.avroType)
  t.ok(items, 'create an instance')

  items.create(key, start, length)

  post(context)

  t.pass('success')
})

Tape('Items constructor and get item (with file) happy path', (t) => {
  t.plan(3)
  const context = pre()

  const path = 'test'
  const pathList = 'test.list'
  const buffer = Buffer.alloc(58)
  const key = '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
  const item = { key: Buffer.from(key, 'hex'), start: Buffer.alloc(8), length: Buffer.alloc(8), position: Buffer.alloc(8) }
  context.fsMock.expects('existsSync').once().withArgs(pathList).returns(true)
  context.fsMock.expects('openSync').once().withArgs(pathList, 'r').returns(1)
  context.fsMock.expects('readSync').once().withArgs(1, buffer, 0, 58, 0).callThrough().returns(1)
  context.fsMock.expects('readSync').once().withArgs(1, buffer, 0, 58, 58).returns(0)
  context.avroTypeMock.expects('fromBuffer').once().returns(item)
  context.fsMock.expects('closeSync').once().withArgs(1).returns()

  const { Items } = Proxyquire('../../lib/items', { fs: context.fs })
  const items = new Items(path, context.avroType)
  t.ok(items, 'create an instance')

  const result = items.get(key)

  t.ok(result, 'got item')

  post(context)

  t.pass('success')
})

Tape('Items constructor and update item (with file) happy path', (t) => {
  t.plan(3)
  const context = pre()

  const path = 'test'
  const pathList = 'test.list'
  const buffer = Buffer.alloc(58)
  const key = '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
  const item = { key: Buffer.from(key, 'hex'), start: Buffer.alloc(8), length: Buffer.alloc(8), position: Buffer.alloc(8) }
  context.fsMock.expects('existsSync').once().withArgs(pathList).returns(true)
  context.fsMock.expects('openSync').once().withArgs(pathList, 'r').returns(1)
  context.fsMock.expects('readSync').once().withArgs(1, buffer, 0, 58, 0).callThrough().returns(1)
  context.fsMock.expects('readSync').once().withArgs(1, buffer, 0, 58, 58).returns(0)
  context.avroTypeMock.expects('fromBuffer').once().returns(item)
  context.fsMock.expects('closeSync').once().withArgs(1).returns()

  context.avroTypeMock.expects('toBuffer').once().returns(buffer)

  context.fsMock.expects('openSync').once().withArgs(pathList, 'w').returns(2)
  context.fsMock.expects('writeSync').once().withArgs(2).returns()
  context.fsMock.expects('closeSync').once().withArgs(2).returns()

  const { Items } = Proxyquire('../../lib/items', { fs: context.fs })
  const items = new Items(path, context.avroType)
  t.ok(items, 'create an instance')

  items.update(key, item.start, item.length, item.position)
  t.pass('updated')
  post(context)

  t.pass('success')
})

Tape('Items constructor and delete item (with file) happy path', (t) => {
  t.plan(3)
  const context = pre()

  const path = 'test'
  const pathList = 'test.list'
  const buffer = Buffer.alloc(58)
  const key = '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
  const item = { key: Buffer.from(key, 'hex'), start: Buffer.alloc(8), length: Buffer.alloc(8), position: Buffer.alloc(8) }
  context.fsMock.expects('existsSync').once().withArgs(pathList).returns(true)
  context.fsMock.expects('openSync').once().withArgs(pathList, 'r').returns(1)
  context.fsMock.expects('readSync').once().withArgs(1, buffer, 0, 58, 0).callThrough().returns(1)
  context.fsMock.expects('readSync').once().withArgs(1, buffer, 0, 58, 58).returns(0)
  context.avroTypeMock.expects('fromBuffer').once().returns(item)
  context.fsMock.expects('closeSync').once().withArgs(1).returns()

  context.fsMock.expects('openSync').once().withArgs(pathList, 'a').returns(2)
  context.fsMock.expects('writeSync').once().withArgs(2).returns()
  context.fsMock.expects('closeSync').once().withArgs(2).returns()

  const { Items } = Proxyquire('../../lib/items', { fs: context.fs })
  const items = new Items(path, context.avroType)
  t.ok(items, 'create an instance')

  items.delete(key)

  const result = items.get(key)
  t.notok(result, 'deleted')

  post(context)

  t.pass('success')
})

Tape('Items constructor, create, get, delete, and compression (with file) happy path', (t) => {
  t.plan(4)
  const context = pre()

  const path = 'test'
  const pathList = 'test.list'
  const pathNew = 'test.list.new'
  const buffer = Buffer.alloc(58)
  const key = '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
  const key2 = '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a07'
  const item = { key: Buffer.from(key, 'hex'), start: Buffer.alloc(8), length: Buffer.alloc(8), position: Buffer.alloc(8) }
  context.fsMock.expects('existsSync').once().withArgs(pathList).returns(true)
  context.fsMock.expects('openSync').once().withArgs(pathList, 'r').returns(1)
  context.fsMock.expects('readSync').once().withArgs(1, buffer, 0, 58, 0).callThrough().returns(1)
  context.fsMock.expects('readSync').once().withArgs(1, buffer, 0, 58, 58).returns(0)
  context.avroTypeMock.expects('fromBuffer').once().returns(item)
  context.fsMock.expects('closeSync').once().withArgs(1).returns()

  context.avroTypeMock.expects('toBuffer').twice().returns(buffer)

  context.fsMock.expects('openSync').twice().withArgs(pathList, 'a').returns(2)
  context.fsMock.expects('writeSync').twice().withArgs(2).returns()
  context.fsMock.expects('closeSync').twice().withArgs(2).returns()

  context.fsMock.expects('openSync').once().withArgs(pathNew, 'w').returns(3)
  context.fsMock.expects('writeSync').once().withArgs(3).returns()
  context.fsMock.expects('closeSync').once().withArgs(3).returns()
  context.fsMock.expects('unlinkSync').once().withArgs(pathList).returns()
  context.fsMock.expects('renameSync').once().withArgs(pathNew, pathList).returns()

  const { Items } = Proxyquire('../../lib/items', { fs: context.fs })
  const items = new Items(path, context.avroType)
  t.ok(items, 'create an instance')

  items.create(key2, 0, 0)
  items.delete(key)
  items.compress()

  const result = items.get(key2)
  t.ok(result, 'item there after delete')
  t.equal(result.position, 0, 'zero position')

  post(context)

  t.pass('success')
})
