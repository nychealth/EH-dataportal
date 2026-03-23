# Readme: Content management
This doc lays out some broad stroke practical guidelines for managing content in the EH Data Portal source code. 

## Use descriptive titles 

Especially for anything outward-facing. For a new piece of content’s folder name, use a brief, human-readable name that will make a useful URL (for explaining what the page is about), and a useful content name for explaining to us down the line what this piece of content is. 

For templates, use descriptive titles that will help us easily identify what something is. 

## Storing resources like images, data files, PDFs 

If a resource only needs to be accessed by one piece of content, then you can store it in that page’s content folder. If it needs to be accessed by several pieces of content, then you can store it in the `/static` folder.  

While most page-level resources can be stored in the page's content folder, HTML files (eg, embeds) should be stored in `/static` or as a partial. 

Storing resources in /assets is rarely necessary – this is for items that Hugo will process during the serve or build.   

## Limit HTML in Markdown files  

We have it enabled to support some layout stuff, but it would be better to avoid it. As the HTML gets more complex, it becomes harder to edit and manage. In the future, we may want to reconsider ways to use shortcodes for embedding charts in data stories, for example. 

## Always use relative links  

This will ensure that links work on any environment: local, staging, production. Remember that the code needed to do a relative link from a template (using `{{ .Site.BaseURL }}`) is different from what you need to do from a markdown file (using the `{{< baseURL >}}` shortcode). 

## Use web content, not PDFs 

Avoid PDFs where possible. When using them as a resource, avoid trying to build in highly specific links back to web content. PDFs are designed to be printed; it’s hard to allow a user to navigate to a PDF and back to web content (involves different programs opening, possibly triggering a download, etc). We should not consider it reasonably possible or a good user experience.  

## Delete old material 

Partials, templates, and draft markdown files – if they’re not part of something where there’s a reasonable belief that it will go live at some point, it’s OK to delete old material.  

## Keep things simple 

When templating, making partials, writing Hugo code, etc – keeping things as simple as possible, and cleaning and commenting your code, will help content maintainers down the line.  

## Use previously-designed components over new styles  

Refer to [components](readme-components.md) and use existing items rather than creating new classes and styles. This will help avoid fraying and keep things consistent.  

## Data 

In data features, try to ingest data from indicator files whenever possible, so that the data feature auto-updates with DE updates. Make data available for download.  

## Always fill out frontmatter 

Pay special attention to `categories`, which determines which Key Topic pages a piece of content appears on; `related` and `relatedData`. For these, use the most proximally-related items. If there aren’t proximally-related items, then use looser relationships. For example, on the HVI data feature, we’d want to have the HVI Indicator be the top item (most proximally-related).

## Follow basic accessibility heuristics 

The most important of these are: use properly structured/nested headers; use `aria-hidden=”true”` on inaccessible data visualizations; back up inaccessible visualizations with accessible tables; and use alt text on images.  

