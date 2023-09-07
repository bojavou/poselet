import { cast } from '#lib/object.mjs'

export const PoseState = cast({
  Unloaded: Symbol('poselet:PoseState.Unloaded'),
  Loading: Symbol('poselet:PoseState.Loading'),
  Loaded: Symbol('poselet:PoseState.Loaded')
})
