const Tape = require('tape')
const Sinon = require('sinon')
const { BaseCache, DefaultCache } = require('../../../lib/cache')
const Proxiquire = require('proxyquire').noCallThru()

function pre (cache) {
  const context = {}
  const sandbox = context.sandbox = Sinon.createSandbox()
  context.getStub = sandbox.stub(cache.prototype, 'get').returns('value')
  context.setStub = sandbox.stub(cache.prototype, 'set').returns()
  context.delStub = sandbox.stub(cache.prototype, 'del').returns()
  context.clearStub = sandbox.stub(cache.prototype, 'clear').returns()
  const Crypto = { createHash () {} }
  context.cryptMock = sandbox.mock(Crypto)
  context.cryptMock.expects('createHash').once().returns({
    update () {
      return {
        digest () {
          return 'key'
        }
      }
    }
  })
  context.CacheManager = Proxiquire('../../../lib/store/cache-manager', { Crypto })
  return context
}

function test (context, cache, t) {
  t.ok(cache, 'create instance of CacheManager')

  cache.set('key', 'value')
  cache.del('key')
  cache.clear()
  const value = cache.get('get')
  t.equals(value, 'value', 'got value')
  const key = cache.createKey('bucket', 'key')
  t.equals(key, 'key', 'got key')

  t.ok(context.getStub.calledOnce, 'base DefaultCache.get() called')
  t.ok(context.setStub.calledOnce, 'base DefaultCache.set() called')
  t.ok(context.delStub.calledOnce, 'base DefaultCache.del() called')
  t.ok(context.clearStub.calledOnce, 'base DefaultCache.clear() called')
}

function post (context) {
  context.sandbox.verifyAndRestore()
}

Tape('CacheManager constructor with a provided cache', (t) => {
  t.plan(8)
  const context = pre(BaseCache)
  const baseCache = new BaseCache()
  const cache = new context.CacheManager(baseCache)
  test(context, cache, t)
  post(context)
  t.pass('success')
})

Tape('CacheManager using DefaultCache', (t) => {
  t.plan(8)
  const context = pre(DefaultCache)
  const cache = new context.CacheManager()
  test(context, cache, t)
  post(context)
  t.pass('success')
})
