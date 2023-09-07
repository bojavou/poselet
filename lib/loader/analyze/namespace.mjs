import state from '../state.mjs'
import { NamespaceBinding } from './module/surface.mjs'

function namespace (locator) {
  if (state.namespaces.has(locator)) return state.namespaces.get(locator)
  const binding = new NamespaceBinding()
  binding.locator = locator
  state.namespaces.set(locator, binding)
  return binding
}

export default namespace
