import test from 'ava'
import sinon from 'sinon'
import install from '#lib/registry/install.mjs'
import errored from '#lib/registry/errored.mjs'
import receiver from '#lib/registry/receiver.mjs'
import gear from '#lib/gear.mjs'
import state from '#lib/registry/state.mjs'
import { copy, rinse } from '#lib/object.mjs'
import { InvalidError, StateError } from '#lib/error.mjs'

test.afterEach(() => {
  gear.resolve = () => {}
  rinse(state)
  copy(state, {
    installed: false
  })
  state.ready = new Promise(resolve => { state.resolve = resolve })
})

test.serial('invalid', t => {
  const error = t.throws(() => { install(8) }, {
    instanceOf: InvalidError,
    code: 'InvalidPort'
  })
  t.is(error.value, 8)
  t.is(error.note, 'must be MessagePort')
})

test.serial('valid', t => {
  const channel = new MessageChannel()
  const port = channel.port1
  sinon.spy(port, 'addEventListener')
  sinon.spy(port, 'start')
  install(port)
  t.is(state.port, port)
  t.true(state.installed)
  t.true(port.addEventListener.calledTwice)
  const { firstCall } = port.addEventListener
  t.deepEqual(firstCall.args, [
    'messageerror', errored, { passive: true, once: true }
  ])
  const { secondCall } = port.addEventListener
  t.deepEqual(secondCall.args, ['message', receiver, { passive: true }])
  t.true(port.start.calledOnceWithExactly())
})

test.serial('double', t => {
  const channel = new MessageChannel()
  const port = channel.port1
  install(port)
  t.throws(() => { install(port) }, {
    instanceOf: StateError,
    code: 'DoubleInstall',
    message: 'Attempted to install poselet registry twice'
  })
})
