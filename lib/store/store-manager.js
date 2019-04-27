const ORDER = { ASCENDING: 1, DESCENDING: 2 }
const Fs = require('fs')

class StoreManager {
  constructor (lists) {
    this.lists = lists
  }

  getAll (bucket, order = ORDER.ASCENDING) {
    const { items, path, serializer } = this.lists.get(bucket)
    const all = Object.values(items.list)
    const list = order === ORDER.ASCENDING ? all : all.reverse()
    return { list, path, serializer }
  }

  create (item, path, serializer) {
    let size = 0
    if (Fs.existsSync(path)) {
      size = Fs.statSync(path).size
    }
    const buffer = serializer.serialize(item)
    const start = size
    const length = buffer.length
    const file = Fs.openSync(path, 'a')
    Fs.writeSync(file, buffer)
    Fs.closeSync(file)
    return { start, length }
  }

  update (key, prev, item, path, serializer) {
    const buffer = serializer.serialize(item)
    delete (prev.start, prev.length, path)
    let start = prev.start
    if (buffer.length <= prev.length) {
      const file = Fs.openSync(path, 'w')
      Fs.writeSync(file, buffer, prev.start)
      Fs.closeSync(file)
    } else {
      const { size } = Fs.statSync(path)
      start = size
      const file = Fs.openSync(path, 'a')
      Fs.writeSync(file, buffer, 0, buffer.length)
      Fs.closeSync(file)
    }
    return { start, length: buffer.length }
  }

  get (start, length, path, serializer) {
    const file = Fs.openSync(path, 'r')
    const buffer = Buffer.alloc(length)
    Fs.readSync(file, buffer, 0, length, start)
    Fs.closeSync(file)
    const item = serializer.deserialize(buffer)
    return item
  }

  delete (start, length, path) {
    const buffer = Buffer.alloc(length)
    const file = Fs.openSync(path, 'w')
    Fs.writeSync(file, buffer, 0, buffer.length, start)
    Fs.closeSync(file)
  }

  compress (bucket) {
    const { list, path } = this.getAll(bucket)
    const backup = `${path}.new`
    const newFile = Fs.openSync(backup, 'w')
    const oldFile = Fs.openSync(path, 'r')
    for (const item of list) {
      const buffer = Buffer.alloc(item.length)
      Fs.readSync(oldFile, buffer, 0, item.length, item.position)
      Fs.writeSync(newFile, buffer, 0, buffer.length)
    }
    Fs.closeSync(newFile)
    Fs.closeSync(oldFile)
    Fs.unlinkSync(path)
    Fs.renameSync(backup, path)
  }
}

module.exports = { StoreManager, ORDER }
