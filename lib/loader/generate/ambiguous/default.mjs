const message = 'The default export is backed by conflicting star exports'
const ambiguousDefault = `throw new SyntaxError('${message}')`

export default ambiguousDefault
