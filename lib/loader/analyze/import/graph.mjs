import analyzeEcmascriptGraph from '../ecmascript/graph.mjs'
import analyzeImportedCommonjsGraph from './commonjs.mjs'
import analyzeImportedJson from '../import/json.mjs'
import analyzeImportedWasm from '../import/wasm.mjs'
import loadImportedModule from './load.mjs'
import state from '#lib/loader/state.mjs'
import { cast } from '#lib/object.mjs'
import { ModuleType } from '../enum.mjs'
import { InvalidError } from '#lib/error.mjs'

const analyzers = cast({
  [ModuleType.ECMAScript]: analyzeEcmascriptGraph,
  [ModuleType.CommonJS]: analyzeImportedCommonjsGraph,
  [ModuleType.JSON]: analyzeImportedJson,
  [ModuleType.WASM]: analyzeImportedWasm
})

async function analyzeImportedGraph (moduleURL) {
  // Use URL keyed cached result
  if (state.modules.has(moduleURL)) return state.modules.get(moduleURL)

  // Load module
  // TODO: Relay parentURL
  // TODO: Relay import attributes
  // TODO: Relay export conditions
  const { type, code } = await loadImportedModule(moduleURL, {})

  // Analyze module
  const analyzer = analyzers[type]
  if (analyzer) return await analyzer(moduleURL, code)
  throw new InvalidError({
    code: 'UnexpectedModuleType',
    value: type
  })
}

export default analyzeImportedGraph
