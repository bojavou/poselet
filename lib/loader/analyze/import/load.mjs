import gear from '#lib/loader/gear.mjs'
import translateFormat from './format.mjs'
import translateSource from './source.mjs'
import { cast } from '#lib/object.mjs'

async function loadImportedModule (moduleURL) {
  const loaded = await gear.load(moduleURL)
  const type = translateFormat(loaded.format)
  const code = translateSource(type, loaded.source)
  return cast({ type, code })
}

export default loadImportedModule
