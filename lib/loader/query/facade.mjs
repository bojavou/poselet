import query from './base.mjs'
import { bare, cast } from '#lib/object.mjs'
import { DuplicateError, InvalidError } from '#lib/error.mjs'

async function queryFacade (url, ordinal) {
  const request = bare({ type: 'facade', url, ordinal })
  const response = await query(request)
  const { names, full } = response
  if (!Array.isArray(names)) {
    throw new InvalidError({
      code: 'InvalidFacade',
      value: names,
      note: 'must be array'
    })
  }
  for (const name of names) {
    if (typeof name === 'string' && name !== '') continue
    throw new InvalidError({
      code: 'InvalidName',
      value: name,
      note: 'must be nonempty string'
    })
  }
  const set = new Set(names)
  if (set.size !== names.length) {
    throw new DuplicateError({
      code: 'DuplicateName',
      message: 'Facade contained duplicate name'
    })
  }
  if (typeof full !== 'boolean') {
    throw new InvalidError({
      code: 'InvalidFull',
      value: full,
      note: 'must be boolean'
    })
  }
  return cast({ names: set, full })
}

export default queryFacade
