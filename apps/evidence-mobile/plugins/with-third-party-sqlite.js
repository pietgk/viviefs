import { withPodfileProperties } from 'expo/config-plugins'

/**
 * Lets expo-sqlite and op-sqlite share iOS sqlite (op-sqlite docs).
 * P02 ships both so the expo-sqlite fallback probe can run in the same binary.
 */
export default function withThirdPartySqlite(config) {
  return withPodfileProperties(config, (next) => {
    next.modResults['expo.updates.useThirdPartySQLitePod'] = 'true'
    return next
  })
}
