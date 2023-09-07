import fs from 'node:fs/promises'
import { pkgUp } from 'pkg-up'
import { cast } from '#lib/object.mjs'
import { ModuleType } from '../enum.mjs'

const options = cast({
  encoding: 'utf8'
})

async function manifestedType (modulePath) {
  const manifestPath = await pkgUp(cast({ cwd: modulePath }))
  if (manifestPath === undefined) return ModuleType.CommonJS
  const manifestJson = await fs.readFile(manifestPath, options)
  const manifest = JSON.parse(manifestJson)
  if (manifest?.type === 'module') return ModuleType.ECMAScript
  else return ModuleType.CommonJS
}

export default manifestedType
