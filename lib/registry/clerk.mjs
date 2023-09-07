import * as responder from './responder/surface.mjs'
import { InvalidError } from '#lib/error.mjs'

function clerk (message) {
  if (typeof message !== 'object') {
    throw new InvalidError({
      code: 'InvalidMessage',
      value: message,
      note: 'must be object'
    })
  } else if (!Number.isSafeInteger(message.id) || message.id <= 0) {
    throw new InvalidError({
      code: 'InvalidMessageID',
      value: message.id,
      note: 'must be positive integer'
    })
  }
  switch (message.type) {
    case 'ordinal': return responder.ordinal(message)
    case 'facade': return responder.facade(message)
  }
  throw new InvalidError({
    code: 'UnrecognizedMessageType',
    value: message.type
  })
}

export default clerk
