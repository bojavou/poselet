import * as acorn from 'acorn'
import importAttributes from '@bojavou/acorn-import-attributes'
import ModuleFile from '../file.mjs'
import * as walk from 'acorn-walk'
import { cast } from '#lib/object.mjs'
import { ExportSource, ImportSource, ModuleType } from '../enum.mjs'
import { InvalidError } from '#lib/error.mjs'

const Parser = acorn.Parser.extend(
  importAttributes(cast({ with: false, assert: true }))
)

const options = cast({
  ecmaVersion: 'latest',
  sourceType: 'module'
})

function analyzeEcmascriptFile (code) {
  const tree = Parser.parse(code, options)
  const walker = new Walker()
  walk.simple(tree, walker)
  const file = new ModuleFile()
  file.type = ModuleType.ECMAScript
  file.imports = walker.imports
  file.exports = walker.exports
  file.wildcards = walker.wildcards
  return file
}

class Walker {
  imports = new Map()
  exports = new Map()
  wildcards = new Set()

  constructor () {
    // Work around acorn-walk not binding locus when calling visitors
    const prototype = Object.getPrototypeOf(this)
    for (const key of Object.getOwnPropertyNames(prototype)) {
      const value = prototype[key]
      if (typeof value !== 'function') continue
      this[key] = value.bind(this)
    }
  }

  ExportAllDeclaration (node) {
    if (node.exported) {
      // export * as name from 'module'
      // export * as 'string name' from 'module'
      const exported = node.exported.type === 'Literal'
        ? node.exported.value
        : node.exported.name
      const whence = cast({
        module: node.source.value,
        imported: ImportSource.Namespace
      })
      this.exports.set(exported, whence)
    } else {
      // export * from 'module'
      this.wildcards.add(node.source.value)
    }
  }

  ExportDefaultDeclaration (node) {
    // export default function gadget () {}
    // export default function () {}
    // export default class Gadget {}
    // export default class {}
    // export default 42
    const { type, id } = node.declaration
    const local = type === 'FunctionDeclaration' || type === 'ClassDeclaration'
      ? id === null ? ExportSource.Default : id.name
      : ExportSource.Default
    const whence = cast({ local })
    this.exports.set('default', whence)
  }

  ExportNamedDeclaration (node) {
    if (node.declaration) {
      const { type } = node.declaration
      if (type === 'VariableDeclaration') {
        for (const declarator of node.declaration.declarations) {
          this.#ExportPattern(declarator.id)
        }
      } else if (type === 'FunctionDeclaration') {
        // export function gadget () {}
        const local = node.declaration.id.name
        const whence = cast({ local })
        this.exports.set(local, whence)
      } else if (type === 'ClassDeclaration') {
        // export class Gadget () {}
        const local = node.declaration.id.name
        const whence = cast({ local })
        this.exports.set(local, whence)
      } else {
        throw new InvalidError({
          code: 'UnrecognizedDeclarationType',
          value: type
        })
      }
    } else if (node.source) {
      // export { name } from 'module'
      // export { source as name } from 'module'
      // export { 'string name' } from 'module'
      // export { 'string source' as 'string name' } from 'module'
      for (const specifier of node.specifiers) {
        const imported = specifier.local.type === 'Literal'
          ? specifier.local.value
          : specifier.local.name
        const exported = specifier.exported.type === 'Literal'
          ? specifier.exported.value
          : specifier.exported.name
        const whence = cast({
          module: node.source.value,
          imported
        })
        this.exports.set(exported, whence)
      }
    } else {
      // export { name }
      // export { source as 'string name' }
      for (const specifier of node.specifiers) {
        const local = specifier.local.name
        const exported = specifier.exported.type === 'Literal'
          ? specifier.exported.value
          : specifier.exported.name
        const whence = cast({ local })
        this.exports.set(exported, whence)
      }
    }
  }

  ImportDeclaration (node) {
    const source = node.source.value
    if (!this.imports.has(source)) this.imports.set(source, new Map())
    const sourceImports = this.imports.get(source)
    for (const specifier of node.specifiers) {
      const local = specifier.local.name
      const { type } = specifier
      if (type === 'ImportSpecifier') {
        // import { name } from 'module'
        // import { source as name } from 'module'
        // import { 'string source' as name } from 'module'
        const imported = specifier.imported.type === 'Literal'
          ? specifier.imported.value
          : specifier.imported.name
        sourceImports.set(local, imported)
      } else if (type === 'ImportDefaultSpecifier') {
        // import name from 'module'
        sourceImports.set(local, 'default')
      } else if (type === 'ImportNamespaceSpecifier') {
        // import * as name from 'module'
        sourceImports.set(local, ImportSource.Namespace)
      } else {
        throw new InvalidError({
          code: 'UnrecognizedImportSpecifier',
          value: type
        })
      }
    }
  }

  #ExportObjectPatternEntry (entry) {
    const { type } = entry
    if (type === 'Property') {
      // export { a, b, c } = {}
      // export { d: e } = {}
      this.#ExportPattern(entry.value)
    } else if (type === 'RestElement') this.#ExportPattern(entry)
    else {
      throw new InvalidError({
        code: 'UnrecognizedObjectPatternEntry',
        value: type
      })
    }
  }

  #ExportPattern (pattern) {
    const { type } = pattern
    if (type === 'Identifier') {
      // export var a = 1
      // export let b = 2
      // export const c = 3
      const local = pattern.name
      const whence = cast({ local })
      this.exports.set(local, whence)
    } else if (type === 'ArrayPattern') {
      // export const [a, b, ...c] = []
      // export const [,,, d] = []
      for (const element of pattern.elements) {
        if (element === null) continue
        this.#ExportPattern(element)
      }
    } else if (type === 'ObjectPattern') {
      for (const entry of pattern.properties) {
        this.#ExportObjectPatternEntry(entry)
      }
    } else if (type === 'RestElement') {
      // export const [...a] = []
      // export const [...[b, c, d]] = []
      // export const { ...e } = {}
      this.#ExportPattern(pattern.argument)
    } else if (type === 'AssignmentPattern') {
      // export const [a = 1] = []
      // export const { b = 2 } = {}
      this.#ExportPattern(pattern.left)
    } else {
      throw new InvalidError({
        code: 'UnrecognizedPatternType',
        value: type
      })
    }
  }
}

export default analyzeEcmascriptFile
