import test from 'ava'
import pathURL from '#lib/url.mjs'
import { InvalidError } from '#lib/error.mjs'

test('path', t => {
  const value = '/home/user/file.js'
  const result = pathURL(value)
  t.true(result instanceof URL)
  t.is(result.href, `file://${value}`)
})

test('url nonfile', t => {
  const value = 'http://site.test'
  const error = t.throws(() => { pathURL(value) }, {
    instanceOf: InvalidError,
    code: 'InvalidCallerURL'
  })
  t.is(error.value, value)
  t.is(error.note, 'must be file URL')
})

test('url file', t => {
  const value = 'file:///home/user/file.js'
  const result = pathURL(value)
  t.true(result instanceof URL)
  t.is(result.href, value)
})
