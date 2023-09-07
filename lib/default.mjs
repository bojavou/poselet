import deposit from '#lib/registry/deposit.mjs'
import { cast } from '#lib/object.mjs'

function poseDefault (specifier, value, depth) {
  deposit(specifier, cast({ default: value }), depth)
}

export default poseDefault
