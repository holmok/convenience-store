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
    this.list = []
    if (!Fs.existsSync(this.path)) {
      Fs.closeSync(Fs.openSync(this.path, 'w'))
    } else {
      const file = Fs.openSync(this.path, 'r')
      let position = 0
      while (true) {
        const buffer = Buffer.alloc(58)
        const read = Fs.readSync(file, buffer, 0, 58, position)
        console.log('read', read)
        console.log('buffer', buffer.toString('hex'))
        if (read === 0) break // EOF
        if (buffer.readUInt8(56) === 1) { // active item
          console.log('add item')
          const item = internals.bufferToItem(buffer)
          this.list.push(item)
        }
        if (read === 0) break // EOF
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
  addItem (key, start, length) {
    const position = this.list.length
    const item = { key, start, length, position }
    const buffer = internals.itemToBuffer(item)
    const file = Fs.openSync(this.path, 'w')
    console.log('buffer', buffer.toString('hex'))
    console.log('this.list.length postition', this.list.length, position)
    console.log('position', (position) * 58)
    Fs.writeSync(file, buffer, 0, 58, (position) * 58)
    Fs.closeSync(file)
    this.list.push(item)
  }
}

module.exports = Items

const Crypto = require('crypto')
function hash (value) {
  return Crypto.createHash('sha256').update(value).digest().toString('hex')
}

const items = new Items(require('path').join(__dirname, 'testing'))
items.addItem(hash('adfasdf' + (new Date().getTime()).toString.toString()), new Date().getTime(), 128)
console.log(items.list)
