import { cast } from '#lib/object.mjs'

export const BindingState = cast({
  Ambiguous: Symbol('poselet:BindingState.Ambiguous'),
  Cycle: Symbol('poselet:BindingState.Cycle')
})

export const ExportSource = cast({
  Default: Symbol('poselet:ExportSource.Default')
})

export const ImportSource = cast({
  Namespace: Symbol('poselet:ImportSource.Namespace')
})

export const ModuleType = cast({
  Addon: Symbol('poselet:ModuleType.Addon'),
  CommonJS: Symbol('poselet:ModuleType.CommonJS'),
  CommonJSWrapper: Symbol('poselet:ModuleType.CommonJSWrapper'),
  ECMAScript: Symbol('poselet:ModuleType.ECMAScript'),
  JSON: Symbol('poselet:ModuleType.JSON'),
  WASM: Symbol('poselet:ModuleType.WASM')
})
