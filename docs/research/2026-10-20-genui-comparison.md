# Generative / agentic UI: OpenUI vs lavish vs show-me (and the rest)
_Researched 20 Oct 2026. Star counts are GitHub figures from that day._

## First, a correction on who made what
- **lavish** is by **Kun Chen** (`kunchenguid`, formerly a principal engineer at Meta and Microsoft). Repo: https://github.com/kunchenguid/lavish-axi
- **show-me** is by **Dex Horthy** (@dexhorthy, HumanLayer), not Dax Raad (@thdxr, opencode). I found no showme skill from Dax: an X search of his posts came back empty. Matt Pocock's posts made show-me popular. Repo: https://github.com/humanlayer/skills/tree/main/plugins/show-me · install-count post: https://x.com/dexhorthy/status/2107557043565666502

## Two different categories
1. **Generative UI runtimes** (OpenUI, json-render, A2UI, CopilotKit, MCP Apps). These run inside the product you ship. The LLM outputs a structured UI description, and your app renders it with your own components at runtime.
2. **Agent visualization skills** (lavish, show-me). These are for developers working with coding agents like Claude Code or opencode. The agent writes a one-off HTML file, Mermaid diagram or tree so you can understand or review its work. Nothing ships to end users.

So OpenUI does not really compete with lavish or show-me. The real competitors are json-render, A2UI and CopilotKit.

## The three you asked about
**OpenUI (Thesys)**: https://github.com/thesysdev/openui. MIT license, about 12.4k stars, last push 19 Oct 2026. You register your components (props typed with Zod), and OpenUI writes the system prompt from that list. The LLM then streams **OpenUI Lang**, a compact text format, which gets parsed and rendered as tokens arrive. It has runtimes for React, Vue, Svelte and Angular, and React also gets ready-made component libraries and chat UIs. Other pieces: LangChain/LangGraph integration over AG-UI, an assistant-ui adapter, a React Email package, an A2UI v1.0 client, a CLI scaffolder, and an agent skill. Thesys claims about 52% fewer tokens than json-render or their own C1 JSON (that's their own benchmark). The observability-cloud package sends data to the paid Thesys console, so there's an optional commercial layer.

**lavish (lavish-axi)**: MIT license, about 4.2k stars, created May 2026, last push 18 Oct 2026. Tagline: "HTML is the new markdown." It's an **AXI**, meaning a CLI built for agents to drive, plus a skill. Install the skill with `npx skills add kunchenguid/lavish-axi --skill lavish` and the agent runs `npx -y lavish-axi`. Alternatively, `npm i -g lavish-axi` followed by `lavish-axi setup hooks|plugin` (the README documents this). The agent writes a self-contained, interactive HTML file: a plan, explainer, proposal, review board or status report. These can hold large SVG diagrams, editable Mermaid, embedded prototypes and clickable decision options, and they reuse the project's design system. Lavish opens the file locally in a sandboxed iframe. You annotate elements or text, comment, edit diagrams and click decisions. Your feedback goes **straight back to the agent** through long polling, in TOON, a compact output format that keeps token use low. You repeat until you approve. It also checks for broken layouts. It works with any agent harness, runs on macOS, Linux and Windows, and hosted sharing is opt-in. It's built for **developer–agent collaboration during planning and review, not for UI that end users see.**

**show-me** is by **Dex Horthy** (@dexhorthy, HumanLayer), not Dax Raad (@thdxr, opencode). I found no showme skill from Dax: an X search of his posts came back empty. Matt Pocock's posts made show-me popular. Repo: https://github.com/humanlayer/skills/tree/main/plugins/show-me · install-count post: https://x.com/dexhorthy/status/2107557043565666502

## Two different categories
1. **Generative UI runtimes** (OpenUI, json-render, A2UI, CopilotKit, MCP Apps). These run inside the product you ship. The LLM outputs a structured UI description, and your app renders it with your own components at runtime.
2. **Agent visualization skills** (lavish, show-me). These are for developers working with coding agents like Claude Code or opencode. The agent writes a one-off HTML file, Mermaid diagram or tree so you can understand or review its work. Nothing ships to end users.

So OpenUI does not really compete with lavish or show-me. The real competitors are json-render, A2UI and CopilotKit.

## The three you asked about
**OpenUI (Thesys)**: https://github.com/thesysdev/openui. MIT license, about 12.4k stars, last push 19 Oct 2026. You register your components (props typed with Zod), and OpenUI writes the system prompt from that list. The LLM then streams **OpenUI Lang**, a compact text format, which gets parsed and rendered as tokens arrive. It has runtimes for React, Vue, Svelte and Angular, and React also gets ready-made component libraries and chat UIs. Other pieces: LangChain/LangGraph integration over AG-UI, an assistant-ui adapter, a React Email package, an A2UI v1.0 client, a CLI scaffolder, and an agent skill. Thesys claims about 52% fewer tokens than json-render or their own C1 JSON (that's their own benchmark). The observability-cloud package sends data to the paid Thesys console, so there's an optional commercial layer.

**lavish (lavish-axi)**: MIT license, about 4.2k stars, created May 2026, last push 18 Oct 2026. Tagline: "HTML is the new markdown." You install it as an agent skill (`npx skills add kunchenguid/lavish-axi --skill lavish`), and the skill calls a local CLI. The agent writes `artifact.html`, then `lavish-axi <file>` opens it in a sandboxed iframe in your browser. There you can annotate elements or text, edit Mermaid diagrams like a whiteboard, and chat. The agent long-polls and receives your feedback. It also checks for broken layouts and has design "playbooks". It runs locally, and sharing is opt-in. Built for plans, design explorations, reviews and prototypes.

**show-me**: one `SKILL.md` file, with `disable-model-invocation: true`, so it only runs when you type `/show-me`. It's a menu of formats: pseudocode, call trees, component trees, file trees, Mermaid diagrams and diffs. For layouts it allows one focused HTML file that matches your product's styling, which it opens with `open`. Dex announced about 25k installs on 6 Oct 2026. It has no runtime and no feedback loop. Commentary: https://explainx.ai/blog/show-me-skill-visual-output-coding-agents-2026

## Other real competitors (verified)
- **json-render (Vercel Labs)**: https://github.com/vercel-labs/json-render. Apache-2.0, about 18.7k stars. Generative UI framework using a JSON spec and your component catalog. Targets web, mobile, PDF, email and video (per the OpenUI comparison table).
- **A2UI (Google, now a2ui-project)**: https://github.com/a2ui-project/a2ui. Apache-2.0, about 16.8k stars. A declarative protocol for agents to describe UI. Renderers exist for web, iOS and Android.
- **CopilotKit**: https://github.com/CopilotKit/CopilotKit. MIT, about 38k stars. A frontend stack for agents (chat, shared state, generative UI) and the creators of the AG-UI protocol, which OpenUI also uses.
- **MCP Apps**: https://github.com/modelcontextprotocol/ext-apps. About 3k stars. The official MCP extension that lets MCP servers serve interactive UI inside AI chat clients.
- **Thesys C1**: Thesys's own hosted generative UI API. OpenUI benchmarks against it. It's a commercial product, and I didn't look into it in detail.
- I didn't check Vercel AI SDK `streamUI`, the OpenAI Apps SDK or Claude artifacts for this report, so they're left out.

## Kun Chen's comparison axes, applied
| | Who sees the UI | Does feedback go back to the agent? | Local or hosted | Tied to one agent harness? |
|---|---|---|---|---|
| OpenUI | **End users** in your app | Partly: user actions in the rendered UI can feed the next LLM turn (the app is in charge, not a coding agent) | Self-hosted SDK, optional Thesys cloud observability | Not a coding-agent tool. Tied to your app stack (React/Vue/Svelte/Angular, LangGraph, AG-UI) |
| lavish | **Developer** reviewing agent work | **Yes**: annotations, comments, diagram edits and decision clicks reach the agent through long-polling | Local (sharing opt-in) | No: any harness that can run a CLI |
| show-me | **Developer** | **No**: one-way output. You reply in chat as usual | Local (inline in chat, or one HTML file opened with `open`) | No: plain SKILL.md that any skills-aware agent can load |

## Comparison
| | Category | Output | Integration | Strengths | Weaknesses | Maturity |
|---|---|---|---|---|---|---|
| OpenUI | Runtime | OpenUI Lang, streamed, rendered with your components | npm SDKs (React/Vue/Svelte/Angular), LangGraph, AG-UI, A2UI | Token-efficient streaming, works with many frameworks, chat UI included | Custom format (learning curve, lock-in risk), self-run benchmarks, Thesys upsell | 12.4k★, very active |
| json-render | Runtime | JSON spec plus component catalog | npm | Vercel backing, many output targets | Uses more tokens (per OpenUI) | 18.7k★ |
| A2UI | Protocol | Declarative JSON UI messages | Agent-to-client protocol | Native mobile, cross-vendor standard | You bring the components | 16.8k★ |
| CopilotKit | Runtime/stack | Tool-rendered React UI plus chat | React SDK, AG-UI | Full copilot stack, large community | Heavier, React-first | 38k★ |
| MCP Apps | Protocol | HTML UI served by MCP servers | MCP extension | Works in every MCP chat host | Only applies inside chat hosts | 3k★ |
| lavish | Dev skill + AXI CLI | Self-contained interactive HTML (SVG, Mermaid, prototypes, decision buttons) | Skill + `npx -y lavish-axi`, or global install + hooks/plugin | Closed feedback loop back to the agent, token-cheap, works with any harness | Local, one person, a new project | 4.2k★, 5 months old |
| show-me | Dev skill | Diagrams/trees/diffs, sometimes one HTML file | One SKILL.md, `/show-me` | Zero setup, easy to customize | No new capability, can produce "diagram slop" | ~25k installs |

## Opinionated take
- **Prototyping UI with a coding agent (Piet's main use):** use **lavish**. HTML artifacts plus click-to-annotate feedback is the best loop of these for iterating on prototypes. Keep **show-me** around for quick "explain this structure" questions and PR walkthroughs.
- **Shipping a product where the LLM builds UI for end users:** **OpenUI** if streaming, token cost and multi-framework support matter. **json-render** if you'd rather go with Vercel's ecosystem and output targets. **A2UI** if you need native mobile or an interoperable protocol. **CopilotKit** if you want a whole in-app copilot. **MCP Apps** if your UI should live inside ChatGPT, Claude or other chat clients.
- These combine well: prototype with lavish, then ship the dynamic parts with OpenUI or json-render.
