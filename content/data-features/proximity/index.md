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
aboutTheData: '<p><strong>Accessible subway stations</strong>: Locations are from the MTA Subway Stations dataset, filtered for stations marked as compliant with the Americans with Disabilities Act (ADA).</p> <p><strong>Walking distance</strong>: We defined walking distance as 800 meters along the walking network (sourced from OpenStreetMaps), using shortest-path algorithms instead of straight-line buffers. This is roughly equal to a 10-15 minute walk.</p> <p><strong>Population estimates</strong>: Population counts come from U.S. Census block groups. We used PLUTO building-level data to allocate block group populations more accurately, based on the share of residential units inside each walkable area.</p> <p><a href="">Download data</a>.</p>'  
---
 
How close people live to important resources, like transit, schools, or clinics, affects their ability to use them.  

For this example, we look at **Accessible subway stations**. Using the walking network, we mapped all areas within an 800-meter (about 10-15 minute) walk of these stations. Then we overlaid Census population data, adjusting for where residential buildings are located, to estimate the percent of people in each neighborhood who live within walking distance.  

We show results at several geographic levels, including Census block groups, Census tracts, Neighborhood Tabulation Areas (NTAs), Community District Tabulation Areas (CDTAs), and UHF42 neighborhoods.  

While this feature highlights subway access, the same proximity method can be used for other resources. Using this methodology, we can better understand how well New Yorkers are connected to the things that support health and daily life.  

The maps below illustrate how we moved through each step of the process.  

