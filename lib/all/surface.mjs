import host from '../all.mjs'
import default_ from './default.mjs'
import { ice } from '#lib/object.mjs'

ice(host, {
  default: default_
})

export default host
