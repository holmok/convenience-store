const Tape = require('tape')
const Fs = require('fs')
const Path = require('path')
const Avro = require('avsc')

Tape('bucket test / compression and cipher', (t) => {
  const path = Path.join(process.cwd(), 'bucket.list')
  if (Fs.existsSync(path)) Fs.unlinkSync(path)

  const { Compresser } = require('../../lib/compresser')
  const { Cipher } = require('../../lib/cipher')
  const { Serializer } = require('../../lib/serializer')
  const { Buckets, BUCKETS_TYPE } = require('../../lib/buckets')

  const ABC_TYPE = Avro.Type.forValue({ name: 'hello', active: false })

  const compresser = new Compresser()
  t.ok(compresser, 'new compresser')

  const cipher = new Cipher('abdefghijkl')
  t.ok(cipher, 'new cipher')

  const serializer = new Serializer(BUCKETS_TYPE, { compresser, cipher })
  t.ok(serializer, 'new serializer')

  const buckets = new Buckets(process.cwd(), serializer)
  t.ok(buckets, 'new bucket')

  buckets.create('abc', ABC_TYPE)
  t.pass('create bucket')

  const bucket = buckets.get('abc')
  t.ok(bucket, 'got bucket')

  const buckets2 = new Buckets(process.cwd(), serializer)
  const bucket2 = buckets2.get('abc')
  t.ok(bucket2, 'got bucket (on different bucket)')

  buckets2.delete('abc')
  t.pass('delete bucket')
  Fs.unlinkSync(path)
  t.end()
})
