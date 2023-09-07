import test from 'ava'
import sinon from 'sinon'
import fs from 'node:fs/promises'
import vm from 'node:vm'
import { bootstrapPath, launchPath, presentPath } from '#lib/loader/value.mjs'

const presentSpecifier = JSON.stringify(presentPath)
const launchSpecifier = JSON.stringify(launchPath)
const template = await fs.readFile(bootstrapPath, { encoding: 'utf8' })
const code = template
  .replace("'$$PRESENT$$'", presentSpecifier)
  .replace("'$$LAUNCH$$'", launchSpecifier)
const bootstrap = vm.compileFunction(code, ['getBuiltin', 'port'], {
  filename: '<preload>'
})

const launch = sinon.stub()
const launchModule = { default: launch }
const require = sinon.stub().resolves(launchModule)
const builtin = {
  module: {
    createRequire: sinon.stub().returns(require)
  },
  path: {
    join: sinon.stub().returns('/test/path/<poselet:bootstrap>')
  },
  process: {
    cwd: sinon.stub().returns('/test/path')
  }
}
const getBuiltin = sinon.stub()
getBuiltin.withArgs('module').returns(builtin.module)
getBuiltin.withArgs('path').returns(builtin.path)
getBuiltin.withArgs('process').returns(builtin.process)

test.afterEach(() => {
  launch.reset()
  require.resetHistory()
  builtin.module.createRequire.resetHistory()
  builtin.path.join.resetHistory()
  builtin.process.cwd.resetHistory()
  getBuiltin.resetHistory()
})

test.serial('success', async t => {
  const installed = new Promise(resolve => { launch.callsFake(resolve) })
  const port = Symbol('Port')
  bootstrap(getBuiltin, port)
  await installed
  t.true(getBuiltin.calledThrice)
  t.true(getBuiltin.calledWithExactly('module'))
  t.true(getBuiltin.calledWithExactly('path'))
  t.true(getBuiltin.calledWithExactly('process'))
  t.true(builtin.process.cwd.calledOnceWithExactly())
  t.true(builtin.path.join.calledOnceWithExactly(
    '/test/path', '<poselet:bootstrap>'
  ))
  t.true(builtin.module.createRequire.calledOnceWithExactly(
    '/test/path/<poselet:bootstrap>'
  ))
  t.true(require.calledTwice)
  t.true(require.firstCall.calledWithExactly(presentPath))
  t.true(require.secondCall.calledWithExactly(launchPath))
  t.true(launch.calledOnceWithExactly(port))
})
