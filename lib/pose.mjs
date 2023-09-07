import deposit from '#lib/registry/deposit.mjs'
import { cast } from '#lib/object.mjs'
import { InvalidError } from '#lib/error.mjs'

function pose (specifier, exports, depth) {
  if (typeof exports !== 'object') {
    throw new InvalidError({
      code: 'InvalidExports',
      value: exports,
      note: 'must be object'
    })
  }
  deposit(specifier, cast(exports), depth)
}

export default pose
