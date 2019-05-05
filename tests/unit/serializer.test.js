/* eslint no-new: 0 */
const Tape = require('tape')
const Sinon = require('sinon')
const { BaseCipher } = require('../../lib/cipher')
const { BaseCompresser } = require('../../lib/compresser')
const Avro = require('avsc')

function pre () {
  const sandbox = Sinon.createSandbox()
  const cipher = new BaseCipher()
  const compresser = new BaseCompresser()
  class AvroType extends Avro.Type {
    toBuffer () {}
    fromBuffer () {}
    isType () {}
  }
  const avroType = new AvroType()
  return {
    sandbox,
    cipher,
    compresser,
    avroType,
    cipherMock: sandbox.mock(cipher),
    compresserMock: sandbox.mock(compresser),
    avroTypeMock: sandbox.mock(avroType)
  }
}
function post (context) {
  context.sandbox.verifyAndRestore()
}

Tape('BaseSerializer', (t) => {
  t.plan(4)

  const { BaseSerializer } = require('../../lib/serializer')
  const serializer = new BaseSerializer()

  t.ok(serializer, 'create an instance')

  t.throws(serializer.serialize, /not implemented/, 'base serializer.serialize() throws')
  t.throws(serializer.deserialize, /not implemented/, 'base serializer.deserialize() throws')

  t.pass('success')
})

Tape('Serializer - happy path (no compression, no encryption)', (t) => {
  t.plan(4)

  const context = pre()

  const item = 'item'
  const buffer = Buffer.from(item)

  context.compresserMock.expects('compress').never()
  context.compresserMock.expects('uncompress').never()
  context.cipherMock.expects('encrypt').never()
  context.cipherMock.expects('decrypt').never()
  context.avroTypeMock.expects('toBuffer').once().withArgs(item).returns(buffer)
  context.avroTypeMock.expects('fromBuffer').once().withArgs(buffer).returns(item)
  context.avroTypeMock.expects('isValid').once().withArgs(item).returns(true)

  const { Serializer } = require('../../lib/serializer')
  const serializer = new Serializer(context.avroType)

  t.ok(serializer, 'create an instance')

  const result1 = serializer.serialize(item)
  const result2 = serializer.deserialize(buffer)

  t.ok(result1.compare(buffer) === 0, 'serialize works')
  t.equal(result2, item, 'deserialize works')

  post(context)
  t.pass('success')
})

Tape('Serializer - happy path (with compression, no encryption)', (t) => {
  t.plan(4)

  const context = pre()

  const item = 'item'
  const compressed = Buffer.from('compressed')
  const buffer = Buffer.from(item)

  context.compresserMock.expects('compress').once().withArgs(buffer).returns(compressed)
  context.compresserMock.expects('uncompress').once().withArgs(compressed).returns(buffer)
  context.cipherMock.expects('encrypt').never()
  context.cipherMock.expects('decrypt').never()
  context.avroTypeMock.expects('toBuffer').once().withArgs(item).returns(buffer)
  context.avroTypeMock.expects('fromBuffer').once().withArgs(buffer).returns(item)
  context.avroTypeMock.expects('isValid').once().withArgs(item).returns(true)

  const { Serializer } = require('../../lib/serializer')
  const serializer = new Serializer(context.avroType, { compresser: context.compresser })

  t.ok(serializer, 'create an instance')

  const result1 = serializer.serialize(item)
  const result2 = serializer.deserialize(compressed)

  t.ok(result1.compare(compressed) === 0, 'serialize works')
  t.equal(result2, item, 'deserialize works')

  post(context)
  t.pass('success')
})

Tape('Serializer - happy path (no compression, with encryption)', (t) => {
  t.plan(4)

  const context = pre()

  const item = 'item'
  const secret = Buffer.from('secret')
  const buffer = Buffer.from(item)

  context.compresserMock.expects('compress').never()
  context.compresserMock.expects('uncompress').never()
  context.cipherMock.expects('encrypt').once().withArgs(buffer).returns(secret)
  context.cipherMock.expects('decrypt').once().withArgs(secret).returns(buffer)
  context.avroTypeMock.expects('toBuffer').once().withArgs(item).returns(buffer)
  context.avroTypeMock.expects('fromBuffer').once().withArgs(buffer).returns(item)
  context.avroTypeMock.expects('isValid').once().withArgs(item).returns(true)

  const { Serializer } = require('../../lib/serializer')
  const serializer = new Serializer(context.avroType, { cipher: context.cipher })

  t.ok(serializer, 'create an instance')

  const result1 = serializer.serialize(item)
  const result2 = serializer.deserialize(secret)

  t.ok(result1.compare(secret) === 0, 'serialize works')
  t.equal(result2, item, 'deserialize works')

  post(context)
  t.pass('success')
})

Tape('Serializer - happy path (with compression, with encryption)', (t) => {
  t.plan(4)

  const context = pre()

  const item = 'item'
  const secret = Buffer.from('secret')
  const compressed = Buffer.from('compressed')
  const buffer = Buffer.from(item)

  context.compresserMock.expects('compress').once().withArgs(buffer).returns(compressed)
  context.compresserMock.expects('uncompress').once().withArgs(compressed).returns(buffer)
  context.cipherMock.expects('encrypt').once().withArgs(compressed).returns(secret)
  context.cipherMock.expects('decrypt').once().withArgs(secret).returns(compressed)
  context.avroTypeMock.expects('toBuffer').once().withArgs(item).returns(buffer)
  context.avroTypeMock.expects('fromBuffer').once().withArgs(buffer).returns(item)
  context.avroTypeMock.expects('isValid').once().withArgs(item).returns(true)

  const { Serializer } = require('../../lib/serializer')
  const serializer = new Serializer(context.avroType, { cipher: context.cipher, compresser: context.compresser })

  t.ok(serializer, 'create an instance')

  const result1 = serializer.serialize(item)
  const result2 = serializer.deserialize(secret)

  t.ok(result1.compare(secret) === 0, 'serialize works')
  t.equal(result2, item, 'deserialize works')

  post(context)
  t.pass('success')
})

Tape('Serializer - bad params', (t) => {
  t.plan(6)
  const context = pre()
  const { Serializer } = require('../../lib/serializer')

  const item = 'item'

  context.avroTypeMock.expects('isValid').once().withArgs(item).returns(false)
  context.avroTypeMock.expects('isValid').once().withArgs(undefined).returns(false)

  const serializer = new Serializer(context.avroType)
  t.ok(serializer, 'create an instance')

  t.throws(() => { serializer.serialize(item) }, /`item` is not the correct Avro.Type/, 'serialize fails bad avro type')
  t.throws(() => { serializer.serialize() }, /`item` is not the correct Avro.Type/, 'serialize fails no value')

  t.throws(() => { serializer.deserialize([1, 2, 3]) }, /`buffer` must be an instance of Buffer/, 'deserialize fails bad value')
  t.throws(() => { serializer.deserialize() }, /`buffer` must be an instance of Buffer/, 'deserialize fails no value')
  post(context)

  t.pass('success')
})

Tape('Serializer - bad constructors', (t) => {
  t.plan(5)
  const context = pre()
  post(context)
  const { Serializer } = require('../../lib/serializer')

  t.throws(() => { new Serializer() }, /`type` must be an instance of Avro.Type/, 'type undefined')
  t.throws(() => { new Serializer('bad') }, /`type` must be an instance of Avro.Type/, 'type wrong type')
  t.throws(() => { new Serializer(context.avroType, { compresser: 'bad' }) }, /`compresser` must be an instance of BaseCompresser/, 'bad compressor')
  t.throws(() => { new Serializer(context.avroType, { cipher: 'bad' }) }, /`cipher` must be an instance of BaseCipher/, 'bad cipher')

  t.pass('success')
})
