# A new frontend for the Environment and Health Data portal
## Brief overview
This repository contains a new prototype of the Environment and Health Data Portal. You can view a staged development version [here](https://nycehs.github.io/ehs-data-portal-frontend-temp/).

This prototype is a static site built with [Hugo](https://gohugo.io/). Generally, Hugo works by combining content (written in markdown) with templates (HTML) to produce the site's HTML files. 

This site has four main sections:
- Data Stories: pages with narrative content and data visualizations
- Key Topics: pages that ingest content from across the site
- Neighborhood Reports: pages that read JSON and CSV data to generate neighborhood reports about health topics
- Data Explorer: pages that read JSON and CSV data to generate visualizations of datasets

### How you can help

In the spirit of free software, everyone is encouraged to help improve this project.  Here are some ways you can contribute.

- Comment on or clarify [issues](link to issues).
- Suggest new features.
- Write or edit documentation.
- Write code to fix typos, add comments, clean up code, or add new features. No patch is too small.

### Contact us

You can comment on issues and we'll follow up as soon as we can. 

### Communications disclaimer

With regard to GitHub platform communications, staff from the New York City Department of Health & Mental Hygiene are authorized to answer specific questions of a technical nature with regard to this repository. Staff may not disclose private or sensitive data. 

---
## How we build and develop this site

### Requirements

You will need the following things properly installed on your computer.

- [Git](https://git-scm.com/)
- [Hugo](https://gohugo.io/) 
- [NPM](https://www.npmjs.com/)
- [Grunt](https://gruntjs.com/installing-grunt)

### Testing and checks
The site runs a CodeQL analysis on merges/builds. 

### Architecture

Generally, Hugo works by combining content (in markdown, located in /content) with templates (located in the /themes) - you'll notice that these two directories have identical structures, because Hugo combines /content/data_stories, for example, with templates in /themes/layouts/data_stories. Templates can include Hugo code (which you can identify by {{ curly brackets }}. When Hugo serves or builds the site, it runs code, inserts content into the HTML, and produces static pages. 

### Development

- On your local, start the server with ```hugo serve --environment local --disableFastRender```
    - ```hugo serve``` starts the server - you can then browse the site at http://localhost:1313/ehs-data-portal-frontend-temp 
    - ```--environment local``` specifies that it will serve the site for the local environment, using content from ```/config/local/config.toml```
    - ```--disableFastRender``` turns off fast render mode, so more small changes are rapidly served

### Development guidelines
- Create a new branch off of main to begin work.
- Develop on branches labelled hotfix-, content-, or feature-. Keep branch work focused on discrete tasks to avoid merge conflicts later.
- Commit often, with descriptive commit messages/notes.
- To test, stage, or review, merge a working branch into development. 
    - Open a pull request for team review.
    - When the work is merged into development, run a build on development with ```hugo --environment local```. The ```hugo``` command builds a fresh version of the site to ```/docs```. Development is served on githubpages.  
- Branches that pass testing and are ready for primetime can then be merged into main. **Important**: merge the working branch into main. Do not merge development into main.
- After merging branches into main, run a new build on main following the instructions above.

---

## Content management guidelines

### Navigation
The nav menu will highlight the content area (e.g., "Data Stories") when the user is on that area's landing page, or on a subpage within that directory. For this to work, each markdown file (especially subpages) needs the following in the front matter:

```
menu:
    main:
        identifier: '02'
```

Use 01 for subpages of the home page, 02  for data stories, 03 for the data explorer, 04 for neighborhood reports, and 05 for Key Topics (per config.toml).

### Asset management
Assets like images or other files can be stored in /static, or in a content directory. Follow these guidelines for asset managemetn:
- If an asset is likely to be used across the site, it should be stored in /static. 
- Store data files in /static, so that an update workflow might overwrite /static/visualizations/csv rather than finding individual data files in content directories. 
- If it's page-specific, store it in a content directory close to the content that uses it.

#### Data Stories banner images
Data stories include a banner image. This image is added to the data story's directory. It should be called ```ds-[storyname].jpg```. The image should be referenced in the front matter this way:
```
image: ds-assaults.jpg
```

It is referenced via in-line CSS in themes/dohmh/layouts/data_stories/single.html.

#### Other data story images
Other images can be added to Data Stories (and other pages) using the figure shortcode that is native to Hugo.
```{{< figure src="/location/image.jpg" alt="Alt text goes here" >}}```

### Alternate data story layouts
A file named ```index.md``` will, by default, receive the ```single.html``` layout, whereas a file named ```_index.md``` will get ```section.html``` layout. We can also use custom layouts by specifying the layout in the front matter. For example, ```layout:advanced``` will use ```advanced.html``` (for in-page nagivation), and ```layout:flexible``` will use ```flexible.html```, which puts all content inside of a ```container-fluid``` and a single Bootstrap row. This is largely useful for moving pre-existing data stories over into our new structure, and probably shouldn't be used to develop *new* data stories.

For ```layout:advanced```, create chapter frontmatter formatted like this:
```
chapters: [
    {
        "chapter": "Introduction",
        "anchor": "1"
    },
    {
        "chapter": "Poverty, race, and health",
        "anchor": "2"
    },
    {
        "chapter": "A brief history of redlining",
        "anchor": "3"
    }
]
```

And, use the storyheader shortcode to insert headers with anchor links like this:
```{{< storyheader text="Introduction" anchor="1">}}```

Note that ```text``` does not need to match ```chapter```, but ```anchor``` in the frontmatter needs to match ```anchor``` in the shortcode.

### Indicators
Indicators can be displayed on subtopic pages. Indicators are currently stored as json within subtopic content markdown file's front matter - see [asthma.md](https://github.com/nycehs/ehs-neighborhoodprofiles/blob/main/content/data_explorer/asthma.md) or below:

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


Then, the template page loops through the Indicator JSON and displays each indicator:

```
{{ range .Params.indicators}}
    <a href="{{.url}}" onclick="protoPopup()">{{.name}}</a>
    <hr>
{{end}}
```

Currently, it directs to the old version of the portal, with a pop-up window about the change in environments. 

### Ranging through items in another content section
We have a few different ways of ingesting content across sections. One way is using the partial ```related.html```. This partial can be called with the following:
```                    
{{ partial "related" (dict "section" "data_explorer" "layout" "list" "content" . ) }}
```

This passes in several arguments (data explorer, list) that are used as variables in the partial itself, to determine which section's content is displayed, and how it is displayed.

The basis of the code in related.html is an older approach, code that works on any template page to range through items in another content section. For example, placed on key_topics/section.html, it ranges (loops) through all of the Site's Pages that are in the data_stories section, and prints the Title.

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
    {{ range where .Site.RegularPages "Section" "data_explorer" }}
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

To embed a Vega/Vega-Lite visualization, simply add this:. The shortcut inserts the id and the spec into standard V/VL code. Store chart specifications in ```static/visualizations/spec```. Additionally, the markdown file needs ```vega: true``` which adds Vega libraries to ```head.html```. 
```{{< vega id="uniqueDivID" spec="../../visualizations/spec/bartest.vl.json" >}}```

For Datawrapper, the shortcode is:
```{{< datawrapper "Title" "chartID/version/" "Height" >}}```

### Environment-specific deployment and building
The /config folder includes subfolders with environment-specific configuration. Specifically, there are different configuration files for serving the site locally, serving it on Github pages, and eventually, building for production.

Currently, config/local/config.toml has a variable ```devpath = "/ehs-data-portal-frontend-temp"```. This can be inserted into templates in order to fix path issues. For example, in header.html, the following uses this environment variable to load the banner image:
```<div class="site-header bg-primary" style="background-image: url({{ $.Site.Params.devpath}}/images/header_background.jpg)">``` 

To run a local-environment-specific serve or build, enter ```hugo serve --environment local``` or ```hugo build --environment local```. This will merge the contents of /config/local/config.toml with /config/_default/config.toml.



---

## Neighborhood Reports

### General

* Project is using NYC's Core Framework which is based on Bootstrap 4. SASS is being processed by Hugo's [Pipes](https://gohugo.io/hugo-pipes/) capabilities.
* NYC Framework files are organized in the `/assets` folder. 
* Site unique CSS is in the `/assets/scss/_theme.scss` file
* Image and other assets used by site are stored in `/static/images/`

### Report Pages

* Report specs (metadata) are stored in the `/data/reports/` folder (one for each neighborhood-report combination).
* Report data are stored in the `/static/visualizations/csv` folder (one for each report type; and one for each indicator).
* There is a markdown file for each report in site `content/neighborhood_reports` that references the report spec (metadata) from its front matter (via the `data_json` field).
* There are two main templates used for reports `themes/dohmh/layouts/neighborhood_reports/single` is the main report template along with the partial that is loaded for each indicator `themes/dohmh/partials/report_indicator`.

### Visualizations
Visualizations are powered by Vega-Lite with code and basic implementation approach provided by DOHMH team.

* Visualization specifications and functions to generate them are included in `assets/js/site.js`. This is previously `chart.html` and functions to identify the correct indicator CSV and neighborhood name and inject it into the Vega-Lite specification.
* CSV data for visualizations is stored in the `/static/visualizations/csv/`folder.
* SVG images for visualizations is stored in the `/static/visualizations/images/`folder.
* All html, function calls, and dynamic variables are found in the `themes/dohmh/partials/report_indicator` partial.
* Functions are initiated on modal open following methods detailed in Bootstrap 4.5 docs.

### SEO
The site has been configured to support both site wide SEO meta defaults as well as per page overrides.

* The `themes/dohmh/layouts/partials/seo.html` file is the template for SEO meta that is pulled into the html head and related partial.
* Default data are set in two places `/data/globals/seo_defaults.yml` has basic meta settings while `/data/globals/social.yml` has any of your social destinations.
* In content front matter the following fields can override the site-wide defaults.
  * `title` entry title will override default title.
  * `seo_title` will override both page `title` and default title.
  * `seo_description` will override default description
  * `seo_image` will override default image. NOTE - you should use a relative path to the image. LOCATION TBD.

  ### Primary Navigation

The menu portion of the Primary navigation is powered by [hugo's menus](https://gohugo.io/content-management/menus/). The main menu is located in the `config.toml` file. 

NOTE: When adding a url for a menu node be sure to include a closing `/`

### Globals

There are some critical content elements that are site wide or used in multiple pages and are stored in `data/globals`. 

* `data/globals/report_content/...` - There should be five of these files. One for each report type. These include the content in the four cards at the bottom of each report page.
* `data/globals/seo_defaults.yml` - These are the Site default meta values. The SEO image should stored in the `assets/images` folder. Image dimensions should be 2400 × 1260 for a 2x image resolution.

### Homepage

`_index.md` in root of content folder. There are frontmatter params and content. Content can be formatted using markdown.

### Neighborhood Reports

`_index.md` in `neighborhood_reports` of content folder. There are frontmatter params and content. Content can be formatted using markdown.

### Location (Neighborhood page)

Content for this page is dynamically generated from the specific child report pages.

- Report page opengraph image is what is used for the card image on this page.

### Report Pages for neighborhood

These pages have content in their frontmatter to power key features and content in hugo templates. They also dictate data fields that include the report data themselves.

- `seo_image` should target an image with the following syntax `image/file_name_of_image.jpg`. These images should stored in the `assets/images` folder. Image dimensions should be 2400 × 1260 for a 2x image resolution.

---
## Site Search

### search-results.js

#### Update the path to the generated Lunr search index file:
line 9 : `request.open('GET', '/ehs-neighborhoodprofiles/js/lunr/PagesIndex.json', true);`

#### Update the homepage path:
Line 87: `window.location.href = "/ehs-neighborhoodprofiles/"`

### search.js

#### Path to the search results page:
Line 5:  `window.location.href = "/ehs-neighborhoodprofiles/search_results/index.html?search=${search}";`

### config.toml

#### Update the baseUrl
Line 1:  `baseURL = "https://blenderbox.github.io/ehs-neighborhoodprofiles/"`
If the baseURL has a subdirectory like on GitHub Pages you will need to set : `canonifyURLs = "true”` and `relativeURLs = "true"`
https://nycehs.github.io/ehs-data-portal-frontend-temp/

[Blenderbox repo's github pages](https://blenderbox.github.io/ehs-neighborhoodprofiles/)

The command to build the search index if you want to run it locally is `grunt lunr-index`

For local dev you can remove the `/ehs-neighborhoodprofiles/` from and update the `baseUrl`

---
## Additional Resources

The following are some reasources you might find helpful for working with hugo.

Regis Philibert - [https://regisphilibert.com/blog/](https://regisphilibert.com/blog/) - Regis is a notable member of the hugo community and has written some great resources that we have found helpful over the years. Some specific articles that we'd recommend reading.
 * Hugo, the scope, the context and the dot - [https://regisphilibert.com/blog/2018/02/hugo-the-scope-the-context-and-the-dot/](https://regisphilibert.com/blog/2018/02/hugo-the-scope-the-context-and-the-dot/) - This is a must read. The most challenging concept of using Hugo is the concept of scope. When you loop through content/data and then have loops within loops and/or pass data down to partials as is needed on this site keep track of scope of the data variables is important. This article should help a lot.
 * Hugo Scratch Explained - [https://regisphilibert.com/blog/2017/04/hugo-scratch-explained-variable/](https://regisphilibert.com/blog/2017/04/hugo-scratch-explained-variable/) - Scratch is a way to store data in a variable to be used elsehwere in your page processing. We use this in a few notable ways to help with reports and making data from one scope available to another.
 * Hugo Pipes - [https://regisphilibert.com/blog/2018/07/hugo-pipes-and-asset-processing-pipeline/](https://regisphilibert.com/blog/2018/07/hugo-pipes-and-asset-processing-pipeline/) - We are using pipes to process and prepare both the SCSS and Javascript on the site.
