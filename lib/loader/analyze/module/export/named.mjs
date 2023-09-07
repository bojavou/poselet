import Export from './base.mjs'

class NamedExport extends Export {
  name
  import
  request
  binding

  constructor (options) {
    super(options)
    if (!options) return
    ;({
      name: this.name,
      import: this.import,
      request: this.request,
      binding: this.binding
    } = options)
  }
}

export default NamedExport
