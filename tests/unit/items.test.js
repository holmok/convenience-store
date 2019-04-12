/* eslint no-new: 0 */
const Tape = require('Tape')
const Sinon = require('sinon')
const Avro = require('avsc')
const Proxyquire = require('proxyquire').noCallThru()

function pre () {
  const sandbox = Sinon.createSandbox()
  const fs = { existsSync () {}, unlinkSync () {}, closeSync () {}, openSync () {}, readSync () {}, writeSync () {}, copyFileSync () {} }
  return {
    sandbox,
    fs,
    fsMock: sandbox.mock(fs),
    avroMock: sandbox.mock(Avro),
    avroTypeMock: sandbox.mock(Avro.Type)
  }
}
function post (context) {
  context.sandbox.verifyAndRestore()
}

Tape('Items constructor and create bucket (no file) happy path', (t) => {
  t.plan(4)
  const context = pre()
  post(context)
})
