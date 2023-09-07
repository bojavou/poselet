import state from '../state.mjs'
import { cast } from '#lib/object.mjs'
import { PoseState } from '../enum.mjs'
import { InvalidError } from '#lib/error.mjs'

function respondOrdinal (message) {
  const { id, url } = message
  if (typeof url !== 'string' || url === '') {
    throw new InvalidError({
      code: 'InvalidModuleURL',
      value: url,
      note: 'must be URL string'
    })
  } else if (state.modules.has(url)) {
    const module = state.modules.get(url)
    const { current: ordinal } = module
    const pose = module.poses.get(ordinal)
    if (pose.state === PoseState.Unloaded) pose.state = PoseState.Loading
    const response = cast({ type: 'ordinal', id, ordinal })
    state.port.postMessage(response)
  } else {
    const response = cast({ type: 'ordinal', id, ordinal: null })
    state.port.postMessage(response)
  }
}

export default respondOrdinal
