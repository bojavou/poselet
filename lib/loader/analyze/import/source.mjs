/*
 * For binary data, the Node.js load logic accepts any of TypedArray,
 * ArrayBuffer, and SharedArrayBuffer. When a binary value is provided for
 * a string format, the binary data is decoded as UTF-8. Decoding tolerates
 * invalid data and substitutes the Unicode replacement character.
 */

import { TextDecoder } from 'node:util'
import { ModuleType } from '../enum.mjs'
import { TypedArray } from '#lib/nether.mjs'
import { InvalidError } from '#lib/error.mjs'

const decoder = new TextDecoder('utf-8')

function translateSource (type, source) {
  switch (type) {
    case ModuleType.ECMAScript:
    case ModuleType.JSON:
      return translateStringSource(source)
    case ModuleType.WASM:
      return translateBinarySource(source)
    case ModuleType.CommonJS:
      return null
  }
  throw new InvalidError({
    code: 'UnexpectedModuleType',
    value: type
  })
}

function translateStringSource (source) {
  if (typeof source === 'string') return source
  if (
    source instanceof TypedArray ||
    source instanceof ArrayBuffer ||
    source instanceof SharedArrayBuffer
  ) return decoder.decode(source)
  throw new InvalidError({
    code: 'InvalidModuleSource',
    value: source,
    note: 'must be string or binary'
  })
}

function translateBinarySource (source) {
  if (
    source instanceof TypedArray ||
    source instanceof ArrayBuffer ||
    source instanceof SharedArrayBuffer
  ) return source
  throw new InvalidError({
    code: 'InvalidModuleSource',
    value: source,
    note: 'must be binary'
  })
}

export default translateSource
