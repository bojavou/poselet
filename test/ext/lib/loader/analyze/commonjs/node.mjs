import test from 'ava'
import analyze from '#lib/loader/analyze/commonjs/node.mjs'
import fs from 'node:fs/promises'
import Module from '#lib/loader/analyze/module.mjs'
import os from 'node:os'
import path from 'node:path'
import { copy } from '#lib/object.mjs'
import { ExportSource, ModuleType } from '#lib/loader/analyze/enum.mjs'
import {
  DefaultBinding, NameBinding, NamedExport, WildcardExport
} from '#lib/loader/analyze/module/surface.mjs'

const tempPath = os.tmpdir()
const prefix = path.join(tempPath, 'poselet-')

test.beforeEach(async t => {
  const root = await fs.mkdtemp(prefix)
  copy(t.context, { root })
})

test.afterEach(async t => {
  const { root } = t.context
  await fs.rm(root, { recursive: true })
})

test.serial('empty', async t => {
  const { root } = t.context
  const modulePath = path.join(root, 'test.cjs')
  await fs.writeFile(modulePath, '', { encoding: 'utf8' })
  const result = await analyze(modulePath)
  t.true(result instanceof Module)
  t.is(result.type, ModuleType.CommonJS)
  t.is(result.bindings.size, 1)
  const binding = result.bindings.get(ExportSource.Default)
  t.true(binding instanceof DefaultBinding)
  t.is(binding.module, result)
  t.is(result.exports.size, 1)
  const entry = result.exports.get('default')
  t.true(entry instanceof NamedExport)
  t.is(entry.import, undefined)
  t.is(entry.binding, binding)
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test.serial('named', async t => {
  const { root } = t.context
  const modulePath = path.join(root, 'test.cjs')
  const code = `
module.exports.a = 1
`.trim()
  await fs.writeFile(modulePath, code, { encoding: 'utf8' })
  const result = await analyze(modulePath)
  t.true(result instanceof Module)
  t.is(result.type, ModuleType.CommonJS)
  t.is(result.bindings.size, 2)
  t.true(result.bindings.has(ExportSource.Default))
  const binding = result.bindings.get('a')
  t.true(binding instanceof NameBinding)
  t.is(binding.module, result)
  t.is(binding.name, 'a')
  t.is(result.exports.size, 2)
  t.true(result.exports.has('default'))
  const entry = result.exports.get('a')
  t.true(entry instanceof NamedExport)
  t.is(entry.import, undefined)
  t.is(entry.export, undefined)
  t.is(entry.binding, binding)
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test.serial('wildcard', async t => {
  const { root } = t.context
  const modulePath1 = path.join(root, 'test1.cjs')
  const code1 = `
module.exports = require('./test2.cjs')
`.trim()
  await fs.writeFile(modulePath1, code1, { encoding: 'utf8' })
  const modulePath2 = path.join(root, 'test2.cjs')
  await fs.writeFile(modulePath2, '', { encoding: 'utf8' })
  const result = await analyze(modulePath1)
  t.true(result instanceof Module)
  t.is(result.type, ModuleType.CommonJS)
  t.is(result.bindings.size, 1)
  t.true(result.bindings.has(ExportSource.Default))
  t.is(result.exports.size, 1)
  t.true(result.exports.has('default'))
  t.is(result.wildcards.size, 1)
  const entry = [...result.wildcards][0]
  t.true(entry instanceof WildcardExport)
  t.is(entry.request.module, modulePath2)
  t.is(result.imports.size, 0)
})
