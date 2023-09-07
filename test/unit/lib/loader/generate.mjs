import test from 'ava'
import generate from '#lib/loader/generate.mjs'
import inlineModule from '#lib/loader/generate/inline.mjs'
import { withdrawURL } from '#lib/loader/value.mjs'

const withdrawSpecifier = JSON.stringify(withdrawURL)
const authentic = 'file:///'
const ordinal = 1
const specifier = JSON.stringify(authentic)

test('bare', t => {
  const assay = { envelop: true, default: false, named: false }
  const facade = { names: new Set(), full: false }
  const result = generate(authentic, ordinal, assay, facade)
  t.is(result, `
import ${specifier}
`.trim())
})

test('unchanged default', t => {
  const assay = { envelop: false, default: true, named: false }
  const facade = { names: new Set(), full: false }
  const result = generate(authentic, ordinal, assay, facade)
  t.is(result, `
export { default } from ${specifier}
`.trim())
})

test('unchanged named', t => {
  const assay = { envelop: false, default: false, named: true }
  const facade = { names: new Set(), full: false }
  const result = generate(authentic, ordinal, assay, facade)
  t.is(result, `
export * from ${specifier}
`.trim())
})

test('unchanged default named', t => {
  const assay = { envelop: false, default: true, named: true }
  const facade = { names: new Set(), full: false }
  const result = generate(authentic, ordinal, assay, facade)
  t.is(result, `
export { default } from ${specifier}
export * from ${specifier}
`.trim())
})

test('envelop default', t => {
  const assay = { envelop: true, default: false, named: false }
  const facade = { names: new Set(['default']), full: false }
  const result = generate(authentic, ordinal, assay, facade)
  t.is(result, `
import ${specifier}
import withdraw from ${withdrawSpecifier}
const facade = withdraw(${specifier}, ${ordinal})
export default facade.default
`.trim())
})

test('envelop named', t => {
  const assay = { envelop: true, default: false, named: false }
  const facade = { names: new Set(['a', 'b', 'c']), full: false }
  const result = generate(authentic, ordinal, assay, facade)
  t.is(result, `
import ${specifier}
import withdraw from ${withdrawSpecifier}
const facade = withdraw(${specifier}, ${ordinal})
export const { a, b, c } = facade
`.trim())
})

test('envelop default named', t => {
  const assay = { envelop: true, default: false, named: false }
  const facade = { names: new Set(['default', 'a', 'b', 'c']), full: false }
  const result = generate(authentic, ordinal, assay, facade)
  t.is(result, `
import ${specifier}
import withdraw from ${withdrawSpecifier}
const facade = withdraw(${specifier}, ${ordinal})
export default facade.default
export const { a, b, c } = facade
`.trim())
})

test('envelop named string', t => {
  const assay = { envelop: true, default: false, named: false }
  const facade = {
    names: new Set(['string a', 'string b', 'string c']),
    full: false
  }
  const result = generate(authentic, ordinal, assay, facade)
  t.is(result, `
import ${specifier}
import withdraw from ${withdrawSpecifier}
const facade = withdraw(${specifier}, ${ordinal})
const { "string a": $a, "string b": $b, "string c": $c } = facade
export { $a as "string a", $b as "string b", $c as "string c" }
`.trim())
})

test('envelop named id string', t => {
  const assay = { envelop: true, default: false, named: false }
  const facade = {
    names: new Set(['a', 'b', 'string a', 'string b']),
    full: false
  }
  const result = generate(authentic, ordinal, assay, facade)
  t.is(result, `
import ${specifier}
import withdraw from ${withdrawSpecifier}
const facade = withdraw(${specifier}, ${ordinal})
const { a: $a, b: $b, "string a": $c, "string b": $d } = facade
export { $a as a, $b as b, $c as "string a", $d as "string b" }
`.trim())
})

test('envelop named id string coalesce', t => {
  const assay = { envelop: true, default: false, named: false }
  const facade = { names: new Set(['$a', '$b', 'string a']), full: false }
  const result = generate(authentic, ordinal, assay, facade)
  t.is(result, `
import ${specifier}
import withdraw from ${withdrawSpecifier}
const facade = withdraw(${specifier}, ${ordinal})
const { $a, $b, "string a": $c } = facade
export { $a, $b, $c as "string a" }
`.trim())
})

test('partial default', t => {
  const assay = { envelop: false, default: false, named: true }
  const facade = { names: new Set(['default']), full: false }
  const result = generate(authentic, ordinal, assay, facade)
  t.is(result, `
export * from ${specifier}
import withdraw from ${withdrawSpecifier}
const facade = withdraw(${specifier}, ${ordinal})
export default facade.default
`.trim())
})

test('partial named', t => {
  const assay = { envelop: false, default: true, named: true }
  const facade = { names: new Set(['a', 'b', 'c']), full: false }
  const result = generate(authentic, ordinal, assay, facade)
  t.is(result, `
export { default } from ${specifier}
export * from ${specifier}
import withdraw from ${withdrawSpecifier}
const facade = withdraw(${specifier}, ${ordinal})
export const { a, b, c } = facade
`.trim())
})

test('partial default named', t => {
  const assay = { envelop: false, default: false, named: true }
  const facade = { names: new Set(['default', 'a', 'b', 'c']), full: false }
  const result = generate(authentic, ordinal, assay, facade)
  t.is(result, `
export * from ${specifier}
import withdraw from ${withdrawSpecifier}
const facade = withdraw(${specifier}, ${ordinal})
export default facade.default
export const { a, b, c } = facade
`.trim())
})

test('full bound default', t => {
  const assay = {
    envelop: false,
    default: true,
    named: false,
    relay: new Set(['default']),
    ambiguous: new Set()
  }
  const facade = { names: new Set(['a', 'b', 'c']), full: true }
  const result = generate(authentic, ordinal, assay, facade)
  t.is(result, `
export default undefined
import withdraw from ${withdrawSpecifier}
const facade = withdraw(${specifier}, ${ordinal})
const { a: $a, b: $b, c: $c } = facade
export { $a as a, $b as b, $c as c }
`.trim())
})

test('full bound named', t => {
  const assay = {
    envelop: false,
    default: false,
    named: true,
    relay: new Set(['a', 'b']),
    ambiguous: new Set()
  }
  const facade = { names: new Set(['c']), full: true }
  const result = generate(authentic, ordinal, assay, facade)
  t.is(result, `
const $a = undefined, $b = undefined
export { $a as a, $b as b }
import withdraw from ${withdrawSpecifier}
const facade = withdraw(${specifier}, ${ordinal})
const { c: $c } = facade
export { $c as c }
`.trim())
})

test('full ambiguous default', t => {
  const assay = {
    envelop: false,
    default: true,
    named: false,
    relay: new Set(),
    ambiguous: new Set(['default'])
  }
  const facade = { names: new Set(['a', 'b', 'c']), full: true }
  const result = generate(authentic, ordinal, assay, facade)
  const message = 'The default export is backed by conflicting star exports'
  t.is(result, `
throw new SyntaxError('${message}')
import withdraw from ${withdrawSpecifier}
const facade = withdraw(${specifier}, ${ordinal})
export const { a, b, c } = facade
`.trim())
})

test('full ambiguous named', t => {
  const assay = {
    envelop: false,
    default: false,
    named: true,
    relay: new Set(),
    ambiguous: new Set(['value'])
  }
  const facade = { names: new Set(['a', 'b', 'c']), full: true }
  const result = generate(authentic, ordinal, assay, facade)
  const sourceCode = `
const value = undefined
export { value }
`.trim()
  const source1 = inlineModule(sourceCode + '\n// 1')
  const source2 = inlineModule(sourceCode + '\n// 2')
  t.is(result, `
export * from ${JSON.stringify(source1)}
export * from ${JSON.stringify(source2)}
import withdraw from ${withdrawSpecifier}
const facade = withdraw(${specifier}, ${ordinal})
export const { a, b, c } = facade
`.trim())
})

test('full ambiguous named string', t => {
  const assay = {
    envelop: false,
    default: false,
    named: true,
    relay: new Set(),
    ambiguous: new Set(['string value'])
  }
  const facade = { names: new Set(['a', 'b', 'c']), full: true }
  const result = generate(authentic, ordinal, assay, facade)
  const sourceCode = `
const $a = undefined
export { $a as "string value" }
`.trim()
  const source1 = inlineModule(sourceCode + '\n// 1')
  const source2 = inlineModule(sourceCode + '\n// 2')
  t.is(result, `
export * from ${JSON.stringify(source1)}
export * from ${JSON.stringify(source2)}
import withdraw from ${withdrawSpecifier}
const facade = withdraw(${specifier}, ${ordinal})
export const { a, b, c } = facade
`.trim())
})
