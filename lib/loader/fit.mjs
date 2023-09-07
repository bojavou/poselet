import { InvalidError } from '#lib/error.mjs'

function fitFacade (shape, facade) {
  for (const name of facade.names) {
    if (shape.ambiguous.has(name)) {
      throw new InvalidError({
        code: 'AmbiguousPose',
        label: name,
        note: 'ambiguous exports may not be posed'
      })
    } else if (!shape.bound.has(name)) {
      throw new InvalidError({
        code: 'PhantomPose',
        label: name,
        note: 'undefined exports may not be posed'
      })
    }
  }
}

export default fitFacade
