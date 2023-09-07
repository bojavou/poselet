import protostate from '#lib/launcher/protostate.cjs'
import { LackError } from '#lib/error.mjs'

if (!protostate.present) {
  throw new LackError({
    code: 'LackLoader',
    message: 'Loader absent',
    note: 'run with --loader=poselet/loader'
  })
}
