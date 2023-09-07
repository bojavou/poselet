/*
 * JSON modules in files are cached by path in a single cache shared by both
 * imports and requires. Imports of all other URL schemes are cached by URL.
 */

import analyzeJson from '../json.mjs'
import analyzeJsonFile from '../file/json.mjs'
import state from '#lib/loader/state.mjs'
import url from 'node:url'

const filePrefix = 'file:'

function analyzeImportedJson (moduleURL) {
  if (moduleURL.startsWith(filePrefix)) {
    const modulePath = url.fileURLToPath(moduleURL)
    return analyzeJsonFile(modulePath)
  }
  const module = analyzeJson()
  state.modules.set(moduleURL, module)
  return module
}

export default analyzeImportedJson
