const { Compresser } = require('../serializer/compresser')
const { Cipher } = require('../serializer/cipher')
const { BUCKETS_TYPE, Buckets } = require('../buckets')
const { BaseSerializer, Serializer } = require('../serializer')
const Avro = require('avsc')

class BucketManager {
  constructor (path, { compress = false, password, salt, algorithm = 'AES-256-CBC', serializer }) {
    /* istanbul ignore next  */
    this.path = path || process.cwd()
    /* istanbul ignore else  */
    if (serializer) {
      /* istanbul ignore else  */
      if (serializer instanceof BaseSerializer) {
        this.buckets = new Buckets(this.path, serializer)
      } else {
        throw new Error('`serializer` must be an instance of BaseSerializer')
      }
    } else {
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
      this.buckets = new Buckets(this.path, bucketSerializer)
    }

    this.lists = {}
  }

  create (bucket, type) {
    let avroType = null
    /* istanbul ignore if  */
    if (!type) {
      throw new Error('`type` must be an Avro type or an example object')
    } /* istanbul ignore next */ else if (Avro.Type.isType(type)) {
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
