import * as lexer from 'cjs-module-lexer'
import ModuleFile from '../file.mjs'
import { ExportSource, ModuleType } from '../enum.mjs'
import { cast } from '#lib/object.mjs'

await lexer.init()

function analyzeCommonjsFile (code) {
  const file = new ModuleFile()
  file.type = ModuleType.CommonJS
  file.exports.set('default', cast({ local: ExportSource.Default }))
  const result = lexer.parse(code)
  for (const name of result.exports) {
    const whence = cast({ local: name })
    file.exports.set(name, whence)
  }
  for (const source of result.reexports) file.wildcards.add(source)
  return file
}

export default analyzeCommonjsFile
