/* global getBuiltin port */

(async () => {
  const module = getBuiltin('module')
  const path = getBuiltin('path')
  const process = getBuiltin('process')
  const workingPath = process.cwd()
  const requireRoot = path.join(workingPath, '<poselet:bootstrap>')
  const require = module.createRequire(requireRoot)
  require('$$PRESENT$$')
  await Promise.resolve()
  const { default: launch } = await require('$$LAUNCH$$')
  launch(port)
})()
