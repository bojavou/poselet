import test from 'ava'
import URL from '#lib/loader/url.mjs'
import { MissingError } from '#lib/error.mjs'

test('bare', t => {
  const input = 'file:///'
  const url = new URL(input)
  t.is(url.essence, 'file:///')
  t.is(url.query, null)
  t.is(url.fragment, null)
  t.is(url.serial, input)
})

test('query', t => {
  const input = 'file:///?query'
  const url = new URL(input)
  t.is(url.essence, 'file:///')
  t.is(url.query, 'query')
  t.is(url.fragment, null)
  t.is(url.serial, input)
})

test('fragment', t => {
  const input = 'file:///#fragment'
  const url = new URL(input)
  t.is(url.essence, 'file:///')
  t.is(url.query, null)
  t.is(url.fragment, 'fragment')
  t.is(url.serial, input)
})

test('query fragment', t => {
  const input = 'file:///?query#fragment'
  const url = new URL(input)
  t.is(url.essence, 'file:///')
  t.is(url.query, 'query')
  t.is(url.fragment, 'fragment')
  t.is(url.serial, input)
})

test('fragment question', t => {
  const input = 'file:///#not?aquery'
  const url = new URL(input)
  t.is(url.essence, 'file:///')
  t.is(url.query, null)
  t.is(url.fragment, 'not?aquery')
  t.is(url.serial, input)
})

test('add chain', t => {
  const url = new URL('file:///')
  const result = url.add('color', 'blue')
  t.is(result, url)
})

test('add bare', t => {
  const url = new URL('file:///')
  url.add('color', 'blue')
  t.is(url.serial, 'file:///?color=blue')
})

test('add orthogonal', t => {
  const url = new URL('file:///?fruit=apple')
  url.add('color', 'blue')
  t.is(url.serial, 'file:///?fruit=apple&color=blue')
})

test('add alike', t => {
  const url = new URL('file:///?color=purple')
  url.add('color', 'blue')
  t.is(url.serial, 'file:///?color=purple&color=blue')
})

test('add identical', t => {
  const url = new URL('file:///?color=blue')
  url.add('color', 'blue')
  t.is(url.serial, 'file:///?color=blue&color=blue')
})

test('delete missing', t => {
  const url = new URL('file:///')
  const error = t.throws(() => { url.delete('color') }, {
    instanceOf: MissingError,
    code: 'MissingParameter'
  })
  t.is(error.value, 'color')
})

test('delete chain', t => {
  const url = new URL('file:///?color=blue')
  const result = url.delete('color')
  t.is(result, url)
})

test('delete last', t => {
  const url = new URL('file:///?color=blue')
  url.delete('color')
  t.is(url.serial, 'file:///')
})

test('delete outer', t => {
  const url = new URL('file:///?fruit=apple&color=blue')
  url.delete('color')
  t.is(url.serial, 'file:///?fruit=apple')
})

test('delete inner', t => {
  const url = new URL('file:///?color=blue&fruit=apple')
  url.delete('color')
  t.is(url.serial, 'file:///?fruit=apple')
})

test('delete plural', t => {
  const url = new URL('file:///?color=purple&color=blue')
  url.delete('color')
  t.is(url.serial, 'file:///?color=purple')
})

test('get missing', t => {
  const url = new URL('file:///')
  const error = t.throws(() => { url.get('color') }, {
    instanceOf: MissingError,
    code: 'MissingParameter'
  })
  t.is(error.value, 'color')
})

test('get sole', t => {
  const url = new URL('file:///?color=blue')
  const result = url.get('color')
  t.is(result, 'blue')
})

test('get outer', t => {
  const url = new URL('file:///?fruit=apple&color=blue')
  const result = url.get('color')
  t.is(result, 'blue')
})

test('get inner', t => {
  const url = new URL('file:///?color=blue&fruit=apple')
  const result = url.get('color')
  t.is(result, 'blue')
})

test('get plural', t => {
  const url = new URL('file:///?color=purple&color=blue')
  const result = url.get('color')
  t.is(result, 'blue')
})

test('get value empty', t => {
  const url = new URL('file:///?color=')
  const result = url.get('color')
  t.is(result, '')
})

test('get value absent', t => {
  const url = new URL('file:///?color')
  const result = url.get('color')
  t.is(result, null)
})
