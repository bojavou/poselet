import errored from './errored.mjs'
import receiver from './receiver.mjs'
import state from './state.mjs'
import { cast } from '#lib/object.mjs'
import { InvalidError, StateError } from '#lib/error.mjs'

function install (port) {
  if (state.installed) {
    throw new StateError({
      code: 'DoubleInstall',
      message: 'Attempted to install poselet registry twice'
    })
  }
  if (!(port instanceof MessagePort)) {
    throw new InvalidError({
      code: 'InvalidPort',
      value: port,
      note: 'must be MessagePort'
    })
  }
  state.port = port
  state.installed = true
  state.port.addEventListener('messageerror', errored, cast({
    passive: true,
    once: true
  }))
  state.port.addEventListener('message', receiver, cast({ passive: true }))
  state.port.unref()
  state.port.start()
}

export default install
