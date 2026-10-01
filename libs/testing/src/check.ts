/** One check of a suite: its name, whether it passed, and what it saw. */
export type CheckStatus = 'PASS' | 'FAIL'

export type CheckResult = {
  name: string
  status: CheckStatus
  detail: string
}
