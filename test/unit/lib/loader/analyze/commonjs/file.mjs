import test from 'ava'
import analyze from '#lib/loader/analyze/commonjs/file.mjs'
import ModuleFile from '#lib/loader/analyze/file.mjs'
import { ExportSource, ModuleType } from '#lib/loader/analyze/enum.mjs'

test('file', t => {
  const result = analyze('')
  t.true(result instanceof ModuleFile)
})

test('type', t => {
  const result = analyze('')
  t.is(result.type, ModuleType.CommonJS)
})

test('empty', t => {
  const result = analyze('')
  t.deepEqual(result.exports, new Map([
    ['default', { local: ExportSource.Default }]
  ]))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('named', t => {
  const code = `
module.exports.a = 1
module.exports.b = 2
module.exports.c = 3
`.trim()
  const result = analyze(code)
  t.deepEqual(result.exports, new Map([
    ['default', { local: ExportSource.Default }],
    ['a', { local: 'a' }],
    ['b', { local: 'b' }],
    ['c', { local: 'c' }]
  ]))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('wildcard', t => {
  const code = `
module.exports = require('./code.cjs')
`.trim()
  const result = analyze(code)
  t.deepEqual(result.exports, new Map([
    ['default', { local: ExportSource.Default }]
  ]))
  t.deepEqual(result.wildcards, new Set(['./code.cjs']))
  t.is(result.imports.size, 0)
})

test('named+wildcard', t => {
  const code = `
module.exports.a = 1
module.exports.b = 2
module.exports.c = 3
module.exports = require('./code.cjs')
`.trim()
  const result = analyze(code)
  t.deepEqual(result.exports, new Map([
    ['default', { local: ExportSource.Default }],
    ['a', { local: 'a' }],
    ['b', { local: 'b' }],
    ['c', { local: 'c' }]
  ]))
  t.deepEqual(result.wildcards, new Set(['./code.cjs']))
  t.is(result.imports.size, 0)
})
