import test from 'ava'
import analyze from '#lib/loader/analyze/ecmascript/file.mjs'
import ModuleFile from '#lib/loader/analyze/file.mjs'
import {
  ExportSource, ImportSource, ModuleType
} from '#lib/loader/analyze/enum.mjs'

test('file', t => {
  const result = analyze('')
  t.true(result instanceof ModuleFile)
})

test('type', t => {
  const result = analyze('')
  t.is(result.type, ModuleType.ECMAScript)
})

test('empty', t => {
  const result = analyze('')
  t.is(result.imports.size, 0)
  t.is(result.exports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('import default', t => {
  const code = `
import a from './source1.mjs'
import b from './source2.mjs'
import c from './source2.mjs'
`.trim()
  const result = analyze(code)
  t.deepEqual(result.imports, new Map([
    ['./source1.mjs', new Map([['a', 'default']])],
    ['./source2.mjs', new Map([['b', 'default'], ['c', 'default']])]
  ]))
  t.is(result.exports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('import default assert', t => {
  const code = `
import a from './source.json' assert { type: 'json' }
`.trim()
  const result = analyze(code)
  t.deepEqual(result.imports, new Map([
    ['./source.json', new Map([['a', 'default']])]
  ]))
  t.is(result.exports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('import namespace', t => {
  const code = `
import * as a from './source1.mjs'
import * as b from './source2.mjs'
import * as c from './source2.mjs'
`.trim()
  const result = analyze(code)
  t.deepEqual(result.imports, new Map([
    ['./source1.mjs', new Map([['a', ImportSource.Namespace]])],
    ['./source2.mjs', new Map([
      ['b', ImportSource.Namespace],
      ['c', ImportSource.Namespace]
    ])]
  ]))
  t.is(result.exports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('import namespace assert', t => {
  const code = `
import * as a from './source.json' assert { type: 'json' }
`.trim()
  const result = analyze(code)
  t.deepEqual(result.imports, new Map([
    ['./source.json', new Map([['a', ImportSource.Namespace]])]
  ]))
  t.is(result.exports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('import named', t => {
  const code = `
import { a } from './source1.mjs'
import { b } from './source2.mjs'
import { c, d } from './source2.mjs'
`.trim()
  const result = analyze(code)
  t.deepEqual(result.imports, new Map([
    ['./source1.mjs', new Map([['a', 'a']])],
    ['./source2.mjs', new Map([['b', 'b'], ['c', 'c'], ['d', 'd']])]
  ]))
  t.is(result.exports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('import named assert', t => {
  const code = `
import { a } from './source.json' assert { type: 'json' }
`.trim()
  const result = analyze(code)
  t.deepEqual(result.imports, new Map([
    ['./source.json', new Map([['a', 'a']])]
  ]))
  t.is(result.exports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('import named rename', t => {
  const code = `
import { a as b } from './source.mjs'
`.trim()
  const result = analyze(code)
  t.deepEqual(result.imports, new Map([
    ['./source.mjs', new Map([['b', 'a']])]
  ]))
  t.is(result.exports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('import named string', t => {
  const code = `
import { 'string name' as b } from './source.mjs'
`.trim()
  const result = analyze(code)
  t.deepEqual(result.imports, new Map([
    ['./source.mjs', new Map([['b', 'string name']])]
  ]))
  t.is(result.exports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('export default function named', t => {
  const code = `
export default function gadget () {}
`.trim()
  const result = analyze(code)
  t.deepEqual(result.exports, new Map([
    ['default', { local: 'gadget' }]
  ]))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('export default function anon', t => {
  const code = `
export default function () {}
`.trim()
  const result = analyze(code)
  t.deepEqual(result.exports, new Map([
    ['default', { local: ExportSource.Default }]
  ]))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('export default class named', t => {
  const code = `
export default class Gadget {}
`.trim()
  const result = analyze(code)
  t.deepEqual(result.exports, new Map([
    ['default', { local: 'Gadget' }]
  ]))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('export default class anon', t => {
  const code = `
export default class {}
`.trim()
  const result = analyze(code)
  t.deepEqual(result.exports, new Map([
    ['default', { local: ExportSource.Default }]
  ]))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('export default expression', t => {
  const code = `
export default null
`.trim()
  const result = analyze(code)
  t.deepEqual(result.exports, new Map([
    ['default', { local: ExportSource.Default }]
  ]))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('export default rename', t => {
  const code = `
const value = null
export { value as default }
`.trim()
  const result = analyze(code)
  t.deepEqual(result.exports, new Map([
    ['default', { local: 'value' }]
  ]))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('export var', t => {
  const code = `
export var a = 1
export var b, c = 3
`.trim()
  const result = analyze(code)
  t.deepEqual(result.exports, new Map([
    ['a', { local: 'a' }],
    ['b', { local: 'b' }],
    ['c', { local: 'c' }]
  ]))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('export let', t => {
  const code = `
export let a = 1
export let b, c = 3
`.trim()
  const result = analyze(code)
  t.deepEqual(result.exports, new Map([
    ['a', { local: 'a' }],
    ['b', { local: 'b' }],
    ['c', { local: 'c' }]
  ]))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('export const', t => {
  const code = `
export const a = 1
export const b = 2, c = 3
`.trim()
  const result = analyze(code)
  t.deepEqual(result.exports, new Map([
    ['a', { local: 'a' }],
    ['b', { local: 'b' }],
    ['c', { local: 'c' }]
  ]))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('export destructure array', t => {
  const code = `
export const [a, b, ...c] = []
export const [,,, d] = []
`.trim()
  const result = analyze(code)
  t.deepEqual(result.exports, new Map([
    ['a', { local: 'a' }],
    ['b', { local: 'b' }],
    ['c', { local: 'c' }],
    ['d', { local: 'd' }]
  ]))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('export destructure array default', t => {
  const code = `
export const [a = 1, b = 2, c = (3)] = []
`.trim()
  const result = analyze(code)
  t.deepEqual(result.exports, new Map([
    ['a', { local: 'a' }],
    ['b', { local: 'b' }],
    ['c', { local: 'c' }]
  ]))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('export destructure object', t => {
  const code = `
export const { a, b, ...c } = {}
`.trim()
  const result = analyze(code)
  t.deepEqual(result.exports, new Map([
    ['a', { local: 'a' }],
    ['b', { local: 'b' }],
    ['c', { local: 'c' }]
  ]))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('export destructure object rename', t => {
  const code = `
export const { a: b, c: d, e: f } = {}
`.trim()
  const result = analyze(code)
  t.deepEqual(result.exports, new Map([
    ['b', { local: 'b' }],
    ['d', { local: 'd' }],
    ['f', { local: 'f' }]
  ]))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('export destructure object default', t => {
  const code = `
export const { a = 1, b: c = 2, d = 3 } = {}
`.trim()
  const result = analyze(code)
  t.deepEqual(result.exports, new Map([
    ['a', { local: 'a' }],
    ['c', { local: 'c' }],
    ['d', { local: 'd' }]
  ]))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('export destructure complex', t => {
  const code = `
export const [{ a: [{ b: [...[...[...[,,, { c: value }]]]] }] }] = []
`.trim()
  const result = analyze(code)
  t.deepEqual(result.exports, new Map([
    ['value', { local: 'value' }]
  ]))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('export declare function', t => {
  const code = `
export function a () {}
export function b () {}
export function c () {}
`.trim()
  const result = analyze(code)
  t.deepEqual(result.exports, new Map([
    ['a', { local: 'a' }],
    ['b', { local: 'b' }],
    ['c', { local: 'c' }]
  ]))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('export declare class', t => {
  const code = `
export class A {}
export class B {}
export class C {}
`.trim()
  const result = analyze(code)
  t.deepEqual(result.exports, new Map([
    ['A', { local: 'A' }],
    ['B', { local: 'B' }],
    ['C', { local: 'C' }]
  ]))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('export named', t => {
  const code = `
const a = 1, b = 2, c = 3
export { a, b, c }
`.trim()
  const result = analyze(code)
  t.deepEqual(result.exports, new Map([
    ['a', { local: 'a' }],
    ['b', { local: 'b' }],
    ['c', { local: 'c' }]
  ]))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('export named rename', t => {
  const code = `
const a = 1
export { a as b }
`.trim()
  const result = analyze(code)
  t.deepEqual(result.exports, new Map([
    ['b', { local: 'a' }]
  ]))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('export named string', t => {
  const code = `
const a = 1
export { a as 'string name' }
`.trim()
  const result = analyze(code)
  t.deepEqual(result.exports, new Map([
    ['string name', { local: 'a' }]
  ]))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('export namespace', t => {
  const code = `
export * as a from './source1.mjs'
export * as b from './source2.mjs'
export * as c from './source2.mjs'
`.trim()
  const result = analyze(code)
  t.deepEqual(result.exports, new Map([
    ['a', { module: './source1.mjs', imported: ImportSource.Namespace }],
    ['b', { module: './source2.mjs', imported: ImportSource.Namespace }],
    ['c', { module: './source2.mjs', imported: ImportSource.Namespace }]
  ]))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('export namespace string', t => {
  const code = `
export * as 'string name' from './source.mjs'
`.trim()
  const result = analyze(code)
  t.deepEqual(result.exports, new Map([
    ['string name', {
      module: './source.mjs',
      imported: ImportSource.Namespace
    }]
  ]))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('export wildcard', t => {
  const code = `
export * from './source1.mjs'
export * from './source2.mjs'
export * from './source2.mjs'
`.trim()
  const result = analyze(code)
  t.deepEqual(result.wildcards, new Set(['./source1.mjs', './source2.mjs']))
  t.is(result.imports.size, 0)
  t.is(result.exports.size, 0)
})

test('reexport named', t => {
  const code = `
export { a } from './source1.mjs'
export { b, c } from './source2.mjs'
`.trim()
  const result = analyze(code)
  t.deepEqual(result.exports, new Map([
    ['a', { module: './source1.mjs', imported: 'a' }],
    ['b', { module: './source2.mjs', imported: 'b' }],
    ['c', { module: './source2.mjs', imported: 'c' }]
  ]))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('reexport named assert', t => {
  const code = `
export { a } from './source.json' assert { type: 'json' }
`.trim()
  const result = analyze(code)
  t.deepEqual(result.exports, new Map([
    ['a', { module: './source.json', imported: 'a' }]
  ]))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('reexport named string', t => {
  const code = `
export { 'string name' } from './source.mjs'
`.trim()
  const result = analyze(code)
  t.deepEqual(result.exports, new Map([
    ['string name', { module: './source.mjs', imported: 'string name' }]
  ]))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('reexport named rename', t => {
  const code = `
export { a as b } from './source.mjs'
`.trim()
  const result = analyze(code)
  t.deepEqual(result.exports, new Map([
    ['b', { module: './source.mjs', imported: 'a' }]
  ]))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('reexport named rename id string', t => {
  const code = `
export { a as 'string name' } from './source.mjs'
`.trim()
  const result = analyze(code)
  t.deepEqual(result.exports, new Map([
    ['string name', { module: './source.mjs', imported: 'a' }]
  ]))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('reexport named rename string id', t => {
  const code = `
export { 'string name' as a } from './source.mjs'
`.trim()
  const result = analyze(code)
  t.deepEqual(result.exports, new Map([
    ['a', { module: './source.mjs', imported: 'string name' }]
  ]))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('reexport named rename string string', t => {
  const code = `
export { 'string name 1' as 'string name 2' } from './source.mjs'
`.trim()
  const result = analyze(code)
  t.deepEqual(result.exports, new Map([
    ['string name 2', { module: './source.mjs', imported: 'string name 1' }]
  ]))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('reexport default', t => {
  const code = `
export { default } from './source.mjs'
`.trim()
  const result = analyze(code)
  t.deepEqual(result.exports, new Map([
    ['default', { module: './source.mjs', imported: 'default' }]
  ]))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('reexport default assert', t => {
  const code = `
export { default } from './source.json' assert { type: 'json' }
`.trim()
  const result = analyze(code)
  t.deepEqual(result.exports, new Map([
    ['default', { module: './source.json', imported: 'default' }]
  ]))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('reexport default rename', t => {
  const code = `
export { default as a } from './source1.mjs'
export { default as b } from './source2.mjs'
export { default as c } from './source2.mjs'
`.trim()
  const result = analyze(code)
  t.deepEqual(result.exports, new Map([
    ['a', { module: './source1.mjs', imported: 'default' }],
    ['b', { module: './source2.mjs', imported: 'default' }],
    ['c', { module: './source2.mjs', imported: 'default' }]
  ]))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('reexport default rename string', t => {
  const code = `
export { default as 'string name' } from './source.mjs'
`.trim()
  const result = analyze(code)
  t.deepEqual(result.exports, new Map([
    ['string name', { module: './source.mjs', imported: 'default' }]
  ]))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test('dynamic import assert', t => {
  const code = `
import('./source.json', { assert: { type: 'json' } })
`.trim()
  t.notThrows(() => { analyze(code) })
})
