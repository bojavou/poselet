import state from '../state.mjs'
import { ExhaustionError, InvalidError, TimeLimitError } from '#lib/error.mjs'

const limit = 1 * 1000 // 1 second

async function query (request) {
  const id = state.ids.alloc()
  if (id === null) throw new ExhaustionError('Exhausted available request IDs')
  request.id = id
  let timer
  const received = new Promise((resolve, reject) => {
    timer = setTimeout(() => {
      reject(new TimeLimitError('Registry never responded to loader request'))
    }, limit)
    state.requests.set(id, resolve)
    state.port.postMessage(request)
  })
  try {
    const response = await received
    if (response?.type !== request.type) {
      const type = response?.type
      throw new InvalidError({
        code: 'UnexpectedResponseType',
        value: type
      })
    }
    return response
  } finally {
    clearTimeout(timer)
    state.requests.delete(id)
    state.ids.free(id)
  }
}

export default query
