import test from 'ava'
import sinon from 'sinon'
import resolve from '#lib/loader/resolve.mjs'
import * as receiver from '#lib/loader/receiver/surface.mjs'
import loaderState from '#lib/loader/state.mjs'
import registryState from '#lib/registry/state.mjs'
import { rinse } from '#lib/object.mjs'

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
  loaderState.port = channel.port1
  registryState.port = channel.port
  Object.assign(t.context, {
    port1: channel.port1,
    port2: channel.port2
  })
})

test.afterEach(() => {
  loaderState.port = null
  rinse(registryState)
})

test.serial('unposed', async t => {
  const { port2 } = t.context
  port2.addEventListener('message', event => {
    const { id } = event.data
    const response = { type: 'ordinal', id, ordinal: null }
    port2.postMessage(response)
  })
  const specifier = 'module'
  const resolved = { a: 1, b: 2, c: 3, url: 'file:///module' }
  const next = sinon.stub().resolves(resolved)
  const result = await resolve(specifier, {}, next)
  t.true(next.calledOnceWithExactly(specifier))
  t.deepEqual(result, { a: 1, b: 2, c: 3, url: 'file:///module?pose=' })
})

test.serial('1', async t => {
  const { port2 } = t.context
  port2.addEventListener('message', event => {
    const { id } = event.data
    const response = { type: 'ordinal', id, ordinal: 1 }
    port2.postMessage(response)
  })
  const specifier = 'module'
  const resolved = { a: 1, b: 2, c: 3, url: 'file:///module' }
  const next = sinon.stub().resolves(resolved)
  const result = await resolve(specifier, {}, next)
  t.true(next.calledOnceWithExactly(specifier))
  t.deepEqual(result, { a: 1, b: 2, c: 3, url: 'file:///module?pose=1' })
})

test.serial('3', async t => {
  const { port2 } = t.context
  port2.addEventListener('message', event => {
    const { id } = event.data
    const response = { type: 'ordinal', id, ordinal: 3 }
    port2.postMessage(response)
  })
  const specifier = 'module'
  const resolved = { a: 1, b: 2, c: 3, url: 'file:///module' }
  const next = sinon.stub().resolves(resolved)
  const result = await resolve(specifier, {}, next)
  t.true(next.calledOnceWithExactly(specifier))
  t.deepEqual(result, { a: 1, b: 2, c: 3, url: 'file:///module?pose=3' })
})
