# Seed: glossary-defined English as a way to program LLMs (brief delivered 2026-10-09)

Labels: [verified] = read in repo/docs/paper; [X chatter] = posts, unverified.

## Thesis check
- Supported: removing ambiguity from what you hand an agent clearly matters.
- Not shown anywhere: that a glossary term beats spelling out the same meaning in plain English. Pocock's own docs say a term and its expansion probably get the same result from the model; the vocabulary mainly shortens human-to-human communication. They also warn an unreviewed, agent-authored glossary is worse than none.

## Pocock's grill-with-docs [verified, skills v1.3]
- One-line skill delegating to `grilling` (question rounds) and `domain-modeling` (writing).
- Flags terms that conflict with the glossary, replaces vague words with precise terms, probes concept boundaries with edge-case scenarios, checks claims against code.
- Writes each term the moment it is settled. File is GLOSSARY.md (renamed from CONTEXT.md in v1.3); GLOSSARY-MAP.md for several bounded contexts. Entry = **Term**: 1-2 sentence definition + `_Avoid_:` synonyms; no implementation details.
- Hard decisions go to docs/adr/ only if hard to reverse, surprising, and a real trade-off.
- Chain: grill-with-docs -> to-spec -> to-tickets -> implement -> code-review -> retro.
- Known weak spots: glossary drifting into a spec; decisions left only in chat; silent failure if helper skills don't load.
Sources: https://github.com/mattpocock/skills/blob/main/skills/engineering/domain-modeling/SKILL.md , https://github.com/mattpocock/skills/blob/main/skills/engineering/domain-modeling/GLOSSARY-FORMAT.md , https://github.com/mattpocock/skills/blob/main/docs/engineering/grill-with-docs.md , https://www.aihero.dev/skills-changelog-v13-implement-spec-pr-retro-and-glossary-md

## Similar approaches
1. DDD ubiquitous language for agents. https://dev.to/aws/your-agent-keeps-using-that-word--4g36 , https://agentpatterns.ai/instructions/ubiquitous-language-for-ai-plans/ (types and enums can make a prose glossary redundant)
2. ASD-STE100 Simplified Technical English: Pocock's global CLAUDE.md line (Aug 4, 2026). https://x.com/mattpocockuk/status/2084753070437609606
3. EARS syntax in Kiro (`WHEN ... THE SYSTEM SHALL ...`). https://kiro.dev/docs/specs/feature-specs/
4. GitHub Spec Kit constitution + specify/plan/tasks/implement. https://github.com/github/spec-kit
5. Boeckeler on spec-driven development (spec-first / spec-anchored / spec-as-source): overkill for small changes, non-deterministic regeneration from same spec. https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html
6. Huntley's Ralph specs loop and Horthy's context engineering. https://github.com/ghuntley/how-to-ralph-wiggum , https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/ace-fca.md
7. SudoLang and Gherkin. https://github.com/paralleldrive/sudolang-llm-support , https://asdlc.io/concepts/gherkin/

## Research [verified]
- ClarifyCodeBench (2026): terminology is a top ambiguity type; unclear requirements cut pass@1 by ~8-20 points; models rarely ask the right clarifying question. https://arxiv.org/abs/2607.00711
- Orchid (2026): one ambiguous word roughly doubles disagreement between a model's repeated runs. https://arxiv.org/html/2604.21505v1
- ETH Zurich, Evaluating AGENTS.md (ICLR 2026): instruction files didn't significantly improve success, raised cost >20%; developer-written beat LLM-written by ~7 points; specific rules followed, overviews didn't help. https://arxiv.org/abs/2602.11988

## Suggestions (candidates for the stable core)
1. Separate vocabulary (glossary nouns) from behavior (patterns as EARS or Given/When/Then sentences using glossary terms), each convertible to a human-written acceptance test.
2. Push terms into types, enums and names; lint for `_Avoid_` synonyms.
3. Measure: same task 3-5 runs with term vs 3-5 runs spelled out; compare run disagreement and tokens.
4. Short, human-reviewed, per-area glossaries referenced once from AGENTS.md.
5. Run to-spec in the same conversation and check it against your answers; optionally ASD-STE100 for agent output.
