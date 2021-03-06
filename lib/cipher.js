const Crypto = require('crypto')

class BaseCipher {
  encrypt (buffer) {
    throw new Error('not implemented')
  }
  decrypt (buffer) {
    throw new Error('not implemented')
  }
}

class Cipher extends BaseCipher {
  constructor (password, algorithm = 'AES-256-CBC') {
    super()
    if (!password || typeof password !== 'string') {
      throw new Error('`password` must be string')
    }
    this.algorithm = algorithm
    const salt = Buffer.from(Crypto.createHash('sha256').update(password).digest('hex'), 'utf8')
    this.key = Crypto.pbkdf2Sync(Buffer.from(password), salt, 64, 32, 'sha1')
  }
  encrypt (buffer) {
    if (!(buffer instanceof Buffer)) {
      throw new Error('`buffer` is not an instance of Buffer')
    }
    const iv = Buffer.from(Crypto.randomBytes(16))
    const cipher = Crypto.createCipheriv(this.algorithm, this.key, iv)
    const secret = Buffer.concat([iv, cipher.update(buffer), cipher.final()])
    return secret
  }
  decrypt (secret) {
    if (!(secret instanceof Buffer)) {
      throw new Error('`buffer` is not an instance of Buffer')
    }
    const iv = secret.slice(0, 16)
    const data = secret.slice(16)
    const decipher = Crypto.createDecipheriv(this.algorithm, this.key, iv)
    const buffer = Buffer.concat([decipher.update(data), decipher.final()])
    return buffer
  }
}

module.exports = { Cipher, BaseCipher }
