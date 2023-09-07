import URL from './url.mjs'

function tag (string, ordinal) {
  const url = new URL(string)
  url.add('pose', ordinal ?? '')
  return url.serial
}

export default tag
