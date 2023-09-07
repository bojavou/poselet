import Binding from './base.mjs'

class NamespaceBinding extends Binding {
  locator

  constructor (options) {
    super(options)
    if (!options) return
    ;({
      locator: this.locator
    } = options)
  }
}

export default NamespaceBinding
