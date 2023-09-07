import state from '../state.mjs'
import { InvalidError } from '#lib/error.mjs'

function receiveMessage (event) {
  if (!(event instanceof MessageEvent)) {
    throw new InvalidError({
      code: 'InvalidEventType',
      value: event,
      note: 'must be MessageEvent'
    })
  }
  const message = event.data
  if (!state.requests.has(message.id)) {
    throw new InvalidError({
      code: 'UnrecognizedRequestID',
      value: message.id
    })
  }
  const resolve = state.requests.get(message.id)
  resolve(message)
}

export default receiveMessage
