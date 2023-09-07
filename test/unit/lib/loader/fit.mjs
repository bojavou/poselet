import test from 'ava'
import fit from '#lib/loader/fit.mjs'
import { InvalidError } from '#lib/error.mjs'

test('ambiguous default', t => {
  const shape = { bound: new Set(), ambiguous: new Set(['default']) }
  const facade = { names: new Set(['default']), full: false }
  const error = t.throws(() => { fit(shape, facade) }, {
    instanceOf: InvalidError,
    code: 'AmbiguousPose'
  })
  t.is(error.label, 'default')
  t.is(error.note, 'ambiguous exports may not be posed')
})

test('ambiguous named', t => {
  const shape = { bound: new Set(), ambiguous: new Set(['gadget']) }
  const facade = { names: new Set(['gadget']), full: false }
  const error = t.throws(() => { fit(shape, facade) }, {
    instanceOf: InvalidError,
    code: 'AmbiguousPose'
  })
  t.is(error.label, 'gadget')
  t.is(error.note, 'ambiguous exports may not be posed')
})

test('phantom default', t => {
  const shape = { bound: new Set(), ambiguous: new Set() }
  const facade = { names: new Set(['default']), full: false }
  const error = t.throws(() => { fit(shape, facade) }, {
    instanceOf: InvalidError,
    code: 'PhantomPose'
  })
  t.is(error.label, 'default')
  t.is(error.note, 'undefined exports may not be posed')
})

test('phantom named', t => {
  const shape = { bound: new Set(), ambiguous: new Set() }
  const facade = { names: new Set(['gadget']), full: false }
  const error = t.throws(() => { fit(shape, facade) }, {
    instanceOf: InvalidError,
    code: 'PhantomPose'
  })
  t.is(error.label, 'gadget')
  t.is(error.note, 'undefined exports may not be posed')
})

test('success', t => {
  const shape = {
    bound: new Set(['default', 'a', 'b', 'c']),
    ambiguous: new Set(['d', 'e', 'f'])
  }
  const facade = { names: new Set(['default', 'b', 'c']), full: false }
  t.notThrows(() => { fit(shape, facade) })
})
