import manifestedType from './manifest.mjs'
import path from 'node:path'
import url from 'node:url'
import { ModuleType } from '../enum.mjs'
import { InvalidError } from '#lib/error.mjs'

async function importedType (moduleURL) {
  return await importedFileType(moduleURL)
}

async function importedFileType (fileURL) {
  const modulePath = url.fileURLToPath(fileURL)
  const extension = path.extname(modulePath)
  switch (extension) {
    case '.mjs': return ModuleType.ECMAScript
    case '.cjs': return ModuleType.CommonJS
    case '.js': return await manifestedType(modulePath)
    case '.json': return ModuleType.JSON
    case '.wasm': return ModuleType.WASM
  }
  throw new InvalidError({
    code: 'InvalidExtension',
    value: extension
  })
}

export default importedType
