# A new frontend for the Environment and Health Data portal

This repository contains a new prototype of the Environment and Health Data Portal. You can view a staged development version [here](https://nycehs.github.io/ehs-data-portal-frontend-temp/).

## How you can help

In the spirit of free software, everyone is encouraged to help improve this project.  Here are some ways you can contribute.

- Comment on or clarify [issues](https://github.com/nycehs/ehs-data-portal-frontend-temp/issues)
- Suggest new features
- Write or edit documentation
- Write code (no patch is too small)
- Fix typos
- Add comments
- Clean up code
- Add new features

## Requirements

You will need the following things properly installed on your computer.

- [Git](https://git-scm.com/)
- [Hugo](https://gohugo.io/) 

## Development

- On your local, start the server with ```hugo serve --environment local --disableFastRender```
    - ```hugo serve``` starts the server - you can then browse the site at http://localhost:1313/ehs-data-portal-frontend-temp 
    - ```--environment local``` specifies that it will serve the site for the local environment, using content from ```/config/local/config.toml```
    - ```--disableFastRender``` turns off fast render mode, so more small changes are rapidly served
- Develop on branches labelled hotfix-, content-, or feature-. Keep branch work focused on discrete tasks to avoid merge conflicts later.
- Merge into development to test. 
    - Run a build with ```hugo --environment local```. The ```hugo``` command builds a fresh version of the site to ```/docs```.
    - Development is served on githubpages.  
- Branches that pass testing and are ready for primetime can then be merged into main. 
- After merging branches into main, run a new build on main.

## Architecture

Generally, Hugo works by combining content (in markdown, located in /content) with templates (located in the /themes) - you'll notice that these two directories have identical structures, because Hugo combines /content/data_stories, for example, with templates in /themes/layouts/data_stories. Templates can include Hugo code (which you can identify by {{ curly brackets }}. When Hugo serves or builds the site, it runs code, inserts content into the HTML, and produces static pages. 

Functionality worth noting for ongoing development:

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

## Testing and checks
The site runs a CodeQL analysis on merges/builds. 

## Deployment
The development branch is served on github pages, here: [Environment and Health Data Portal](https://nycehs.github.io/ehs-data-portal-frontend-temp).

## Contact us

You can comment on issues and we'll follow up as soon as we can. 


## Communications disclaimer

With regard to GitHub platform communications, staff from the New York City Department of Health & Mental Hygiene are authorized to answer specific questions of a technical nature with regard to this repository. Staff may not disclose private or sensitive data. 
