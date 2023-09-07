import test from 'ava'
import withdraw from '#lib/registry/withdraw.mjs'
import state from '#lib/registry/state.mjs'
import { PoseState } from '#lib/registry/enum.mjs'
import { MissingError } from '#lib/error.mjs'

test.beforeEach(() => {
  state.modules = new Map()
})

test.serial('missing module', t => {
  const module = 'file:///'
  const error = t.throws(() => { withdraw(module, 1) }, {
    instanceOf: MissingError,
    code: 'MissingModule'
  })
  t.is(error.label, module)
})

test.serial('missing pose empty', t => {
  const module = 'file:///'
  const ordinal = 1
  state.modules.set(module, { poses: new Map() })
  const error = t.throws(() => { withdraw(module, ordinal) }, {
    instanceOf: MissingError,
    code: 'MissingPose'
  })
  t.is(error.label, module)
  t.is(error.value, ordinal)
})

test.serial('missing pose nonempty', t => {
  const module = 'file:///'
  const ordinal = 1
  const poses = new Map().set(2, {})
  state.modules.set(module, { poses })
  const error = t.throws(() => { withdraw(module, ordinal) }, {
    instanceOf: MissingError,
    code: 'MissingPose'
  })
  t.is(error.label, module)
  t.is(error.value, ordinal)
})

test.serial('success sole', t => {
  const module = 'file:///'
  const ordinal = 1
  const facade = { a: 1, b: 2, c: 3 }
  const pose = { state: PoseState.Loading, facade }
  const poses = new Map().set(ordinal, pose)
  state.modules.set(module, { current: ordinal, poses })
  const result = withdraw(module, ordinal)
  t.is(result, facade)
  t.deepEqual(state.modules.get(module).poses, new Map([[ordinal, pose]]))
})

test.serial('success more', t => {
  const module = 'file:///'
  const ordinal1 = 1
  const facade1 = { a: 1 }
  const pose1 = { state: PoseState.Loading, facade: facade1 }
  const ordinal2 = 2
  const facade2 = { b: 2 }
  const pose2 = { state: PoseState.Unloaded, facade: facade2 }
  const poses = new Map()
    .set(ordinal1, pose1)
    .set(ordinal2, pose2)
  state.modules.set(module, { current: ordinal2, poses })
  const result = withdraw(module, ordinal1)
  t.is(result, facade1)
  t.deepEqual(state.modules.get(module).poses, new Map([[ordinal2, pose2]]))
})
