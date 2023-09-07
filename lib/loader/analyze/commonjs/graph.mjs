/*
 * The CommonJS module cache has the following properties:
 * - The same cache is used by both require and import.
 * - The cache key omits the URL query and fragment possible via import.
 *
 * The logic here caches by file path to match those semantics.
 * The file path is always fully resolved and absolute,
 * and therefore will never collide with file URLs used by the ESM cache.
 */

/*
 * Imported surface formation for CommonJS modules takes a shortcut:
 * All statically analyzed named exports are included,
 * even if they are subsequently removed by module.exports assignment.
 *
 * The following CommonJS module when imported provides exports `a` `b` `c`,
 * defaulting their values to `undefined` if `source.cjs` does not define them.
 *
 * module.exports.a = 1
 * module.exports.b = 2
 * module.exports.c = 3
 * module.exports = require('./source.cjs')
 */

/*
 * There are no nonlocal bindings in CommonJS. Every export is bound locally.
 * That makes nonwildcard requires irrelevant to module shape.
 * This analysis does not attempt to track CommonJS requires.
 */

import analyzeAddon from '../require/addon.mjs'
import analyzeCommonjsNode from './node.mjs'
import analyzeJsonFile from '../file/json.mjs'
import requiredType from '../type/require.mjs'
import state from '#lib/loader/state.mjs'
import { bare } from '#lib/object.mjs'
import { ModuleType } from '../enum.mjs'
import { InvalidError } from '#lib/error.mjs'

async function analyzeCommonjsGraph (modulePath) {
  // Use cached result
  if (state.modules.has(modulePath)) return state.modules.get(modulePath)

  // Analyze module
  const module = await analyzeCommonjsNode(modulePath)
  state.modules.set(modulePath, module)

  // Find sources
  const sources = new Map()
  for (const wildcard of module.wildcards) {
    if (sources.has(wildcard.request.module)) continue
    sources.set(wildcard.request.module, bare())
  }

  // Type sources
  await Promise.all([...sources.entries()].map(([sourcePath, result]) => {
    if (!state.typing.has(sourcePath)) {
      const operation = requiredType(sourcePath)
        .finally(() => { state.typing.delete(sourcePath) })
      state.typing.set(sourcePath, operation)
    }
    return state.typing.get(sourcePath).then(type => { result.type = type })
  }))

  // Analyze sources
  await Promise.all([...sources.entries()].map(([sourcePath, result]) => {
    const { type } = result
    if (!state.analyzing.has(sourcePath)) {
      const operation = analyzeCommonjsSource(modulePath, sourcePath, type)
        .finally(() => { state.analyzing.delete(sourcePath) })
      state.analyzing.set(sourcePath, operation)
    }
    return state.analyzing.get(sourcePath).then(module => {
      result.module = module
    })
  }))

  // Link to sources
  for (const wildcard of module.wildcards) {
    const { module } = sources.get(wildcard.request.module)
    wildcard.request.module = module
  }

  // Return linked module
  return module
}

async function analyzeCommonjsSource (modulePath, sourcePath, sourceType) {
  switch (sourceType) {
    case ModuleType.CommonJS: return await analyzeCommonjsGraph(sourcePath)
    case ModuleType.ECMAScript:
      throw new InvalidError({
        code: 'RequireESM',
        message: `Require of ECMAScript module ${sourcePath}` +
          ` from CommonJS module ${modulePath}`
      })
    case ModuleType.JSON: return analyzeJsonFile(sourcePath)
    case ModuleType.Addon: return analyzeAddon(sourcePath)
  }
  throw new InvalidError({
    code: 'UnrecognizedModuleType',
    value: sourceType
  })
}

export default analyzeCommonjsGraph
