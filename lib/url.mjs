import url from 'node:url'
import { InvalidError } from '#lib/error.mjs'

function pathURL (value) {
  const parsed = parseURL(value)
  if (parsed === null) return url.pathToFileURL(value)
  if (parsed.protocol === 'file:') return parsed
  throw new InvalidError({
    code: 'InvalidCallerURL',
    value,
    note: 'must be file URL'
  })
}

function parseURL (value) {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

export default pathURL
