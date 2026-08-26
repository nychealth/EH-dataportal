# Readme: site development

## General Development
This Readme file documents the basics of site structure and functioning. 

### Getting started
You will need the following things properly installed on your computer.

- [Git](https://git-scm.com/)
- [npm](https://www.npmjs.com/)
- [Hugo](https://gohugo.io/) 

With this repository cloned onto your machine, you can browse a local version of the site. In your local development environment, start the server by typing `hugo serve --environment development` into the terminal.
- `hugo serve` starts the server - you can then browse the site at http://localhost:1313/EH-dataportal
- `--environment development` specifies that it will serve the site for the development environment, using content from `/config/development/config.toml`

You can browse the site at [http://localhost:1313/EH-dataportal](http://localhost:1313/EH-dataportal).

To build the source code, simply enter the command `hugo`. This assembles the site’s files, building to `/docs` (this build-to destination can be specified in `config.toml`). 

More help is available by typing `hugo --help` in the terminal. You can also view help online at [Hugo's CLI docs page](https://gohugo.io/commands/hugo/).

### Start developing
Our internal workflows are to begin work by:
- Branching off of production
- Giving the branch a unique name. We name branches: hotfix-[FIXNAME], content-[CONTENTNAME], or feature-[PROJECTNAME].
- Keeping branch work focused on discrete, unique tasks

After committing, working branches are merged into `production` for deployment. To stage a branch for review, use CloudCannon, which builds individual branches. **Merging into `development` for testing is deprecated** — consistent with the tables below, where `development` appears in no branch row and `hugo-build-to-dev-prod.yml` is marked "In use? No".

### Branches
A run-down of main branches, actions, and purposes are:

| Deploy to          | `EH-dataportal` branch: | `EHDP-data` branch: | Action on merge:             | Used for:              |
|--------------------|-------------------------|---------------------|------------------------------|------------------------|
| Production servers | `production`            | `production`        | Builds to `builds/prod-prod` | Live site              |
| 307 (internal)     | `build-to-dev-stage`    | `staging`           | Builds to `builds/dev-stage` | Demoing data & content |

On merge, these branches are automatically [built](https://github.com/peaceiris/actions-hugo) and [served](https://github.com/peaceiris/actions-gh-pages) to other branches using Github Actions (triggerd by a merged pull request).  _(Note that this requires a workflow YAML file in both [`production`](https://github.com/nychealth/EH-dataportal/blob/production/.github/workflows/hugo-build-to-dev-prod.yml) and the build branch, e.g. [`build-to-dev-stage`](https://github.com/nychealth/EH-dataportal/blob/build-to-dev-stage/.github/workflows/hugo-build-to-dev-stage.yml).)_

### Automated actions

#### Builds
When changes are merged into `production`, a Github Action bulids and commits the site files to `builds/prod-prod`. This build is configured using a GitHub actions workflow file located in [.github/workflows/](.github/workflows/). We deploy this branch to our server to serve up the production site.

Current workflows:

| Workflow:                     | `EH-dataportal` branch: | `EHDP-data` branch:   | Action on merge:                                  | In use?      |
|-------------------------------|-------------------------|-----------------------|---------------------------------------------------|--------------|
| `hugo-build-to-prod-prod.yml` | `production`            | `production`          | Builds to `builds/prod-prod`                      | Yes          |
| `hugo-build-to-dev-stage.yml` | `build-to-dev-stage`    | `staging`             | Builds to `builds/dev-stage`                      | Yes          |
| `hugo-build-to-dev-prod.yml`  | `development`           | `production`          | Builds to `builds/dev-prod`                       | No           |
| `hugo-build-any-branch.yml`   | Any (need to specify)   | Any (need to specify) | By default, builds to `builds/[specified-branch]` | Yes          |

**Note:**
GitHub Actions and the deployment pipeline are set up to convert all end-of-line characters to Unix style (`LF`). This is configured in the workflow YAML files (step `set git EOL`). This is nice for consistency and for avoiding git flagging hundreds of inconsequential changes, but it's actually important for subresource integrity calculations.

#### Other actions
In addition to automated builds, these actions are triggered: The site runs a CodeQL analysis on merges/builds, and is set up to use Github's Depandabot to review dependencies for vulnerabilities.

### Environments
The `/config` folder includes subfolders with environment-specific configuration. Specifically, there are different configuration files for different combinations of development or production site code, and staging or production data. You serve or build the site by specifying the environment (e.g., `hugo serve --environment production` or `hugo serve --environment dev_stage`). This merges the contents of that environment's config file (in `/config/ENVIRONMENT/config.toml'`) with `/config/_default/config.toml`. **You may find it useful to create aliases for these functions ([in Powershell](https://www.tutorialspoint.com/how-to-create-powershell-alias-permanently), or [Bash](https://www.shell-tips.com/bash/alias/))**.

Some key uses of environment-specific variables in the `config` are:
- Setting the `baseURL`
- Setting the variable `data_branch`, which tells the site to read data from `staging` or `production` branches of [EHDP-data](https://www.github.com/nychealth/EHDP-data).

To deploy to a new environment, update the `baseURL` in `config.toml`. Update the path, if necessary, in the environment-specific `config.toml` file.

Current environments:

| Environment:  | Build type: | Data branch: | Purpose                              | Notes                         |
|---------------|-------------|--------------|--------------------------------------|-------------------------------|
| `development` | Development | `production` | Preview site changes                 | Identical to `dev_prod`       |
| `dev_prod`    | Development | `production` | Preview site changes                 |                               |
| `dev_stage`   | Development | `staging`    | Preview combined site & data changes |                               |
| `production`  | Production  | `production` | Deploy to production servers         | Config file identical to `prod_prod`, but see the note below |
| `prod_prod`   | Production  | `production` | Deploy to production servers         |                               |
| `prod_stage`  | Production  | `staging`    | Preview data changes                 |                               |
| `local_prod`  | Development | `production` | Preview site changes                 | Uses locally hosted data repo |
| `local_stage` | Development | `staging`    | Preview combined site & data changes | Uses locally hosted data repo |

**A note on `production` vs `prod_prod`:** the two config files are byte-identical, but the environment *name* is what `partials/head.html` branches on. Only `prod_prod` gets the production Google Analytics property and omits the `<meta name="robots" content="noindex, nofollow">` tag; every other environment — including `production`, and including a bare `hugo` with no `--environment` flag — emits the noindex tag and the development analytics property. The build workflow uses `hugo --environment prod_prod`, so the live site is correct. Build locally with `prod_prod` if you are inspecting anything that depends on those tags.

### Checking your work

Two automated checks live in this repo. Both need `npm install` first, and both drive a real
browser, so they catch things a successful `hugo` build does not — a build only proves the
templates compile.

| Command | What it does |
|---|---|
| `npm run smoke` | Loads 33 pages, one per template kind, and fails on any JavaScript error. Fast. |
| `npm run smoke:all` | The same, over every page the site serves. For a pre-merge sweep. |
| `npm run characterize:site` | Loads every page and compares its *structure* — assets, heading levels, `alt` text, tables, JSON-LD, overflow — against a committed baseline. |
| `npm run characterize:site:sample` | The same check over 41 pages, one per template kind. |

Run `smoke` before merging anything that touches `partials/head.html`, `_default/baseof.html`, the
header or footer partials, or `assets/js/`. Neither check sees what the other does: `smoke` catches
JavaScript that throws, characterization catches a page whose markup quietly moved.

#### Checking a specific environment

`npm run characterize:site` checks whichever environment your machine happens to be serving — it
reuses any Hugo server already answering on :8080, :8081 or :1313, and otherwise starts `dev_stage`
for you. When you need a *named* environment instead, and especially `prod_prod`, which is the one
that actually deploys:

```bash
npm run characterize:site:prod_prod        # the environment the live site is built with
npm run characterize:site:dev_stage        # staging data, deterministically
npm run characterize:site:env local_prod   # any environment in config/
```

These start their own Hugo server on port 8090, build it entirely outside the repo, and stop it
when they finish — so they ignore whatever you have running, and they leave `docs/` and
`resources/_gen` untouched. They are slower than `characterize:site`, because a full build runs
before the check does.

Two baselines are committed, between them covering four of the eight environments. The rest
stop and say which baselines exist:

| Environment | Baseline used |
|---|---|
| `prod_prod` | `prod_prod` |
| `dev_stage`, `local_stage`, `prod_stage` | `staging` |
| `dev_prod`, `development`, `local_prod`, `production` | **none — the check exits and tells you so** |

**Pass the environment as a plain word, not as a flag.** `npm run characterize:site:env prod_prod`
works; `npm run characterize:site:env --env prod_prod` does not, because PowerShell and npm between
them discard the flag's name and keep only its value. The scripts refuse anything starting with `-`
rather than act on a mangled argument. If you need the underlying flags, call the script directly:
`node scripts/site-characterization.mjs --check --content`.

#### When a check fails

A characterization failure names each page and field that moved, with the raw diff underneath. That
is a starting point, not a verdict — a page can move because the data behind it moved, or because a
third-party embed rendered differently, not only because someone broke it. Read what changed before
assuming a regression.

Some pages legitimately go red when *data* changes rather than code. `data-features/proximity/`,
`data-features/congestion-pricing-report/` and `data-features/heat-story/` draw a map marker per
row of their data, and the check counts those markers on purpose — a marker appearing or vanishing
is a real change to what the page shows. Editing that data therefore means re-capturing the
baselines, and that is working as intended, not a bug. `data-features/realtime-air-quality/` is the
exception: its markers come from a live feed that nobody here controls, so its marker count is
deliberately **not** recorded — only whether the map drew any markers at all.

If a site-wide change is *intended*, the baselines are re-captured with
`npm run characterize:site:rebaseline`, which rebuilds every committed baseline and reports what
moved. That command takes no arguments and overwrites all of them, so it is not the way to check a
single environment — the `characterize:site:env` scripts above are.

### Data repository

Most of the data used by the site is stored in the separate [EHDP-data](https://github.com/nychealth/EHDP-data) repository. This setup allows us to update the site's data without needing to re-build the entire site. Look there for descriptions of the data files, and for the code used to generate the them. 

Note that any file required to *build* the site should remain with the source code, but anything required only for display can be stored in the remote data repo, EHDP-data. 

---
## How to create new content
Generally, Hugo works by combining content (in markdown, located in `/content`) with templates (located in the `/themes`) - you'll notice that these two directories have identical structures, because Hugo combines content in `/content/data-stories`, for example, with templates in `/themes/dohmh/layouts/data-stories`. 
- A file named `_index.md` will get `section.html` layout 
- A file named `index.md` will, by default, receive the `single.html` layout
- And, a file with another name, `name.md`, will receive `single.html` layout 
- A file with `layout: custom` in the frontmatter will get a layout called `custom.html` (all in the corresponding layouts folder).

Generally, a page constructed with `index.md` will be the final item in that directory structure that Hugo builds; `_index.md` is required for a content item to have child pages.

Templates can include Hugo code (which you can identify by {{ curly brackets }}. When Hugo serves or builds the site, it runs code, inserts content into the HTML, and produces static HTML pages. Any template is actually an assembly of other templates, including partials, which are re-usable template blocks.

### Creating a new data story
- First create the markdown file with the terminal command `hugo new data-stories/TITLE/index.md`. 
- Add a banner image to the same folder.
- Copy, paste, and edit the frontmatter from pre-existing data stories. You will need these fields (as well as others):
    - `title`, `date`, and `draft` 
    - `seo_title` and `seo_description`
    - `categories`: this determines what Key Topics this data story is associated with
    - `keywords` to support search functions
    - `image` to associate with the image filename
    - `menu.main.identifier` to highlight the correct button in the nav menu
- Write the data story in markdown. You can use Datawrapper and Vega shortcodes (see additional information on shortcodes, below)
- To publish, set `draft: false`. The data story will be a part of the site when you serve or build it, and it will appear on the related pages if it's been tagged properly via `categories`.

### Key Topics
To create a new Key Topic:
- Create a markdown file with `hugo new key-topics/TITLE/index.md`
- Copy, paste, and edit the frontmatter from pre-existing Key Topic files. In particular, you will need the following frontmatter fields: 
    -  `keyTopic` (for example, `keyTopic: airquality`). This associates this Key Topic with any other content that has `airquality` as one of its `categories`.
    - `layout: single` to give it the correct template
    
To create a child page, create a subfolder within the keytopic - for example, see the folder structure under `/content/key-topics/airquality`.

### Data Explorer
The data explorer includes markdown files for each topic (previously called subtopics). The associated indicators are specified in an array (with headers) in the frontmatter. Extensive Javascript powers the rest of the functions, with the javascript for each display (summary, map, trend, and links) in discrete files.

### Neighborhood Reports
To publish a new neighborhood report, you'd need:
- JSON files for each neighborhood stored in `EHDP-data/neighborhood-reports/reports`
- YML stored in `/data/globals`
- Preview chart images stored in `EHDP-data/neighborhood-reports/images`
- Indicator data files stored in `EHDP-data/neighborhood-reports/data`

---
## Special functions

### Related content
Related content and related data are managed through frontmatter fields; partials that ingest related content or related data are set to default to things that match on Key Topic / `categories`, if those frontmatter fieldsdo not exist. 

### Templates and partials
Templates are stored in `themes/dohmh/layouts`, in the folder for their corresponding content area. A template includes:
- The base template, in `layouts/_default/baseof.html`, and components referenced in that file (like `header.html`, `footer.html`, etc)
- The page template itself (e.g., `layouts/data-stories/single.html`)
- Partials: re-usable template blocks are are stored in `/partials`. These can be called from any other templates.

### Shortcodes
Shortcodes can be called from content files (markdown). Essentially, the shortcode is called and arguments are passed into it and inserted into the corresponding HTML code in `layouts/shortcodes`. There are shortcodes for a few different visualization embeds for Data Stories, and more can be written as needed.

### Data/Globals
Data accessible throughout the site can be stored in the `data` folder. This can be referenced by site templates. For example, `data/recently_updated_data.yml` supplies the "featured datasets" shown on the Home Page (`themes/dohmh/layouts/index.html`) and the Data Explorer landing page (`themes/dohmh/layouts/data-explorer/section.html`), both of which range over `.Site.Data.recently_updated_data.featured` directly. You can update those datasets by editing that file.

Other content in `data/globals` is SEO defaults (`seo_defaults.yml`), social links (`social.yml`), and the Neighborhood Reports copy in `NR_content/` and `NR_footer/`.

*(Note: `partials/featured-data.html` and `partials/featured-data-2.html` still range over a `featured_data` data file that no longer exists, and neither partial is called from any template.)*

### Subresource Integrity
We use Hugo's `integrity` function; this calculates a "message digest" value for a resource, allowing us to include it in the `integrity` property of `<script>` and `<link>` tags, which usually load JavaScript and CSS files, respectively. Hugo also adds a hash value to the resource's built filename, and tells the pages to fetch the files with the hashed names. (We use a partial template to modify the way this filename hash is calculated, because Hugo's default is absurdly long.) This is a way of improving security by ensuring the integrity of the JS and CSS files. 

If *all* of these resources break on the production site, it may be because the server's certificate is expired. If *some* - but not *all* - of these break on the production site, Unix vs. Windows end-of-line characters may be to blame. See [Automated actions](#automated-actions) above for more info.

### Dependency bundling
Dependencies (The JS libraries the site uses: D3, Arquero, Vega-Lite, Accessible Autocomplete, etc) are served by the site rather than linked from CDNs. When you run `npm install` to configure your local repo, they are stored in `/node_modules`. When you run a build (`hugo` or via merging to `development` or `production`, per Github Actions), Hugo grabs these dependencies, applies the Integrity hash (see above), and references these 'local' versions. 

### Image handling
We use Hugo to automatically resize images. Where you put the source path of an image, there's additional code - Hugo resizes the image, generates a different size (puts it in the `/resources/_gen/images`), and automatically points to the resized image. **Missing images are frequent causes of build failures.**

### Environment-specific code
We currently use a variety of environment-specific code to produce:
- Different analytics for staging and production

### Generating topic_indicators.json
`data-index.html`, on site build, assembles a json file of topics and indicators. It ranges over DE topic frontmatter and produces a cross-reference of topics and indicators ([file](https://github.com/nychealth/EH-dataportal/blob/builds/prod-prod/IndicatorMetadata/topic_indicators.json)). This is used on `data-index.html` as well as on the Neighborhood Reports: when an indicator is clicked, it runs `getURL()` to find the parent topic for the indicator, generates a URL, and produces the Get The Dataset button. 

### CloudCannon integration
The repo includes some files to integrate with CloudCannon, an online CMS provider. Specifically:
- `cloudcannon.config.yaml` sets up how the site appears in the CloudCannon CMS, what the editor reveals, what shortcodes are easily accessible, etc. 
- `.cloudcannon/prebuild` is code that runs immediately before CloudCannon builds a site branch.
- `.cloudcannon/postbuild` is code that runs after CloudCannon builds a site branch.
- `.cloudcannon/schemas` include frontmatter templates for when CloudCannon works with frontmatter.

### Build caching
Resources used in a build (like a Neighborhood Report json spec, for example) may be cached by whatever machine is running the build. Updates to resources might not be reflected in a build if Hugo is using cached versions. In `config.toml`, setting the cache to have a `maxAge = 0` effectively turns it off, ensuring that Hugo will use the original, non-cached resources. Caching in Hugo is explained more [here](https://gohugo.io/configuration/caches/).