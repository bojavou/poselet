import { cast } from '#lib/object.mjs'
import { ModuleType } from '../enum.mjs'
import { InvalidError } from '#lib/error.mjs'

const formats = cast({
  commonjs: ModuleType.CommonJS,
  json: ModuleType.JSON,
  module: ModuleType.ECMAScript,
  wasm: ModuleType.WASM
})

function translateFormat (format) {
  if (format in formats) return formats[format]
  throw new InvalidError({
    code: 'UnsupportedModuleFormat',
    value: format
  })
}

export default translateFormat
