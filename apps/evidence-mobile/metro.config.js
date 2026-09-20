import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { getDefaultConfig } = require('expo/metro-config')

const projectRoot = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(projectRoot, '../..')
const config = getDefaultConfig(projectRoot)

config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]
config.resolver.unstable_enableSymlinks = true
config.resolver.unstable_enablePackageExports = true
config.resolver.unstable_conditionNames = [
  '@viviefs/source',
  ...(config.resolver.unstable_conditionNames ?? [
    'react-native',
    'browser',
    'import',
    'require',
  ]),
]
if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm')
}

const previousEnhance = config.server?.enhanceMiddleware
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, server) => {
    const next = previousEnhance
      ? previousEnhance(middleware, server)
      : middleware
    return (req, res, resume) => {
      res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless')
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
      if (String(req.url ?? '').includes('.wasm')) {
        res.setHeader('Content-Type', 'application/wasm')
      }
      return next(req, res, resume)
    }
  },
}

export default config
