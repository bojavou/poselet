export function wrap (routine) {
  function wrapper (...args) { return routine(...args) }
  return wrapper
}
