/*
 * Analysis constructs and links module instances. After analysis of a module
 * graph is complete, the names of the module export surface can be resolved.
 * Resolution returns the set of bound names and the set of ambiguous names.
 * Cycles and other undefined names cause resolution to fail.
 */

/*
 * By the specification, wildcard exports ignore cycles. In most cases the
 * cycle will throw elsewhere but a cycle that only exists through wildcards
 * will not throw. V8 diverges from this by sometimes throwing a cycle error.
 * The V8 quirk seems to happen only in unusual cases.
 *
 * The current logic follows the spec and always ignores cycles through
 * wildcards. If this becomes a problem, the quirk will have to be matched.
 *
 * // left.mjs
 * export { value } from './middle.mjs'
 *
 * // middle.mjs
 * export * from './left.mjs'
 * export * from './right.mjs'
 * export * from './bind.mjs'
 *
 * // right.mjs
 * export { value } from './middle.mjs'
 *
 * // bind.mjs
 * export const value = 'bind'
 *
 * // entry.mjs
 * import { value } from './left.mjs'
 * // SyntaxError: Detected cycle while resolving name 'value' ..
 */

import { cast, freeze } from '#lib/object.mjs'
import { BindingState, ModuleType } from './enum.mjs'
import { UnsupportedError } from '#lib/error.mjs'

const emptyList = freeze([])

class Module {
  type // ModuleType
  bindings = new Map() // Map<source:string|ExportSource,Binding>
  imports = new Map() // Map<local:string,Import>
  exports = new Map() // Map<exported:string|ImportSource,Export>
  wildcards = new Set() // Set<WildcardExport>

  #shape = null

  resolve () {
    if (this.#shape) return this.#shape
    if (this.type === ModuleType.CommonJS) return this.#resolveCommonjs()
    const names = this.#names()
    const bound = new Set()
    const ambiguous = new Set()
    for (const name of names) {
      const binding = this.resolveExport(name)
      if (binding === BindingState.Ambiguous) ambiguous.add(name)
      else bound.add(name)
    }
    const shape = cast({ bound, ambiguous })
    this.#shape = shape
    return shape
  }

  resolveExport (name) {
    if (this.type === ModuleType.CommonJS) {
      throw new UnsupportedError('CommonJS bindings are not tracked')
    }
    const seen = new Map()
    return this.#resolveExport(name, seen)
  }

  #names (seen = new Set()) {
    if (seen.has(this)) return emptyList
    seen.add(this)
    const names = new Set(this.exports.keys())
    for (const wildcard of this.wildcards) {
      for (const name of wildcard.request.module.#names(seen)) names.add(name)
    }
    return names
  }

  #requestSpecifier (name) {
    const offer = this.exports.get(name)
    const specifier = offer.import
      ? offer.import.request.specifier
      : offer.request.specifier
    return specifier
  }

  #resolveCommonjs () {
    const bound = this.#names()
    const ambiguous = new Set()
    const shape = cast({ bound, ambiguous })
    this.#shape = shape
    return shape
  }

  #resolveExplicitExport (name, seen, specifier, diaspecifier) {
    const offer = this.exports.get(name)
    if (offer.binding !== undefined) return offer.binding
    if (offer.import) {
      const binding = this.#resolveImport(offer.import, seen)
      offer.binding = binding
      return binding
    } else if (offer.request) {
      const { request } = offer
      const binding = request.module.#resolveExport(
        request.name, seen, request.specifier, diaspecifier)
      offer.binding = binding
      return binding
    } else return null
  }

  #resolveExport (name, seen, specifier, diaspecifier) {
    if (!seen.has(this)) seen.set(this, new Set())
    const moduleSeen = seen.get(this)
    if (moduleSeen.has(name)) return BindingState.Cycle
    moduleSeen.add(name)
    if (this.exports.has(name)) {
      const binding = this.#resolveExplicitExport(
        name, seen, specifier, diaspecifier)
      if (binding === null) {
        specifier ??= this.#requestSpecifier(name)
        throw new SyntaxError(
          `The requested module '${diaspecifier ?? specifier}'` +
          ` does not provide an export named '${name}'`
        )
      } else if (binding === BindingState.Cycle) {
        specifier ??= this.#requestSpecifier(name)
        throw new SyntaxError(
          `Detected cycle while resolving name '${name}' in '${specifier}'`
        )
      } else return binding
    } else if (name === 'default') {
      specifier ??= this.#requestSpecifier(name)
      throw new SyntaxError(
        `The requested module '${specifier}'` +
        " does not provide an export named 'default'"
      )
    }
    let binding = null
    for (const wildcard of this.wildcards) {
      const { request } = wildcard
      const prospect = request.module.#resolveExport(
        name, copy(seen), request.specifier, diaspecifier ?? specifier)
      if (prospect === BindingState.Ambiguous) return prospect
      else if (prospect === BindingState.Cycle);
      else if (binding === null) binding = prospect
      else if (prospect !== binding) return BindingState.Ambiguous
    }
    if (binding !== null) return binding
    throw new SyntaxError(
      `The requested module '${diaspecifier ?? specifier}'` +
      ` does not provide an export named '${name}'`
    )
  }

  #resolveImport (pull, seen) {
    if (pull.binding !== undefined) return pull.binding
    const { request } = pull
    const binding = request.module.#resolveExport(
      request.name, seen, request.specifier)
    pull.binding = binding
    return binding
  }
}

// The seen list is copied when passing through wildcard exports,
// to prevent detecting distinct resolutions to the same export as a cycle.
function copy (original) {
  const result = new Map()
  for (const [module, seen] of original) result.set(module, new Set(seen))
  return result
}

export default Module
