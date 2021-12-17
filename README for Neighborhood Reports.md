# Site Overview

* **Client Name:** New York City Department of Health and Mental Hygiene
* **CMS Platform:** Static using [Hugo](https://gohugo.io/)

# Working With The Site
This site is currently build with the Hugo static site generator. 

## Local Setup Details

* You will need to [install hugo](https://gohugo.io/getting-started/installing/) if not done already.
* Once Hugo is installed run `hugo server` from local project root to start a local server

## What is this site doing that is unexpected?

### General

* Project is using NYC's Core Framework which is based on Bootstrap 4. SASS is being processed by Hugo's [Pipes](https://gohugo.io/hugo-pipes/) capabilities.
* NYC Framework files are organized in the `/assets` folder. 
* Site unique CSS is in the `/assets/scss/_theme.scss` file
* Image and other assets used by site are stored in `/static/images/`

### Report Pages

* Report data for the site is stored in the `/data/reports/` folder. 
* There is a markdown file for each report in site content that references the report metadata from its front matter.
* There are two main templates used for reports `themes/dohmh/layouts/neighborhood_reports/single` is the main report template along with the partial that is loaded for each indicator `themes/dohmh/partials/report_indicator`.

### Visualizations
Visualizations are powered by Vega-Lite with code and basic implementation approach provided by DOHMH team.

* Visualization specifications and functions to generate them are included in `assets/js/site.js`.
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

## How is this site being deployed?

For initial development purposes this site is being deployed to MOD-Lab's Netlify account. Ultimately it will be hosted by the City in GitHub Pages and deployed using a method that suits their workflow.

## Content Management

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


# Additional Resources

The following are some reasources you might find helpful for working with hugo.

Regis Philibert - [https://regisphilibert.com/blog/](https://regisphilibert.com/blog/) - Regis is a notable member of the hugo community and has written some great resources that we have found helpful over the years. Some specific articles that we'd recommend reading.
 * Hugo, the scope, the context and the dot - [https://regisphilibert.com/blog/2018/02/hugo-the-scope-the-context-and-the-dot/](https://regisphilibert.com/blog/2018/02/hugo-the-scope-the-context-and-the-dot/) - This is a must read. The most challenging concept of using Hugo is the concept of scope. When you loop through content/data and then have loops within loops and/or pass data down to partials as is needed on this site keep track of scope of the data variables is important. This article should help a lot.
 * Hugo Scratch Explained - [https://regisphilibert.com/blog/2017/04/hugo-scratch-explained-variable/](https://regisphilibert.com/blog/2017/04/hugo-scratch-explained-variable/) - Scratch is a way to store data in a variable to be used elsehwere in your page processing. We use this in a few notable ways to help with reports and making data from one scope available to another.
 * Hugo Pipes - [https://regisphilibert.com/blog/2018/07/hugo-pipes-and-asset-processing-pipeline/](https://regisphilibert.com/blog/2018/07/hugo-pipes-and-asset-processing-pipeline/) - We are using pipes to process and prepare both the SCSS and Javascript on the site.
