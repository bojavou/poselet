import manifestedType from './manifest.mjs'
import path from 'node:path'
import { ModuleType } from '../enum.mjs'

async function requiredType (modulePath) {
  const extension = path.extname(modulePath)
  switch (extension) {
    case '.cjs': return ModuleType.CommonJS
    case '.mjs': return ModuleType.ECMAScript
    case '.js': return await manifestedType(modulePath)
    case '.json': return ModuleType.JSON
    case '.node': return ModuleType.Addon
    default: return ModuleType.CommonJS
  }
}

export default requiredType
