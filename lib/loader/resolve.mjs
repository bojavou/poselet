import queryOrdinal from './query/ordinal.mjs'
import state from './state.mjs'
import tag from './tag.mjs'
import unposed from './unposed.mjs'
import { bare } from '#lib/object.mjs'
import { dataPrefix, internalPrefix, nodePrefix } from './value.mjs'

async function resolve (specifier, context, next) {
  // Resolve specifier
  const resolved = await next(specifier)

  // Allow load of authentic module from pose wrapper module
  if (state.wrapping.has(context.parentURL)) {
    state.wrapping.delete(context.parentURL)
    const tagged = unposed(resolved.url)
    return bare(resolved, { url: tagged })
  }

  // Pass through untaggable modules
  if (
    resolved.url.startsWith(nodePrefix) ||
    resolved.url.startsWith(dataPrefix)
  ) return resolved

  // Detect unposable modules
  if (resolved.url.startsWith(internalPrefix)) {
    const tagged = unposed(resolved.url)
    return bare(resolved, { url: tagged })
  }

  // Query registry for pose
  const ordinal = await queryOrdinal(resolved.url)

  // Tag posable modules
  const tagged = tag(resolved.url, ordinal)
  return bare(resolved, { url: tagged })
}

export default resolve
