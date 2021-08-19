# Format Notes
This markdown contains directions on how we handle specific content in this prototype.

## Indicators
Indicators can be displayed on subtopic pages. If Indicators are stored as json within subtopic content markdown file's front matter - see [asthma.md](https://github.com/nycehs/ehs-neighborhoodprofiles/blob/main/content/data_explorer/asthma.md) or below:

```
indicators: {
    {
        "name" : "ED visits (adults)",
        "URL": "http://a816-dohbesp.nyc.gov/IndicatorPublic/VisualizationData.aspx?id=2380,4466a0,11,Summarize"
    },

    {
        "name" : "ED visits (age 0-4)",
        "URL": "http://a816-dohbesp.nyc.gov/IndicatorPublic/VisualizationData.aspx?id=2048,4466a0,11,Summarize"
    }
}
```


...then the template page can loop through the Indicator JSON and display each indicator:

```
{{ range .Params.indicators}}
    <a href="{{.url}}" onclick="protoPopup()">{{.name}}</a>
    <hr>
{{end}}
```

## Ranging through items in another content section
This code works on any template page to range through items in another content section. For example, placed on key_topics/section.html, it ranges through all of the Site's Pages that are in the data_stories section, and prints the Title.

```
{{ range where .Site.RegularPages "Section" "data_stories" }}
    {{ .Title }}<br>
{{end}}
```

It can be elaborated on with additional conditions. This looks for data_stories that have a category that intersects with the key topic's frontmatter variable, keyTopic.

```
{{ range where ( where .Site.RegularPages "Section" "data_stories") ".Params.categories" "intersect" ( slice .Params.keyTopic ) }}
<h3>Related Data Stories</h3>
<ul>
    <li><a href="{{ .URL}}">{{ .Title }}</a></li>
</ul>
{{ end}}    

```

For this to work, key topics need the following in the frontmattr:
```
keyTopic: airquality
```

And, data stories and data explorer (subtopics) markdown should have the following in the frontmatter:
- categories: ["key topic 1", "key topic 2"]

Data stories and data explorer (subtopics) and other content can also have the following in the frontmatter:
- tags: this is a freeform category we are not yet using
- keywords: this is a field used to populate information for the site search function