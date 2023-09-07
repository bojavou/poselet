import Module from '../module.mjs'
import state from '../../state.mjs'
import { ExportSource, ModuleType } from '../enum.mjs'
import { DefaultBinding, NamedExport } from '../module/surface.mjs'

function analyzeAddon (modulePath) {
  if (state.modules.has(modulePath)) return state.modules.get(modulePath)
  const module = new Module()
  module.type = ModuleType.Addon
  const binding = new DefaultBinding({ module })
  module.bindings.set(ExportSource.Default, binding)
  const entry = new NamedExport({ name: 'default', binding })
  module.exports.set('default', entry)
  state.modules.set(modulePath, module)
  return module
}

export default analyzeAddon
