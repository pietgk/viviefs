export function refuseUnrunProbe(gate: string, fact: string): never {
  console.error(
    `${gate} is registered and not yet run.\nFact to establish: ${fact}\nDo not treat this message as a pass.`,
  )
  process.exit(1)
}
