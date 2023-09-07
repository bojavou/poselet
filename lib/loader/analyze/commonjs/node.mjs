import analyzeCommonjsFile from './file.mjs'
import fs from 'node:fs/promises'
import Module from '../module.mjs'
import nodeModule from 'node:module'
import { cast } from '#lib/object.mjs'
import { ExportSource, ModuleType } from '../enum.mjs'
import {
  DefaultBinding, ImportRequest, NameBinding, NamedExport, WildcardExport
} from '../module/surface.mjs'

const options = cast({
  encoding: 'utf8'
})

async function analyzeCommonjsNode (modulePath) {
  // Analyze file
  const code = await fs.readFile(modulePath, options)
  const file = analyzeCommonjsFile(code)

  // Create module
  const module = new Module()
  module.type = ModuleType.CommonJS

  // Construct named and default exports
  for (const [name, whence] of file.exports) {
    if (whence.local === ExportSource.Default) {
      const binding = new DefaultBinding({ module })
      module.bindings.set(ExportSource.Default, binding)
      const offer = new NamedExport({ name, binding })
      module.exports.set(name, offer)
    } else {
      const binding = new NameBinding({ module, name })
      module.bindings.set(name, binding)
      const offer = new NamedExport({ name, binding })
      module.exports.set(name, offer)
    }
  }

  // Construct wildcard exports
  if (file.wildcards.size) {
    const require = nodeModule.createRequire(modulePath)
    const seen = new Set()
    for (const specifier of file.wildcards) {
      const sourcePath = require.resolve(specifier)
      if (seen.has(sourcePath)) continue
      seen.add(sourcePath)
      const request = new ImportRequest({ specifier, module: sourcePath })
      const offer = new WildcardExport({ request })
      module.wildcards.add(offer)
    }
  }

  // Return module
  return module
}

export default analyzeCommonjsNode
