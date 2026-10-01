## Changelog

### 2026-03-05
- Generated initial `README-MOD.md` from a scan of config, templates, content, and existing documentation.

# The NYC Environment and Health Data Portal

## Overview

- **What this project is and who the client is**: Source code for the NYC Department of Health & Mental Hygiene’s Environment & Health Data Portal website (`README.md`, `config/_default/config.toml`).
- **Brief description of the site/application purpose**: Provides public access to environment and health indicators through data stories, an interactive data explorer, neighborhood reports, and topic pages, with underlying data kept in the separate `EHDP-data` repository (`README.md`, `readme-development.md`).

## Tech stack

- **CSS framework**: Bootstrap 4.3.1, with custom SCSS and Bootstrap overrides in `assets/bootstrap` and `assets/scss` (`package.json`, `assets/`).
- **Build tool**: Hugo (using the `dohmh` theme and Hugo Extended, optionally installed via the `hugo-extended` npm package) builds the static site into the `docs/` directory (`config/_default/config.toml`, `themes/dohmh/theme.toml`, `package.json`).
- **Front-end JS**: D3, Arquero, Vega, Vega-Lite, Vega-Embed, Leaflet (plus raster and geocoder plugins), jQuery and DataTables (with Buttons and RowGroup), Font Awesome, Pagefind, chroma-js, seedrandom, qrcode-generator, topojson-client, DOMPurify, and geospatial helpers (`geoblaze`, `georaster`, `georaster-layer-for-leaflet`) (`package.json`).

## Project structure

- **Template directory organization**: Section layouts live under `themes/dohmh/layouts/` (e.g., `_default`, `data-stories`, `data-features`, `data-explorer`, `key-topics`, `neighborhood-reports`, `about`, `take-action`), along with `partials`, `shortcodes`, and top-level templates such as `index.html` and `404.html` (`themes/dohmh/layouts/`).
- **Key layout and partial files**: A base layout in `_default/baseof.html` composes shared elements (header, footer, navigation) with section-specific layouts; partials in `themes/dohmh/layouts/partials/` implement reusable blocks such as navigation, featured data, and shared components (`readme-development.md`, `themes/dohmh/layouts/_default`, `themes/dohmh/layouts/partials`).
- **Component patterns**: Reusable UI components (section-colored content cards, primary and secondary cards, gray “aside” boxes, left-border callouts, plain shadow cards, and photo attributions) are implemented in layouts/partials and documented in `readme-components.md`.
- **Asset management**: Hugo processes SCSS, JS, and images from `assets/` (including `bootstrap`, `scss`, `js`, `images`, and `map-data`), writes generated resources under `resources/`, and serves unprocessed files from `static/`; Hugo modules mount `node_modules` into `assets/node_modules` so JS/CSS dependencies can be fingerprinted with Subresource Integrity (`config/_default/config.toml`, `assets/`, `static/`, `resources/`).

## What is unique about this project

- **Separate data repository**: Most indicator and neighborhood report data is stored in the external [`EHDP-data`](https://github.com/nychealth/EHDP-data) repository, which allows updating data independently of site code; the `config` files set `data_branch` to pull from either `production` or `staging` branches of that repo (`README.md`, `readme-development.md`, `config/*/config.toml`).
- **Data Explorer and Neighborhood Reports**: The Data Explorer and Neighborhood Reports combine Hugo templates with custom JS, Vega visualizations, Leaflet maps, DataTables, and indicator metadata to provide maps, trends, tables, and “Get the dataset” links driven by structured frontmatter and JSON/YAML configuration (`readme-development.md`, `content/data-explorer`, `content/neighborhood-reports`).
- **Topic–indicator indexing**: On build, `data-index.html` assembles a `topic_indicators.json` file that cross-references topics and indicators, used both on the data index and in Neighborhood Reports for linking indicators back to their parent topics and dataset pages (`readme-development.md`).
- **CloudCannon CMS integration**: CloudCannon config in `cloudcannon.config.yaml` and `.cloudcannon/` exposes collections for Data Stories, Data Explorer topics, Key Topics, Data Features, and About pages with schemas that map frontmatter fields into an editor UI (`cloudcannon.config.yaml`, `.cloudcannon/schemas/`).
- **Multi-language content**: The site is configured for English, Spanish, and Simplified Chinese, with localized home `_index` content files (e.g., `_index.md`, `_index.es.md`, `_index.zh.md`) and language settings in `config/_default/config.toml`.

## Local development

- **How to start the environment**: Install Git, npm, and Hugo; run `npm install` to fetch JS dependencies (including `hugo-extended`), then start a local server with `hugo serve --environment development` or another configured environment (e.g., `dev_stage`, `production`); by default, the site is served at `http://localhost:1313/EH-dataportal/` (`readme-development.md`).
- **Build commands**: Run `hugo` to build the site into `docs/`, with environment-specific configuration pulled from `config/_default/config.toml` and the appropriate `config/ENVIRONMENT/config.toml`; GitHub Actions workflows handle automated builds and deployments from branches like `production` and `build-to-dev-stage` (`readme-development.md`, `.github/workflows/*.yml`).

## Content model

- **Key sections and entry types**: Main content sections include `data-stories`, `data-features`, `data-explorer`, `key-topics`, `neighborhood-reports`, `about`, `take-action`, and localized home pages, with Hugo combining markdown in `content/` with layouts in `themes/dohmh/layouts/` (`content/`, `themes/dohmh/layouts/`, `readme-development.md`).
- **Any notable content relationships**: Frontmatter fields such as `categories`, `keywords`, `related`, `relatedData`, and `keyTopic` determine how stories, features, and other pages are grouped under Key Topics and surfaced as related content; environment-specific variables configure which `EHDP-data` branch the site reads from for indicator files and neighborhood report specifications (`readme-development.md`, `cloudcannon.config.yaml`, `config/*/config.toml`).

## Accessibility

- **Target WCAG level**: <!-- TODO: clarify target WCAG level for this project. -->
- **Known accessible component patterns**: Internal guidance emphasizes properly structured/nested headings, backing charts with accessible tables, marking inaccessible visualizations with `aria-hidden="true"`, and providing descriptive alt text for images; Bootstrap’s screen-reader mixins and consistent card/aside patterns support readable, scannable layouts (`readme-content.md`, `assets/bootstrap/scss/mixins/_screen-reader.scss`, `readme-components.md`).