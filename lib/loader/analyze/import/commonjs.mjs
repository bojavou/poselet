import analyzeCommonjsGraph from '../commonjs/graph.mjs'
import state from '#lib/loader/state.mjs'
import url from 'node:url'
import WrapperModule from '../wrapper.mjs'
import { ExportSource, ModuleType } from '../enum.mjs'
import {
  DefaultBinding, NameBinding, NamedExport
} from '../module/surface.mjs'

async function analyzeImportedCommonjsGraph (fileURL) {
  // Use cached result
  if (state.modules.has(fileURL)) return state.modules.get(fileURL)

  // Analyze module
  const modulePath = url.fileURLToPath(fileURL)
  if (!state.analyzing.has(modulePath)) {
    const operation = analyzeCommonjsGraph(modulePath)
      .finally(() => { state.analyzing.delete(modulePath) })
    state.analyzing.set(modulePath, operation)
  }
  const module = await state.analyzing.get(modulePath)

  // Synthesize wrapper module
  const wrapper = new WrapperModule()
  wrapper.type = ModuleType.CommonJSWrapper
  wrapper.wrapped = module
  state.modules.set(fileURL, wrapper)
  const shape = module.resolve()
  for (const name of shape.bound) {
    if (name === 'default') {
      const binding = new DefaultBinding({ module: wrapper })
      wrapper.bindings.set(ExportSource.Default, binding)
      const offer = new NamedExport({ name: 'default', binding })
      wrapper.exports.set('default', offer)
    } else {
      const binding = new NameBinding({ module: wrapper, name })
      wrapper.bindings.set(name, binding)
      const offer = new NamedExport({ name, binding })
      wrapper.exports.set(name, offer)
    }
  }

  // Return wrapper module
  return wrapper
}

export default analyzeImportedCommonjsGraph
