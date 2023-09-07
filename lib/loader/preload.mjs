/*
 * Preload performs a launch procedure. It listens to the loader side of the
 * communication channel then installs the registry on the main thread. Launch
 * proceeds as follows.
 *
 * Generate bootstrap code at startup. Since the bootstrap has no file path at
 * runtime, requires cannot be done with relative paths. The absolute paths
 * are constructed and merged into the code template at load time.
 *
 * Execute bootstrap. This code is run as a script (not module) in a special
 * environment. Dynamic import() is not available. CommonJS require() is not
 * available. A special getBuiltin() function exposes builtin Node.js modules.
 * It aims to reach ESM as soon as possible.
 *
 * Use module.createRequire() to create a require() function. This enables
 * loading CommonJS modules.
 *
 * Signal presence. This sets a present flag in protostate in a CJS module.
 * The user API checks this flag and throws if clear to ask the user to run
 * with the loader. Since loading ESM is asynchronous, putting the flag in ESM
 * state would require an await with an arbitrary timeout on this check.
 * Setting the flag synchronously enables throwing an error immediately. This
 * single piece of early state is stored in a CJS module to enable setting the
 * flag synchronously.
 *
 * Await a microtick. This bypasses a race condition in Node.js v20.
 *
 * Require the CJS launch entrypoint. This loads the ESM launch routine with a
 * dynamic import() call. The promise is returned as the module export so the
 * require() result is awaited to receive the import() result.
 *
 * Run the ESM launch routine. This has full access to ESM state and modules.
 *
 * Run registry install. This is the main install procedure. It listens to the
 * registry side of the communication channel, bringing up the registry clerk
 * service which responds to requests from the loader.
 */

import loadBootstrap from './bootstrap.mjs'
import * as receiver from './receiver/surface.mjs'
import state from './state.mjs'
import { cast } from '#lib/object.mjs'

const bootstrap = await loadBootstrap()

function globalPreload (context) {
  const { port } = context
  port.addEventListener('messageerror', receiver.error, cast({
    passive: true,
    once: true
  }))
  port.addEventListener('message', receiver.message, cast({ passive: true }))
  port.unref()
  port.start()
  state.port = port
  return bootstrap
}

export default globalPreload
