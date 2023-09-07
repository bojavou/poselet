import { InvalidError } from '#lib/error.mjs'

function errored (event) {
  throw new InvalidError({
    code: 'RegistryPortError',
    message: 'Poselet registry received an invalid message'
  })
}

export default errored
