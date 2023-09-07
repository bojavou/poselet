import Binding from './base.mjs'

class NameBinding extends Binding {
  module
  name

  constructor (options) {
    super(options)
    if (!options) return
    ;({
      module: this.module,
      name: this.name
    } = options)
  }
}

export default NameBinding
