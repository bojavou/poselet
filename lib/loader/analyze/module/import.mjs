class Import {
  name
  request
  binding

  constructor (options) {
    if (!options) return
    ;({
      name: this.name,
      request: this.request,
      binding: this.binding
    } = options)
  }
}

export default Import
