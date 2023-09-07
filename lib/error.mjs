import util from 'node:util'
import { bare, cast } from '#lib/object.mjs'

const breaks = /[\n\r]/g
const valueInspectOptions = cast({
  breakLength: Number.POSITIVE_INFINITY
})

export class PoseletError extends Error {
  #code
  #comment
  #kind
  #label
  #labeled
  #limn = bare()
  #message
  #missive
  #note
  #trace
  #value
  #valued

  get code () { return this.#code }
  get comment () { return this.#comment }
  get kind () { return this.#kind }
  get label () { return this.#label }
  get message () { return this.#message }
  get missive () { return this.#missive }
  get name () { return this.type }
  get note () { return this.#note }
  get stack () { return this.#report() }
  get type () { return this.constructor.name }
  get value () { return this.#value }

  constructor (...args) {
    super()
    this.#parse(args)
    this.#constructKind()
    this.#constructComment()
    this.#constructMissive()
    this.#extractTrace()
    this.#convertStack()
  }

  toString () {
    return this.#missive
  }

  #parse (args) {
    if (typeof args[0] === 'string') this.#message = args[0]
    else if (typeof args[0] === 'object') {
      const options = args[0]
      ;({
        code: this.#code,
        message: this.#message,
        note: this.#note
      } = options)
      if ('label' in options) {
        this.#labeled = true
        this.#label = options.label
        this.#limnLabel()
      } else this.#labeled = false
      if ('value' in options) {
        this.#valued = true
        this.#value = options.value
        this.#limnValue()
      } else this.#valued = false
    }
  }

  #constructKind () {
    const fragments = []
    fragments.push(this.type)
    if (this.#code !== undefined) fragments.push(this.code)
    this.#kind = fragments.join(' ')
  }

  #constructComment () {
    const fragments = []
    if (this.#message !== undefined) fragments.push(this.message)
    if (this.#labeled) fragments.push(`|${this.#limn.label}|`)
    if (this.#valued) fragments.push(`<${this.#limn.value}>`)
    const main = fragments.length ? fragments.join(' ') : null
    const sections = []
    if (main) sections.push(main)
    if (this.#note) sections.push(this.#note)
    if (sections.length) this.#comment = sections.join(': ')
  }

  #constructMissive () {
    const fragments = []
    fragments.push(this.kind)
    if (this.comment !== undefined) fragments.push(this.comment)
    const missive = fragments.join(': ')
    const unbroken = missive.replace(breaks, '\u23ce')
    this.#missive = unbroken
  }

  #limnLabel () {
    if (typeof this.#label === 'symbol') {
      const description = this.#label.description ?? ''
      this.#limn.label = `[${description}]`
    } else this.#limn.label = this.#label
  }

  #limnValue () {
    if (typeof this.#value === 'string') this.#limn.value = this.#value
    else this.#limn.value = util.inspect(this.#value, valueInspectOptions)
  }

  #extractTrace () {
    const raw = this.#readStack()
    if (typeof raw === 'string') {
      const lines = raw.split('\n')
      lines.shift()
      const nonempty = lines.filter(line => line !== '')
      this.#trace = nonempty.join('\n')
    } else this.#trace = undefined
  }

  #readStack () {
    // Generate stack on throwtime engines
    /* eslint-disable-next-line no-throw-literal */
    if (!this.stack) try { throw this } catch {}
    return this.stack
  }

  #convertStack () {
    delete this.stack // Delete raw value to expose getter
  }

  #report () {
    const fragments = []
    fragments.push(this.missive)
    if (this.#trace) fragments.push(this.#trace)
    return fragments.join('\n')
  }
}

export class InvalidError extends PoseletError {}
export class LimitError extends PoseletError {}
export class ResourceError extends PoseletError {}

export class DuplicateError extends InvalidError {}
export class ExhaustionError extends ResourceError {}
export class LackError extends ResourceError {}
export class MissingError extends PoseletError {}
export class PermissionError extends PoseletError {}
export class StateError extends PoseletError {}
export class TestError extends PoseletError {}
export class TimeLimitError extends LimitError {}
export class UnsupportedError extends PoseletError {}
