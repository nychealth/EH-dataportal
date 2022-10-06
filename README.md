# The NYC Environment and Health Data portal - frontend development

This repository contains a prototype of the Environment and Health Data Portal. You can view a staged development version [here](https://nychealth.github.io/EH-dataportal/). We are in the process of fully developing this. If you're interested in helping, you can [email us](mailto:trackingportal@health.nyc.gov) - we are always looking for people interested in user testing and co-design work.

## General Development

### Getting started
You will need the following things properly installed on your computer.

- [Git](https://git-scm.com/)
- [Hugo](https://gohugo.io/) 
- [Grunt](https://gruntjs.com/)

This repository contains source code. To browse a local version of the site, in your local development environment, start the server by typing `hugo serve --environment development --disableFastRender` into the terminal.
- `hugo serve` starts the server - you can then browse the site at http://localhost:1313/EH-dataportal
- `--environment development` specifies that it will serve the site for the development environment, using content from `/config/development/config.toml`
- `--disableFastRender` turns off fast render mode, so more small changes are rapidly served.

You can browse the site at [http://localhost:1313/EH-dataportal](http://localhost:1313/EH-dataportal).

To build the source code, simply enter the command `hugo`. This assembles the site’s files, building to `/docs` (this build-to destination can be specified in `config.toml`). 

### Start developing
To begin work:
- Branch off of production
- Give the branch a unique name. Branches should be named hotfix-[FIXNAME], content-[CONTENTNAME], or feature-[PROJECTNAME].
- Keep branch work focused on discrete tasks

After committing, working branches can be merged into `development` for testing and `production` for deployment.

### Branches
A run-down of main branches, actions, and purposes are:

| Branch name:  | Action on merge:         | `EHDP-data` branch:  | Used for:                          |
|---------------|--------------------------|----------------------|------------------------------------|
| `development` | Builds to `gh-pages`     | `production`         | General development                |
| `production`  | Builds to `data-staging` | `staging`            | Demoing data (build/deploy to 201) |
| `production`  | Builds to `prod-deploy ` | `production`         | Deployment to live server          |

On merge, these branches are automatically [built](https://github.com/peaceiris/actions-hugo and [served](https://github.com/peaceiris/actions-gh-pages) to other branches using Github Actions (triggerd by a merged pull request).  _(Note that this requires a workflow YAML file in both [`main`](https://github.com/nychealth/EH-dataportal/blob/main/.github/workflows/hugo-build-gh-pages.yml) and [`development`](https://github.com/nychealth/EH-dataportal/blob/development/.github/workflows/hugo-build-gh-pages.yml).)_

### Automated actions
When changed are merged into `development` or `production`, in addition to automated builds, these actions are triggered:
- The site runs a CodeQL analysis on merges/builds, and is set up to use Github's Depandabot to review dependencies for vulnerabilities.
- `Gruntfile.js` runs to create `/static/js/lunr/PagesIndex.json`, which powers the search function (`search-results.js`  uses Lunr functions to search `PagesIndex.jso`n and display results on the search-results template).

### Environments
The `/config` folder includes subfolders with environment-specific configuration. Specifically, there are different configuration files for development, staging, and production envirnoments. You serve or build the site by specifying the environment (eg, `hugo serve --environment development` or `hugo --environment production`). This merges the contents of that environment's config file (in `/config/ENVIRONMENT/config.toml'` with  `/config/_default/config.toml`. **You may find it useful to create aliases for these functions ([in Powershell](https://www.tutorialspoint.com/how-to-create-powershell-alias-permanently), or [Bash](https://www.shell-tips.com/bash/alias/))**.

Some key uses of environment-specific variables in the `config` are:
- Setting the BaseURL
- Setting the variable `sitepath` (inserted into the templates to fix path issues)
- Setting the variable `data_repo`, which tells the site to read data from `staging` or `production` branches of [EHDP-data](https://www.github.com/nychealth/EHDP-data).

To deploy to a new environment, update the baseURL in `config.toml`. Update the path, if necessary, in the environment-specific `config.toml` file. And, you may need to update paths in other files, like `search-results.js`.

### Data repository

Most of the data used by the site is stored in the separate [EHDP-data](https://github.com/nychealth/EHDP-data) repository. This setup allows us to update the site's data without needing to re-build the entire site. Look there for descriptions of the data files, and for the code used to generate the them. 

Note that any file required to *build* the site should remain with the source code, but anything required only for display can and should be stored in the remote data repo, EHDP-data. 

---
## How to create new content
Generally, Hugo works by combining content (in markdown, located in `/content`) with templates (located in the `/themes`) - you'll notice that these two directories have identical structures, because Hugo combines content in `/content/data-stories`, for example, with templates in `/themes/layouts/data-stories`. 
- A file named ```index.md``` will, by default, receive the ```single.html``` layout
- A file named ```_index.md``` will get ```section.html``` layout 
- And, a file with another name, `name.md`, will receive `single.html` layout 
- A file with `layout: custom` in the frontmatter will get a layout called `custom.html` (all in the corresponding layouts folder).

Templates can include Hugo code (which you can identify by {{ curly brackets }}. When Hugo serves or builds the site, it runs code, inserts content into the HTML, and produces static HTML pages. 

### Creating a new data story
- First create the markdown file with `hugo new data-stories/TITLE/index.md`. 
- Add a banner image to the same folder.
- Copy, paste, and edit the frontmatter from pre-existing data stories. You will need these fields:
    - `title`, `date`, and `draft` 
    - `seo_title` and `seo_description`
    - `categories`: this determines what Key Topics this data story is associated with
    - `keywords` to support search functions
    - `image` to associate with the image filename
    - `menu.main.identifier` to highlight the correct button in the nav menu
- Write the data story in markdown. You can use Datawrapper and Vega shortcodes (see additional information on shortcodes, below)
- To publish, set `draft: false`. The data story will be a part of the site when you serve or build it, and it will appear on the related pages if it's been tagged properly via `categories`.

### Key Topics
Key Topics associate different content types by theme, and they also host their own child pages (such as the Air Quality Explorer, or the interactive Heat Vulnerability Index). Each Key Topic page is an `_index.md` file in a titled folder. 

To create a new Key Topic:
- Create a markdown file with `hugo new key-topics/TITLE/_index.md`
- Copy, paste, and edit the frontmatter from pre-existing Key Topic files. In particular, you will need the following frontmatter fields: 
    -  `keyTopic` (for example, `keyTopic: airquality`). This associates this Key Topic with any other content that has `airquality` as one of its `categories`.
    - `layout: single` to give it the correct template
    
To create a child page, create a subfolder within the keytopic - for example, see the folder structure under `/content/key-topics/airquality`.

### Data Explorer
The data explorer includes markdown files for each topic (previously called subtopics). The associated indicators are specified in an array (with headers) in the frontmatter. 

### Neighborhood Reports
To publish a new neighborhood report, you'd need:
- JSON files for each neighborhood stored in `EHDP-data/neighborhood-reports/reports`
- YML stored in `/data/globals`
- Preview chart images stored in `EHDP-data/neighborhood-reports/images`
- Indicator data files stored in `EHDP-data/neighborhood-reports/data`

---
## Special functions

MORE HERE
---

## Contact us

You can comment on issues and we'll follow up as soon as we can. In the spirit of free software, everyone is encouraged to help improve this project.  Here are some ways you can contribute.

- Comment on or clarify [issues](https://github.com/nychealth/EH-dataportal/issues)
- Suggest new features
- Write code (no patch is too small), clean up code, or add new features

## Communications disclaimer

With regard to GitHub platform communications, staff from the New York City Department of Health & Mental Hygiene are authorized to answer specific questions of a technical nature with regard to this repository. Staff may not disclose private or sensitive data. 
