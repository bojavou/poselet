import test from 'ava'
import clerk from '#lib/registry/clerk.mjs'
import { InvalidError } from '#lib/error.mjs'

test.serial('message invalid', t => {
  const error = t.throws(() => { clerk(8) }, {
    instanceOf: InvalidError,
    code: 'InvalidMessage'
  })
  t.is(error.value, 8)
  t.is(error.note, 'must be object')
})

test.serial('id invalid', t => {
  const request = { type: 'ordinal', id: null, url: 'file:///module' }
  const error = t.throws(() => { clerk(request) }, {
    instanceOf: InvalidError,
    code: 'InvalidMessageID'
  })
  t.is(error.value, null)
  t.is(error.note, 'must be positive integer')
})

test.serial('type invalid', t => {
  const request = { type: 'explode', id: 1, url: 'file:///module' }
  const error = t.throws(() => { clerk(request) }, {
    instanceOf: InvalidError,
    code: 'UnrecognizedMessageType'
  })
  t.is(error.value, 'explode')
})
