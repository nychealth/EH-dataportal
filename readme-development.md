# Readme: site development

## General Development
This Readme file documents the basics of site structure and functioning. 

### Getting started
You will need the following things properly installed on your computer.

- [Git](https://git-scm.com/)
- [npm](https://www.npmjs.com/)
- [Hugo](https://gohugo.io/) 

With this repository cloned onto your machine, you can browse a local version of the site. In your local development environment, start the server by typing `hugo serve --environment development --disableFastRender` into the terminal.
- `hugo serve` starts the server - you can then browse the site at http://localhost:1313/EH-dataportal
- `--environment development` specifies that it will serve the site for the development environment, using content from `/config/development/config.toml`
- `--disableFastRender` turns off fast render mode, so more small changes are rapidly served.

You can browse the site at [http://localhost:1313/EH-dataportal](http://localhost:1313/EH-dataportal).

To build the source code, simply enter the command `hugo`. This assembles the site’s files, building to `/docs` (this build-to destination can be specified in `config.toml`). 

### Start developing
Our internal workflows are to begin work by:
- Branching off of production
- Giving the branch a unique name. We name branches: hotfix-[FIXNAME], content-[CONTENTNAME], or feature-[PROJECTNAME].
- Keeping branch work focused on discrete, unique tasks

After committing, working branches can be merged into `development` for testing then merged into `production` for deployment.

### Branches
A run-down of main branches, actions, and purposes are:

| Deploy to          | `EH-dataportal` branch: | `EHDP-data` branch: | Action on merge:             | Used for:              |
|--------------------|-------------------------|---------------------|------------------------------|------------------------|
| Production servers | `production`            | `production`        | Builds to `builds/prod-prod` | Live site              |
| GitHub Pages       | `development`           | `production`        | Builds to `builds/dev-prod`  | General development    |
| 307 (internal)     | `development`           | `staging`           | Builds to `builds/dev-stage` | Demoing data & content |

On merge, these branches are automatically [built](https://github.com/peaceiris/actions-hugo and [served](https://github.com/peaceiris/actions-gh-pages) to other branches using Github Actions (triggerd by a merged pull request).  _(Note that this requires a workflow YAML file in both [`main`](https://github.com/nychealth/EH-dataportal/blob/main/.github/workflows/hugo-build-dev-prod.yml) and [`development`](https://github.com/nychealth/EH-dataportal/blob/development/.github/workflows/hugo-build-dev-prod.yml).)_

### Automated actions
When changes are merged into `development` or `production`, in addition to automated builds, these actions are triggered:
- The site runs a CodeQL analysis on merges/builds, and is set up to use Github's Depandabot to review dependencies for vulnerabilities.
- On merge to `development`, a Github Action builds and commits the site files to `builds/dev-prod`. On merge to `production`, an Action bulids and commits the site files to `builds/prod-prod`. We deploy this branch to our server to serve up the production site.
- GitHub Actions and the deployment pipeline are set up to convert all end-of-line characters to Unix style (`LF`). This is nice for consistency and for avoiding git flagging hundreds of inconsequential changes, but it's actually important for subresource integrity calculations.

### Environments
The `/config` folder includes subfolders with environment-specific configuration. Specifically, there are different configuration files for development, staging, and production envirnoments. You serve or build the site by specifying the environment (eg, `hugo serve --environment development` or `hugo --environment production`). This merges the contents of that environment's config file (in `/config/ENVIRONMENT/config.toml'`) with  `/config/_default/config.toml`. **You may find it useful to create aliases for these functions ([in Powershell](https://www.tutorialspoint.com/how-to-create-powershell-alias-permanently), or [Bash](https://www.shell-tips.com/bash/alias/))**.

Some key uses of environment-specific variables in the `config` are:
- Setting the BaseURL
- Setting the variable `data_repo`, which tells the site to read data from `staging` or `production` branches of [EHDP-data](https://www.github.com/nychealth/EHDP-data).

To deploy to a new environment, update the baseURL in `config.toml`. Update the path, if necessary, in the environment-specific `config.toml` file. And, you may need to update paths in other files, like `search-results.js`. Crtl-F is your friend.

### Data repository

Most of the data used by the site is stored in the separate [EHDP-data](https://github.com/nychealth/EHDP-data) repository. This setup allows us to update the site's data without needing to re-build the entire site. Look there for descriptions of the data files, and for the code used to generate the them. 

Note that any file required to *build* the site should remain with the source code, but anything required only for display can be stored in the remote data repo, EHDP-data. 

---
## How to create new content
Generally, Hugo works by combining content (in markdown, located in `/content`) with templates (located in the `/themes`) - you'll notice that these two directories have identical structures, because Hugo combines content in `/content/data-stories`, for example, with templates in `/themes/layouts/data-stories`. 
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
Data accessible throughout the site can be stored in the `data` folder. This can be referenced by site templates. For example, `featured_data.yml` is referenced by `partials/featured-data.html` and displayed on the Home Page and the Data Explorer landing page. You can update "featured datasets" by updating this file.

Other content in `data` are SEO variables and Neighborhood Reports core content.

### Subresource Integrity
We use Hugo's `integrity` function; this calculates a "message digest" value for a resource, allowing us to include it in the `integrity` property of `<script>` and `<link>` tags, which usually load JavaScript and CSS files, respectively. Hugo also adds a hash value to the resource's eventual filename, and tells the pages to fetch the files with the hashed names. (We use a partial template to modify the way this filename hash is calculated, because Hugo's default is absurdly long.) This is a way of improving security by ensuring the integrity of the JS and CSS files. If *all* of these resources break on the production site, it may be because the server's certificate is expired. If *some* - but not *all* - of these break on the production site, Unix vs. Windows end-of-line characters may be to blame. See [Automated actions](#automated-actions) above for more info.

### Dependency bundling
Dependencies (The JS libraries the site uses: D3, Arquero, Vega-Lite, Accessible Autocomplete, etc) are served by the site rather than linked from CDNs. When you run `npm install` to configure your local repo, they are stored in `/node_modules`. When you run a build (`hugo` or via merging to `development` or `production`, per Github Actions), Hugo grabs these dependencies, applies the Integrity hash (see above), and references these 'local' versions. 

### Image handling
We use Hugo to automatically resize images. Where you put the source path of an image, there's additional code - Hugo resizes the image, generates a different size (puts it in the `/resources/_gen/images`), and automatically points to the resized image.

### Environment-specific code
We use a variety of environment-specific code to produce:
- A conditional modal
- Different analytics for staging and production
- ...and possibly other stuff. 

### Generating topic_indicators.json
`data-index.html`, on site build, assembles a json file of topics and indicators. It ranges over DE topic frontmatter and produces a cross-reference of topics and indicators ([file](https://github.com/nychealth/EH-dataportal/blob/builds/prod-prod/IndicatorData/topic_indicators.json). This is used on `data-index.html` as well as on the Neighborhood Reports: when an indicator is clicked, it runs `getURL()` to find the parent topic for the indicator, generates a URL, and produces the Get The Dataset button. 

### Cloudcannon integration
The repo includes some files to integrate with Cloudcannon, an online CMS provider. Specifically:
- `cloudcannon.config.yaml` sets up how the site appears in the CC CMS, what the editor reveals, what shortcodes are easily accessible, etc. 
- `.cloudcannon/prebuild` is code that runs when Cloudcannon builds/serves the site.
- `.cloudcannon/schemas` include frontmatter templates for when CC works with frontmatter.

### Build caching
Resources used in a build (like a Neighborhood Report json spec, for example) may be cached by whatever machine is running the build. Updates to resources might not be reflected in a build if Hugo is using cached versions. In `config.toml`, setting the cache to have a `maxAge = 0` effectively turns it off, ensuring that Hugo will use the original, non-cached resources. Caching in Hugo is explained more [here](https://gohugo.io/getting-started/configuration/#configure-file-caches).