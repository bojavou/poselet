import test from 'ava'
import sinon from 'sinon'
import '#lib/loader/analyze/import/graph.mjs' // Load normal entrypoint
import analyze from '#lib/loader/analyze/ecmascript/graph.mjs'
import gear from '#lib/loader/gear.mjs'
import state from '#lib/loader/state.mjs'
import Module from '#lib/loader/analyze/module.mjs'
import fs from 'node:fs/promises'
import path from 'node:path'
import url from 'node:url'
import { resolve as importMetaResolve } from 'import-meta-resolve'
import { ModuleType } from '#lib/loader/analyze/enum.mjs'

const root = path.normalize('/test')

gear.resolve = sinon.stub()
gear.load = sinon.stub()

test.afterEach(() => {
  gear.resolve.reset()
  gear.load.reset()
  state.modules = new Map()
})

test.serial('simple', async t => {
  const modulePath = path.join(root, 'test.mjs')
  const fileURL = url.pathToFileURL(modulePath).href
  const code = `
export const a = 1
export const b = 2
export const c = 3
`.trim()
  const result = await analyze(fileURL, code)
  t.true(result instanceof Module)
  t.is(result.type, ModuleType.ECMAScript)
  t.deepEqual(new Set(result.bindings.keys()), new Set(['a', 'b', 'c']))
  t.deepEqual(new Set(result.exports.keys()), new Set(['a', 'b', 'c']))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
  t.is(state.modules.size, 1)
  t.is(state.modules.get(fileURL), result)
})

test.serial('wildcard ecmascript', async t => {
  const modulePath1 = path.join(root, 'test1.mjs')
  const fileURL1 = url.pathToFileURL(modulePath1).href
  const code1 = `
export * from './test2.mjs'
`.trim()
  const modulePath2 = path.join(root, 'test2.mjs')
  const fileURL2 = url.pathToFileURL(modulePath2).href
  const code2 = `
export const a = 1
export const b = 2
export const c = 3
`.trim()
  gear.resolve.withArgs('./test2.mjs').returns(fileURL2)
  gear.load.withArgs(fileURL2).resolves({ format: 'module', source: code2 })
  const result = await analyze(fileURL1, code1)
  t.true(result instanceof Module)
  t.is(result.type, ModuleType.ECMAScript)
  t.is(result.wildcards.size, 1)
  const source = [...result.wildcards][0].request.module
  t.is(source.type, ModuleType.ECMAScript)
  t.deepEqual(new Set(source.exports.keys()), new Set(['a', 'b', 'c']))
  t.is(state.modules.size, 2)
  t.is(state.modules.get(fileURL1), result)
  t.is(state.modules.get(fileURL2), source)
})

test.serial('wildcard json', async t => {
  const modulePath1 = path.join(root, 'test1.mjs')
  const fileURL1 = url.pathToFileURL(modulePath1).href
  const code1 = `
export * from './test2.json' assert { type: 'json' }
`.trim()
  const modulePath2 = path.join(root, 'test2.json')
  const fileURL2 = url.pathToFileURL(modulePath2).href
  gear.resolve.withArgs('./test2.json').returns(fileURL2)
  gear.load.withArgs(fileURL2).resolves({ format: 'json', source: '' })
  const result = await analyze(fileURL1, code1)
  t.true(result instanceof Module)
  t.is(result.type, ModuleType.ECMAScript)
  t.is(result.wildcards.size, 1)
  const source = [...result.wildcards][0].request.module
  t.is(source.type, ModuleType.JSON)
  t.deepEqual(new Set(source.exports.keys()), new Set(['default']))
  t.is(state.modules.size, 2)
  t.is(state.modules.get(fileURL1), result)
  t.is(state.modules.get(modulePath2), source)
})

test.serial('wildcard wasm', async t => {
  const modulePath1 = path.join(root, 'test1.mjs')
  const fileURL1 = url.pathToFileURL(modulePath1).href
  const code1 = `
export * from './test2.wasm'
`.trim()
  const modulePath2 = path.join(root, 'test2.wasm')
  const fileURL2 = url.pathToFileURL(modulePath2).href
  gear.resolve.withArgs('./test2.wasm').returns(fileURL2)
  const adderURL = importMetaResolve('#test/fix/adder.wasm', import.meta.url)
  const adderPath = url.fileURLToPath(adderURL)
  const code = await fs.readFile(adderPath)
  gear.load.withArgs(fileURL2).resolves({ format: 'wasm', source: code })
  const result = await analyze(fileURL1, code1)
  t.true(result instanceof Module)
  t.is(result.type, ModuleType.ECMAScript)
  t.is(result.wildcards.size, 1)
  const source = [...result.wildcards][0].request.module
  t.is(source.type, ModuleType.WASM)
  t.deepEqual(new Set(source.exports.keys()), new Set(['add']))
  t.is(state.modules.size, 2)
  t.is(state.modules.get(fileURL1), result)
  t.is(state.modules.get(fileURL2), source)
})

test.serial('wildcard alias ecmascript', async t => {
  const modulePath1 = path.join(root, 'test1.mjs')
  const fileURL1 = url.pathToFileURL(modulePath1).href
  const code1 = `
export * from './test2.mjs'
export * from './test/../test2.mjs'
`.trim()
  const modulePath2 = path.join(root, 'test2.mjs')
  const fileURL2 = url.pathToFileURL(modulePath2).href
  const code2 = `
export const a = 1
export const b = 2
export const c = 3
`.trim()
  gear.resolve.withArgs('./test2.mjs').returns(fileURL2)
  gear.resolve.withArgs('./test/../test2.mjs').returns(fileURL2)
  gear.load.withArgs(fileURL2).resolves({ format: 'module', source: code2 })
  const result = await analyze(fileURL1, code1)
  t.true(result instanceof Module)
  t.is(result.type, ModuleType.ECMAScript)
  t.is(result.wildcards.size, 1)
  const source = [...result.wildcards][0].request.module
  t.is(source.type, ModuleType.ECMAScript)
  t.deepEqual(new Set(source.exports.keys()), new Set(['a', 'b', 'c']))
  t.is(state.modules.size, 2)
  t.is(state.modules.get(fileURL1), result)
  t.is(state.modules.get(fileURL2), source)
})

test.serial('wildcard semialias ecmascript param', async t => {
  const modulePath1 = path.join(root, 'test1.mjs')
  const fileURL1 = url.pathToFileURL(modulePath1).href
  const code1 = `
export * from './test2.mjs'
export * from './test2.mjs?param=value'
`.trim()
  const modulePath2 = path.join(root, 'test2.mjs')
  const fileURL2 = url.pathToFileURL(modulePath2).href
  const code2 = `
export const a = 1
export const b = 2
export const c = 3
`.trim()
  const semialiasURL = url.pathToFileURL(modulePath2)
  semialiasURL.searchParams.set('param', 'value')
  gear.resolve.withArgs('./test2.mjs').returns(fileURL2)
  gear.resolve.withArgs('./test2.mjs?param=value').returns(semialiasURL.href)
  const loaded = { format: 'module', source: code2 }
  gear.load.withArgs(fileURL2).resolves(loaded)
  gear.load.withArgs(semialiasURL.href).resolves(loaded)
  const result = await analyze(fileURL1, code1)
  t.true(result instanceof Module)
  t.is(result.type, ModuleType.ECMAScript)
  t.is(state.modules.size, 3)
  t.is(state.modules.get(fileURL1), result)
  const source1 = state.modules.get(fileURL2)
  t.is(source1.type, ModuleType.ECMAScript)
  t.deepEqual(new Set(source1.exports.keys()), new Set(['a', 'b', 'c']))
  const source2 = state.modules.get(semialiasURL.href)
  t.is(source2.type, ModuleType.ECMAScript)
  t.deepEqual(new Set(source2.exports.keys()), new Set(['a', 'b', 'c']))
  t.deepEqual(
    new Set([...result.wildcards].map(offer => offer.request.module)),
    new Set([source1, source2])
  )
})

test.serial('wildcard semialias ecmascript fragment', async t => {
  const modulePath1 = path.join(root, 'test1.mjs')
  const fileURL1 = url.pathToFileURL(modulePath1).href
  const code1 = `
export * from './test2.mjs'
export * from './test2.mjs#fragment'
`.trim()
  const modulePath2 = path.join(root, 'test2.mjs')
  const fileURL2 = url.pathToFileURL(modulePath2).href
  const code2 = `
export const a = 1
export const b = 2
export const c = 3
`.trim()
  const semialiasURL = url.pathToFileURL(modulePath2)
  semialiasURL.hash = 'fragment'
  gear.resolve.withArgs('./test2.mjs').returns(fileURL2)
  gear.resolve.withArgs('./test2.mjs#fragment').returns(semialiasURL.href)
  const loaded = { format: 'module', source: code2 }
  gear.load.withArgs(fileURL2).resolves(loaded)
  gear.load.withArgs(semialiasURL.href).resolves(loaded)
  const result = await analyze(fileURL1, code1)
  t.true(result instanceof Module)
  t.is(result.type, ModuleType.ECMAScript)
  t.is(state.modules.size, 3)
  t.is(state.modules.get(fileURL1), result)
  const source1 = state.modules.get(fileURL2)
  t.is(source1.type, ModuleType.ECMAScript)
  t.deepEqual(new Set(source1.exports.keys()), new Set(['a', 'b', 'c']))
  const source2 = state.modules.get(semialiasURL.href)
  t.is(source2.type, ModuleType.ECMAScript)
  t.deepEqual(new Set(source2.exports.keys()), new Set(['a', 'b', 'c']))
  t.deepEqual(
    new Set([...result.wildcards].map(offer => offer.request.module)),
    new Set([source1, source2])
  )
})

test.serial('cached indirect', async t => {
  const modulePath1 = path.join(root, 'test1.mjs')
  const fileURL1 = url.pathToFileURL(modulePath1).href
  const code1 = `
export * from './test2.mjs'
`.trim()
  const modulePath2 = path.join(root, 'test2.mjs')
  const fileURL2 = url.pathToFileURL(modulePath2).href
  gear.resolve.withArgs('./test2.mjs').returns(fileURL2)
  const source = new Module()
  state.modules.set(fileURL2, source)
  sinon.spy(state.modules, 'set')
  const result = await analyze(fileURL1, code1)
  t.true(result instanceof Module)
  t.is(result.type, ModuleType.ECMAScript)
  t.is(result.wildcards.size, 1)
  t.is([...result.wildcards][0].request.module, source)
  t.true(state.modules.set.calledOnceWithExactly(fileURL1, result))
  t.is(state.modules.size, 2)
  t.is(state.modules.get(fileURL1), result)
  t.is(state.modules.get(fileURL2), source)
})
