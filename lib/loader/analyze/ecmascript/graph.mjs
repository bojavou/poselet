/*
 * An export of a namespace import only adds a single name to the surface.
 * Namespace imports therefore do not on their own require analyzing the
 * source module. Namespace bindings are cached independently to enable
 * tracing them even when their source module has not been analyzed.
 */

/*
 * Wildcard exports are coalesced in 3 stages.
 *
 * File analysis coalesces identical specifiers:
 * export * from './source.mjs'
 * export * from './source.mjs'
 *
 * Node analysis coalesces identical resolved locators:
 * export * from './source.mjs'
 * export * from './directory/../source.mjs'
 *
 * JSON modules at file URLs are cached by path. Once the module type is
 * determined, graph analysis coalesces identical cache keys:
 * export * from './source.json' assert { type: 'json' }
 * export * from './source.json?param=value' assert { type: 'json' }
 * export * from './source.json#fragment' assert { type: 'json' }
 */

/*
 * V8 offers a SyntheticModule feature. Node.js uses this to integrate CommonJS
 * modules into the ECMAScript module graph. When a CJS module is imported,
 * its export surface is analyzed with cjs-module-lexer and a synthetic ESM
 * wrapper is created. The wrapper loads the CJS module and copies its analyzed
 * exports to the ESM surface. This situation has the following properties.
 *
 * Bindings are not traced into CJS modules.
 *
 * Wildcard exports in CJS modules are merged. Identical names in multiple
 * wildcard exports never raise ambiguity errors.
 *
 * // source1.cjs
 * module.exports.value = 1
 *
 * // source2.cjs
 * module.exports.value = 2
 *
 * // aggregate.cjs
 * module.exports = {
 *   ...require('./source1.cjs'),
 *   ...require('./source2.cjs')
 * }
 *
 * // entry.mjs
 * import { value } from './aggregate.cjs'
 * // value === 2
 *
 * URL query and fragment are significant in the cache key of the wrapper
 * module. Distinct URLs produce distinct wrappers. This means wildcard
 * exporting the same CJS module with distinct URLs always produces ambiguity
 * because the CJS exports collide with themselves, despite loading the CJS
 * module only once.
 *
 * // source.cjs
 * module.exports.value = 42
 *
 * // aggregate.mjs
 * export * from './source.cjs'
 * export * from './source.cjs?param=value'
 *
 * // entry.mjs
 * import { value } from './aggregate.mjs'
 * // SyntaxError: .. conflicting star exports for name 'value'
 */

import analyzeImportedGraph from '../import/graph.mjs'
import analyzeEcmascriptNode from './node.mjs'
import namespace from '../namespace.mjs'
import state from '#lib/loader/state.mjs'
import url from 'node:url'
import { NamespaceBinding } from '../module/surface.mjs'
import { ModuleType } from '../enum.mjs'
import { bare } from '#lib/object.mjs'

const filePrefix = 'file:'

async function analyzeEcmascriptGraph (moduleURL, code) {
  // Analyze entry module
  const module = analyzeEcmascriptNode(moduleURL, code)
  state.modules.set(moduleURL, module)

  // Find binding relevant sources
  const sources = new Map()
  for (const offer of module.exports.values()) {
    if (offer.import) {
      if (sources.has(offer.import.request.module)) continue
      sources.set(offer.import.request.module, bare())
    } else if (offer.request) {
      if (sources.has(offer.request.module)) continue
      sources.set(offer.request.module, bare())
    }
  }
  for (const wildcard of module.wildcards) {
    if (sources.has(wildcard.request.module)) continue
    sources.set(wildcard.request.module, bare())
  }

  // Analyze sources
  for (const sourceURL of sources.keys()) {
    const module = await analyzeImportedGraph(sourceURL)
    sources.set(sourceURL, module)
  }

  // Link to sources
  for (const offer of module.exports.values()) {
    if (offer.binding) {
      if (offer.binding instanceof NamespaceBinding) {
        offer.binding = namespace(offer.binding.locator)
      }
    } else if (offer.import) {
      const source = sources.get(offer.import.request.module)
      offer.import.request.module = source
    } else if (offer.request) {
      const source = sources.get(offer.request.module)
      offer.request.module = source
    }
  }
  const wildcards = new Map()
  for (const wildcard of module.wildcards) {
    // Link wildcards
    // Coalesce type aware identical wildcards
    const sourceURL = wildcard.request.module
    const source = sources.get(sourceURL)
    const sourceLocator = pathKeyed(source.type)
      ? url.fileURLToPath(sourceURL)
      : sourceURL
    if (wildcards.has(sourceLocator)) continue
    wildcard.request.module = sources.get(sourceURL)
    wildcards.set(sourceLocator, wildcard)
  }
  module.wildcards = new Set(wildcards.values())
  for (const pull of module.imports.values()) {
    if (pull.binding && pull.binding instanceof NamespaceBinding) {
      // Coalesce exported namespace imports
      pull.binding = namespace(pull.binding.locator)
    }
  }

  // Return linked module
  return module
}

function pathKeyed (moduleURL, type) {
  return type === ModuleType.JSON && moduleURL.startsWith(filePrefix)
}

export default analyzeEcmascriptGraph
