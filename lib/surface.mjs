import host from './pose.mjs'
import all from './all/surface.mjs'
import clear from './clear.mjs'
import default_ from './default.mjs'
import { ice } from '#lib/object.mjs'

ice(host, {
  all,
  clear,
  default: default_
})

export default host
