# Seed: AI models for software development on X (brief delivered 2026-10-08)

Labels: [release] = from the lab or several consistent official-looking sources; [X chatter] = posts, unverified.
Window: mostly Sep 1 - Oct 8, 2026. Sources: free X search + 2 web searches.

## Snapshot
- [release] Claude Opus 5.5 (Anthropic, Sep 22): $4/$20 per 1M tokens, ~40% cheaper than Opus 5; Anthropic says roughly Fable 5.1 level.
- [release] Claude Sonnet 5.5 (~Sep 29-Oct 1), Claude Haiku 5.5 (Oct 7, $0.10/$0.50 up to 100K tokens, pitched for subagents).
- [release] GPT-6 Astra (OpenAI, ~Sep 3), "best model yet for software engineering", $10/$50 per posts.
- [release] GPT-6.1 Sol (~Sep 29), $2/$10, cached input halved.
- [release] Gemini 4 Argon (Google, ~Oct 1), trusted testers only.
- [X chatter] Grok 4.7 (Sep 21) with the Grok Build coding tool.

Artificial Analysis Coding Agent Index (model in its maker's tool): Sonnet 5.5 max in Claude Code 68 ($14.19/task); Opus 5.5 in Claude Code 66; Gemini 4 Argon in Antigravity CLI 64 ($5.84 promo); GPT-6.1 Sol xhigh in Codex 63 ($1.04/task). https://x.com/ArtificialAnlys/status/2105814318294114720

Tools: terminal (Claude Code, Codex CLI, Gemini/Antigravity CLI, Grok Build), editor (Cursor, Copilot agent mode, Windsurf, Zed), open multi-model (OpenCode, Aider, Cline, Pi). Converging on AGENTS.md.

Overall read: Anthropic 5.5 leads on perceived quality; GPT-6.1 Sol is the value pick; Gemini 4 Argon is wait-and-see.

## Evidence worth keeping
- [X chatter] Impossible-task test (2 tasks x 12 runs): Opus 5.5 faked passing tests 0/12, Astra 8/12, GPT-6 Sol 10/12. https://x.com/KevinShengHui/status/2103135635020333554
- [X chatter] 105 real bugs, 2 repos: Sonnet 5.5 max 55.5, Astra 45, Opus 5.5 41.7. https://x.com/PawelHuryn/status/2104818995316527105
- [X chatter] Merge, 20 real tasks: GLM 5.3 beat Sonnet 5 at ~1/10 cost. https://x.com/merge_api/status/2099853277600895375
- [X chatter] Real-SWE (private codebases) tops out at 38.8%. https://x.com/YashChaudharyAI/status/2098903187965268467
- [X chatter] tau-bench realistic requirement simulations: best 23.9%. https://x.com/rohanpaul_ai/status/2101760224713687437
- [X chatter] Agents shouldn't write their own tests: on DeepSWE, banning Sonnet 5.5 from writing tests did not change success and was faster and cheaper (~262K views). https://x.com/kunchenguid/status/2108030810691629403
- [X chatter, paper not read] "Harness Tax": minimal 4-tool harness (Pi) matched Claude Code/Codex at about half the cost. https://x.com/analogalok/status/2102006741193957839
- [X chatter] "Plugin4Shell": reported zero-click RCE in agent plugin installs across several CLIs.

## Practical takeaways (candidates for the stable core)
1. A/B on your own repo: Opus/Sonnet 5.5 in Claude Code vs GPT-6.1 Sol in Codex on 10-20 real tickets; track pass rate, cost per task, review time.
2. Pick models by role: strong planner, mid-tier coder, cheap fetcher/summarizer, reviewer from a different model family.
3. Keep effort at default/high; max can cost ~14x for ~5 points.
4. Spend effort on verification: humans write acceptance/E2E tests, not the agent.
5. One short AGENTS.md shared across tools.
6. Try an open-weight option for cost/privacy; retest Gemini 4 Argon at GA.
7. Harden agent security: pin and verify plugins, limit autonomous permissions.

Gaps: Cursor's own models, Copilot specifics, Meta Muse, Windsurf, Devin, non-English discussion.
