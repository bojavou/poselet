import test from 'ava'
import translate from '#lib/loader/analyze/import/source.mjs'
import { TextEncoder } from 'node:util'
import { ModuleType } from '#lib/loader/analyze/enum.mjs'
import { InvalidError } from '#lib/error.mjs'

const encoder = new TextEncoder()

test('type invalid', t => {
  const error = t.throws(() => { translate(8) }, {
    instanceOf: InvalidError,
    code: 'UnexpectedModuleType'
  })
  t.is(error.value, 8)
})

test('string invalid', t => {
  const error = t.throws(() => { translate(ModuleType.ECMAScript, 8) }, {
    instanceOf: InvalidError,
    code: 'InvalidModuleSource'
  })
  t.is(error.value, 8)
  t.is(error.note, 'must be string or binary')
})

test('string string', t => {
  const source = 'test source'
  const result = translate(ModuleType.ECMAScript, source)
  t.is(result, source)
})

test('string TypedArray', t => {
  const source = 'test source'
  const view = encoder.encode(source)
  const result = translate(ModuleType.ECMAScript, view)
  t.is(result, source)
})

test('string ArrayBuffer', t => {
  const source = 'test source'
  const view = encoder.encode(source)
  const { buffer } = view
  const result = translate(ModuleType.ECMAScript, buffer)
  t.is(result, source)
})

test('string SharedArrayBuffer', t => {
  const source = 'test source'
  const view = encoder.encode(source)
  const { buffer } = view
  const shared = new SharedArrayBuffer(buffer.byteLength)
  const sharedView = new Uint8Array(shared)
  for (const [index, value] of view.entries()) sharedView[index] = value
  const result = translate(ModuleType.ECMAScript, shared)
  t.is(result, source)
})

test('binary invalid', t => {
  const error = t.throws(() => { translate(ModuleType.WASM, 8) }, {
    instanceOf: InvalidError,
    code: 'InvalidModuleSource'
  })
  t.is(error.value, 8)
  t.is(error.note, 'must be binary')
})

test('binary TypedArray', t => {
  const source = new Uint8Array()
  const result = translate(ModuleType.WASM, source)
  t.is(result, source)
})

test('binary ArrayBuffer', t => {
  const source = new ArrayBuffer()
  const result = translate(ModuleType.WASM, source)
  t.is(result, source)
})

test('binary SharedArrayBuffer', t => {
  const source = new SharedArrayBuffer()
  const result = translate(ModuleType.WASM, source)
  t.is(result, source)
})

test('ignored', t => {
  const result = translate(ModuleType.CommonJS, 8)
  t.is(result, null)
})
