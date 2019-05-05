const Tape = require('tape')
const Snappy = require('snappy')
const Sinon = require('sinon')

Tape('BaseCompresser', (t) => {
  t.plan(4)

  const { BaseCompresser } = require('../../lib/compresser')
  const compresser = new BaseCompresser()

  t.ok(compresser, 'create an instance')

  t.throws(compresser.compress, /not implemented/, 'base compresser.compress() throws')
  t.throws(compresser.uncompress, /not implemented/, 'base compresser.uncompress() throws')

  t.pass('success')
})

Tape('Compresser - happy path', (t) => {
  t.plan(4)

  const snappyMock = Sinon.mock(Snappy)
  const { Compresser } = require('../../lib/compresser')

  const compressed = Buffer.from('compressed')
  const uncompressed = Buffer.from('uncompressed')

  snappyMock.expects('compressSync').once().withArgs(uncompressed).returns(compressed)
  snappyMock.expects('uncompressSync').once().withArgs(compressed).returns(uncompressed)

  const compresser = new Compresser()
  t.ok(compresser, 'create an instance')

  const result1 = compresser.compress(uncompressed)
  const result2 = compresser.uncompress(compressed)

  t.ok(result1.compare(compressed) === 0, 'compress works')
  t.ok(result2.compare(uncompressed) === 0, 'uncompress works')

  snappyMock.verify()
  snappyMock.restore()

  t.pass('success')
})

Tape('Compresser - non buffer params', (t) => {
  t.plan(10)

  const snappyMock = Sinon.mock(Snappy)
  const { Compresser } = require('../../lib/compresser')

  snappyMock.expects('compressSync').never()
  snappyMock.expects('uncompressSync').never()

  const compresser = new Compresser()
  t.ok(compresser, 'create an instance')

  t.throws(() => { compresser.compress(null) }, /`buffer` is not an instance of Buffer/, 'compress fails on null')
  t.throws(() => { compresser.compress() }, /`buffer` is not an instance of Buffer/, 'compress fails on undefined')
  t.throws(() => { compresser.compress('null') }, /`buffer` is not an instance of Buffer/, 'compress fails on string')
  t.throws(() => { compresser.compress([1, 2, 3]) }, /`buffer` is not an instance of Buffer/, 'compress fails on array')

  t.throws(() => { compresser.uncompress(null) }, /`buffer` is not an instance of Buffer/, 'uncompress fails on null')
  t.throws(() => { compresser.uncompress() }, /`buffer` is not an instance of Buffer/, 'uncompress fails on undefined')
  t.throws(() => { compresser.uncompress('null') }, /`buffer` is not an instance of Buffer/, 'uncompress fails on string')
  t.throws(() => { compresser.uncompress([1, 2, 3]) }, /`buffer` is not an instance of Buffer/, 'uncompress fails on array')

  snappyMock.verify()
  snappyMock.restore()

  t.pass('success')
})
