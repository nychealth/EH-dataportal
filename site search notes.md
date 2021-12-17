
Here is the zipped up repo, and some instructions from Blenderbox development team:

## search-results.js

### Update the path to the generated Lunr search index file:
line 9 : `request.open('GET', '/ehs-neighborhoodprofiles/js/lunr/PagesIndex.json', true);`

### Update the homepage path:
Line 87: `window.location.href = "/ehs-neighborhoodprofiles/"`

## search.js

### Path to the search results page:
Line 5:  `window.location.href = "/ehs-neighborhoodprofiles/search_results/index.html?search=${search}";`

## config.toml

### Update the baseUrl
Line 1:  `baseURL = "https://blenderbox.github.io/ehs-neighborhoodprofiles/"`
If the baseURL has a subdirectory like on GitHub Pages you will need to set : `canonifyURLs = "true”` and `relativeURLs = "true"`
https://nycehs.github.io/ehs-data-portal-frontend-temp/

[Blenderbox repo's github pages](https://blenderbox.github.io/ehs-neighborhoodprofiles/)

The command to build the search index if you want to run it locally is `grunt lunr-index`

For local dev you can remove the `/ehs-neighborhoodprofiles/` from and update the `baseUrl`

