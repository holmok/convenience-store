const Tape = require('tape')
const store = require('../../lib')

Tape('Store lib entry', (t) => {
  t.plan(7)
  const { BaseCache, BaseCipher, BaseCompresser, BaseSerializer, Store, ORDER } = store

  t.ok(BaseCache, 'BaseCacke ok')
  t.ok(BaseCipher, 'BaseCipher ok')
  t.ok(BaseCompresser, 'BaseCompresser ok')
  t.ok(BaseSerializer, 'BaseSerializer ok')
  t.ok(Store, 'Store ok')
  t.ok(ORDER, 'ORDER ok')

  t.pass('success')
})
