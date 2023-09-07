import test from 'ava'
import generate from '#lib/loader/identifiers.mjs'

const alphabetSize = 26 * 2

test('first', t => {
  const ids = generate()
  const { value } = ids.next()
  t.is(value, '$a')
})

test('second', t => {
  const ids = generate()
  ids.next()
  const { value } = ids.next()
  t.is(value, '$b')
})

test('extend 1', t => {
  const ids = generate()
  for (let i = 0; i < alphabetSize; i++) ids.next()
  const { value } = ids.next()
  t.is(value, '$aa')
})

test('extend 1+1', t => {
  const ids = generate()
  for (let i = 0; i < alphabetSize; i++) ids.next()
  ids.next()
  const { value } = ids.next()
  t.is(value, '$ab')
})

test('extend 1 wrap 1', t => {
  const ids = generate()
  const iterations = alphabetSize * 2
  for (let i = 0; i < iterations; i++) ids.next()
  const { value } = ids.next()
  t.is(value, '$ba')
})

test('extend 2', async t => {
  const ids = generate()
  const iterations = alphabetSize + alphabetSize ** 2
  for (let i = 0; i < iterations; i++) ids.next()
  const { value } = ids.next()
  t.is(value, '$aaa')
})

test('extend 3', t => {
  const ids = generate()
  const iterations = alphabetSize + alphabetSize ** 2 + alphabetSize ** 3
  for (let i = 0; i < iterations; i++) ids.next()
  const { value } = ids.next()
  t.is(value, '$aaaa')
})
