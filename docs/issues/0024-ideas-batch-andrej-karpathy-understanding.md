# I24: Ideas batch: understanding LLM output (Andrej Karpathy)

Status: needs-triage

Category: enhancement

Found: 2026-10-03

Series: ideas-batch, first batch: `ideas-batch-andrej-karpathy-understanding`

## What

A tweet by Andrej Karpathy lists output formats that make LLM work easier to understand, and this issue keeps it as input for a brainstorm on what in ViViEfs needs to improve, how, and why. ViViEfs already uses some of these formats but not all. It is the first issue in the ideas-batch series. More issues in the series will collect other ideas, and the brainstorm reads them together. This issue does not decide anything yet.

## Source

Andrej Karpathy (@karpathy) on X, copied on 2026-10-03:

> We'll be spending a lot more time trying to understand the outputs of language models. A few thoughts, tips & tricks:
>
> Writing. Something I've had success with: Ask your LLM to explain something in ASD-STE100, it's a controlled language specification originally developed for aerospace maintenance documentation. LLMs well-versed in this language and it comes with heavy constraints on clean writing style that I often find a lot more readable. Sometimes I've tried to soften it a bit e.g. ask for "80% of the way to ASD-STE100" because the spec is quite stringent. But even better:
>
> Diagrams / images. Instead of writing, ask your LLM to create a diagram. These can be a lot easier to process, parse, and understand. But even better:
>
> Web pages. Ask for output "in HTML" to get a beautiful, interactive webpage. LLMs are getting really good at frontend and can create beautiful experiences, animations, etc. But even better:
>
> Explainer videos. The output format I am most bullish on is fully custom / bespoke explainer videos generated on any arbitrary topic. Experiment with things like "Create a 3b1b style video explainer on X. Use my ElevenLabs API key for audio narration". (you'd need an API key for the latter or you can ask your LLM to find you decent free alternatives that use your local compute). This is actually starting to work!
>
> In summary:
> - As LLMs get better, they will do more and more of the legwork autonomously, and a lot more of our work will rise up the abstractions into oversight and understanding.
> - Luckily, LLMs can help here too because as intelligence and code are increasingly abundant, you can ask for large, custom, discardable software artifacts (e.g. web apps, video explainers) that would have never made sense to create before. Push the boundaries here and you'll be surprised.

## The ideas and where ViViEfs stands

| Idea | Already in ViViEfs | Not yet |
| --- | --- | --- |
| Writing in a controlled language (ASD-STE100, or "80% of the way") | The `wait-what` skill asks for a re-pitch in ASD-STE100 with the `GLOSSARY.md` terms. `GLOSSARY.md` names rejected synonyms, which is a controlled vocabulary. D94 makes every glossary definition start with one plain sentence; I21 tests that with a reader outside software. | No writing rule for docs pages, guides, ADRs, issues or agent replies. `verify` does not check style. Only one skill uses STE, and only when the human asks for it. |
| Diagrams instead of prose | Mermaid in the docs site, with Mermaid integrity checked (D59-D61). Mermaid in the research review pages. | No rule for when a page needs a diagram. No diagram for some core concepts, for example the path claim -> gate -> run -> note -> ledger entry (see I22). |
| Interactive HTML pages | Lavish review pages for design decisions, kept as dated research records in `docs/research/` (D68). The interactive K-Plex concept navigator (2026-10-02). Design questions get a visual review page with worked examples before the human decides. | The HTML pages are records of a decision, not a path into the repo for a newcomer. The docs site does not link them as learning material. |
| Bespoke explainer videos (3Blue1Brown style, narrated) | Nothing. | No video for any pattern, gate or guide. The toolchain (Manim, Remotion, local or paid text-to-speech) and how to keep a video true to its source are open. |
| Work moves up to oversight and understanding | Verify - Qualify - Teach: a pattern is delivered only with evidence, an exemplar and an accepted guide (ADR-0026). Claims and evidence pages. Lessons cite evidence. | No measure of whether a human actually understands the result. I21 is the first test of that. |
| Large, discardable artifacts | `.lavish/` is a scratch area again (D68); research records are never the source of a claim. Exercises have problem and solution folders (D66). | No rule for which artifacts we throw away, which we keep as a record, and which we regenerate from source when the source changes. |

## Questions for the brainstorm

The why first:

- Where does a reader lose the thread today: a newcomer, the human who reviews, an agent? Name the place and what goes wrong there. That decides which format helps.
- Which of the ideas helps the human keep oversight as agents do more of the work, and which only makes output look better?

Then each idea:

- Writing: do we want a controlled-language rule for docs, issues and agent replies? Full ASD-STE100 or "80% of the way"? Can `verify` check some of it, the way the `guides` step checks the guide template? How does it fit `GLOSSARY.md` and D94?
- Diagrams: which concepts need one canonical diagram on the docs site, and who owns it so it does not drift from the code?
- Web pages: should some review pages become learning material, or stay records (D68)? Should a concept navigator like the K-Plex research become part of the docs site?
- Videos: is a generated explainer of one guide (for example the log-store guide) worth a prototype? How does a video cite evidence (D68: research is never the source of a claim) and stay true when the guide changes?
- Discardable artifacts: which artifacts should we regenerate from source on demand instead of keeping them?

How the batch is used: the brainstorm reads this issue with the later ideas-batch issues, and turns what it keeps into decisions (decision log, ADRs) or into new issues. This issue links them; it does not restate them.

## Comments
