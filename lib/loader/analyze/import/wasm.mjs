/*
 * WASM modules are cached by URL.
 */

import Module from '../module.mjs'
import state from '../../state.mjs'
import { ModuleType } from '../enum.mjs'
import { NameBinding, NamedExport } from '../module/surface.mjs'

async function analyzeImportedWasm (moduleURL, wasmBinary) {
  if (state.modules.has(moduleURL)) return state.modules.get(moduleURL)
  const wasmModule = await WebAssembly.compile(wasmBinary)
  const descriptors = WebAssembly.Module.exports(wasmModule)
  const names = descriptors.map(descriptor => descriptor.name)
  const module = new Module()
  module.type = ModuleType.WASM
  for (const name of names) {
    const binding = new NameBinding({ module, name })
    module.bindings.set(name, binding)
    const offer = new NamedExport({ name, binding })
    module.exports.set(name, offer)
  }
  state.modules.set(moduleURL, module)
  return module
}

export default analyzeImportedWasm
