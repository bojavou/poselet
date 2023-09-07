import clerk from './clerk.mjs'

function receiver (event) {
  const message = event.data
  clerk(message)
}

export default receiver
