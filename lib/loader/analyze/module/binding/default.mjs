import Binding from './base.mjs'

class DefaultBinding extends Binding {
  module

  constructor (options) {
    super(options)
    if (!options) return
    ;({
      module: this.module
    } = options)
  }
}

export default DefaultBinding
