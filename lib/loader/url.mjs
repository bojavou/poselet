/*
 * Specialized URL parsing. This class provides abilities the web URL class
 * does not. It also elides parsing not relevant to poselet for performance.
 * It has the following properties:
 *
 * - No validation of received URLs.
 * - No decoding of percent encodings.
 * - Parses only the query portion.
 * - Deals only with final parameters of a particular name. Adds to the end,
 *   deletes from the end, and reads from the end.
 * - Requires referenced parameters to exist. Attempting to read or delete an
 *   absent parameter throws an error.
 */

import { cast } from '#lib/object.mjs'
import { MissingError } from '#lib/error.mjs'

class URL {
  #essence
  #query
  #fragment
  #parameters

  get essence () { return this.#essence }
  get query () { return this.#query }
  get fragment () { return this.#fragment }

  get serial () {
    let serial = this.#essence
    this.#query = this.#serializeParameters()
    if (this.#query) serial += '?' + this.#query
    if (this.#fragment !== null) serial += '#' + this.#fragment
    return serial
  }

  constructor (string) {
    const question = string.indexOf('?')
    const hash = string.indexOf('#')
    if (question === -1) {
      if (hash === -1) {
        // file:///
        this.#essence = string
        this.#query = null
        this.#fragment = null
      } else {
        // file:///#fragment
        this.#essence = string.slice(0, hash)
        this.#query = null
        this.#fragment = string.slice(hash + 1)
      }
    } else {
      if (hash === -1) {
        // file:///?query
        this.#essence = string.slice(0, question)
        this.#query = string.slice(question + 1)
        this.#fragment = null
      } else {
        if (question > hash) {
          // file:///#not?aquery
          this.#essence = string.slice(0, hash)
          this.#query = null
          this.#fragment = string.slice(hash + 1)
        } else {
          // file:///?query#fragment
          this.#essence = string.slice(0, question)
          this.#query = string.slice(question + 1, hash)
          this.#fragment = string.slice(hash + 1)
        }
      }
    }
    this.#parameters = this.#parseParameters()
  }

  add (name, value) {
    const parameter = cast({ name, value })
    this.#parameters.push(parameter)
    return this
  }

  delete (name) {
    const index = this.#parameters
      .findLastIndex(parameter => parameter.name === name)
    if (index === -1) {
      throw new MissingError({
        code: 'MissingParameter',
        value: name
      })
    }
    this.#parameters.splice(index, 1)
    return this
  }

  get (name) {
    const index = this.#parameters
      .findLastIndex(parameter => parameter.name === name)
    if (index === -1) {
      throw new MissingError({
        code: 'MissingParameter',
        value: name
      })
    }
    const parameter = this.#parameters[index]
    return parameter.value
  }

  #parseParameters () {
    if (this.#query === null) return []
    const entries = this.#query.split('&')
    const parameters = new Array(entries.length)
    for (const [index, serial] of entries.entries()) {
      const delimiter = serial.indexOf('=')
      const name = delimiter === -1
        ? serial
        : serial.slice(0, delimiter)
      const value = delimiter === -1
        ? null
        : serial.slice(delimiter + 1)
      const parameter = cast({ name, value })
      parameters[index] = parameter
    }
    return parameters
  }

  #serializeParameters () {
    const entries = new Array(this.#parameters.length)
    for (const [index, { name, value }] of this.#parameters.entries()) {
      let serial = name
      if (value !== null) serial += '=' + value
      entries[index] = serial
    }
    if (entries.length) return entries.join('&')
    else return null
  }
}

export default URL
