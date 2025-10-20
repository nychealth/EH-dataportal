---
title: "Proximity indicators"
date: 2025-08-27T11:51:01-04:00
draft: false
seo_title: "Proximity indicators"
seo_description: "Calculating population walking distance to important resources."
description: "Calculating population walking distance to important resources."
categories: [publicspace, housing]
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
  - title: "Street safety and the built environment"
    url: "data-stories/streets/"
weight: 3
blurb: How we calculate 'proximity' indicators.  
aboutTheData: '<p><strong>Accessible subway stations</strong><br> Locations are from the <a href="https://catalog.data.gov/dataset/mta-subway-stations">MTA Subway Stations dataset</a>, filtered for stations marked as compliant with the Americans with Disabilities Act (ADA).</p> <p><strong>Walking distance</strong>:<br> We defined walking distance as 800 meters along the walking-network (<a href="https://onlinelibrary.wiley.com/doi/10.1111/gean.70009">sourced from OpenStreetMaps</a>), using a shortest-path algorithm known as Dijkstra&rsquo;s, instead of straight-line buffers. This is roughly equal to a 10-15 minute walk.</p> <p><strong>Population estimates</strong><br> Population counts come from U.S. Census block groups. We used PLUTO building-level data to allocate block group populations more accurately. <a href ="https://d1wqtxts1xzle7.cloudfront.net/45913588/Mapping_Population_Distribution_in_the_U20160524-805-1ao5d3m-libre.pdf?1464099385=&response-content-disposition=inline%3B+filename%3DMapping_Population_Distribution_in_the_U.pdf&Expires=1759956946&Signature=GKBYFNhO~bJ3I1xumlBmSuAAt3hjKgZwB4TZ-cAcxQu3uzdwQkbfPdUE8mKX~H9e0lHJyEedg6MupZ3t6aqVKBD~1GAUzw8FCdaUhv61~IUoe2smw8D-1IaPaRhxIPScuCoKJX6fQ7~oFMYZyjp~Rhh7cQWFXqexwN2aFOxkAGqYK5xaO8~TUdXudVfEVeLDDXgusRxA6yX01sTiw3KcOpUtzTnGNz6Dur5ET5QmyzbD5N3NTSE8b9jUxXUaKfn~tMjbfmenAE9SeZg6D1flceVy7pHrTK6IUi3rb6x8eHsQx0V5rr0auG8xaV~IwGbVbotwXz4nC3IybK6VdD8fdA__&Key-Pair-Id=APKAJLOHF5GGSLRBV4ZA">Visit this peer-reviewed article to learn more</a> about making population estimates at a hyper-local level.</p>'  
# <p><a href="https://catalog.data.gov/dataset/mta-subway-stations">Download data</a>.</p>
---

How close people live to important resources, like transit, schools, or clinics, affects their ability to use them.

So, we've calculated a series of 'proximity' indicators - the percent of each neighborhood's population that lives within walking distance to parks, subway stations, and more. We calculated these data for several [geographies](../../data-stories/geographies/), including Neighborhood Tabulation Areas (NTAs), Community District Tabulation Areas (CDTAs), and UHF42 neighborhoods.

**Here's how we calculated these indicators.** In this example, we'll use *proximity to accessible subway stations* as an example - but this same method can be used to calculate proximity to lots of other resources. These methods help us understand how well New Yorkers are connected to the resources that support daily life and health. 

For this example, we look at **Accessible subway stations**. Using a walking-network, we mapped all areas within a half mile (or ~10-15 minute) walk of these stations. Then we overlaid Census population data, adjusting for where residential buildings are located, to estimate the percent of people in each neighborhood who live within walking distance



