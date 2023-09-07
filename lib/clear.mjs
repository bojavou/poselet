import deposit from '#lib/registry/deposit.mjs'

function clearPose (specifier, depth) {
  deposit(specifier, null, depth)
}

export default clearPose
