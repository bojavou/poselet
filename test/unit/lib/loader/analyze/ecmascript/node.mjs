import test from 'ava'
import sinon from 'sinon'
import analyze from '#lib/loader/analyze/ecmascript/node.mjs'
import gear from '#lib/loader/gear.mjs'
import Module from '#lib/loader/analyze/module.mjs'
import path from 'node:path'
import url from 'node:url'
import { ExportSource, ModuleType } from '#lib/loader/analyze/enum.mjs'
import {
  DefaultBinding, ImportRequest, NameBinding, NamedExport, NamespaceBinding,
  WildcardExport
} from '#lib/loader/analyze/module/surface.mjs'

const root = path.normalize('/test')

gear.resolve = sinon.stub()

test.afterEach(() => {
  gear.resolve.reset()
})

test.serial('empty', t => {
  const modulePath = path.join(root, 'test.mjs')
  const fileURL = url.pathToFileURL(modulePath).href
  const result = analyze(fileURL, '')
  t.true(result instanceof Module)
  t.is(result.type, ModuleType.ECMAScript)
  t.is(result.bindings.size, 0)
  t.is(result.imports.size, 0)
  t.is(result.exports.size, 0)
  t.is(result.wildcards.size, 0)
})

test.serial('import default', t => {
  const modulePath1 = path.join(root, 'test1.mjs')
  const fileURL1 = url.pathToFileURL(modulePath1).href
  const code = `
import gadget from './test2.mjs'
`.trim()
  const modulePath2 = path.join(root, 'test2.mjs')
  const fileURL2 = url.pathToFileURL(modulePath2).href
  gear.resolve.withArgs('./test2.mjs').returns(fileURL2)
  const result = analyze(fileURL1, code)
  t.true(result instanceof Module)
  t.is(result.type, ModuleType.ECMAScript)
  t.is(result.bindings.size, 0)
  t.is(result.imports.size, 0)
  t.is(result.exports.size, 0)
  t.is(result.wildcards.size, 0)
})

test.serial('import named', t => {
  const modulePath1 = path.join(root, 'test1.mjs')
  const fileURL1 = url.pathToFileURL(modulePath1).href
  const code = `
import { gadget } from './test2.mjs'
`.trim()
  const modulePath2 = path.join(root, 'test2.mjs')
  const fileURL2 = url.pathToFileURL(modulePath2)
  gear.resolve.withArgs('./test2.mjs').returns(fileURL2)
  const result = analyze(fileURL1, code)
  t.true(result instanceof Module)
  t.is(result.type, ModuleType.ECMAScript)
  t.is(result.bindings.size, 0)
  t.is(result.imports.size, 0)
  t.is(result.exports.size, 0)
  t.is(result.wildcards.size, 0)
})

test.serial('import namespace', t => {
  const modulePath1 = path.join(root, 'test1.mjs')
  const fileURL1 = url.pathToFileURL(modulePath1).href
  const code = `
import * as gadget from './test2.mjs'
`.trim()
  const modulePath2 = path.join(root, 'test2.mjs')
  const fileURL2 = url.pathToFileURL(modulePath2)
  gear.resolve.withArgs('./test2.mjs').returns(fileURL2)
  const result = analyze(fileURL1, code)
  t.true(result instanceof Module)
  t.is(result.type, ModuleType.ECMAScript)
  t.is(result.bindings.size, 0)
  t.is(result.imports.size, 0)
  t.is(result.exports.size, 0)
  t.is(result.wildcards.size, 0)
})

test.serial('export default named', t => {
  const modulePath = path.join(root, 'test.mjs')
  const fileURL = url.pathToFileURL(modulePath).href
  const code = `
export default function gadget () {}
`.trim()
  const result = analyze(fileURL, code)
  t.true(result instanceof Module)
  t.is(result.type, ModuleType.ECMAScript)
  t.is(result.exports.size, 1)
  const offer = result.exports.get('default')
  t.true(offer instanceof NamedExport)
  t.is(offer.name, 'default')
  const { binding } = offer
  t.true(binding instanceof NameBinding)
  t.is(binding.module, result)
  t.is(binding.name, 'gadget')
  t.is(offer.import, undefined)
  t.is(offer.request, undefined)
  t.deepEqual(result.bindings, new Map([['gadget', binding]]))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test.serial('export default anon', t => {
  const modulePath = path.join(root, 'test.mjs')
  const fileURL = url.pathToFileURL(modulePath).href
  const code = `
export default function () {}
`.trim()
  const result = analyze(fileURL, code)
  t.true(result instanceof Module)
  t.is(result.type, ModuleType.ECMAScript)
  t.is(result.exports.size, 1)
  const offer = result.exports.get('default')
  t.true(offer instanceof NamedExport)
  t.is(offer.name, 'default')
  const { binding } = offer
  t.true(binding instanceof DefaultBinding)
  t.is(binding.module, result)
  t.is(offer.import, undefined)
  t.is(offer.request, undefined)
  t.deepEqual(result.bindings, new Map([[ExportSource.Default, binding]]))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test.serial('export named', t => {
  const modulePath = path.join(root, 'test.mjs')
  const fileURL = url.pathToFileURL(modulePath).href
  const code = `
export const aleph = null
`.trim()
  const result = analyze(fileURL, code)
  t.true(result instanceof Module)
  t.is(result.type, ModuleType.ECMAScript)
  t.is(result.exports.size, 1)
  const offer = result.exports.get('aleph')
  t.true(offer instanceof NamedExport)
  t.is(offer.name, 'aleph')
  const { binding } = offer
  t.true(binding instanceof NameBinding)
  t.is(binding.module, result)
  t.is(binding.name, 'aleph')
  t.is(offer.import, undefined)
  t.is(offer.request, undefined)
  t.deepEqual(result.bindings, new Map([['aleph', binding]]))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test.serial('export named rename', t => {
  const modulePath = path.join(root, 'test.mjs')
  const fileURL = url.pathToFileURL(modulePath).href
  const code = `
const aleph = null
export { aleph as small }
`.trim()
  const result = analyze(fileURL, code)
  t.true(result instanceof Module)
  t.is(result.type, ModuleType.ECMAScript)
  t.is(result.exports.size, 1)
  const offer = result.exports.get('small')
  t.true(offer instanceof NamedExport)
  t.is(offer.name, 'small')
  const { binding } = offer
  t.true(binding instanceof NameBinding)
  t.is(binding.module, result)
  t.is(binding.name, 'aleph')
  t.is(offer.import, undefined)
  t.is(offer.request, undefined)
  t.deepEqual(result.bindings, new Map([['aleph', binding]]))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test.serial('export named alias', t => {
  const modulePath = path.join(root, 'test.mjs')
  const fileURL = url.pathToFileURL(modulePath).href
  const code = `
const aleph = null
export { aleph as small, aleph as infinity }
`.trim()
  const result = analyze(fileURL, code)
  t.true(result instanceof Module)
  t.is(result.type, ModuleType.ECMAScript)
  t.is(result.exports.size, 2)
  const offer1 = result.exports.get('small')
  t.true(offer1 instanceof NamedExport)
  t.is(offer1.name, 'small')
  const { binding } = offer1
  t.true(binding instanceof NameBinding)
  t.is(binding.module, result)
  t.is(binding.name, 'aleph')
  t.is(offer1.import, undefined)
  t.is(offer1.export, undefined)
  const offer2 = result.exports.get('infinity')
  t.true(offer2 instanceof NamedExport)
  t.is(offer2.name, 'infinity')
  t.is(offer2.binding, binding)
  t.is(offer2.import, undefined)
  t.is(offer2.export, undefined)
  t.deepEqual(result.bindings, new Map([['aleph', binding]]))
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test.serial('reexport', t => {
  const modulePath1 = path.join(root, 'test1.mjs')
  const fileURL1 = url.pathToFileURL(modulePath1).href
  const code = `
export { gadget } from './test2.mjs'
`.trim()
  const modulePath2 = path.join(root, 'test2.mjs')
  const fileURL2 = url.pathToFileURL(modulePath2).href
  gear.resolve.withArgs('./test2.mjs').returns(fileURL2)
  const result = analyze(fileURL1, code)
  t.true(result instanceof Module)
  t.is(result.type, ModuleType.ECMAScript)
  t.is(result.exports.size, 1)
  const offer = result.exports.get('gadget')
  t.true(offer instanceof NamedExport)
  t.is(offer.name, 'gadget')
  const { request } = offer
  t.true(request instanceof ImportRequest)
  t.is(request.module, fileURL2)
  t.is(request.name, 'gadget')
  t.is(offer.binding, undefined)
  t.is(offer.import, undefined)
  t.is(result.bindings.size, 0)
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test.serial('reexport rename', t => {
  const modulePath1 = path.join(root, 'test1.mjs')
  const fileURL1 = url.pathToFileURL(modulePath1).href
  const code = `
export { a as b } from './test2.mjs'
`.trim()
  const modulePath2 = path.join(root, 'test2.mjs')
  const fileURL2 = url.pathToFileURL(modulePath2).href
  gear.resolve.withArgs('./test2.mjs').returns(fileURL2)
  const result = analyze(fileURL1, code)
  t.true(result instanceof Module)
  t.is(result.type, ModuleType.ECMAScript)
  t.is(result.exports.size, 1)
  const offer = result.exports.get('b')
  t.true(offer instanceof NamedExport)
  t.is(offer.name, 'b')
  const { request } = offer
  t.true(request instanceof ImportRequest)
  t.is(request.module, fileURL2)
  t.is(request.name, 'a')
  t.is(offer.binding, undefined)
  t.is(offer.import, undefined)
  t.is(result.bindings.size, 0)
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test.serial('reexport namespace', t => {
  const modulePath1 = path.join(root, 'test1.mjs')
  const fileURL1 = url.pathToFileURL(modulePath1).href
  const code = `
export * as gadget from './test2.mjs'
`.trim()
  const modulePath2 = path.join(root, 'test2.mjs')
  const fileURL2 = url.pathToFileURL(modulePath2).href
  gear.resolve.withArgs('./test2.mjs').returns(fileURL2)
  const result = analyze(fileURL1, code)
  t.true(result instanceof Module)
  t.is(result.type, ModuleType.ECMAScript)
  t.is(result.exports.size, 1)
  const offer = result.exports.get('gadget')
  t.true(offer instanceof NamedExport)
  t.is(offer.name, 'gadget')
  const { binding } = offer
  t.true(binding instanceof NamespaceBinding)
  t.is(binding.locator, fileURL2)
  t.is(offer.import, undefined)
  t.is(offer.request, undefined)
  t.is(result.bindings.size, 0)
  t.is(result.imports.size, 0)
  t.is(result.wildcards.size, 0)
})

test.serial('reexport indirect', t => {
  const modulePath1 = path.join(root, 'test1.mjs')
  const fileURL1 = url.pathToFileURL(modulePath1).href
  const code = `
import { gadget } from './test2.mjs'
export { gadget }
`.trim()
  const modulePath2 = path.join(root, 'test2.mjs')
  const fileURL2 = url.pathToFileURL(modulePath2).href
  gear.resolve.withArgs('./test2.mjs').returns(fileURL2)
  const result = analyze(fileURL1, code)
  t.true(result instanceof Module)
  t.is(result.type, ModuleType.ECMAScript)
  t.is(result.imports.size, 1)
  const pull = result.imports.get('gadget')
  t.is(result.exports.size, 1)
  const offer = result.exports.get('gadget')
  t.true(offer instanceof NamedExport)
  t.is(offer.name, 'gadget')
  t.is(offer.import, pull)
  t.is(offer.binding, undefined)
  t.is(offer.request, undefined)
  t.is(result.bindings.size, 0)
  t.is(result.wildcards.size, 0)
})

test.serial('wildcard', t => {
  const modulePath1 = path.join(root, 'test1.mjs')
  const fileURL1 = url.pathToFileURL(modulePath1).href
  const code = `
export * from './test2.mjs'
`.trim()
  const modulePath2 = path.join(root, 'test2.mjs')
  const fileURL2 = url.pathToFileURL(modulePath2).href
  gear.resolve.withArgs('./test2.mjs').returns(fileURL2)
  const result = analyze(fileURL1, code)
  t.true(result instanceof Module)
  t.is(result.type, ModuleType.ECMAScript)
  t.is(result.wildcards.size, 1)
  const wildcard = [...result.wildcards][0]
  t.true(wildcard instanceof WildcardExport)
  t.is(wildcard.request.module, fileURL2)
  t.is(result.bindings.size, 0)
  t.is(result.imports.size, 0)
  t.is(result.exports.size, 0)
})

test.serial('wildcard alias', t => {
  const modulePath1 = path.join(root, 'test1.mjs')
  const fileURL1 = url.pathToFileURL(modulePath1).href
  const code = `
export * from './test2.mjs'
export * from './test/../test2.mjs'
`.trim()
  const modulePath2 = path.join(root, 'test2.mjs')
  const fileURL2 = url.pathToFileURL(modulePath2).href
  gear.resolve.withArgs('./test2.mjs').returns(fileURL2)
  gear.resolve.withArgs('./test/../test2.mjs').returns(fileURL2)
  const result = analyze(fileURL1, code)
  t.true(result instanceof Module)
  t.is(result.type, ModuleType.ECMAScript)
  t.is(result.wildcards.size, 1)
  const wildcard = [...result.wildcards][0]
  t.true(wildcard instanceof WildcardExport)
  t.is(wildcard.request.module, fileURL2)
  t.is(result.bindings.size, 0)
  t.is(result.imports.size, 0)
  t.is(result.exports.size, 0)
})
