const Snappy = require('snappy')

class BaseCompresser {
  compress (buffer) {
    throw new Error('not implemented')
  }
  uncompress (buffer) {
    throw new Error('not implemented')
  }
}

class Compresser extends BaseCompresser {
  compress (buffer) {
    if (!(buffer instanceof Buffer)) {
      throw new Error('`buffer` is not an instance of Buffer')
    }
    const compressed = Snappy.compressSync(buffer)
    return compressed
  }
  uncompress (buffer) {
    if (!(buffer instanceof Buffer)) {
      throw new Error('`buffer` is not an instance of Buffer')
    }
    const compressed = Snappy.uncompressSync(buffer)
    return compressed
  }
}

module.exports = { Compresser, BaseCompresser }
