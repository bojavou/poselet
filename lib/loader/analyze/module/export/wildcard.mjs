import Export from './base.mjs'

class WildcardExport extends Export {
  request

  constructor (options) {
    super(options)
    if (!options) return
    ;({
      request: this.request
    } = options)
  }
}

export default WildcardExport
