import test from 'ava'
import caller from '#lib/caller.mjs'
import url from 'node:url'
import { wrap } from '#test/aid.mjs'

const wrapper = wrap(wrap(caller))

test('depth default', t => {
  const result = wrapper()
  t.true(result instanceof URL)
  const path = url.fileURLToPath(result)
  const suffix = path.split('/').slice(-5).join('/')
  t.is(suffix, 'poselet/test/unit/lib/caller.mjs')
})

test('depth 1', t => {
  const wrapper1 = wrap(wrapper)
  const result = wrapper1(1)
  t.true(result instanceof URL)
  const path = url.fileURLToPath(result)
  const suffix = path.split('/').slice(-5).join('/')
  t.is(suffix, 'poselet/test/unit/lib/caller.mjs')
})

test('depth 3', t => {
  const wrapper1 = wrap(wrapper)
  const wrapper2 = wrap(wrapper1)
  const wrapper3 = wrap(wrapper2)
  const result = wrapper3(3)
  t.true(result instanceof URL)
  const path = url.fileURLToPath(result)
  const suffix = path.split('/').slice(-5).join('/')
  t.is(suffix, 'poselet/test/unit/lib/caller.mjs')
})
