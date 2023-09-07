import analzeImportedGraph from './analyze/import/graph.mjs'
import assayFacade from './assay.mjs'
import generatePosedModule from './generate.mjs'
import fitFacade from './fit.mjs'
import gear from './gear.mjs'
import queryFacade from './query/facade.mjs'
import state from './state.mjs'
import URL from './url.mjs'
import { cast } from '#lib/object.mjs'
import { dataPrefix, nodePrefix } from './value.mjs'

async function load (locator, context, next) {
  // Extract underlying load routine
  gear.load ??= next

  // Pass through untaggable modules
  if (
    locator.startsWith(nodePrefix) ||
    locator.startsWith(dataPrefix)
  ) return next(locator)

  // Parse module URL
  const url = new URL(locator)
  const ordinalString = url.get('pose')

  // Pass through unposed modules
  if (ordinalString === '') return next(locator)

  // Extract pose ordinal
  const ordinal = Number.parseInt(ordinalString, 10)
  url.delete('pose')
  const untagged = url.serial

  // Analyze authentic module shape
  // Query registry for posed facade
  const [shape, facade] = await Promise.all([
    analzeImportedGraph(untagged).then(module => module.resolve()),
    queryFacade(untagged, ordinal)
  ])

  // Validate facade
  fitFacade(shape, facade)

  // Generate wrapper module
  const assay = assayFacade(shape, facade)
  const source = generatePosedModule(untagged, ordinal, assay, facade)
  state.wrapping.add(locator)
  return cast({ shortCircuit: true, format: 'module', source })
}

export default load
