/*
 * A default export can only be ambiguous when backed by a renaming export from
 * an aggregate module.
 *
 * // entry.mjs
 * export { gadget as default } from './aggregate.mjs'
 *
 * // aggregate.mjs
 * export * from './source1.mjs'
 * export * from './source2.mjs'
 *
 * // source1.mjs
 * export function gadget () {}
 *
 * // source2.mjs
 * export function gadget () {}
 *
 * This pattern always throws at module link time. Synthesizing true ambiguity
 * uses 3 inline modules and includes the generated data URL in the error
 * message, producing a confusing error. This logic instead produces a manual
 * syntax error. This loses some information (original export name 'gadget'
 * and module specifier './aggregate.mjs') but should be clear enough to
 * enable finding the issue.
 */

import ambiguousDefault from './generate/ambiguous/default.mjs'
import generateIdentifiers from './identifiers.mjs'
import inlineModule from './generate/inline.mjs'
import { bare, cast } from '#lib/object.mjs'
import { withdrawURL } from './value.mjs'

const withdrawSpecifier = JSON.stringify(withdrawURL)

const pattern = cast({
  identifier: /^(?:[$_\p{ID_Start}])(?:[$\u200C\u200D\p{ID_Continue}])*$/u
})

function generatePosedModule (authenticURL, ordinal, assay, facade) {
  const specifier = JSON.stringify(authenticURL)
  const state = bare({ aliases: null })
  const lines = []
  if (facade.full) generateElided(state, lines, assay)
  else if (assay.envelop) lines.push(`import ${specifier}`)
  else {
    if (assay.default) lines.push(`export { default } from ${specifier}`)
    if (assay.named) lines.push(`export * from ${specifier}`)
  }
  if (facade.names.size) {
    generateFacade(state, lines, specifier, ordinal, facade)
  }
  if (state.aliases) state.aliases.return()
  return lines.join('\n')
}

function generateElided (state, lines, assay) {
  if (assay.relay.size) generateElidedBound(state, lines, assay.relay)
  if (assay.ambiguous.size) {
    generateElidedAmbiguous(lines, assay.ambiguous)
  }
}

function generateElidedBound (state, lines, relay) {
  state.aliases ??= generateIdentifiers()
  const { aliases } = state
  const [main, identifiers, strings] = analyzeNames(relay)
  if (main) lines.push('export default undefined')
  const length = main ? relay.size - 1 : relay.size
  if (!length) return
  const declares = new Array(length)
  const exports = new Array(length)
  let index = 0
  for (const name of identifiers) {
    const { value: alias } = aliases.next()
    declares[index] = `${alias} = undefined`
    if (alias === name) exports[index] = name
    else exports[index] = `${alias} as ${name}`
    index += 1
  }
  for (const name of strings) {
    const string = JSON.stringify(name)
    const { value: alias } = aliases.next()
    declares[index] = `${alias} = undefined`
    exports[index] = `${alias} as ${string}`
    index += 1
  }
  lines.push(`const ${declares.join(', ')}`)
  lines.push(`export { ${exports.join(', ')} }`)
}

function generateElidedAmbiguous (lines, ambiguous) {
  const [main, identifiers, strings] = analyzeNames(ambiguous)
  if (main) lines.push(ambiguousDefault)
  if (identifiers.length || strings.length) {
    synthesizeAmbiguousNames(lines, identifiers, strings)
  }
}

function synthesizeAmbiguousNames (lines, identifiers, strings) {
  const sourceCode = ambiguousNamesModule(identifiers, strings)
  const source1 = inlineModule(sourceCode + '\n// 1')
  const source2 = inlineModule(sourceCode + '\n// 2')
  lines.push(`export * from ${JSON.stringify(source1)}`)
  lines.push(`export * from ${JSON.stringify(source2)}`)
}

function ambiguousNamesModule (identifiers, strings) {
  if (strings.length) return stringAmbiguousNamesModule(identifiers, strings)
  else return identifierAmbiguousNamesModule(identifiers)
}

function identifierAmbiguousNamesModule (identifiers) {
  const lines = []
  const declares = identifiers.map(name => `${name} = undefined`)
  lines.push(`const ${declares.join(', ')}`)
  lines.push(`export { ${identifiers.join(', ')} }`)
  return lines.join('\n')
}

function stringAmbiguousNamesModule (identifiers, strings) {
  const aliases = generateIdentifiers()
  const length = identifiers.length + strings.length
  const declares = new Array(length)
  const exports = new Array(length)
  let index = 0
  for (const name of identifiers) {
    const { value: alias } = aliases.next()
    declares[index] = `${alias} = undefined`
    if (alias === name) exports[index] = name
    else exports[index] = `${alias} as ${name}`
    index += 1
  }
  for (const name of strings) {
    const string = JSON.stringify(name)
    const { value: alias } = aliases.next()
    declares[index] = `${alias} = undefined`
    exports[index] = `${alias} as ${string}`
    index += 1
  }
  const lines = []
  lines.push(`const ${declares.join(', ')}`)
  lines.push(`export { ${exports.join(', ')} }`)
  return lines.join('\n')
}

function generateFacade (state, lines, specifier, ordinal, facade) {
  lines.push(`import withdraw from ${withdrawSpecifier}`)
  lines.push(`const facade = withdraw(${specifier}, ${ordinal})`)
  const [main, identifiers, strings] = analyzeNames(facade.names)
  if (strings.length) state.aliases ??= generateIdentifiers()
  if (main) lines.push('export default facade.default')
  if (state.aliases) {
    generateStringFacade(state.aliases, lines, identifiers, strings)
  } else if (identifiers.length) generateIdentifierFacade(lines, identifiers)
}

function generateIdentifierFacade (lines, identifiers) {
  lines.push(`export const { ${identifiers.join(', ')} } = facade`)
}

function generateStringFacade (aliases, lines, identifiers, strings) {
  const length = identifiers.length + strings.length
  const extracts = new Array(length)
  const exports = new Array(length)
  let index = 0
  for (const name of identifiers) {
    const { value: alias } = aliases.next()
    if (alias === name) {
      extracts[index] = name
      exports[index] = name
    } else {
      extracts[index] = `${name}: ${alias}`
      exports[index] = `${alias} as ${name}`
    }
    index += 1
  }
  for (const name of strings) {
    const string = JSON.stringify(name)
    const { value: alias } = aliases.next()
    extracts[index] = `${string}: ${alias}`
    exports[index] = `${alias} as ${string}`
    index += 1
  }
  lines.push(`const { ${extracts.join(', ')} } = facade`)
  lines.push(`export { ${exports.join(', ')} }`)
}

function analyzeNames (names) {
  const main = names.has('default')
  const identifiers = []
  const strings = []
  for (const name of names) {
    if (name === 'default') continue
    if (pattern.identifier.test(name)) identifiers.push(name)
    else strings.push(name)
  }
  return [main, identifiers, strings]
}

export default generatePosedModule
