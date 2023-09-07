import Module from './module.mjs'
import { ExportSource, ModuleType } from './enum.mjs'
import { DefaultBinding, NamedExport } from './module/surface.mjs'

function analyzeJson () {
  const module = new Module()
  module.type = ModuleType.JSON
  const binding = new DefaultBinding({ module })
  module.bindings.set(ExportSource.Default, binding)
  const offer = new NamedExport({ name: 'default', binding })
  module.exports.set('default', offer)
  return module
}

export default analyzeJson
