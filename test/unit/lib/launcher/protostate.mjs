import test from 'ava'

test('present default', async t => {
  const protostate = await import('#lib/launcher/protostate.cjs')
  t.false(protostate.present)
})
