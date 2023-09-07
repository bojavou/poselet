import test from 'ava'
import type from '#lib/loader/analyze/type/require.mjs'
import { ModuleType } from '#lib/loader/analyze/enum.mjs'

test('empty', async t => {
  const modulePath = '/home/user/module'
  const result = await type(modulePath)
  t.is(result, ModuleType.CommonJS)
})

test('unspecified', async t => {
  const modulePath = '/home/user/module.alien'
  const result = await type(modulePath)
  t.is(result, ModuleType.CommonJS)
})

test('cjs', async t => {
  const modulePath = '/home/user/module.cjs'
  const result = await type(modulePath)
  t.is(result, ModuleType.CommonJS)
})

test('mjs', async t => {
  const modulePath = '/home/user/module.mjs'
  const result = await type(modulePath)
  t.is(result, ModuleType.ECMAScript)
})

test('json', async t => {
  const modulePath = '/home/user/module.json'
  const result = await type(modulePath)
  t.is(result, ModuleType.JSON)
})

test('node', async t => {
  const modulePath = '/home/user/addon.node'
  const result = await type(modulePath)
  t.is(result, ModuleType.Addon)
})
