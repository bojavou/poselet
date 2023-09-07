const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
const lastIndex = alphabet.length - 1

// Generate an infinite series of unique identifiers
function * generateIdentifiers () {
  let prefix = ''
  let index = 0
  let tail = alphabet[0]
  while (true) {
    yield '$' + prefix + tail
    if (index === lastIndex) {
      prefix = advancePrefix(prefix)
      index = 0
    } else index += 1
    tail = alphabet[index]
  }
}

function advancePrefix (prefix) {
  if (!prefix.length) return alphabet[0]
  for (let index = prefix.length - 1; index > -1; --index) {
    const character = prefix[index]
    const characterIndex = alphabet.indexOf(character)
    const wrap = characterIndex === lastIndex
    const advancedIndex = wrap ? 0 : characterIndex + 1
    const advanced = alphabet[advancedIndex]
    prefix = replaceAt(prefix, index, advanced)
    if (!wrap) return prefix
  }
  prefix += alphabet[0]
  return prefix
}

function replaceAt (string, index, character) {
  const prefix = string.slice(0, index)
  const suffix = string.slice(index + 1)
  return prefix + character + suffix
}

export default generateIdentifiers
