import getCallerFile from 'get-caller-file'
import pathURL from '#lib/url.mjs'

function caller (depth = 0) {
  const raw = getCallerFile(4 + depth)
  const callerURL = pathURL(raw)
  return callerURL
}

export default caller
