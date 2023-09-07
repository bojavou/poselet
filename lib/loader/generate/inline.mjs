function inlineModule (code) {
  return `data:text/javascript,${encodeURIComponent(code)}`
}

export default inlineModule
