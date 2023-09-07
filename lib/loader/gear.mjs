import { resolve as importMetaResolve } from 'import-meta-resolve'
import { bare } from '#lib/object.mjs'

const gear = bare({
  load: null,
  resolve: importMetaResolve
})

export default gear
