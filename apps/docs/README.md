# Docs site

The ViViEfs docs site (D59-D61): Starlight on Astro 7, in this project. It
renders `GLOSSARY.md`, the ADRs, the evidence notes and the research records in
place; guides live in `src/content/docs/guides/`.

## Run

```sh
pnpm exec nx run docs:build      # what verify's docs step runs; links, anchors and samples fail it
pnpm exec nx run docs:serve      # development server on http://localhost:4321
pnpm exec astro preview          # in apps/docs, after a build; Astro 7 runs it as a daemon (astro preview stop)
```

## How it is put together

- One content loader, `src/lib/repo-docs-loader.ts`, renders repository
  Markdown in place. Those pages are not under `src/content/docs`, so
  Starlight's `autogenerate` cannot list them; `src/lib/repo-pages.ts` builds
  their sidebar groups, with ADR status badges.
- Relative file links in any rendered Markdown become site or GitHub links,
  and a link to a missing file fails the build (`src/lib/repo-links.ts`);
  `starlight-links-validator` checks site paths and anchors.
- `<Sample path region>` embeds a `// #region` from source and fails on a
  missing region (`src/lib/regions.ts`, D60).
- Astro 7's Markdown processor is Sätteri, not remark: plugins are
  `mdastPlugins` and `hastPlugins` (`satteri`).
- `astro.config.ts` and `src/content.config.ts` are checked by the build, not
  by `tsc`: the Starlight plugins ship TypeScript sources that do not compile
  under this repository's settings.
- Mermaid renders in the browser (`astro-mermaid`), so `verify`'s `diagrams`
  step checks the source.
