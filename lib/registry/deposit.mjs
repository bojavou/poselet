import 'string.prototype.iswellformed/auto'
import caller from '#lib/caller.mjs'
import gear from '#lib/gear.mjs'
import state from './state.mjs'
import { bare, cast } from '#lib/object.mjs'
import { PoseState } from './enum.mjs'
import { internalPrefix } from './value.mjs'
import { InvalidError, PermissionError } from '#lib/error.mjs'

function deposit (specifier, exports, depth, full = false) {
  if (typeof specifier !== 'string' || specifier === '') {
    throw new InvalidError({
      code: 'InvalidSpecifier',
      value: specifier,
      note: 'must be nonempty string'
    })
  }
  if (
    depth !== undefined &&
    (!Number.isSafeInteger(depth) || depth < 0)
  ) {
    throw new InvalidError({
      code: 'InvalidDepth',
      value: depth,
      note: 'must be nonnegative integer'
    })
  }
  const callerURL = caller(depth)
  const targetURL = gear.resolve(specifier, callerURL)
  if (targetURL.startsWith(internalPrefix)) {
    throw new PermissionError({
      code: 'ForbiddenPose',
      label: targetURL,
      note: 'internal files may not be posed'
    })
  }
  if (exports !== null) {
    const names = Object.keys(exports)
    for (const name of names) {
      if (name.isWellFormed()) continue
      throw new InvalidError({
        code: 'InvalidExportName',
        label: name,
        note: 'must be well-formed string'
      })
    }
  }
  const clear = exports === null
  if (state.modules.has(targetURL)) {
    const module = state.modules.get(targetURL)
    const prior = module.poses.get(module.current)
    if (prior.state !== PoseState.Loading) module.poses.delete(module.current)
    module.current += 1
    const facade = clear
      ? cast()
      : full ? cast(exports) : cast(prior.facade, exports)
    const pose = bare({ facade, full, state: PoseState.Unloaded })
    module.poses.set(module.current, pose)
  } else {
    const facade = clear ? cast() : cast(exports)
    const pose = bare({ facade, full, state: PoseState.Unloaded })
    const poses = new Map()
    poses.set(1, pose)
    const module = bare({ current: 1, poses })
    state.modules.set(targetURL, module)
  }
}

export default deposit
