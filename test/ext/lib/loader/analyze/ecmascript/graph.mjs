import test from 'ava'
import sinon from 'sinon'
import '#lib/loader/analyze/import/graph.mjs' // Load normal entrypoint
import analyze from '#lib/loader/analyze/ecmascript/graph.mjs'
import gear from '#lib/loader/gear.mjs'
import state from '#lib/loader/state.mjs'
import Module from '#lib/loader/analyze/module.mjs'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import url from 'node:url'
import { copy } from '#lib/object.mjs'
import { ModuleType } from '#lib/loader/analyze/enum.mjs'

const tempPath = os.tmpdir()
const prefix = path.join(tempPath, 'poselet-')
gear.resolve = sinon.stub()
gear.load = sinon.stub()

test.beforeEach(async t => {
  state.modules = new Map()
  const root = await fs.mkdtemp(prefix)
  copy(t.context, { root })
})

test.afterEach(async t => {
  const { root } = t.context
  await fs.rm(root, { recursive: true })
  gear.resolve.reset()
  gear.load.reset()
})

test.serial('wildcard commonjs', async t => {
  const { root } = t.context
  const modulePath1 = path.join(root, 'test1.mjs')
  const fileURL1 = url.pathToFileURL(modulePath1).href
  const code1 = `
export * from './test2.cjs'
`.trim()
  await fs.writeFile(modulePath1, code1, { encoding: 'utf8' })
  const modulePath2 = path.join(root, 'test2.cjs')
  const fileURL2 = url.pathToFileURL(modulePath2).href
  const code2 = `
module.exports.a = 1
module.exports.b = 2
module.exports.c = 3
`.trim()
  await fs.writeFile(modulePath2, code2, { encoding: 'utf8' })
  gear.resolve.withArgs('./test2.cjs').returns(fileURL2)
  gear.load.withArgs(fileURL2).resolves({ format: 'commonjs', source: code2 })
  const result = await analyze(fileURL1, code1)
  t.true(result instanceof Module)
  t.is(result.type, ModuleType.ECMAScript)
  t.is(result.wildcards.size, 1)
  const wrapper = [...result.wildcards][0].request.module
  t.is(wrapper.type, ModuleType.CommonJSWrapper)
  const source = wrapper.wrapped
  t.is(source.type, ModuleType.CommonJS)
  t.deepEqual(
    new Set(source.exports.keys()),
    new Set(['default', 'a', 'b', 'c'])
  )
  t.is(state.modules.size, 3)
  t.is(state.modules.get(fileURL1), result)
  t.is(state.modules.get(fileURL2), wrapper)
  t.is(state.modules.get(modulePath2), source)
})

test.serial('wildcard alias commonjs', async t => {
  const { root } = t.context
  const modulePath1 = path.join(root, 'test1.mjs')
  const fileURL1 = url.pathToFileURL(modulePath1).href
  const code1 = `
export * from './test2.cjs'
export * from './test/../test2.cjs'
`.trim()
  await fs.writeFile(modulePath1, code1, { encoding: 'utf8' })
  const modulePath2 = path.join(root, 'test2.cjs')
  const fileURL2 = url.pathToFileURL(modulePath2).href
  const code2 = `
module.exports.a = 1
module.exports.b = 2
module.exports.c = 3
`.trim()
  await fs.writeFile(modulePath2, code2, { encoding: 'utf8' })
  gear.resolve.withArgs('./test2.cjs').returns(fileURL2)
  gear.resolve.withArgs('./test/../test2.cjs').returns(fileURL2)
  gear.load.withArgs(fileURL2).resolves({ format: 'commonjs', source: code2 })
  const result = await analyze(fileURL1, code1)
  t.true(result instanceof Module)
  t.is(result.type, ModuleType.ECMAScript)
  t.is(result.wildcards.size, 1)
  const wrapper = [...result.wildcards][0].request.module
  t.is(wrapper.type, ModuleType.CommonJSWrapper)
  const source = wrapper.wrapped
  t.is(source.type, ModuleType.CommonJS)
  t.deepEqual(
    new Set(source.exports.keys()),
    new Set(['default', 'a', 'b', 'c'])
  )
  t.is(state.modules.size, 3)
  t.is(state.modules.get(fileURL1), result)
  t.is(state.modules.get(fileURL2), wrapper)
  t.is(state.modules.get(modulePath2), source)
})

test.serial('wildcard semialias commonjs param', async t => {
  const { root } = t.context
  const modulePath1 = path.join(root, 'test1.mjs')
  const fileURL1 = url.pathToFileURL(modulePath1).href
  const code1 = `
export * from './test2.cjs'
export * from './test2.cjs?param=value'
`.trim()
  await fs.writeFile(modulePath1, code1, { encoding: 'utf8' })
  const modulePath2 = path.join(root, 'test2.cjs')
  const fileURL2 = url.pathToFileURL(modulePath2).href
  const code2 = `
module.exports.a = 1
module.exports.b = 2
module.exports.c = 3
`.trim()
  await fs.writeFile(modulePath2, code2, { encoding: 'utf8' })
  const semialiasURL = url.pathToFileURL(modulePath2)
  semialiasURL.searchParams.set('param', 'value')
  gear.resolve.withArgs('./test2.cjs').returns(fileURL2)
  gear.resolve.withArgs('./test2.cjs?param=value').returns(semialiasURL.href)
  const loaded = { format: 'commonjs', source: code2 }
  gear.load.withArgs(fileURL2).resolves(loaded)
  gear.load.withArgs(semialiasURL.href).resolves(loaded)
  const result = await analyze(fileURL1, code1)
  t.true(result instanceof Module)
  t.is(result.type, ModuleType.ECMAScript)
  t.is(state.modules.size, 4)
  t.is(state.modules.get(fileURL1), result)
  const source = state.modules.get(modulePath2)
  t.is(source.type, ModuleType.CommonJS)
  t.deepEqual(
    new Set(source.exports.keys()),
    new Set(['default', 'a', 'b', 'c'])
  )
  const wrapper1 = state.modules.get(fileURL2)
  t.is(wrapper1.type, ModuleType.CommonJSWrapper)
  t.is(wrapper1.wrapped, source)
  const wrapper2 = state.modules.get(semialiasURL.href)
  t.is(wrapper2.type, ModuleType.CommonJSWrapper)
  t.is(wrapper2.wrapped, source)
  t.deepEqual(
    new Set([...result.wildcards].map(offer => offer.request.module)),
    new Set([wrapper1, wrapper2])
  )
})

test.serial('wildcard semialias commonjs fragment', async t => {
  const { root } = t.context
  const modulePath1 = path.join(root, 'test1.mjs')
  const fileURL1 = url.pathToFileURL(modulePath1).href
  const code1 = `
export * from './test2.cjs'
export * from './test2.cjs#fragment'
`.trim()
  await fs.writeFile(modulePath1, code1, { encoding: 'utf8' })
  const modulePath2 = path.join(root, 'test2.cjs')
  const fileURL2 = url.pathToFileURL(modulePath2).href
  const code2 = `
module.exports.a = 1
module.exports.b = 2
module.exports.c = 3
`.trim()
  await fs.writeFile(modulePath2, code2, { encoding: 'utf8' })
  const semialiasURL = url.pathToFileURL(modulePath2)
  semialiasURL.hash = 'fragment'
  gear.resolve.withArgs('./test2.cjs').returns(fileURL2)
  gear.resolve.withArgs('./test2.cjs#fragment').returns(semialiasURL.href)
  const loaded = { format: 'commonjs', source: code2 }
  gear.load.withArgs(fileURL2).resolves(loaded)
  gear.load.withArgs(semialiasURL.href).resolves(loaded)
  const result = await analyze(fileURL1, code1)
  t.true(result instanceof Module)
  t.is(result.type, ModuleType.ECMAScript)
  t.is(state.modules.size, 4)
  t.is(state.modules.get(fileURL1), result)
  const source = state.modules.get(modulePath2)
  t.is(source.type, ModuleType.CommonJS)
  t.deepEqual(
    new Set(source.exports.keys()),
    new Set(['default', 'a', 'b', 'c'])
  )
  const wrapper1 = state.modules.get(fileURL2)
  t.is(wrapper1.type, ModuleType.CommonJSWrapper)
  t.is(wrapper1.wrapped, source)
  const wrapper2 = state.modules.get(semialiasURL.href)
  t.is(wrapper2.type, ModuleType.CommonJSWrapper)
  t.is(wrapper2.wrapped, source)
  t.deepEqual(
    new Set([...result.wildcards].map(offer => offer.request.module)),
    new Set([wrapper1, wrapper2])
  )
})
