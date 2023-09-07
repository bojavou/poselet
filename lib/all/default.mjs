import deposit from '#lib/registry/deposit.mjs'
import { cast } from '#lib/object.mjs'

function poseAllDefault (specifier, value, depth) {
  deposit(specifier, cast({ default: value }), depth, true)
}

export default poseAllDefault
