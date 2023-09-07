import path from 'node:path'
import url from 'node:url'

const fileURL = import.meta.url
const modulePath = url.fileURLToPath(fileURL)
const rootPath = path.dirname(modulePath)

export default rootPath
