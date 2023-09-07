import query from './base.mjs'
import { bare } from '#lib/object.mjs'
import { InvalidError } from '#lib/error.mjs'

async function queryOrdinal (url) {
  const request = bare({ type: 'ordinal', url })
  const response = await query(request)
  const { ordinal } = response
  if (
    ordinal !== null &&
    (!Number.isSafeInteger(ordinal) || ordinal <= 0)
  ) {
    throw new InvalidError({
      code: 'InvalidOrdinal',
      value: ordinal,
      note: 'must be positive integer'
    })
  }
  return ordinal
}

export default queryOrdinal
