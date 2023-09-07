import test from 'ava'
import type from '#lib/loader/analyze/type/manifest.mjs'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { copy } from '#lib/object.mjs'
import { ModuleType } from '#lib/loader/analyze/enum.mjs'

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

test('invalid', async t => {
  const { root } = t.context
  const manifestPath = path.join(root, 'package.json')
  await fs.writeFile(manifestPath, '}', { encoding: 'utf8' })
  const modulePath = path.join(root, 'test.js')
  await t.throwsAsync(type(modulePath))
})

test('unmanifested', async t => {
  const { root } = t.context
  const modulePath = path.join(root, 'test.js')
  const result = await type(modulePath)
  t.is(result, ModuleType.CommonJS)
})

test('absent', async t => {
  const { root } = t.context
  const manifest = {}
  const manifestJson = JSON.stringify(manifest)
  const manifestPath = path.join(root, 'package.json')
  await fs.writeFile(manifestPath, manifestJson, { encoding: 'utf8' })
  const modulePath = path.join(root, 'test.js')
  const result = await type(modulePath)
  t.is(result, ModuleType.CommonJS)
})

test('unspecified', async t => {
  const { root } = t.context
  const manifest = { type: 'alien' }
  const manifestJson = JSON.stringify(manifest)
  const manifestPath = path.join(root, 'package.json')
  await fs.writeFile(manifestPath, manifestJson, { encoding: 'utf8' })
  const modulePath = path.join(root, 'test.js')
  const result = await type(modulePath)
  t.is(result, ModuleType.CommonJS)
})

test('commonjs', async t => {
  const { root } = t.context
  const manifest = { type: 'commonjs' }
  const manifestJson = JSON.stringify(manifest)
  const manifestPath = path.join(root, 'package.json')
  await fs.writeFile(manifestPath, manifestJson, { encoding: 'utf8' })
  const modulePath = path.join(root, 'test.js')
  const result = await type(modulePath)
  t.is(result, ModuleType.CommonJS)
})

test('module', async t => {
  const { root } = t.context
  const manifest = { type: 'module' }
  const manifestJson = JSON.stringify(manifest)
  const manifestPath = path.join(root, 'package.json')
  await fs.writeFile(manifestPath, manifestJson, { encoding: 'utf8' })
  const modulePath = path.join(root, 'test.js')
  const result = await type(modulePath)
  t.is(result, ModuleType.ECMAScript)
})
