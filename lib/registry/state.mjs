import { bare } from '#lib/object.mjs'

const state = bare({
  installed: false,
  modules: new Map()
})

export default state
