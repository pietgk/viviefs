export type { Catalog, Decision, DecisionSection, Found, GateClaim, Reference, ReferenceKind, Token } from './catalog.ts'
export {
  DECISION_LOG,
  GATE_TABLE,
  GATE_TABLE_DOC,
  GLOSSARY,
  ISSUE_STATUSES,
  buildCatalog,
  decisionAnchor,
  findReferenceTokens,
  findReferences,
  firstSentence,
  newestEvidence,
  onlyReference,
  parseDecisionSections,
  parseDecisions,
  parseGateClaims,
  plainText,
  resolveKey,
} from './catalog.ts'
export type { Rewrite } from './rewrite.ts'
export {
  REFERENCES_MARKER,
  inReferenceScope,
  referenceHref,
  referenceProblems,
  rewriteDocument,
} from './rewrite.ts'
export type { TheirWords, TheirWordsMarker } from './their-words.ts'
export { commentsIn, isQuotedLine, theirWords, theirWordsMarker } from './their-words.ts'
