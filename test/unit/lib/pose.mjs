import test from 'ava'
import pose from '#lib/pose.mjs'
import { InvalidError } from '#lib/error.mjs'

test.serial('exports invalid', t => {
  const error = t.throws(() => { pose('test', 8) }, {
    instanceOf: InvalidError,
    code: 'InvalidExports'
  })
  t.is(error.value, 8)
  t.is(error.note, 'must be object')
})
