/* eslint no-new: 0 */
const Avro = require('avsc')

const { BaseCipher } = require('./cipher')
const { BaseCompresser } = require('./compresser')

class BaseSerializer {
  serialize (buffer) {
    throw new Error('not implemented')
  }
  deserialize (buffer) {
    throw new Error('not implemented')
  }
}

class Serializer extends BaseSerializer {
  constructor (type, options) {
    super()

    if (!(type instanceof Avro.Type)) {
      throw new Error('`type` must be an instance of Avro.Type')
    }
    this.type = type
    if (options) {
      if (options.compresser && !(options.compresser instanceof BaseCompresser)) {
        throw new Error('`compresser` must be an instance of BaseCompresser')
      }
      this.compresser = options.compresser

      if (options.cipher && !(options.cipher instanceof BaseCipher)) {
        throw new Error('`cipher` must be an instance of BaseCipher')
      }
      this.cipher = options.cipher
    }
  }
  serialize (item) {
    if (!this.type.isValid(item)) {
      throw new Error('`item` is not the correct Avro.Type')
    }
    let buffer = this.type.toBuffer(item)
    if (this.compresser) {
      buffer = this.compresser.compress(buffer)
    }
    if (this.cipher) {
      buffer = this.cipher.encrypt(buffer)
    }
    return buffer
  }
  deserialize (buffer) {
    if (!(buffer instanceof Buffer)) {
      throw new Error('`buffer` must be an instance of Buffer')
    }
    if (this.cipher) {
      buffer = this.cipher.decrypt(buffer)
    }
    if (this.compresser) {
      buffer = this.compresser.uncompress(buffer)
    }
    const item = this.type.fromBuffer(buffer)
    return item
  }
}

module.exports = { Serializer, BaseSerializer }
