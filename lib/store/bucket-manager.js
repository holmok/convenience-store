const { Compresser } = require('../compresser')
const { Cipher } = require('../cipher')
const { BUCKETS_TYPE, Buckets } = require('../buckets')
const { BaseSerializer, Serializer } = require('../serializer')
const Avro = require('avsc')

class BucketManager {
  constructor (path, { compress = false, password, algorithm = 'AES-256-CBC', serializer }) {
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
      if (password) {
        this.cipher = new Cipher(password, algorithm)
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

module.exports = { BucketManager }
