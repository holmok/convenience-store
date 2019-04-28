const Tape = require('tape')
const Sinon = require('sinon')
const LruCache = require('lru-cache')
const { BaseCache, DefaultCache } = require('../../../lib/cache')

Tape('BaseCache', (t) => {
  t.plan(6)
  const base = new BaseCache()
  t.ok(base, 'create instance of base cache')

  t.throws(base.get, /not implemented/, 'base cache.get() throws')
  t.throws(base.set, /not implemented/, 'base cache.set() throws')
  t.throws(base.del, /not implemented/, 'base cache.del() throws')
  t.throws(base.clear, /not implemented/, 'base cache.clear() throws')

  t.pass('success')
})

Tape('DefaultCache', (t) => {
  t.plan(7)
  const getStub = Sinon.stub(LruCache.prototype, 'get').returns('value')
  const setStub = Sinon.stub(LruCache.prototype, 'set').returns()
  const delStub = Sinon.stub(LruCache.prototype, 'del').returns()
  const resetStub = Sinon.stub(LruCache.prototype, 'reset').returns('apple')

  const cache = new DefaultCache()
  t.ok(cache, 'create instance of base cache')

  cache.set('key', 'value')
  cache.del('key')
  cache.clear()
  const value = cache.get('get')
  t.equals(value, 'value', 'got value')

  t.ok(getStub.calledOnce, 'base lruCache.get() called')
  t.ok(setStub.calledOnce, 'base lruCache.set() called')
  t.ok(delStub.calledOnce, 'base lruCache.del() called')
  t.ok(resetStub.calledTwice, 'base lruCache.reset() called')

  t.pass('success')
})
