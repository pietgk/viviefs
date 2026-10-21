# Smarter chunking for RAG: POMA AI, its competitors, and the open-source field
*Researched 20 Oct 2026. GitHub star counts were pulled from the GitHub API that day. "Vendor" marks a claim that comes from the company itself.*

---

## 1. What POMA AI does

**Company:** Berlin-based, according to its GitHub org bio. Founder/CEO is Dr. Alexander Kihm. Site: https://www.poma-ai.com/

**Products**
- **PrimeCut**: a document ingestion and chunking engine. You drop it into an existing RAG stack and keep your own embeddings, vector DB and retrieval. POMA calls it "proprietary, patent-protected" (vendor claim). Ships as a Python SDK (`pip install poma`, `PrimeCut.ingest()`), a REST API and a CLI. https://www.poma-ai.com/docs/primecut/
- **index4.ai** (formerly "POMA Grill"): a managed RAG SaaS built on PrimeCut. It handles ingestion, storage, retrieval and ranking. https://index4.ai
- **Enterprise / on-prem**: dedicated VPC or air-gapped PrimeCut deployment.

**How it works** (https://www.poma-ai.com/docs/concepts/, https://www.poma-ai.com/docs/learn/chunking/chunksets)
1. Parse the document into clean **sentence-level units**. Each unit gets a `depth` in a tree inferred from explicit and implicit structure (headings, lists, tables, captions).
2. **Chunks** are typed sentences or paragraphs with `depth`, `page`, a `to_embed` text, and references to tables (kept as HTML) or images (with generated descriptions).
3. **Chunksets** are the retrieval unit. Each one is a full root-to-leaf path, i.e. the leaf sentences plus their breadcrumb trail (`Handbook → Benefits → Health Insurance → "…"`). You embed `chunkset.to_embed`. POMA says it "never cuts text".
4. **Cheatsheets** are built at query time. `generate_cheatsheets(hits, all_chunks)` merges the retrieved chunksets back into document order, removes duplicates, fits them to a token budget and returns one XML+Markdown block per document. The idea is that structure lives in the prompt text, so you don't need parent-doc joins or a hierarchy-aware retriever.
5. It also accepts 50+ file types, including Office, images, audio and video. Images get descriptions, charts become data, and tables are retrievable at row level. Output is a `.poma` ZIP archive.

**Pricing** (https://www.poma-ai.com/pricing)
- 1,000 free pages (max 250 pages per document).
- Pay-as-you-go "Adaptive" is **at most €0.01 per page**. A "page" is one document page, one minute of audio/video, or 1,000 tokens of delivered output, whichever is higher.
- Enterprise pricing is custom.

**Open source from POMA** (github.com/poma-ai)
- `poma-primecut-nano` (MIT, 9★): heading-hierarchy chunker for **Markdown only**. It does chunksets, ancestor expansion and context assembly, so it's a stripped-down public version of the idea.
- `poma-officeqa` (MIT, 9★): their benchmark.
- `poma-memory` (9★), `poma-cli` (5★), `megavibe` (14★).
- The core PrimeCut engine is closed.

**Benchmark** (vendor-produced, https://github.com/poma-ai/poma-officeqa)
- Setup: 20 table-lookup questions from Databricks OfficeQA over 14 US Treasury Bulletins (~2,150 pages). Every method uses the same embeddings (text-embedding-3-large) and the same cosine retrieval.
- Metric: the token budget needed to reach 100% context recall.

| Method | Worst-case tokens to 100% recall | Total over 20 questions |
|---|---:|---:|
| Naive RecursiveCharacterTextSplitter 500/100 | 1.45M | 5.78M |
| Unstructured.io (by_title) | 1.48M | 6.55M |
| POMA chunksets | 0.34M | 1.35M |
| POMA "Mixed" (tuned re-rank, w=0.84) | 0.26M | 1.18M |

**Caveats:**
- It's one corpus, and a table-heavy one.
- 20 questions is a small sample.
- It measures retrieval recall per token, not answer quality.
- "Mixed" is tuned to this dataset (POMA says so itself).
- None of the stronger baselines was tested: Docling HybridChunker, Reducto, LlamaParse, contextual retrieval, late chunking, or parent-child retrieval.

---

## 2. Commercial competitors

| Vendor | URL | Approach | Differentiator vs POMA |
|---|---|---|---|
| **Unstructured** | https://docs.unstructured.io/concepts/chunking | Splits documents into typed elements, then chunks with `basic`, `by_title`, `by_page` or `by_similarity` (embedding-based). Has a separate **contextual chunking** node that adds LLM-generated context to each chunk. | The best-known ETL platform with many connectors. Its OSS core is Apache-2.0 (15.6k★). This is the baseline POMA benchmarks against. |
| **LlamaParse / LlamaCloud** (LlamaIndex) | https://developers.llamaindex.ai/llamaparse/general/pricing/ | Agentic, VLM-based parsing (Parse API v2, Jan 2026) plus Extract, Classify, **Split** and Index. | Tiered credits at $1.25 per 1k credits: Fast 1, Cost-effective 3, Agentic 10, Agentic Plus 45 credits/page. Split is 4 credits/page. Plans run Free (10k credits), Starter $50, Pro $500. Tightly tied to the LlamaIndex framework. |
| **Reducto** | https://docs.reducto.ai/configs/parse/chunking-methods | Layout and VLM parsing (new "r-1" full-page model). Chunk modes: `variable` (groups blocks by section, keeps headers with content and figures with captions, 750–1250 chars), `section`, `page`, `block`. `embedding_optimized` adds table/figure summaries to the `embed` field. | Very strong parsing with bounding boxes and confidence scores. Chunking is structure-aware but size-targeted, with no root-to-leaf breadcrumbs. |
| **Chunkr** (Lumina AI) → **Extend** | https://docs.chunkr.ai/pages/migrate-to-extend/faq | Layout analysis, OCR and VLM processing into semantic chunks. | **Being acquired by Extend. The hosted API shuts down 15 Nov 2026.** The AGPL OSS version stays (4.1k★). |
| **Contextual AI** | https://contextual.ai/blog/document-parser-for-rag | Document parser that infers document hierarchy and adds section metadata to chunks (`enable_document_hierarchy=true`), plus a full enterprise RAG platform. | The closest conceptual match to "hierarchy-aware chunks", sold as part of an end-to-end platform with reranker and grounded LM. |
| **Ragie** | https://www.ragie.ai/ , https://docs.ragie.ai/docs/summary-index | Managed RAG-as-a-service. Multimodal ingestion, a two-tier summary index plus chunk index, hybrid search and reranking. | Competes with **index4.ai** (managed), not with PrimeCut. |
| **Vectara** | https://docs.vectara.com/docs/build/chunking-strategies | RAG platform. Structured-document ingestion where chunks never cross section boundaries. Sentence or max-chars chunking, Boomerang embeddings. | A platform play. Its own research argues fancy chunking has limited value (see §4). |
| **Voyage AI** (MongoDB) `voyage-context-3` | https://blog.voyageai.com/2025/07/23/voyage-context-3/ | **Contextualized chunk embeddings**: each chunk vector also encodes context from the whole document. | Solves the "orphaned chunk" problem at the **embedding** layer instead of the chunking layer, and works with any chunker. |
| **Jina AI** (Segmenter + late chunking) | https://jina.ai/en-US/segmenter/ , https://jina.ai/embeddings/ | Segmenter API, plus `late_chunking: true` on jina-embeddings v3 (8k tokens) and v4 (32k tokens). | Another embedding-layer fix for the same problem. Cheap and needs no LLM calls. |
| **Google Document AI Layout Parser** | https://docs.cloud.google.com/document-ai/docs/layout-parse-quickstart | Layout parsing with built-in chunking. `includeAncestorHeadings: true` adds parent headings to each chunk (up to 2 levels). | The hyperscaler version of breadcrumb chunking. Fine if you're already on GCP. |
| **Azure Document Intelligence / Content Understanding** | https://learn.microsoft.com/en-us/azure/search/search-how-to-semantic-chunking-content-understanding | Layout model emits Markdown with headings and tables. Azure AI Search Document Layout skill splits by header depth. Content Understanding has semantic chunking. | The hyperscaler default for Azure shops. |
| **PageIndex** (Vectify AI) | https://github.com/VectifyAI/PageIndex | "Vectorless" RAG. Builds a hierarchical tree index (like a table of contents) per document and has an LLM reason its way down the tree. OSS (MIT, 39.3k★) plus cloud. | Same underlying idea as POMA (document hierarchy matters), but it replaces vector retrieval rather than feeding it. |

---

## 3. Open-source tools and techniques

### 3a. Parsers / layout → structured output (the input to good chunking)
| Tool | URL | ★ (20 Oct 2026) | License | One-liner |
|---|---|---:|---|---|
| Docling (IBM → LF AI) | https://github.com/docling-project/docling | 69.2k | MIT | Converts PDF/Office documents into a rich DoclingDocument. Ships **HierarchicalChunker** and **HybridChunker**, where `contextualize()` prepends the heading path to each chunk. This is the closest OSS equivalent to POMA chunksets. https://docling-project.github.io/docling/concepts/chunking/ |
| MinerU | https://github.com/opendatalab/MinerU | 82.1k | custom (see repo) | PDF/Office → Markdown/JSON for LLMs. |
| Marker (Datalab) | https://github.com/datalab-to/marker | 40.6k | Apache-2.0 (code) | PDF → Markdown + JSON. |
| Surya | https://github.com/datalab-to/surya | 21.5k | Apache-2.0 | OCR, layout, reading order, tables. |
| MarkItDown (Microsoft) | https://github.com/microsoft/markitdown | 191k | MIT | Lightweight conversion of any file to Markdown. |
| Unstructured OSS | https://github.com/Unstructured-IO/unstructured | 15.6k | Apache-2.0 | Element partitioning plus by_title chunking. |
| Chunkr OSS | https://github.com/lumina-ai-inc/chunkr | 4.1k | AGPL-3.0 | Self-hosted layout, OCR and chunking API. |
| PaddleOCR | https://github.com/PaddlePaddle/PaddleOCR | 91.4k | Apache-2.0 | OCR and document structure. |
| olmOCR (AllenAI) | https://github.com/allenai/olmocr | 19.8k | Apache-2.0 | VLM-based PDF linearization. |
| open-parse | https://github.com/Filimoa/open-parse | 3.1k | MIT | Layout-aware parsing and grouping. |
| llmsherpa | https://github.com/nlmatics/llmsherpa | 1.75k | MIT | Layout-aware hierarchical chunks. Inactive since 2024. |

### 3b. Chunking libraries
| Tool | URL | ★ | One-liner |
|---|---|---:|---|
| Chonkie | https://github.com/feyninc/chonkie | 4.8k | Token, Sentence, Recursive, Semantic, **Late**, Code, Neural, **Slumber (LLM/"agentic")**, Table chunkers, plus "refineries". Very active. |
| LangChain text splitters | https://github.com/langchain-ai/langchain | 148k (whole repo) | RecursiveCharacterTextSplitter (the de-facto baseline), MarkdownHeaderTextSplitter, semantic chunker in experimental. |
| LlamaIndex node parsers | https://github.com/run-llama/llama_index | 52.6k | `HierarchicalNodeParser` + AutoMergingRetriever (parent-child), `SemanticSplitterNodeParser`, `MarkdownNodeParser`. |
| semchunk | https://github.com/isaacus-dev/semchunk | 667 | Fast recursive semantic splitter. |
| text-splitter (Rust/Python) | https://github.com/benbrandt/text-splitter | 634 | Fast Rust splitter for text, Markdown and code. |
| semantic-chunkers (Aurelio) | https://github.com/aurelio-labs/semantic-chunkers | 259 | Embedding-based chunkers. |
| poma-primecut-nano | https://github.com/poma-ai/poma-primecut-nano | 9 | POMA's own Markdown heading-tree chunker with chunksets. |

### 3c. Techniques (most are a few dozen lines of code on top of the tools above)
- **Header/breadcrumb prefixing and parent-child ("small-to-big") retrieval.** Built into Docling `contextualize`, LlamaIndex Hierarchical/AutoMerging, LangChain ParentDocumentRetriever, and Google `includeAncestorHeadings`. This is commodity-level today and is the closest thing to POMA chunksets.
- **Contextual Retrieval (Anthropic, 2024).** An LLM writes a short context blurb for each chunk before embedding and BM25 indexing. Reported reduction in top-20 retrieval failures: 35% from contextual embeddings alone, 49% with contextual BM25 added, 67% with reranking added (vendor-reported). https://www.anthropic.com/engineering/contextual-retrieval
- **Late chunking (Jina, arXiv 2409.04701).** Embed the whole document with a long-context model, then pool token vectors per chunk span. No training needed. https://arxiv.org/abs/2409.04701 · code https://github.com/jina-ai/late-chunking (540★, inactive since Dec 2024)
- **Proposition indexing / Dense X Retrieval (arXiv 2312.06648, EMNLP 2024).** Index atomic, self-contained propositions. Improves recall under fixed token budgets. https://arxiv.org/abs/2312.06648
- **RAPTOR (arXiv 2401.18059).** Recursive clustering and summarization into a tree, retrieving at several levels of abstraction. https://github.com/parthsarthi03/raptor (1.8k★, inactive since 2024)
- **Graph-based RAG.** Microsoft GraphRAG https://github.com/microsoft/graphrag (36.4k★), LightRAG https://github.com/HKUDS/LightRAG (40.2k★), Graphiti https://github.com/getzep/graphiti (32.1k★). These are entity and relation indexes that sidestep chunk boundaries for global or multi-hop questions.
- **Vectorless tree retrieval.** PageIndex (39.3k★), described above.
- **Full OSS RAG engines with layout-aware chunking.** RAGFlow https://github.com/infiniflow/ragflow (92.5k★, "deep document understanding" templates). dsRAG https://github.com/D-Star-AI/dsRAG (1.6k★, semantic sectioning plus contextual chunk headers).
- **Technique catalogue:** https://github.com/NirDiamant/RAG_Techniques (29.9k★).

---

## 4. Benchmarks and evidence

| Study | Who | Finding | Independence |
|---|---|---|---|
| **Evaluating Chunking Strategies for Retrieval** (Jul 2024) https://research.trychroma.com/evaluating-chunking , code https://github.com/brandonstarxel/chunking_evaluation | Chroma | Proposes token-level recall, precision and **IoU** as metrics. RecursiveCharacterTextSplitter at ~200 tokens with no overlap is a strong default. ClusterSemanticChunker had the best IoU and the LLM chunker had the best recall. | Vendor (vector DB), but sells no chunker. Methodology is reusable. |
| **Is Semantic Chunking Worth the Computational Cost?** arXiv 2410.13070 / NAACL Findings 2025 https://arxiv.org/abs/2410.13070 | Vectara researchers | Gains from semantic chunking are inconsistent. Fixed-size chunking is often as good or better on real documents. Embedding quality matters more. | Peer-reviewed, vendor-affiliated authors. |
| **Finding the Best Chunking Strategy** (Jun 2025) https://developer.nvidia.com/blog/finding-the-best-chunking-strategy-for-accurate-ai-responses/ | NVIDIA | Page-level chunking was the best default: 0.648 average end-to-end accuracy, the lowest variance, better than token-based and section-level chunking. Use 256–512-token chunks for factoid queries and ~1,024 for analytical ones. | Vendor (no chunker to sell). |
| **Contextual Retrieval** https://www.anthropic.com/engineering/contextual-retrieval | Anthropic | 35% / 49% / 67% fewer retrieval failures (see §3c). | Vendor. |
| **Late Chunking** arXiv 2409.04701 | Jina AI | Reports retrieval gains over naive per-chunk embedding, with no training needed (I didn't check the exact numbers). | Vendor-authored paper. |
| **Dense X Retrieval** arXiv 2312.06648 | Academic (UW, Tencent et al.) | Propositions beat passages and sentences at a fixed token budget. | Academic. |
| **POMA-OfficeQA** https://github.com/poma-ai/poma-officeqa | POMA | 77% fewer tokens to reach 100% recall versus naive splitting and Unstructured. | **Vendor**, single corpus, n=20, reproducible. |
| Reddit discussion of the POMA benchmark https://www.reddit.com/r/Rag/comments/1ryu9xu/ | Founder post | Same numbers. Small thread. | Vendor. |

**What the evidence says overall:**
- There's no neutral, multi-vendor benchmark of commercial parse-and-chunk products in this list.
- Independent and semi-independent work (Chroma, Vectara, NVIDIA) shows that simple strategies are hard to beat on average, and that results depend heavily on the corpus and query type.
- Structure-aware approaches win mostly on deeply structured, table-heavy or legal/spec documents, which is exactly where POMA focuses.

---

## 5. Assessment: where POMA is differentiated and where it's commodity

**Commodity (others match or exceed it):**
- *Parsing and OCR of 50+ formats.* Docling, MinerU, Marker, Reducto, LlamaParse, Azure and Google all do this. Reducto and LlamaParse arguably lead on hard layouts.
- *"Keep headings with content" / breadcrumbs.* Docling HybridChunker plus `contextualize()`, LlamaIndex Hierarchical/AutoMerging, Google `includeAncestorHeadings`, Contextual AI hierarchy metadata, and Reducto `variable` mode all do a version of this. Even POMA's own `primecut-nano` shows how simple the core idea is for Markdown.
- *Getting context into the chunk.* Contextual Retrieval, late chunking and voyage-context-3 attack the same "orphaned chunk" failure at the embedding layer, with no change to the chunker.

**Plausibly differentiated:**
1. **Sentence-level tree with implicit-structure detection.** POMA assigns a depth to every sentence, including structure that isn't marked by headings. That's finer-grained than heading-based chunkers. This is where the "patent-protected" secret sauce would sit, and it can't be verified from outside.
2. **Chunksets plus cheatsheets as a retrieve-then-compress loop.** Retrieval stays flat and simple, and query-time assembly removes duplicates and budget-fits a structured context. The pitch is about **token efficiency**, not just recall. Few competitors make query-time context assembly a first-class SDK primitive. LlamaIndex auto-merging is the nearest analogue.
3. **Tables and row-level retrieval with header lineage.** This is what their benchmark actually stresses. It's meaningful for finance, insurance and spec documents.
4. **EU / air-gapped on-prem and per-tenant encryption**, plus simple pricing (≤€0.01 per page). That's cheaper than LlamaParse Agentic (10 credits ≈ $0.0125/page) and similar to its Cost-effective tier.

**Risks and open questions:**
- Evidence is limited to a single vendor benchmark. Before trusting the 77% figure, run your own A/B on your own corpus with the Chroma IoU harness. Compare against **Docling HybridChunker plus contextualize** and **contextual retrieval plus rerank**, which are the strong, free baselines POMA didn't test.
- The core engine is closed, and on-prem is enterprise-only.
- The space is consolidating: Chunkr was absorbed by Extend, Voyage by MongoDB, and LlamaIndex is moving into parsing. Platforms (Contextual AI, Ragie, Vectara, hyperscalers) are bundling "good enough" structure-aware chunking for free.
- Vectorless and agentic approaches (PageIndex, long-context agents) question whether chunk-level optimization is the right place to compete at all. POMA's FAQ argues it is, because of token cost.

**Bottom line:** POMA's idea (hierarchy-preserving retrieval units plus compressed structured context) is sound and well-executed. But the basic version is now commodity, and the strongest free alternative is Docling. POMA's real differentiation is the quality of its implicit-structure inference, its query-time cheatsheet compression and its token economics on complex structured documents. That case is plausible but so far only supported by its own benchmark.
