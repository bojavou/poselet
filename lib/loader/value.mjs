import path from 'node:path'
import rootPath from '#lib/root.mjs'
import url from 'node:url'

export const bootstrapPath = path.join(rootPath, 'launcher', 'bootstrap.cjs')
export const dataPrefix = 'data:'
export const internalPrefix = url.pathToFileURL(rootPath).href + '/'
export const launchPath = path.join(rootPath, 'launcher', 'launch.cjs')
export const nodePrefix = 'node:'
export const presentPath = path.join(rootPath, 'launcher', 'present.cjs')

const withdrawPath = path.join(rootPath, 'registry', 'withdraw.mjs')
export const withdrawURL = url.pathToFileURL(withdrawPath)
