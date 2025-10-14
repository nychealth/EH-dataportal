---
title: "PROXIMITY Indicators"
date: 2025-08-27T11:51:01-04:00
draft: false
seo_title: "PROXIMITY Indicators"
seo_description: "Data on PROXIMITY Indicators."
description: "Data on PROXIMITY Indicators."
categories: [publicspace, housing]
keywords:
  [
    "interactive",
    "flooding",
    "storm",
    "hurricane",
    "extreme weather",
    "climate change",
    "climate"
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

For this example, we look at **Accessible subway stations**. Using a walking-network, we mapped all areas within an 800-meter (~10-15 minute) walk of these stations. Then we overlaid Census population data, adjusting for where residential buildings are located, to estimate the percent of people in each neighborhood who live within walking distance.

We show results at several geographic levels, including Census block groups, Census tracts, Neighborhood Tabulation Areas (NTAs), Community District Tabulation Areas (CDTAs), and UHF42 neighborhoods.

While this feature highlights subway access, the same proximity method can be used for other resources. Using this methodology, we can better understand how well New Yorkers are connected to the things that support health and daily life.

The maps below illustrate how we moved through each step of the process.
