---
title: "Proximity indicators"
date: 2025-08-27T11:51:01-04:00
draft: false
seo_title: "Proximity indicators"
seo_description: "How we estimate population-level access to important resources."
description: "How we estimate population-level access to important resources"
categories: [publicspace, housingm, accessibility]
keywords:
  [
    "proximity",
    "accessibility",
    "transit",
    "built environment",
    "active design",
    "analysis"
  ]
layout: proximity
vega: true
leaflet: true
js: proximity.js
image: preview.png
related:
related:
  - title: "Accessibility data"
    url: "data-explorer/accessibility/"
  - title: "Neighborhood boundaries on the EH Data Portal"
    url: "data-stories/geographies/"
  - title: "Find your UHF neighborhood"
    url: "data-features/find-your-uhf/"
weight: 3
blurb: How we estimate population-level access to important resources.  
aboutTheData: '<p><strong>Accessible subway stations</strong><br> Locations are from the <a href="https://catalog.data.gov/dataset/mta-subway-stations">MTA Subway Stations dataset</a>, filtered for stations marked as compliant with the Americans with Disabilities Act (ADA).</p> <p><strong>Walking distance</strong>:<br> We defined walking distance as 800 meters along the walking-network (<a href="https://onlinelibrary.wiley.com/doi/10.1111/gean.70009">sourced from OpenStreetMap</a>), using a shortest-path algorithm known as Dijkstra&rsquo;s, instead of straight-line buffers. This is roughly equal to a 10-15 minute walk.</p> <p><strong>Population estimates</strong><br> Population counts come from U.S. Census block groups. We used PLUTO building-level data to allocate block group populations more accurately. <a href ="https://d1wqtxts1xzle7.cloudfront.net/45913588/Mapping_Population_Distribution_in_the_U20160524-805-1ao5d3m-libre.pdf?1464099385=&response-content-disposition=inline%3B+filename%3DMapping_Population_Distribution_in_the_U.pdf&Expires=1759956946&Signature=GKBYFNhO~bJ3I1xumlBmSuAAt3hjKgZwB4TZ-cAcxQu3uzdwQkbfPdUE8mKX~H9e0lHJyEedg6MupZ3t6aqVKBD~1GAUzw8FCdaUhv61~IUoe2smw8D-1IaPaRhxIPScuCoKJX6fQ7~oFMYZyjp~Rhh7cQWFXqexwN2aFOxkAGqYK5xaO8~TUdXudVfEVeLDDXgusRxA6yX01sTiw3KcOpUtzTnGNz6Dur5ET5QmyzbD5N3NTSE8b9jUxXUaKfn~tMjbfmenAE9SeZg6D1flceVy7pHrTK6IUi3rb6x8eHsQx0V5rr0auG8xaV~IwGbVbotwXz4nC3IybK6VdD8fdA__&Key-Pair-Id=APKAJLOHF5GGSLRBV4ZA">Visit this peer-reviewed article to learn more</a> about making population estimates at a hyper-local level.</p>'  
# <p><a href="https://catalog.data.gov/dataset/mta-subway-stations">Download data</a>.</p>
---

How close people live to important resources, like transit, schools, or clinics, affects their ability to use them.

So, we've calculated a series of 'proximity' indicators - the percent of each neighborhood's population that lives within walking distance to parks, subway stations, and more.

**To calculate these indicators,** we calculate an area that is the walking distance around points of interest, and then determine a geography's population that is inside this area. In this example, we're determining the percent of each neighborhood's population that lives within walking distance of an accessible subway stop.

Click through below for an explanation of how we calculate this.
