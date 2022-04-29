# The NYC Environment and Health Data portal - frontend development

This repository contains a prototype of the Environment and Health Data Portal. You can view a staged development version [here](https://nycehs.github.io/ehs-data-portal-frontend-temp/). We are in the process of fully developing this. If you're interested in helping, you can [email us](mailto:trackingportal@health.nyc.gov) - we are always looking for people interested in user testing and co-design work.

## General Development

### Data repository

Most of the data used by the site is stored in the separate [EHDP-data](https://github.com/nychealth/EHDP-data) repository. This setup allows us to update the site's data without needing to re-build the entire site. Look there for descriptions of the data files, and for the code used to generate the them.

Note that any file required to *build* the site should remain with the source code, but anything required only for display can and should be stored in the remote data repo, EHDP-data. 

### Getting started
You will need the following things properly installed on your computer.
- [Git](https://git-scm.com/)
- [Hugo](https://gohugo.io/). We are currently on v0.97, and builds may not work from older versions. Run `brew upgrade hugo` to update.
- [Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- [Grunt](https://gruntjs.com/)

If your repo doesn't contain npm node modules (which are ignored via `gitignore`), run `npm init` to create `package.json` and `npm install` to install the necessary packages (including Grunt).

### Basic workflow 
Our git patterns are to develop on branches labelled hotfix-, content-, or feature-. Keep branch work focused on discrete tasks to avoid merge conflicts later. 

In your local development environment, start the server by typing `hugo serve --environment local --disableFastRender` into the terminal.
- `hugo serve` starts the server - you can then browse the site at http://localhost:1313/ehs-data-portal-frontend-temp 
- `--environment local` specifies that it will serve the site for the local environment, using content from `/config/local/config.toml`
- `--disableFastRender` turns off fast render mode, so more small changes are rapidly served

Develop your work. To test with coworkers, merge changes into development.
- Run a build with `hugo --environment local`. The `hugo` command builds a fresh version of the site to `/docs`. This build location is specified in `config.toml`.
- Development is served on githubpages.  

Branches that pass testing and are ready for primetime can then be merged into main. After merging branches into main, run a new build on main.

### Testing and checks
The site runs a CodeQL analysis on merges/builds. 

### Environment-specific builds
The /config folder includes subfolders with environment-specific configuration. Specifically, there are different configuration files for serving the site locally, serving it on Github pages, and eventually, building for production.

Currently, config/local/config.toml has a variable ```devpath = "/ehs-data-portal-frontend-temp"```. This can be inserted into templates in order to fix path issues. For example, in header.html, the following uses this environment variable to load the banner image:
```<div class="site-header bg-primary" style="background-image: url({{ $.Site.Params.devpath}}/images/header_background.jpg)">``` 

To run a local-environment-specific serve or build, enter ```hugo serve --environment local``` or ```hugo build --environment local```. This will merge the contents of /config/local/config.toml with /config/_default/config.toml.

**You may find it useful to create aliases for these functions ([in Powershell](https://www.tutorialspoint.com/how-to-create-powershell-alias-permanently), or [Bash](https://www.shell-tips.com/bash/alias/))**.

### Deployment
The development branch is served on github pages, here: [Environment and Health Data Portal](https://nycehs.github.io/ehs-data-portal-frontend-temp).

The branch deploy-Neighborhood-Reports is a dead-end branch meant for deploying only the NRs to our servers.

To deploy to a new environment, update the baseURL in `config.toml`. Update the path, if necessary, in the environment-specific `config.toml` file. And, you may need to update paths in other files, like `search-results.js`.

---
## How-to: Creating new content
This section contains brief descriptions of how to create new content types. Additional details are available below, in "Architecture and Functioning."

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
Key Topics associate different content types by theme, and they also host their own child pages (such as the Air Quality Explorer, or the interactive Heat Vulnerability Index). Each Key Topic page is an `_index.md` file in a titled folder. Child pages are subfolders within that - for example, see the folder structure under `/content/key-topics/airquality`.

To create a new Key Topic:
- Create a markdown file with `hugo new key-topics/TITLE/_index.md`
- Copy, paste, and edit the frontmatter from pre-existing Key Topic files. In particular, you will need the following frontmatter fields: 
    -  `keyTopic` (for example, `keyTopic: airquality`). This associates this Key Topic with any other content that has `airquality` as one of its `categories`.
    - `layout: single` to give it the correct template

### Data Explorer
The data explorer includes markdown files for each subtopic. For the prototype version, the subtopic includes json that connects to Portal data on the old version of the portal. For the future build, it will include an array with indicator IDs associating indicators with the subtopic.

### Neighborhood Reports
To publish a new neighborhood report, you'd need:
- JSON files for each neighborhood stored in `EHDP-data/neighborhoodreports/reports`
- YML stored in `/data/globals`
- Preview chart images stored in `EHDP-data/neighborhoodreports/images`
- Indicator data files stored in `EHDP-data/neighborhoodreports/data`

---

## Architecture and Functioning
Development might entail:
- Writing new content, as markdown files
- Creating new templates, as HTML files
- Using Hugo code to create functions within templates

### Content and templates
Generally, Hugo works by combining content (in markdown, located in `/content`) with templates (located in the `/themes`) - you'll notice that these two directories have identical structures, because Hugo combines content in `/content/data-stories`, for example, with templates in `/themes/layouts/data-stories`. 

A file named ```index.md``` will, by default, receive the ```single.html``` layout, whereas a file named ```_index.md``` will get ```section.html``` layout. And, a file with another name, `name.md`, will receive `single.html` layout - all in the corresponding layouts folder, of course. 

Templates can include Hugo code (which you can identify by {{ curly brackets }}. When Hugo serves or builds the site, it runs code, inserts content into the HTML, and produces static HTML pages. 

### Partials
Partials are templates that can be inserted into other templates. Partials are stored in `/themes/dohmh/layouts/partials` and are called using the Hugo code `{{ partial partialname}}`.

For example, the page's head, SEO information, and JavaScript at the bottom are all stored as partials and called into each other page. Other partials include keywords and socialshare buttons.

### Shortcodes
Shortcodes are codes that are inserted into content markdown file, in order to generate content that's more complex than just markdown can accommodate. Shortcodes are written by writing HTML files in `/themes/dohmh/layouts/shortcodes`, and then are called in content markdown files. 

For example, the rawhtml shortcode allows you to insert raw HTML into a content markdown, by inserting the below into a markdown file.

```
<< rawhtml >>
    ... Insert raw HTML here.
{{< /rawhtml>}}
```

Other shortcodes, like our Vega-lite and Datawrapper shortcodes, can have arguments passed into them. See below for specific documentation.

---

## Main Components

### Data Stories

New data stories can be produced by adding a content markdown file to `/content/data-stories`. 

**Banner images**: Data stories include a banner image. This image is added to the data story's directory. It should be called ```ds-[storyname].jpg```. The image should be referenced in the front matter with: `images: ds-assults.jpg`.

It is referenced via in-line CSS in themes/dohmh/layouts/data_stories/single.html.

**Other data story images**:  Other images can be added to Data Stories (and other pages) using the figure shortcode that is native to Hugo. `{{< figure src="/location/image.jpg" alt="Alt text goes here" >}}`

**Alternate layouts**: We can also use custom layouts by specifying the layout in the front matter. For example, ```layout:advanced``` will use ```advanced.html``` (for in-page nagivation), and ```layout:flexible``` will use ```flexible.html```, which puts all content inside of a ```container-fluid``` and a single Bootstrap row. This is largely useful for moving pre-existing data stories over into our new structure, and probably shouldn't be used to develop *new* data stories.

## Neighborhood Reports
Neighborhood Reports use content markdown, json data, and CSV data to generate the reports.

* Report data for the site is stored in [`EHDP-data/neighborhoodreports/reports`](https://github.com/nychealth/EHDP-data/tree/main/neighborhoodreports/reports). These json exist for each neighborhood-and-report combination, and specify what indicators and summary statistics are a part of the report.
* There is a markdown file for each report in site content that references the report metadata from its front matter.
* There are two main templates used for reports `/themes/dohmh/layouts/location/single.html` is the main report template along with the partial that is loaded for each indicator `/themes/dohmh/partials/report_indicator.html`.

Visualizations are powered by Vega-Lite with code and basic implementation approach provided by DOHMH team.
* Visualization specifications for the summary, trend, and map are included in `/static/visualizations/spec`.
* CSV data for visualizations is stored in [`EHDP-data/neighborhoodreports/data`](https://github.com/nychealth/EHDP-data/tree/main/neighborhoodreports/data).
* SVG images for visualizations is stored in [`EHDP-data/neighborhoodreports/images`](https://github.com/nychealth/EHDP-data/tree/main/neighborhoodreports/images).
* All html, function calls, and dynamic variables are found in the `/themes/dohmh/partials/report_indicator.html` partial.
* Functions are initiated on modal open following methods detailed in Bootstrap 4.5 docs.

There are some critical content elements that are site wide or used in multiple pages and are stored in `/data/globals`. 
* `/data/globals/report_content/...` - There should be five of these files. One for each report type. These include the content in the four cards at the bottom of each report page.
* `/data/globals/seo_defaults.yml` - These are the Site default meta values. The SEO image should stored in the `/assets/images` folder. Image dimensions should be 2400 × 1260 for a 2x image resolution.

### Data Explorer
Currently, the Data Explorer just includes subtopics that link to Indicator Pages on the extant Portal. 

Indicators are currently stored as json within subtopic content markdown file's front matter - see [asthma.md](https://github.com/nycehs/ehs-neighborhoodprofiles/blob/main/content/data-explorer/asthma.md) or below:

```
indicators: [
    {
        "name" : "ED visits (adults)",
        "URL": "http://a816-dohbesp.nyc.gov/IndicatorPublic/VisualizationData.aspx?id=2380,4466a0,11,Summarize"
    },

    {
        "name" : "ED visits (age 0-4)",
        "URL": "http://a816-dohbesp.nyc.gov/IndicatorPublic/VisualizationData.aspx?id=2048,4466a0,11,Summarize"
    }
]
```

For the future iteration of the Data Vis Module, the following functions will be in place:
- Indicators will be associated with subtopics via frontmatter
- The page will display Indicator metadata that is stored in [`EHDP-data/indicators/indicators.json`](https://github.com/nychealth/EHDP-data/tree/main/indicators/indicators.json)
- Upon indicator selection, the page will display data stored in `EHDP-data/indicators/data/(indicatorID).json`.

### Key Topics
Key topic pages ingest content in other sections (neighborhood-reports, data-stories, and data-explorer) as well as child pages, to display related content from across the site.

In order to associate content properly:
- Any given content piece should have frontmatter `categories` that correspond with the Key Topics it's associated with: `categories: ["transportation","airquality","neighborhoods"]`. 
- Key Topics should have a single keyTopic in their frontmatter: `keyTopic: airquality`.

**Data features** are child pages of Key Topic pages.

### Site Search
The site search works using Grunt and Lunr. 
- `Gruntfile.js` runs locally and builds `/static/js/lunr/PagesIndex.json`
- `search-results.js` uses Lunr functions to search `PagesIndex.json` and display results on the search-results template.

When you add or update content, re-Index the site by running `grunt lunr-index` in your terminal. It will scan the site and update PagesIndex.json.

### SEO
The site has been configured to support both site wide SEO meta defaults as well as per page overrides.

* The `/themes/dohmh/layouts/partials/seo.html` file is the template for SEO meta that is pulled into the html head and related partial.
* Default data are set in two places `/data/globals/seo_defaults.yml` has basic meta settings while `/data/globals/social.yml` has any of your social destinations.
* In content front matter the following fields can override the site-wide defaults.
  * `title` entry title will override default title.
  * `seo_title` will override both page `title` and default title.
  * `seo_description` will override default description
  * `seo_image` will override default image. NOTE - you should use a relative path to the image. LOCATION TBD.

---

## How the components work together
Other functionality worth noting for ongoing development:

### Navigation
The nav menu will highlight the content area (e.g., "Data Stories") when the user is on that area's landing page, or on a subpage within that directory. For this to work, each markdown file (especially subpages) needs the following in the front matter:

```
menu:
    main:
        identifier: '02'
```

Use 01 for subpages of the home page, 02  for data stories, 03 for the data explorer, 04 for neighborhood reports, and 05 for Key Topics (per config.toml).

### Asset management
Assets like images or other files can be stored in /static, or in a content directory. Follow these guidelines for asset management:
- If an asset is likely to be used across the site, it should be stored in /static. 
- Store data files in /static, so that an update workflow might overwrite /static/visualizations/csv/nr rather than finding individual data files in content directories. 
- If it's page-specific, store it in a content directory close to the content that uses it.

### Ranging through items in another content section
We have a few different ways of ingesting content across sections. One way is using the partial ```related.html```. This partial can be called with the following:
```                    
{{ partial "related" (dict "section" "data-explorer" "layout" "list" "content" . ) }}
```

This passes in several arguments (data explorer, list) that are used as variables in the partial itself, to determine which section's content is displayed, and how it is displayed.

The basis of the code in related.html is an older approach, code that works on any template page to range through items in another content section. For example, placed on key-topics/section.html, it ranges (loops) through all of the Site's Pages that are in the data_stories section, and prints the Title.

```
    {{ range where .Site.RegularPages "Section" "data_stories" }}
        {{ .Title }}<br>
    {{end}}
```

This is more complex code that looks for the intersection of two areas' categories field. As a reminder, we use categories to tag matter with their **key topics**. 

```
    <!--Establishes two variables-->
    {{ $page_link := .Permalink }}
    {{ $cats := .Params.categories }}
    <!--Ranges through the section we want to ingest into this page-->
    {{ range where .Site.RegularPages "Section" "data-explorer" }}
    <!--Places the contents of that range, ., into a variable called $page-->
    {{ $page := . }}
    <!--Defines a variable as the intersection of the ranged pages .Params.categories, and this page's-->
    {{ $has_common_cats := intersect $cats .Params.categories | len | lt 0 }}
    <!--Excludes this page-->
    {{ if and $has_common_cats (ne $page_link $page.Permalink) }}
    <li><a href="{{ .URL}}">{{ .Title }}</a></li>
    {{ end }} 
    {{ end }}
```

Data stories, Key Topics, and Data Explorer (subtopics) markdown should have the following in the frontmatter:
- categories: ["key topic 1", "key topic 2"]
- keywords: a field used to populate information for the site search function
- tags: a freeform category we are not yet using

Each Key Topic also has a single keyTopic parameter that matches its title, and other content's category tag. 

### Using custom layouts
If a file contains ```layout: custom``` in the frontmatter,  Hugo will look for a layout named ```custom.html``` in the same directory structure within ```/themes/dohmh/layouts```. Use this for one-off data features like the Air Quality Explorer. For Key Topic landing pages, use ```layout: single``` to force these pages to display based on the ```single.html``` template instead of the list template (```section.html```).

### Data visualization shortcodes
Shortcodes for Datawraper and Vega/Vega-Lite both exist. With shortcodes, you enter simple code in markdown that inserts components into pre-written code. 

To embed a Vega/Vega-Lite visualization, simply add this:. The shortcut inserts the id and the spec into standard V/VL code. Store chart specifications in ```/static/visualizations/spec```. 

Vega shortcode example:
```{{< vega id="uniqueDivID" spec="../../visualizations/spec/bartest.vl.json" >}}```

For Datawrapper, the shortcode is:
```{{< datawrapper title="Title" src="chartID/version/" height="Height" >}}```

### Data visualization libraries
Content markdown needs frontmatter parameters so that the page template adds necessary reference for visualization libraries. Use ```vega:true``` in the markdown to add Vega libraries to ```head.html```. Use ```arquero:true``` to add Arquero, ```datatables:true``` to add datatables, and ```leaflet:true``` to add leaflet. 

The partial `head.html` has a bunch of conditionals that add references to these libraries to the page if the associated variable is set to true in the frontmatter. 

---

## Contact us

You can comment on issues and we'll follow up as soon as we can. In the spirit of free software, everyone is encouraged to help improve this project.  Here are some ways you can contribute.

- Comment on or clarify [issues](https://github.com/nycehs/ehs-data-portal-frontend-temp/issues)
- Suggest new features
- Write code (no patch is too small), clean up code, or add new features

## Communications disclaimer

With regard to GitHub platform communications, staff from the New York City Department of Health & Mental Hygiene are authorized to answer specific questions of a technical nature with regard to this repository. Staff may not disclose private or sensitive data. 
