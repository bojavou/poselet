import test from 'ava'
import clerk from '#lib/registry/clerk.mjs'
import state from '#lib/registry/state.mjs'
import { PoseState } from '#lib/registry/enum.mjs'
import { InvalidError, MissingError } from '#lib/error.mjs'

test.beforeEach(() => {
  state.port = null
  state.modules.clear()
})

test.serial('url invalid', t => {
  const request = { type: 'facade', id: 1, url: 8, ordinal: 1 }
  const error = t.throws(() => { clerk(request) }, {
    instanceOf: InvalidError,
    code: 'InvalidModuleURL'
  })
  t.is(error.value, 8)
  t.is(error.note, 'must be URL string')
})

test.serial('ordinal invalid empty', t => {
  const url = 'file:///module'
  const request = { type: 'facade', id: 1, url, ordinal: -1 }
  const error = t.throws(() => { clerk(request) }, {
    instanceOf: InvalidError,
    code: 'InvalidOrdinal'
  })
  t.is(error.value, -1)
  t.is(error.note, 'must be positive integer')
})

test.serial('module missing', t => {
  const url = 'file:///module'
  const request = { type: 'facade', id: 1, url, ordinal: 1 }
  const error = t.throws(() => { clerk(request) }, {
    instanceOf: MissingError,
    code: 'MissingModule'
  })
  t.is(error.value, url)
})

test.serial('ordinal missing absent', t => {
  const url = 'file:///module'
  const poses = new Map().set(1, {})
  state.modules.set(url, { poses })
  const request = { type: 'facade', id: 1, url, ordinal: 2 }
  const error = t.throws(() => { clerk(request) }, {
    instanceOf: MissingError,
    code: 'MissingOrdinal'
  })
  t.is(error.label, url)
  t.is(error.value, 2)
})

test.serial('success', async t => {
  const channel = new MessageChannel()
  const responded = new Promise(resolve => {
    channel.port1.addEventListener('message', event => {
      resolve(event.data)
    }, { once: true })
  })
  channel.port1.start()
  state.port = channel.port2
  const url = 'file:///module'
  const facade = { a: 1, b: 2, c: 3 }
  const pose = { state: PoseState.Loading, facade, full: false }
  const poses = new Map().set(1, pose)
  state.modules.set(url, { poses })
  const request = { type: 'facade', id: 1, url, ordinal: 1 }
  clerk(request)
  const response = await responded
  t.deepEqual(response, {
    type: 'facade',
    id: 1,
    names: ['a', 'b', 'c'],
    full: false
  })
})
