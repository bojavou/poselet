import test from 'ava'
import query from '#lib/loader/query/base.mjs'
import events from 'node:events'
import * as receiver from '#lib/loader/receiver/surface.mjs'
import state from '#lib/loader/state.mjs'
import { InvalidError, TestError, TimeLimitError } from '#lib/error.mjs'

function removeAllListeners (host, type) {
  const listeners = events.getEventListeners(host, type)
  for (const listener of listeners) {
    host.removeEventListener(type, listener, { capture: false })
    host.removeEventListener(type, listener, { capture: true })
  }
}

function dismissTimeout (error) {
  if (error?.message === 'Registry never responded to loader request');
  else throw error
}

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

test.serial('expire', async t => {
  await t.throwsAsync(query({ type: 'test' }), {
    instanceOf: TimeLimitError,
    message: 'Registry never responded to loader request'
  })
})

test.serial('error', async t => {
  const { port1, port2 } = t.context
  removeAllListeners(port1, 'messageerror')
  port1.addEventListener('messageerror', event => {
    t.throws(() => { receiver.error(event) }, {
      instanceOf: InvalidError,
      message: 'Loader received an invalid message'
    })
  }, { once: true })
  const received = new Promise(resolve => {
    port1.addEventListener('messageerror', () => { resolve() }, { once: true })
  })
  port2.addEventListener('message', () => {
    const error = new TestError()
    const event = new MessageEvent('messageerror', { data: error })
    port1.dispatchEvent(event)
  })
  await Promise.all([
    received,
    query({ type: 'test' }).catch(dismissTimeout)
  ])
})

test.serial('event invalid', async t => {
  const { port1, port2 } = t.context
  removeAllListeners(port1, 'message')
  port1.addEventListener('message', event => {
    const error = t.throws(() => { receiver.message(event) }, {
      instanceOf: InvalidError,
      code: 'InvalidEventType'
    })
    t.is(error.value, event)
    t.is(error.note, 'must be MessageEvent')
  }, { once: true })
  const received = new Promise(resolve => {
    port1.addEventListener('message', () => { resolve() }, { once: true })
  })
  port2.addEventListener('message', () => {
    const event = new CustomEvent('message')
    port1.dispatchEvent(event)
  })
  await Promise.all([
    received,
    query({ type: 'test' }).catch(dismissTimeout)
  ])
})

test.serial('id invalid', async t => {
  const { port1, port2 } = t.context
  removeAllListeners(port1, 'message')
  let id
  port1.addEventListener('message', event => {
    const error = t.throws(() => { receiver.message(event) }, {
      instanceOf: InvalidError,
      code: 'UnrecognizedRequestID'
    })
    t.is(error.value, id)
  })
  const received = new Promise(resolve => {
    port1.addEventListener('message', () => { resolve() }, { once: true })
  })
  port2.addEventListener('message', event => {
    id = event.data.id + 1
    const response = { type: 'ordinal', id, ordinal: 1 }
    port2.postMessage(response)
  })
  await Promise.all([
    received,
    query({ type: 'test' }).catch(dismissTimeout)
  ])
})

test.serial('request', async t => {
  const { port2 } = t.context
  port2.addEventListener('message', event => {
    const request = event.data
    t.is(request.type, 'test')
    t.is(request.attribute, 'value')
    t.true(Number.isInteger(request.id))
    const response = { type: 'test', id: request.id, result: 'value' }
    port2.postMessage(response)
  })
  await query({ type: 'test', attribute: 'value' })
})

test.serial('concurrent', async t => {
  const { port2 } = t.context
  let value = 0
  port2.addEventListener('message', event => {
    const { id } = event.data
    const response = { type: 'test', id, value: ++value }
    port2.postMessage(response)
  })
  const [result1, result2, result3] = await Promise.all([
    query({ type: 'test' }),
    query({ type: 'test' }),
    query({ type: 'test' })
  ])
  t.is(result1.value, 1)
  t.is(result2.value, 2)
  t.is(result3.value, 3)
})
