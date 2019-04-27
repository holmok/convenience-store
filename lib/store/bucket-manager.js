const { Compresser } = require('../serializer/compresser')
const { Cipher } = require('../serializer/cipher')
const { BUCKETS_TYPE, Buckets } = require('../buckets')
const { Serializer } = require('../serializer')
const Avro = require('avsc')

class BucketManager {
  constructor (path, compress = false, password, salt, algorithm = 'AES-256-CBC') {
    this.path = path || process.cwd()
    this.compresser = compress ? new Compresser() : undefined
    if ((password && !salt) || (!password && salt)) {
      throw new Error('To use a cipher `password` and `salt` are required')
    } else if (password && salt) {
      if (!algorithm) {
        throw new Error('To use a cipher `algorithm` is required')
      }
      this.cipher = new Cipher(password, salt, algorithm)
    }
    const bucketSerializer = new Serializer(BUCKETS_TYPE, { compresser: this.compresser, cipher: this.cipher })
    this.buckets = new Buckets(path, bucketSerializer)
    this.lists = {}
  }

  create (bucket, type) {
    let avroType = null
    if (!type) {
      throw new Error('`type` must be an Avro type or an example object')
    } else if (Avro.Type.isType(type)) {
      avroType = type
    } else {
      avroType = Avro.Type.forValue(type)
    }
    this.buckets.create(bucket, avroType)
  }

  get (bucket) {
    return this.buckets.get(bucket)
  }

  delete (bucket) {
    this.buckets.delete(bucket)
  }
}

module.exports = BucketManager
