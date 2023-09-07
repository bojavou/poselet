import test from 'ava'
import clerk from '#lib/registry/clerk.mjs'
import state from '#lib/registry/state.mjs'
import { PoseState } from '#lib/registry/enum.mjs'
import { InvalidError } from '#lib/error.mjs'

test.serial('url invalid', t => {
  const request = { type: 'ordinal', id: 1, url: 8 }
  const error = t.throws(() => { clerk(request) }, {
    instanceOf: InvalidError,
    code: 'InvalidModuleURL'
  })
  t.is(error.value, 8)
  t.is(error.note, 'must be URL string')
})

test.serial('response type', async t => {
  const url = 'file:///module'
  state.modules.delete(url)
  const channel = new MessageChannel()
  const promise = new Promise(resolve => {
    channel.port1.addEventListener('message', event => {
      resolve(event.data)
    }, { once: true })
  })
  channel.port1.start()
  state.port = channel.port2
  clerk({ type: 'ordinal', id: 1, url })
  const response = await promise
  t.is(response.type, 'ordinal')
})

test.serial('response id 1', async t => {
  const url = 'file:///module'
  state.modules.delete(url)
  const channel = new MessageChannel()
  const promise = new Promise(resolve => {
    channel.port1.addEventListener('message', event => {
      resolve(event.data)
    }, { once: true })
  })
  channel.port1.start()
  state.port = channel.port2
  clerk({ type: 'ordinal', id: 1, url })
  const response = await promise
  t.is(response.id, 1)
})

test.serial('response id 3 unposed', async t => {
  const url = 'file:///module'
  state.modules.delete(url)
  const channel = new MessageChannel()
  const promise = new Promise(resolve => {
    channel.port1.addEventListener('message', event => {
      resolve(event.data)
    }, { once: true })
  })
  channel.port1.start()
  state.port = channel.port2
  clerk({ type: 'ordinal', id: 3, url })
  const response = await promise
  t.is(response.id, 3)
})

test.serial('response id 3 posed', async t => {
  const url = 'file:///module'
  const pose = { state: PoseState.Unloaded, facade: {} }
  const poses = new Map([[1, pose]])
  state.modules.set(url, { current: 1, poses })
  const channel = new MessageChannel()
  const promise = new Promise(resolve => {
    channel.port1.addEventListener('message', event => {
      resolve(event.data)
    }, { once: true })
  })
  channel.port1.start()
  state.port = channel.port2
  clerk({ type: 'ordinal', id: 3, url })
  const response = await promise
  t.is(response.id, 3)
})

test.serial('unposed', async t => {
  const url = 'file:///module'
  state.modules.delete(url)
  const channel = new MessageChannel()
  const promise = new Promise(resolve => {
    channel.port1.addEventListener('message', event => {
      resolve(event.data)
    }, { once: true })
  })
  channel.port1.start()
  state.port = channel.port2
  clerk({ type: 'ordinal', id: 9, url })
  const response = await promise
  t.deepEqual(response, { type: 'ordinal', id: 9, ordinal: null })
})

test.serial('1', async t => {
  const url = 'file:///module'
  const pose = { state: PoseState.Unloaded, facade: {} }
  const poses = new Map([[1, pose]])
  state.modules.set(url, { current: 1, poses })
  const channel = new MessageChannel()
  const promise = new Promise(resolve => {
    channel.port1.addEventListener('message', event => {
      resolve(event.data)
    }, { once: true })
  })
  channel.port1.start()
  state.port = channel.port2
  clerk({ type: 'ordinal', id: 9, url })
  const response = await promise
  t.deepEqual(response, { type: 'ordinal', id: 9, ordinal: 1 })
  t.is(pose.state, PoseState.Loading)
})

test.serial('3', async t => {
  const url = 'file:///module'
  const pose = { state: PoseState.Unloaded, facade: {} }
  const poses = new Map([[3, pose]])
  state.modules.set(url, { current: 3, poses })
  const channel = new MessageChannel()
  const promise = new Promise(resolve => {
    channel.port1.addEventListener('message', event => {
      resolve(event.data)
    }, { once: true })
  })
  channel.port1.start()
  state.port = channel.port2
  clerk({ type: 'ordinal', id: 9, url })
  const response = await promise
  t.deepEqual(response, { type: 'ordinal', id: 9, ordinal: 3 })
  t.is(pose.state, PoseState.Loading)
})
