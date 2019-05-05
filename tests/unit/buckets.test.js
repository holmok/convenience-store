/* eslint no-new: 0 */
const Tape = require('tape')
const Sinon = require('sinon')
const Avro = require('avsc')
const Proxyquire = require('proxyquire').noCallThru()
const { BaseSerializer } = require('../../lib/serializer')
const MockDate = require('mockdate')

function pre () {
  const sandbox = Sinon.createSandbox()
  const serializer = new BaseSerializer()
  const path = { join () {} }
  const fs = { existsSync () {}, unlinkSync () {}, writeFileSync () {}, readFileSync () {} }
  return {
    sandbox,
    serializer,
    fs,
    path,
    fsMock: sandbox.mock(fs),
    pathMock: sandbox.mock(path),
    avroMock: sandbox.mock(Avro),
    avroTypeMock: sandbox.mock(Avro.Type),
    serializerMock: sandbox.mock(serializer)
  }
}
function post (context) {
  context.sandbox.verifyAndRestore()
}

Tape('Buckets constructor and create bucket (no file) happy path', (t) => {
  t.plan(4)
  const timestamp = 1554664312449
  MockDate.set(timestamp)
  const context = pre()
  const path = './test'
  const file = './test/bucket.list'
  context.avroTypeMock.expects('forSchema').once().returns('type')
  context.pathMock.expects('join').once().withArgs(path, 'bucket.list').returns(file)
  context.fsMock.expects('existsSync').once().withArgs(file).returns(false)

  context.avroTypeMock.expects('isType').once().withArgs('type').returns(true)
  context.pathMock.expects('join').once().withArgs(path, `bucket.${timestamp}`).returns('path')

  const list = [{ bucket: 'bucket', path: 'path', type: 'type' }]
  const buffer = Buffer.from([])
  context.serializerMock.expects('serialize').once().withArgs(list).returns(buffer)

  context.fsMock.expects('writeFileSync').once().withArgs(file, buffer)

  const { Buckets } = Proxyquire('../../lib/buckets', { fs: context.fs, path: context.path })
  const buckets = new Buckets(path, context.serializer)
  t.ok(buckets, 'created instance')

  buckets.create('bucket', 'type')
  t.pass('create bucket')

  const bucket = buckets.get('bucket')
  t.deepEqual(bucket, { bucket: 'bucket', path: 'path', type: 'type' }, 'get a bucket')

  post(context)
  t.pass('success')
})

Tape('Buckets constructor and get bucket (with file) happy path', (t) => {
  t.plan(3)
  const context = pre()
  const path = './test'
  const file = './test/bucket.list'
  context.pathMock.expects('join').once().withArgs(path, 'bucket.list').returns(file)
  context.fsMock.expects('existsSync').once().withArgs(file).returns(true)

  const buffer = Buffer.from([])
  context.fsMock.expects('readFileSync').once().withArgs(file).returns(buffer)

  const list = [{ bucket: 'bucket', path: 'path', type: 'type' }]
  context.serializerMock.expects('deserialize').once().withArgs(buffer).returns(list)
  context.avroMock.expects('parse').once().withArgs('type').returns('type')

  const { Buckets } = Proxyquire('../../lib/buckets', { fs: context.fs, path: context.path })
  const buckets = new Buckets(path, context.serializer)
  t.ok(buckets, 'created instance')

  const bucket = buckets.get('bucket')
  t.deepEqual(bucket, { bucket: 'bucket', path: 'path', type: 'type' }, 'get a bucket')

  post(context)
  t.pass('success')
})

Tape('Buckets constructor and delete bucket (with file) happy path', (t) => {
  t.plan(4)
  const context = pre()
  const path = './test'
  const file = './test/bucket.list'
  context.pathMock.expects('join').once().withArgs(path, 'bucket.list').returns(file)
  context.fsMock.expects('existsSync').once().withArgs(file).returns(true)
  context.fsMock.expects('existsSync').once().withArgs('path.list').returns(true)
  context.fsMock.expects('existsSync').once().withArgs('path.data').returns(true)
  context.fsMock.expects('unlinkSync').once().withArgs('path.list')
  context.fsMock.expects('unlinkSync').once().withArgs('path.data')

  const buffer = Buffer.from([])
  context.fsMock.expects('readFileSync').once().withArgs(file).returns(buffer)

  const list = [{ bucket: 'bucket', path: 'path', type: 'type' }]
  context.serializerMock.expects('deserialize').once().withArgs(buffer).returns(list)
  context.avroMock.expects('parse').once().withArgs('type').returns('type')

  context.serializerMock.expects('serialize').once().withArgs([]).returns(buffer)

  context.fsMock.expects('writeFileSync').once().withArgs(file, buffer)

  const { Buckets } = Proxyquire('../../lib/buckets', { fs: context.fs, path: context.path })
  const buckets = new Buckets(path, context.serializer)
  t.ok(buckets, 'created instance')

  buckets.delete('bucket')
  t.pass('deleted')

  t.throws(() => { buckets.get('bucket') }, /`bucket` is not available in store/, '')

  post(context)
  t.pass('success')
})

Tape('Buckets constructor and delete bucket (with file) happy path (no unlink)', (t) => {
  t.plan(4)
  const context = pre()
  const path = './test'
  const file = './test/bucket.list'
  context.pathMock.expects('join').once().withArgs(path, 'bucket.list').returns(file)
  context.fsMock.expects('existsSync').once().withArgs(file).returns(true)
  context.fsMock.expects('existsSync').once().withArgs('path.list').returns(false)
  context.fsMock.expects('existsSync').once().withArgs('path.data').returns(false)
  context.fsMock.expects('unlinkSync').never()

  const buffer = Buffer.from([])
  context.fsMock.expects('readFileSync').once().withArgs(file).returns(buffer)

  const list = [{ bucket: 'bucket', path: 'path', type: 'type' }]
  context.serializerMock.expects('deserialize').once().withArgs(buffer).returns(list)
  context.avroMock.expects('parse').once().withArgs('type').returns('type')

  context.serializerMock.expects('serialize').once().withArgs([]).returns(buffer)

  context.fsMock.expects('writeFileSync').once().withArgs(file, buffer)

  const { Buckets } = Proxyquire('../../lib/buckets', { fs: context.fs, path: context.path })
  const buckets = new Buckets(path, context.serializer)
  t.ok(buckets, 'created instance')

  buckets.delete('bucket')
  t.pass('deleted')

  t.throws(() => { buckets.get('bucket') }, /`bucket` is not available in store/, '')

  post(context)
  t.pass('success')
})

Tape('Buckets constructor and delete bucket fail', (t) => {
  t.plan(3)
  const timestamp = 1554664312449
  MockDate.set(timestamp)
  const context = pre()
  const path = './test'
  const file = './test/bucket.list'
  context.avroTypeMock.expects('forSchema').once().returns('type')
  context.pathMock.expects('join').once().withArgs(path, 'bucket.list').returns(file)
  context.fsMock.expects('existsSync').once().withArgs(file).returns(false)

  const { Buckets } = Proxyquire('../../lib/buckets', { fs: context.fs, path: context.path })
  const buckets = new Buckets(path, context.serializer)
  t.ok(buckets, 'created instance')

  t.throws(() => { buckets.delete('bucket', 'type') }, /`bucket` is not available in store/, 'failed delete')

  post(context)
  t.pass('success')
})

Tape('Buckets constructor fail', (t) => {
  t.plan(3)
  const timestamp = 1554664312449
  MockDate.set(timestamp)
  const context = pre()

  context.avroTypeMock.expects('forSchema').once().returns('type')
  context.pathMock.expects('join').never()
  context.fsMock.expects('existsSync').never()

  const { Buckets } = Proxyquire('../../lib/buckets', { fs: context.fs, path: context.path })
  t.throws(() => { new Buckets('path') }, /`serializer` must be an instance of Serializer/, 'undefined serializer')
  t.throws(() => { new Buckets('path', 'serializer') }, /`serializer` must be an instance of Serializer/, 'wrong typed serializer')

  post(context)
  t.pass('success')
})

Tape('Buckets constructor and create bucket fails', (t) => {
  t.plan(4)
  const context = pre()
  const path = './test'
  const file = './test/bucket.list'
  context.avroTypeMock.expects('forSchema').once().returns('type')
  context.pathMock.expects('join').once().withArgs(path, 'bucket.list').returns(file)
  context.fsMock.expects('existsSync').once().withArgs(file).returns(true)

  const buffer = Buffer.from([])
  context.fsMock.expects('readFileSync').once().withArgs(file).returns(buffer)

  const list = [{ bucket: 'bucket', path: 'path', type: 'type' }]
  context.serializerMock.expects('deserialize').once().withArgs(buffer).returns(list)
  context.avroMock.expects('parse').once().withArgs('type').returns('type')

  context.avroTypeMock.expects('isType').once().withArgs('not type').returns(false)

  const { Buckets } = Proxyquire('../../lib/buckets', { fs: context.fs, path: context.path })
  const buckets = new Buckets(path, context.serializer)
  t.ok(buckets, 'created instance')

  t.throws(() => { buckets.create('bucket') }, /`bucket` already exists in store/, 'fails on dupe bucket')
  t.throws(() => { buckets.create('bucketw', 'not type') }, /`type` must be an instance of Avro.Type/, 'fails on bad type')

  post(context)
  t.pass('success')
})
