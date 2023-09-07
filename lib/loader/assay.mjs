import { cast } from '#lib/object.mjs'

function assayFacade (shape, facade) {
  const { bound, ambiguous } = shape
  const main = !facade.names.has('default') &&
    (bound.has('default') || ambiguous.has('default'))
  const named = assayNamed(shape, facade)
  const envelop = !(main || named)
  const relay = assayRelay(shape, facade)
  const assay = cast({ default: main, named, envelop, relay, ambiguous })
  return assay
}

function assayNamed (shape, facade) {
  for (const name of shape.bound) {
    if (name === 'default') continue
    if (!facade.names.has(name)) return true
  }
  for (const name of shape.ambiguous) {
    if (name === 'default') continue
    if (!facade.names.has(name)) return true
  }
  return false
}

function assayRelay (shape, facade) {
  const relay = new Set()
  for (const name of shape.bound) {
    if (!facade.names.has(name)) relay.add(name)
  }
  return relay
}

export default assayFacade
