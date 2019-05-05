const Tape = require('tape')
const Sinon = require('sinon')
const { BaseSerializer } = require('../../lib/serializer')
const Buckets = require('../../lib/buckets')
const Proxyquire = require('proxyquire').noCallThru()

Tape('BucketManager constructor and method', (t) => {
  t.plan(7)
  const sandbox = Sinon.createSandbox()
  const serializer = new BaseSerializer()
  const bucketsFake = { create () {}, get () {}, delete () {}, exists () {} }
  const bucketsMock = sandbox.mock(bucketsFake)
  const bucketsStub = sandbox.stub(Buckets, 'Buckets').returns(bucketsFake)

  bucketsMock.expects('create').once().withArgs('bucket').returns()
  bucketsMock.expects('delete').once().withArgs('bucket').returns()
  bucketsMock.expects('get').once().withArgs('bucket').returns('bucket')
  bucketsMock.expects('exists').once().withArgs('bucket').returns(true)

  const { BucketManager } = Proxyquire('../../lib/store/bucket-manager', { '../buckets': { BUCKETS_TYPE: {}, Buckets: Buckets.Buckets } })
  const buckets = new BucketManager('path', { serializer })
  t.ok(bucketsStub.calledOnce, 'buckets constructor called')
  t.ok(buckets, 'created bucket manager')

  buckets.create('bucket', { active: false })
  t.pass('bucket  created')

  const result = buckets.get('bucket')
  t.equal(result, 'bucket', 'got bucket')

  const exists = buckets.exists('bucket')
  t.ok(exists, 'bucket exists')

  buckets.delete('bucket')
  t.pass('bucket  delete')

  sandbox.verifyAndRestore()
  t.pass('success')
})
