import test from 'ava'
import queryOrdinal from '#lib/loader/query/ordinal.mjs'
import * as receiver from '#lib/loader/receiver/surface.mjs'
import state from '#lib/loader/state.mjs'
import { InvalidError } from '#lib/error.mjs'

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

test.serial('nonnumber', async t => {
  const { port2 } = t.context
  port2.addEventListener('message', event => {
    const { id } = event.data
    const response = { type: 'ordinal', id, ordinal: 'abc' }
    port2.postMessage(response)
  })
  const error = await t.throwsAsync(queryOrdinal('url'), {
    instanceOf: InvalidError,
    code: 'InvalidOrdinal'
  })
  t.is(error.value, 'abc')
  t.is(error.note, 'must be positive integer')
})

test.serial('noninteger', async t => {
  const { port2 } = t.context
  port2.addEventListener('message', event => {
    const { id } = event.data
    const response = { type: 'ordinal', id, ordinal: 1.8 }
    port2.postMessage(response)
  })
  const error = await t.throwsAsync(queryOrdinal('url'), {
    instanceOf: InvalidError,
    code: 'InvalidOrdinal'
  })
  t.is(error.value, 1.8)
  t.is(error.note, 'must be positive integer')
})

test.serial('negative', async t => {
  const { port2 } = t.context
  port2.addEventListener('message', event => {
    const { id } = event.data
    const response = { type: 'ordinal', id, ordinal: -1 }
    port2.postMessage(response)
  })
  const error = await t.throwsAsync(queryOrdinal('url'), {
    instanceOf: InvalidError,
    code: 'InvalidOrdinal'
  })
  t.is(error.value, -1)
  t.is(error.note, 'must be positive integer')
})

test.serial('0', async t => {
  const { port2 } = t.context
  port2.addEventListener('message', event => {
    const { id } = event.data
    const response = { type: 'ordinal', id, ordinal: 0 }
    port2.postMessage(response)
  })
  const error = await t.throwsAsync(queryOrdinal('url'), {
    instanceOf: InvalidError,
    code: 'InvalidOrdinal'
  })
  t.is(error.value, 0)
  t.is(error.note, 'must be positive integer')
})

test.serial('null', async t => {
  const { port2 } = t.context
  port2.addEventListener('message', event => {
    const { id } = event.data
    const response = { type: 'ordinal', id, ordinal: null }
    port2.postMessage(response)
  })
  const result = await queryOrdinal('url')
  t.is(result, null)
})

test.serial('1', async t => {
  const { port2 } = t.context
  port2.addEventListener('message', event => {
    const { id } = event.data
    const response = { type: 'ordinal', id, ordinal: 1 }
    port2.postMessage(response)
  })
  const result = await queryOrdinal('url')
  t.is(result, 1)
})

test.serial('3', async t => {
  const { port2 } = t.context
  port2.addEventListener('message', event => {
    const { id } = event.data
    const response = { type: 'ordinal', id, ordinal: 3 }
    port2.postMessage(response)
  })
  const result = await queryOrdinal('url')
  t.is(result, 3)
})
