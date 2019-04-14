const Tape = require('Tape')
const Fs = require('fs')
const Path = require('path')

Tape('bucket test / compression and cipher', (t) => {
  const path = Path.join(process.cwd(), 'items')
  if (Fs.existsSync(`${path}.list`)) Fs.unlinkSync(`${path}.list`)

  const Items = require('../../lib/items')

  const items = new Items(path)
  t.ok(items, 'new items')

  const key1 = '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
  const key2 = '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a07'

  items.create(key1, 12, 34)
  t.pass('create item 1')

  const item1 = items.get(key1)
  t.ok(item1, 'got item 1')

  items.create(key2, 78, 90)
  t.pass('create item 2')

  items.delete(key1)
  t.pass('create item 1')

  items.compress()
  t.pass('compress')

  const items2 = new Items(path)

  const item2 = items2.get(key2)
  t.ok(item2, 'got item 2')
  t.equal(item2.position, 0, 'item 2 at position 0')

  Fs.unlinkSync(`${path}.list`)
  t.end()
})
