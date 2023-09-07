import deposit from '#lib/registry/deposit.mjs'
import { InvalidError } from '#lib/error.mjs'

function poseAll (specifier, exports, depth) {
  if (typeof exports !== 'object') {
    throw new InvalidError({
      code: 'InvalidExports',
      value: exports,
      note: 'must be object'
    })
  }
  deposit(specifier, exports, depth, true)
}

export default poseAll
