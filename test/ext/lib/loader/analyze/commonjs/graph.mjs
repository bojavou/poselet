import test from 'ava'
import sinon from 'sinon'
import analyze from '#lib/loader/analyze/commonjs/graph.mjs'
import state from '#lib/loader/state.mjs'
import Module from '#lib/loader/analyze/module.mjs'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { copy } from '#lib/object.mjs'
import { ExportSource, ModuleType } from '#lib/loader/analyze/enum.mjs'
import { InvalidError } from '#lib/error.mjs'

const tempPath = os.tmpdir()
const prefix = path.join(tempPath, 'poselet-')

test.beforeEach(async t => {
  state.modules = new Map()
  const root = await fs.mkdtemp(prefix)
  copy(t.context, { root })
})

test.afterEach(async t => {
  const { root } = t.context
  await fs.rm(root, { recursive: true })
})

test.serial('cached', async t => {
  const modulePath = '/home/user/test.cjs'
  const module = new Module()
  state.modules.set(modulePath, module)
  const result = await analyze(modulePath)
  t.is(result, module)
})

test.serial('simple', async t => {
  const { root } = t.context
  const modulePath = path.join(root, 'test.cjs')
  const code = `
module.exports.a = 1
module.exports.b = 2
module.exports.c = 3
`.trim()
  await fs.writeFile(modulePath, code, { encoding: 'utf8' })
  const result = await analyze(modulePath)
  t.true(result instanceof Module)
  t.is(result.type, ModuleType.CommonJS)
  t.is(result.bindings.size, 4)
  t.deepEqual(
    [...result.bindings.keys()],
    [ExportSource.Default, 'a', 'b', 'c']
  )
  t.deepEqual([...result.exports.keys()], ['default', 'a', 'b', 'c'])
  t.is(result.wildcards.size, 0)
  t.is(state.modules.size, 1)
  t.is(state.modules.get(modulePath), result)
})

test.serial('wildcard', async t => {
  const { root } = t.context
  const modulePath1 = path.join(root, 'test1.cjs')
  const code1 = `
module.exports = require('./test2.cjs')
`.trim()
  await fs.writeFile(modulePath1, code1, { encoding: 'utf8' })
  const modulePath2 = path.join(root, 'test2.cjs')
  const code2 = `
module.exports.a = 1
module.exports.b = 2
module.exports.c = 3
`.trim()
  await fs.writeFile(modulePath2, code2, { encoding: 'utf8' })
  const result = await analyze(modulePath1)
  t.true(result instanceof Module)
  t.is(result.type, ModuleType.CommonJS)
  t.deepEqual([...result.bindings.keys()], [ExportSource.Default])
  t.deepEqual([...result.exports.keys()], ['default'])
  t.is(result.wildcards.size, 1)
  const source = [...result.wildcards][0].request.module
  t.is(source.type, ModuleType.CommonJS)
  t.deepEqual(
    [...source.bindings.keys()],
    [ExportSource.Default, 'a', 'b', 'c']
  )
  t.deepEqual([...source.exports.keys()], ['default', 'a', 'b', 'c'])
  t.is(source.wildcards.size, 0)
  t.is(state.modules.size, 2)
  t.is(state.modules.get(modulePath1), result)
  t.is(state.modules.get(modulePath2), source)
})

test.serial('wildcard alias', async t => {
  const { root } = t.context
  const modulePath1 = path.join(root, 'test1.cjs')
  const code1 = `
module.exports = {
  ...require('./test2.cjs'),
  ...require('./test/../test2.cjs')
}
`.trim()
  await fs.writeFile(modulePath1, code1, { encoding: 'utf8' })
  const modulePath2 = path.join(root, 'test2.cjs')
  const code2 = `
module.exports.a = 1
module.exports.b = 2
module.exports.c = 3
`.trim()
  await fs.writeFile(modulePath2, code2, { encoding: 'utf8' })
  const result = await analyze(modulePath1)
  t.true(result instanceof Module)
  t.is(result.type, ModuleType.CommonJS)
  t.deepEqual([...result.bindings.keys()], [ExportSource.Default])
  t.deepEqual([...result.exports.keys()], ['default'])
  t.is(result.wildcards.size, 1)
  const source = [...result.wildcards][0].request.module
  t.is(source.type, ModuleType.CommonJS)
  t.deepEqual(
    [...source.bindings.keys()],
    [ExportSource.Default, 'a', 'b', 'c']
  )
  t.deepEqual([...source.exports.keys()], ['default', 'a', 'b', 'c'])
  t.is(source.wildcards.size, 0)
  t.is(state.modules.size, 2)
  t.is(state.modules.get(modulePath1), result)
  t.is(state.modules.get(modulePath2), source)
})

test.serial('wildcard cached', async t => {
  const { root } = t.context
  const modulePath1 = path.join(root, 'test1.cjs')
  const code1 = `
module.exports = require('./test2.cjs')
`.trim()
  await fs.writeFile(modulePath1, code1, { encoding: 'utf8' })
  const modulePath2 = path.join(root, 'test2.cjs')
  await fs.writeFile(modulePath2, '', { encoding: 'utf8' })
  const source = new Module()
  state.modules.set(modulePath2, source)
  sinon.spy(state.modules, 'set')
  const result = await analyze(modulePath1)
  t.true(result instanceof Module)
  t.is(result.type, ModuleType.CommonJS)
  t.deepEqual([...result.bindings.keys()], [ExportSource.Default])
  t.deepEqual([...result.exports.keys()], ['default'])
  t.is(result.wildcards.size, 1)
  t.is([...result.wildcards][0].request.module, source)
  t.true(state.modules.set.calledOnceWithExactly(modulePath1, result))
  t.is(state.modules.size, 2)
  t.is(state.modules.get(modulePath1), result)
  t.is(state.modules.get(modulePath2), source)
})

test.serial('wildcard ecmascript', async t => {
  const { root } = t.context
  const modulePath1 = path.join(root, 'test1.cjs')
  const code1 = `
module.exports = require('./test2.mjs')
`.trim()
  await fs.writeFile(modulePath1, code1, { encoding: 'utf8' })
  const modulePath2 = path.join(root, 'test2.mjs')
  await fs.writeFile(modulePath2, '', { encoding: 'utf8' })
  await t.throwsAsync(analyze(modulePath1), {
    instanceOf: InvalidError,
    code: 'RequireESM',
    message: `Require of ECMAScript module ${modulePath2}` +
      ` from CommonJS module ${modulePath1}`
  })
})

test.serial('wildcard json', async t => {
  const { root } = t.context
  const modulePath1 = path.join(root, 'test1.cjs')
  const code1 = `
module.exports = require('./test2.json')
`.trim()
  await fs.writeFile(modulePath1, code1, { encoding: 'utf8' })
  const modulePath2 = path.join(root, 'test2.json')
  await fs.writeFile(modulePath2, '', { encoding: 'utf8' })
  const result = await analyze(modulePath1)
  t.true(result instanceof Module)
  t.is(result.type, ModuleType.CommonJS)
  t.deepEqual([...result.bindings.keys()], [ExportSource.Default])
  t.deepEqual([...result.exports.keys()], ['default'])
  t.is(result.wildcards.size, 1)
  const source = [...result.wildcards][0].request.module
  t.is(source.type, ModuleType.JSON)
  t.deepEqual([...source.bindings.keys()], [ExportSource.Default])
  t.deepEqual([...source.exports.keys()], ['default'])
  t.is(source.imports.size, 0)
  t.is(source.wildcards.size, 0)
  t.is(state.modules.size, 2)
  t.is(state.modules.get(modulePath1), result)
  t.is(state.modules.get(modulePath2), source)
})

test.serial('wildcard addon', async t => {
  const { root } = t.context
  const modulePath1 = path.join(root, 'test1.cjs')
  const code1 = `
module.exports = require('./test2.node')
`.trim()
  await fs.writeFile(modulePath1, code1, { encoding: 'utf8' })
  const modulePath2 = path.join(root, 'test2.node')
  await fs.writeFile(modulePath2, '', { encoding: 'utf8' })
  const result = await analyze(modulePath1)
  t.true(result instanceof Module)
  t.is(result.type, ModuleType.CommonJS)
  t.deepEqual([...result.bindings.keys()], [ExportSource.Default])
  t.deepEqual([...result.exports.keys()], ['default'])
  t.is(result.wildcards.size, 1)
  const source = [...result.wildcards][0].request.module
  t.is(source.type, ModuleType.Addon)
  t.deepEqual([...source.bindings.keys()], [ExportSource.Default])
  t.deepEqual([...source.exports.keys()], ['default'])
  t.is(source.imports.size, 0)
  t.is(source.wildcards.size, 0)
  t.is(state.modules.size, 2)
  t.is(state.modules.get(modulePath1), result)
  t.is(state.modules.get(modulePath2), source)
})
