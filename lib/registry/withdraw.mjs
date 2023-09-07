import state from './state.mjs'
import { PoseState } from './enum.mjs'
import { MissingError } from '#lib/error.mjs'

function withdraw (targetURL, ordinal) {
  if (!state.modules.has(targetURL)) {
    throw new MissingError({
      code: 'MissingModule',
      label: targetURL
    })
  }
  const module = state.modules.get(targetURL)
  if (!module.poses.has(ordinal)) {
    throw new MissingError({
      code: 'MissingPose',
      label: targetURL,
      value: ordinal
    })
  }
  const pose = module.poses.get(ordinal)
  pose.state = PoseState.Loaded
  const { facade } = pose
  if (ordinal !== module.current) module.poses.delete(ordinal)
  return facade
}

export default withdraw
