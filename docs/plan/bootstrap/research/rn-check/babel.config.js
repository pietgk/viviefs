// Workaround for Metro rejecting the non-literal dynamic import() in effect/unstable/sql/Migrator.js (fromFileSystem loader)
const target = /node_modules[\\/]effect[\\/]dist[\\/]unstable[\\/]sql[\\/]Migrator\.js$/
const stubDynamicImport = ({ types: t }) => ({
  visitor: {
    CallExpression(path, state) {
      if (!target.test(state.filename ?? "")) return
      if (path.node.callee.type === "Import" && path.node.arguments[0]?.type !== "StringLiteral") {
        path.replaceWith(t.callExpression(t.memberExpression(t.identifier("Promise"), t.identifier("reject")), [
          t.newExpression(t.identifier("Error"), [t.stringLiteral("dynamic import() is not supported on React Native")])
        ]))
      }
    }
  }
})
module.exports = function (api) {
  api.cache(true)
  return { presets: ["babel-preset-expo"], plugins: [stubDynamicImport] }
}
