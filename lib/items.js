const Fs = require('fs')
const Avro = require('avsc')

const ITEM_TYPE = Avro.Type.forSchema({
  type: 'record',
  fields: [
    { name: 'key', type: { type: 'fixed', name: 'Key', size: 32 } },
    { name: 'start', type: { type: 'fixed', name: 'Start', size: 8 } },
    { name: 'length', type: { type: 'fixed', name: 'Length', size: 8 } },
    { name: 'position', type: { type: 'fixed', name: 'Position', size: 8 } }
  ]
})

const internals = {
  uLongToBytes (long) {
    const byteArray = [0, 0, 0, 0, 0, 0, 0, 0]
    for (var index = 0; index < byteArray.length; index++) {
      const byte = long & 0xff
      byteArray[ index ] = byte
      long = (long - byte) / 256
    }
    return Buffer.from(byteArray)
  },
  bytesToULong (buffer) {
    const byteArray = [...buffer]
    let value = 0
    for (var i = byteArray.length - 1; i >= 0; i--) {
      value = (value * 256) + byteArray[i]
    }
    return value
  },
  bufferToItem (buffer) {
    const active = buffer.readUInt8(56) === 1
    if (!active) return
    const length = buffer.readUInt8(57)
    const itemBuffer = Buffer.alloc(length)
    buffer.copy(itemBuffer, 0, 0, length)
    const item = ITEM_TYPE.fromBuffer(itemBuffer)
    return {
      key: item.key.toString('hex'),
      start: internals.bytesToULong(item.start),
      length: internals.bytesToULong(item.length),
      position: internals.bytesToULong(item.position)
    }
  },
  itemToBuffer ({ key, start, length, position }) {
    const item = {
      key: Buffer.from(key, 'hex'),
      start: internals.uLongToBytes(start),
      length: internals.uLongToBytes(length),
      position: internals.uLongToBytes(position)
    }
    const buffer = Buffer.alloc(58)
    const itemBuffer = ITEM_TYPE.toBuffer(item)
    itemBuffer.copy(buffer, 0, 0)
    buffer.writeUInt8(itemBuffer.length, 57)
    buffer.writeUInt8(1, 56)
    return buffer
  },
  loadList () {
    this.list = {}
    this.count = 0
    if (!Fs.existsSync(this.path)) {
      Fs.closeSync(Fs.openSync(this.path, 'w'))
    } else {
      const file = Fs.openSync(this.path, 'r')
      let position = 0

      while (true) {
        const buffer = Buffer.alloc(58)
        const read = Fs.readSync(file, buffer, 0, 58, position)
        if (read === 0) break // EOF
        this.count++
        const item = internals.bufferToItem(buffer)
        if (item) {
          this.list[item.key] = item
        }
        position += 58
      }
      Fs.closeSync(file)
    }
  }
}
class Items {
  constructor (path) {
    this.path = `${path}.list`
    internals.loadList.call(this)
  }
  create (key, start, length) {
    if (this.list[key]) throw new Error('Key exists')
    const position = this.count
    const item = { key, start, length, position }
    const buffer = internals.itemToBuffer(item)
    const file = Fs.openSync(this.path, 'a')
    Fs.writeSync(file, buffer, 0, 58, (position) * 58)
    Fs.closeSync(file)
    this.list[item.key] = item
    this.count++
  }
  get (key) {
    return this.list[key]
  }
  delete (key) {
    const item = this.list[key]
    if (!item) throw new Error('Key does not exist')
    const position = (item.position * 58) + 56
    const file = Fs.openSync(this.path, 'a')
    Fs.writeSync(file, Buffer.alloc(1), 0, 1, position)
    Fs.closeSync(file)
    delete this.list[key]
  }
  compress () {
    const backup = `${this.path}.new`
    const file = Fs.openSync(backup, 'w')
    const items = Object.values(this.list)
    let position = 0
    for (const item of items) {
      item.position = position
      const buffer = internals.itemToBuffer(item)
      Fs.writeSync(file, buffer, 0, 58, (position) * 58)
      position++
    }
    Fs.closeSync(file)
    Fs.unlinkSync(this.path)
    Fs.copyFileSync(backup, this.path)
  }
}

module.exports = Items

const Crypto = require('crypto')
function hash (value) {
  return Crypto.createHash('sha256').update(value).digest().toString('hex')
}

const items = new Items(require('path').join(__dirname, 'testing'))
items.create(hash(Math.random().toString()), new Date().getTime(), 128)
if (items.count > 3) {
  const key = Object.keys(items.list)[0]
  const item = items.get(key)
  console.log('deleting', item)
  items.delete(key)
  items.compress()
}
console.log(items.list)
