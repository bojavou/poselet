import { NumberAllocator } from 'number-allocator'
import { bare } from '#lib/object.mjs'

const state = bare({
  ids: new NumberAllocator(1, 100_000),
  requests: new Map(),
  modules: new Map(),
  namespaces: new Map(),
  typing: new Map(),
  analyzing: new Map(),
  wrapping: new Set()
})

export default state
