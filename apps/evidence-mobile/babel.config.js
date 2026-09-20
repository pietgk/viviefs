const target =
  /node_modules[/\\]effect[/\\]dist[/\\]unstable[/\\]sql[/\\]Migrator\.js$/

/**
 * Metro rejects the non-literal `import()` in effect/unstable/sql/Migrator.js
 * (Effect-TS/effect#6347). Stub it so SQL/cluster barrels can bundle. P01
 * exemplar of the workaround; drop this plugin when upstream lands.
 */
const stubMigratorDynamicImport = ({ types: t }) => ({
  visitor: {
    CallExpression(path, state) {
      if (!target.test(state.filename ?? '')) return
      if (
        path.node.callee.type === 'Import' &&
        path.node.arguments[0]?.type !== 'StringLiteral'
      ) {
        path.replaceWith(
          t.callExpression(
            t.memberExpression(t.identifier('Promise'), t.identifier('reject')),
            [
              t.newExpression(t.identifier('Error'), [
                t.stringLiteral(
                  'dynamic import() is not supported on React Native',
                ),
              ]),
            ],
          ),
        )
      }
    },
  },
})

export default function babelConfig(api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [stubMigratorDynamicImport],
  }
}
