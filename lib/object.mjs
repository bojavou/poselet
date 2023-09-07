export function bare (...sources) {
  const object = Object.create(null)
  if (sources.length) Object.assign(object, ...sources)
  return object
}

export function cast (...sources) {
  const object = Object.create(null)
  if (sources.length) Object.assign(object, ...sources)
  Object.freeze(object)
  return object
}

export function copy (object, ...sources) {
  if (sources.length) Object.assign(object, ...sources)
  return object
}

export function freeze (object) {
  Object.freeze(object)
  return object
}

export function ice (object, ...sources) {
  if (sources.length) Object.assign(object, ...sources)
  Object.freeze(object)
  return object
}

export function rinse (object) {
  for (const key of Reflect.ownKeys(object)) delete object[key]
}
