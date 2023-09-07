import test from 'ava'
import sinon from 'sinon'
import depositDirect from '#lib/registry/deposit.mjs'
import gear from '#lib/gear.mjs'
import path from 'node:path'
import rootPath from '#lib/root.mjs'
import state from '#lib/registry/state.mjs'
import url from 'node:url'
import { wrap } from '#test/aid.mjs'
import { PoseState } from '#lib/registry/enum.mjs'
import { InvalidError, PermissionError } from '#lib/error.mjs'

// Execute with same call depth as public surface
const deposit = wrap(depositDirect)

gear.resolve = sinon.stub()

test.afterEach(() => {
  gear.resolve.reset()
  state.modules = new Map()
})

test.serial('specifier invalid', t => {
  const error = t.throws(() => { deposit(8, {}) }, {
    instanceOf: InvalidError,
    code: 'InvalidSpecifier'
  })
  t.is(error.value, 8)
  t.is(error.note, 'must be nonempty string')
})

test.serial('depth invalid', t => {
  const error = t.throws(() => { deposit('test', {}, -1) }, {
    instanceOf: InvalidError,
    code: 'InvalidDepth'
  })
  t.is(error.value, -1)
  t.is(error.note, 'must be nonnegative integer')
})

test.serial('internal', t => {
  const targetPath = path.join(rootPath, 'registry', 'withdraw.mjs')
  const targetURL = url.pathToFileURL(targetPath).href
  gear.resolve.returns(targetURL)
  const error = t.throws(() => { deposit('#lib/withdraw.mjs', {}) }, {
    instanceOf: PermissionError,
    code: 'ForbiddenPose'
  })
  t.is(error.label, targetURL)
  t.is(error.note, 'internal files may not be posed')
})

test.serial('poor form', t => {
  const target = 'file:///'
  gear.resolve.returns(target)
  const name = '\uD800'
  const exports = { [name]: 'value' }
  const error = t.throws(() => { deposit('test', exports) }, {
    instanceOf: InvalidError,
    code: 'InvalidExportName'
  })
  t.is(error.label, name)
  t.is(error.note, 'must be well-formed string')
})

test.serial('single', t => {
  const target = 'file:///'
  gear.resolve.returns(target)
  const exports = { a: 1, b: 2, c: 3 }
  deposit('test', exports)
  const callerURL = new URL(import.meta.url)
  t.true(gear.resolve.calledOnceWithExactly('test', callerURL))
  const module = state.modules.get(target)
  t.is(module.current, 1)
  t.is(module.poses.size, 1)
  t.deepEqual(module.poses.get(1), {
    state: PoseState.Unloaded,
    facade: { a: 1, b: 2, c: 3 },
    full: false
  })
})

test.serial('plural', t => {
  const target = 'file:///'
  gear.resolve.returns(target)
  deposit('test', { a: 1 })
  const module = state.modules.get(target)
  t.is(module.current, 1)
  t.deepEqual(module.poses.get(1), {
    state: PoseState.Unloaded,
    facade: { a: 1 },
    full: false
  })
  deposit('test', { b: 2 })
  t.is(module.current, 2)
  t.deepEqual(module.poses.get(2), {
    state: PoseState.Unloaded,
    facade: { a: 1, b: 2 },
    full: false
  })
  deposit('test', { c: 3 })
  t.is(module.current, 3)
  t.deepEqual(module.poses.get(3), {
    state: PoseState.Unloaded,
    facade: { a: 1, b: 2, c: 3 },
    full: false
  })
})

test.serial('full', t => {
  const target = 'file:///'
  gear.resolve.returns(target)
  deposit('test', { a: 1, b: 2, c: 3 })
  deposit('test', { default: 42 }, undefined, true)
  const module = state.modules.get(target)
  t.is(module.current, 2)
  t.deepEqual(module.poses.get(2), {
    state: PoseState.Unloaded,
    facade: { default: 42 },
    full: true
  })
})
