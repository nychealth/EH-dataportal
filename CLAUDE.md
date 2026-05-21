# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

NYC Department of Health & Mental Hygiene's [Environment & Health Data Portal](https://a816-dohbesp.nyc.gov/IndicatorPublic/) — a Hugo static site providing public access to environmental and health indicators through data stories, an interactive data explorer, neighborhood reports, and topic pages.

Most indicator data lives in the separate [EHDP-data](https://github.com/nychealth/EHDP-data) repository (not this repo). Site code fetches it at build time via `data_branch` config variable and at runtime via `data_repo` param in Hugo templates/JS.

## Commands

```bash
# Install JS dependencies (includes hugo-extended)
npm install

# Local development (uses production data branch)
hugo serve --environment development

# Local dev with staging data
hugo serve --environment dev_stage

# Build to docs/ for production
hugo --environment production

# Create new content
hugo new data-stories/TITLE/index.md
hugo new key-topics/TITLE/index.md
```

Browse locally at http://localhost:1313/EH-dataportal

## Environments

Specify with `--environment ENV`. Each merges `config/ENV/config.toml` over `config/_default/config.toml`.

| Environment   | Data branch | Purpose                              |
|---------------|-------------|--------------------------------------|
| `development` | production  | Preview site changes (default local) |
| `dev_stage`   | staging     | Preview combined site + data changes |
| `production`  | production  | Deploy to production servers         |
| `prod_stage`  | staging     | Preview data changes only            |
| `local_prod`  | production  | Uses locally hosted data repo        |
| `local_stage` | staging     | Uses locally hosted data repo        |

Key per-environment variables: `baseURL` and `data_branch`.

## Architecture

### Hugo structure

- `content/` — Markdown content files with YAML frontmatter
- `themes/dohmh/layouts/` — Hugo templates (mirrors `content/` structure)
- `themes/dohmh/layouts/_default/baseof.html` — Root template: head, header, main, footer, JS
- `themes/dohmh/layouts/partials/` — Reusable template blocks
- `themes/dohmh/layouts/shortcodes/` — Shortcodes callable from markdown content
- `assets/` — SCSS, JS, images (processed by Hugo with SRI fingerprinting)
- `static/` — Unprocessed files served as-is
- `data/globals/` — YAML data accessible throughout templates (featured data, NR specs, SEO vars)

### Layout routing

- `_index.md` → `section.html` (section landing pages)
- `index.md` or `name.md` → `single.html`
- Frontmatter `layout: custom` → `custom.html` in the section's layouts folder

### JS architecture

JS files under `assets/js/` are fingerprinted and served with Subresource Integrity. Dependencies from `node_modules` are mounted into `assets/node_modules` via Hugo module mounts — they are bundled locally, not loaded from CDNs.

The Data Explorer JS is split by view: `assets/js/data-explorer/app.js`, `map.js`, `trend.js`, `table.js`, `links.js`, `disparities.js`, `data.js`, `measures.js`, `global.js`, `print.js`.

`assets/js/nr-topic-spa.js` drives the Phase 2 Neighborhood Reports topic SPA.

### SCSS

`assets/scss/theme.scss` is the root entrypoint, importing Bootstrap overrides and custom styles in lettered files (`_a-global-variables.scss` through `_h-nyc-subway-icons.scss`). Bootstrap itself is mounted from `node_modules`.

### Content sections

| Section | Layout folder | Notes |
|---------|---------------|-------|
| `data-stories` | `layouts/data-stories/` | Markdown articles with Vega/Datawrapper shortcode embeds |
| `data-explorer` | `layouts/data-explorer/` | Each topic MD lists `indicators` array; JS drives all visualization |
| `neighborhood-reports` | `layouts/neighborhood-reports/` | JSON spec per neighborhood in EHDP-data; `nr-topic-spa.html` is Phase 2 |
| `key-topics` | `layouts/key-topics/` | Organizing principle; linked via `categories` frontmatter |
| `data-features` | `layouts/data-features/` | Feature articles/tools |

### Data flow

- **Build time**: Hugo fetches remote JSON/YAML from EHDP-data via `getresource` (controlled by `data_branch` and `maxAge` in config). `data-index.html` generates `topic_indicators.json` cross-referencing topics and indicators.
- **Runtime**: JS reads `data_repo` and `data_branch` Hugo params to fetch indicator data, map specs, and Vega specs directly from EHDP-data GitHub raw URLs.

### Content relationships

- `categories` frontmatter links content to Key Topics (`keyTopic` field)
- `keywords` feeds Pagefind site search
- `related` and `relatedData` frontmatter fields specify manual cross-links; templates default to category-matched content when these are absent

### Shortcodes

Available in markdown content files:
- `vega` / `vega0` — embed Vega-Lite specs from EHDP-data
- `datawrapper` — embed Datawrapper charts
- `accordion` — collapsible content sections
- `csvtable`, `rawhtml`, `storyheader`, `updateflag`

### Multi-language

Site has English (`en`), Spanish (`es`), and Simplified Chinese (`zh`). Localized home pages use `_index.es.md` / `_index.zh.md` naming. `ignoreFiles` in config.toml gates language-specific content from the default build.

### Subresource Integrity (SRI)

Hugo calculates integrity hashes for all local JS/CSS resources using the `short-fingerprint.html` partial (a custom hash-shortening wrapper around Hugo's built-in `integrity` function). If SRI breaks on production, check that end-of-line characters are Unix `LF` — the GitHub Actions workflows enforce this on merge.

### CloudCannon CMS

`cloudcannon.config.yaml` and `.cloudcannon/` configure the CMS editor interface. `.cloudcannon/schemas/` contains frontmatter templates for editor-created content.

## Deployment

Branches are auto-built by GitHub Actions on merge:
- `production` → builds to `builds/prod-prod` (live site)
- `build-to-dev-stage` → builds to `builds/dev-stage` (staging)

Branch naming convention: `hotfix-[NAME]`, `content-[NAME]`, `feature-[NAME]`. Branch from `production`; merge to `development` for testing, then to `production` to deploy.

## JavaScript

When writing or editing any `.js` file in this project, load and follow the `/js-development` command.

## Common gotchas

- **Missing images cause build failures.** Hugo resizes images at build time; a missing source image will abort the build.
- **Build caching.** Remote EHDP-data resources can be cached. Set `maxAge = 0` in config to disable if updates aren't appearing in a build.
- **SRI + line endings.** Integrity hash mismatches on production usually mean `CRLF` line endings snuck in. GitHub Actions normalizes these on merge.
