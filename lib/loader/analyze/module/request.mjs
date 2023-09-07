class ImportRequest {
  specifier
  module
  name

  constructor (options) {
    if (!options) return
    ;({
      specifier: this.specifier,
      module: this.module,
      name: this.name
    } = options)
  }
}

export default ImportRequest
