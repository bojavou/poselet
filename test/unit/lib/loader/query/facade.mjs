import test from 'ava'
import queryFacade from '#lib/loader/query/facade.mjs'
import * as receiver from '#lib/loader/receiver/surface.mjs'
import state from '#lib/loader/state.mjs'
import { DuplicateError, InvalidError } from '#lib/error.mjs'

test.beforeEach(t => {
  const channel = new MessageChannel()
  channel.port1.addEventListener('messageerror', receiver.error, {
    passive: true,
    once: true
  })
  channel.port1.addEventListener('message', receiver.message, {
    passive: true
  })
  channel.port1.start()
  channel.port2.start()
  state.port = channel.port1
  Object.assign(t.context, {
    port1: channel.port1,
    port2: channel.port2
  })
})

test.afterEach(() => {
  state.port = null
})

test.serial('nonarray', async t => {
  const { port2 } = t.context
  port2.addEventListener('message', event => {
    const { id } = event.data
    const response = { type: 'facade', id, names: 8 }
    port2.postMessage(response)
  })
  const error = await t.throwsAsync(queryFacade('url', 1), {
    instanceOf: InvalidError,
    code: 'InvalidFacade'
  })
  t.is(error.value, 8)
  t.is(error.note, 'must be array')
})

test.serial('nonstring', async t => {
  const { port2 } = t.context
  port2.addEventListener('message', event => {
    const { id } = event.data
    const response = { type: 'facade', id, names: ['a', 'b', 8] }
    port2.postMessage(response)
  })
  const error = await t.throwsAsync(queryFacade('url', 1), {
    instanceOf: InvalidError,
    code: 'InvalidName'
  })
  t.is(error.value, 8)
  t.is(error.note, 'must be nonempty string')
})

test.serial('string empty', async t => {
  const { port2 } = t.context
  port2.addEventListener('message', event => {
    const { id } = event.data
    const response = { type: 'facade', id, names: ['a', 'b', ''] }
    port2.postMessage(response)
  })
  const error = await t.throwsAsync(queryFacade('url', 1), {
    instanceOf: InvalidError,
    code: 'InvalidName'
  })
  t.is(error.value, '')
  t.is(error.note, 'must be nonempty string')
})

test.serial('duplicate', async t => {
  const { port2 } = t.context
  port2.addEventListener('message', event => {
    const { id } = event.data
    const response = { type: 'facade', id, names: ['a', 'b', 'b'] }
    port2.postMessage(response)
  })
  await t.throwsAsync(queryFacade('url', 1), {
    instanceOf: DuplicateError,
    code: 'DuplicateName',
    message: 'Facade contained duplicate name'
  })
})

test.serial('valid', async t => {
  const { port2 } = t.context
  port2.addEventListener('message', event => {
    const { id } = event.data
    const response = {
      type: 'facade',
      id,
      names: ['a', 'b', 'c'],
      full: false
    }
    port2.postMessage(response)
  })
  const facade = await queryFacade('url', 1)
  t.deepEqual(facade, { names: new Set(['a', 'b', 'c']), full: false })
})
