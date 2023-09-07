import test from 'ava'
import type from '#lib/loader/analyze/type/import.mjs'
import { ModuleType } from '#lib/loader/analyze/enum.mjs'
import { InvalidError } from '#lib/error.mjs'

test('empty', async t => {
  const fileURL = 'file:///module?param=value#fragment'
  const error = await t.throwsAsync(type(fileURL), {
    instanceOf: InvalidError,
    code: 'InvalidExtension'
  })
  t.is(error.value, '')
})

test('invalid', async t => {
  const fileURL = 'file:///module.alien?param=value#fragment'
  const error = await t.throwsAsync(type(fileURL), {
    instanceOf: InvalidError,
    code: 'InvalidExtension'
  })
  t.is(error.value, '.alien')
})

test('mjs', async t => {
  const fileURL = 'file:///module.mjs?param=value#fragment'
  const result = await type(fileURL)
  t.is(result, ModuleType.ECMAScript)
})

test('cjs', async t => {
  const fileURL = 'file:///module.cjs?param=value#fragment'
  const result = await type(fileURL)
  t.is(result, ModuleType.CommonJS)
})

test('json', async t => {
  const fileURL = 'file:///module.json?param=value#fragment'
  const result = await type(fileURL)
  t.is(result, ModuleType.JSON)
})

test('wasm', async t => {
  const fileURL = 'file:///module.wasm?param=value#fragment'
  const result = await type(fileURL)
  t.is(result, ModuleType.WASM)
})
