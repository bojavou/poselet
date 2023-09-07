import fs from 'node:fs/promises'
import { cast } from '#lib/object.mjs'
import { bootstrapPath, launchPath, presentPath } from './value.mjs'

async function loadBootstrap () {
  const presentSpecifier = JSON.stringify(presentPath)
  const launchSpecifier = JSON.stringify(launchPath)
  const template = await fs.readFile(bootstrapPath, cast({ encoding: 'utf8' }))
  const bootstrap = template
    .replace("'$$PRESENT$$'", presentSpecifier)
    .replace("'$$LAUNCH$$'", launchSpecifier)
  return bootstrap
}

export default loadBootstrap
