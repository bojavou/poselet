import state from '../state.mjs'
import { cast } from '#lib/object.mjs'
import { InvalidError, MissingError } from '#lib/error.mjs'

function respondFacade (message) {
  const { id, url, ordinal } = message
  if (typeof url !== 'string' || url === '') {
    throw new InvalidError({
      code: 'InvalidModuleURL',
      value: url,
      note: 'must be URL string'
    })
  } else if (!Number.isSafeInteger(ordinal) || ordinal <= 0) {
    throw new InvalidError({
      code: 'InvalidOrdinal',
      value: ordinal,
      note: 'must be positive integer'
    })
  } else if (!state.modules.has(url)) {
    throw new MissingError({
      code: 'MissingModule',
      value: url
    })
  }
  const module = state.modules.get(url)
  if (!module.poses.has(ordinal)) {
    throw new MissingError({
      code: 'MissingOrdinal',
      label: url,
      value: ordinal
    })
  }
  const { facade, full } = module.poses.get(ordinal)
  const names = Object.getOwnPropertyNames(facade)
  const response = cast({ type: 'facade', id, names, full })
  state.port.postMessage(response)
}

export default respondFacade
