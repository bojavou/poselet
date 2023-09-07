import test from 'ava'
import globalPreload from '#lib/loader/preload.mjs'
import state from '#lib/loader/state.mjs'
import fs from 'node:fs/promises'
import { rinse } from '#lib/object.mjs'
import { bootstrapPath, launchPath, presentPath } from '#lib/loader/value.mjs'

test.afterEach(() => {
  rinse(state)
})

test.serial('port', t => {
  t.false('port' in state)
  const channel = new MessageChannel()
  const port = channel.port1
  globalPreload({ port })
  t.is(state.port, port)
})

test.serial('bootstrap', async t => {
  const presentSpecifier = JSON.stringify(presentPath)
  const launchSpecifier = JSON.stringify(launchPath)
  const template = await fs.readFile(bootstrapPath, { encoding: 'utf8' })
  const bootstrap = template
    .replace("'$$PRESENT$$'", presentSpecifier)
    .replace("'$$LAUNCH$$'", launchSpecifier)
  const channel = new MessageChannel()
  const port = channel.port1
  const result = globalPreload({ port })
  t.is(result, bootstrap)
})
