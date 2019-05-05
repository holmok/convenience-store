/* eslint no-new: 0 */
const Tape = require('tape')
const Crypto = require('crypto')
const Sinon = require('sinon')

function pre () {
  const cipher = {
    update () {},
    final () {}
  }

  const decipher = {
    update () {},
    final () {}
  }
  const sandbox = Sinon.createSandbox()
  return {
    sandbox,
    cipher,
    decipher,
    cipherMock: sandbox.mock(cipher),
    decipherMock: sandbox.mock(decipher),
    cryptoMock: sandbox.mock(Crypto)
  }
}
function post (context) {
  context.sandbox.verifyAndRestore()
}

Tape('BaseCompresser', (t) => {
  t.plan(4)

  const { BaseCipher } = require('../../lib/cipher')
  const cipher = new BaseCipher()

  t.ok(cipher, 'create an instance')

  t.throws(cipher.encrypt, /not implemented/, 'base cipher.encrypt() throws')
  t.throws(cipher.decrypt, /not implemented/, 'base cipher.decrypt() throws')

  t.pass('success')
})

Tape('Cipher - happy path', (t) => {
  t.plan(4)
  const context = pre()
  const { Cipher } = require('../../lib/cipher')

  const password = 'password'
  const passworfBuffer = Buffer.from(password)
  const algorithm = 'AES-256-CBC'
  const key = 'key'

  context.cryptoMock.expects('pbkdf2Sync').once().withArgs(passworfBuffer).returns(key)

  const randomBytes = Array.from(Array(16).keys())
  context.cryptoMock.expects('randomBytes').once().withArgs(16).returns(randomBytes)

  const randomBytesBuffer = Buffer.from(randomBytes)
  context.cryptoMock.expects('createCipheriv').once().withArgs(algorithm, key, randomBytesBuffer).returns(context.cipher)
  context.cryptoMock.expects('createDecipheriv').once().withArgs(algorithm, key, randomBytesBuffer).returns(context.decipher)

  const unencrypted = Buffer.from([1, 2, 3])
  const cipherUpate = Buffer.from([4, 5])
  const cipherFinal = Buffer.from([6])
  const decipherUpate = Buffer.from([1, 2])
  const decipherFinal = Buffer.from([3])
  const secret = Buffer.concat([cipherUpate, cipherFinal])
  const encrypted = Buffer.concat([randomBytesBuffer, secret])
  context.cipherMock.expects('update').once().withArgs(unencrypted).returns(cipherUpate)
  context.cipherMock.expects('final').once().returns(cipherFinal)
  context.decipherMock.expects('update').once().withArgs(secret).returns(decipherUpate)
  context.decipherMock.expects('final').once().returns(decipherFinal)

  const cipher = new Cipher(password, algorithm)
  t.ok(cipher, 'create an instance')

  const result1 = cipher.encrypt(unencrypted)
  const result2 = cipher.decrypt(encrypted)

  t.ok(result1.compare(encrypted) === 0, 'encrypt works')
  t.ok(result2.compare(unencrypted) === 0, 'unencrypt works')

  post(context)

  t.pass('success')
})

Tape('Cipher - bad params', (t) => {
  t.plan(10)
  const context = pre()
  const { Cipher } = require('../../lib/cipher')
  const password = 'password'
  const passworfBuffer = Buffer.from(password)
  const key = 'key'
  context.cryptoMock.expects('pbkdf2Sync').once().withArgs(passworfBuffer).returns(key)
  context.cryptoMock.expects('createCipheriv').never()
  context.cryptoMock.expects('createDecipheriv').never()

  const cipher = new Cipher(password)
  t.ok(cipher, 'create an instance')

  t.throws(() => { cipher.encrypt(null) }, /`buffer` is not an instance of Buffer/, 'encrypt fails on null')
  t.throws(() => { cipher.encrypt() }, /`buffer` is not an instance of Buffer/, 'encrypt fails on undefined')
  t.throws(() => { cipher.encrypt('null') }, /`buffer` is not an instance of Buffer/, 'encrypt fails on string')
  t.throws(() => { cipher.encrypt([1, 2, 3]) }, /`buffer` is not an instance of Buffer/, 'encrypt fails on array')

  t.throws(() => { cipher.decrypt(null) }, /`buffer` is not an instance of Buffer/, 'decrypt fails on null')
  t.throws(() => { cipher.decrypt() }, /`buffer` is not an instance of Buffer/, 'decrypt fails on undefined')
  t.throws(() => { cipher.decrypt('null') }, /`buffer` is not an instance of Buffer/, 'decrypt fails on string')
  t.throws(() => { cipher.decrypt([1, 2, 3]) }, /`buffer` is not an instance of Buffer/, 'decrypt fails on array')

  post(context)

  t.pass('success')
})

Tape('Cipher - bad constructors', (t) => {
  t.plan(3)
  const context = pre()
  post(context)
  const { Cipher } = require('../../lib/cipher')
  context.cryptoMock.expects('pbkdf2Sync').never()

  t.throws(() => { new Cipher() }, /`password` must be string/, 'password undefined')
  t.throws(() => { new Cipher(1) }, /`password` must be string/, 'password wrong type')

  t.pass('success')
})
