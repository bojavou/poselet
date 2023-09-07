import { InvalidError } from '#lib/error.mjs'

function receiveMessageError () {
  throw new InvalidError({
    code: 'InvalidMessage',
    message: 'Loader received an invalid message'
  })
}

export default receiveMessageError
