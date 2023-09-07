import analyzeJson from '../json.mjs'
import state from '#lib/loader/state.mjs'

function analyzeJsonFile (modulePath) {
  if (state.modules.has(modulePath)) return state.modules.get(modulePath)
  const module = analyzeJson()
  state.modules.set(modulePath, module)
  return module
}

export default analyzeJsonFile
