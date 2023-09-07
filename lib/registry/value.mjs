import rootPath from '#lib/root.mjs'
import url from 'node:url'

export const internalPrefix = url.pathToFileURL(rootPath).href + '/'
