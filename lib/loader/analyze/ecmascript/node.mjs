import analyzeEcmascriptFile from './file.mjs'
import gear from '../../gear.mjs'
import Module from '../module.mjs'
import { ExportSource, ImportSource, ModuleType } from '../enum.mjs'
import {
  DefaultBinding, Import, ImportRequest, NameBinding, NamedExport,
  NamespaceBinding, WildcardExport
} from '../module/surface.mjs'

function analyzeEcmascriptNode (moduleURL, code) {
  // Analyze file
  const file = analyzeEcmascriptFile(code)

  // Create module
  const module = new Module()
  module.type = ModuleType.ECMAScript
  const resolved = new Map()

  // Construct imports
  // Defer specifier resolution to avoid resolving irrelevant imports
  for (const [specifier, imports] of file.imports) {
    for (const [local, imported] of imports) {
      const pull = new Import()
      pull.name = local
      if (imported === ImportSource.Namespace) {
        // import * as name from 'module'
        pull.binding = new NamespaceBinding({ locator: specifier })
      } else {
        // import a from 'module'
        // import { b } from 'module'
        // import { c as d } from 'module'
        pull.request = new ImportRequest({ specifier, name: imported })
      }
      module.imports.set(local, pull)
    }
  }

  // Construct named and default exports
  const transmitted = new Set()
  for (const [exported, whence] of file.exports) {
    if ('local' in whence) {
      const { local } = whence
      if (module.imports.has(local)) {
        // import a from 'module'; export { a }
        // import { b } from 'module'; export { b }
        // import * as c from 'module'; export { c }
        const pull = module.imports.get(local)
        const offer = new NamedExport({ name: exported, import: pull })
        module.exports.set(exported, offer)
        transmitted.add(local)
      } else {
        // export default function () {}
        // export default class {}
        // export default 42
        // export const a = 1
        // export const [b, c, ...d] = []
        // export const { e, f, ...g } = {}
        // export { h }
        // export { i as j }
        const binding = localBinding(module, local)
        const offer = new NamedExport({ name: exported, binding })
        module.exports.set(exported, offer)
      }
    } else if (whence.imported === ImportSource.Namespace) {
      // export * as a from 'module'
      const locator = resolve(resolved, whence.module, moduleURL)
      const binding = new NamespaceBinding({ locator })
      const offer = new NamedExport({ name: exported, binding })
      module.exports.set(exported, offer)
    } else {
      // export { a } from 'module'
      // export { b as c } from 'module'
      const specifier = whence.module
      const name = whence.imported
      const sourceURL = resolve(resolved, specifier, moduleURL)
      const request = new ImportRequest({ specifier, module: sourceURL, name })
      const offer = new NamedExport({ name: exported, request })
      module.exports.set(exported, offer)
    }
  }

  // Construct wildcard exports
  const seen = new Set()
  for (const specifier of file.wildcards) {
    const sourceURL = resolve(resolved, specifier, moduleURL)
    if (seen.has(sourceURL)) continue
    seen.add(sourceURL)
    const request = new ImportRequest({ specifier, module: sourceURL })
    const offer = new WildcardExport({ request })
    module.wildcards.add(offer)
  }

  // Delete irrelevant imports
  for (const name of module.imports.keys()) {
    if (transmitted.has(name)) continue
    module.imports.delete(name)
  }

  // Resolve import specifiers
  for (const pull of module.imports.values()) {
    if (pull.binding) {
      const specifier = pull.binding.locator
      pull.binding.locator = resolve(resolved, specifier, moduleURL)
    } else {
      const specifier = pull.request.specifier
      pull.request.module = resolve(resolved, specifier, moduleURL)
    }
  }

  // Return module
  return module
}

function resolve (resolved, specifier, contextURL) {
  if (resolved.has(specifier)) return resolved.get(specifier)
  const resolvedURL = gear.resolve(specifier, contextURL)
  resolved.set(specifier, resolvedURL)
  return resolvedURL
}

function localBinding (module, source) {
  if (module.bindings.has(source)) return module.bindings.get(source)
  if (source === ExportSource.Default) {
    const binding = new DefaultBinding({ module })
    module.bindings.set(source, binding)
    return binding
  } else {
    const binding = new NameBinding({ module, name: source })
    module.bindings.set(source, binding)
    return binding
  }
}

export default analyzeEcmascriptNode
