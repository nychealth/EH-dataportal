---
title: "Your Neighborhood's Air Quality"
aliases:
  - /key-topics/airquality/aqe/
date: 2021-08-24T12:04:44-04:00
draft: false
seo_title: "Your Neighborhood's Air Quality"
seo_description: "Get data on your neighborhood's air quality."
description: "Get data on your neighborhood's air quality."
tags:
categories: [airquality]
keywords:
  [
    "interactive",
    "air quality",
    "neighborhoods",
    "data",
    "transportation",
    "buildings",
    "emissions",
    "exhaust",
    "cars",
    "traffic",
  ]
layout: aqe
customJS: aqe.js
accessibleAutocomplete: /js/accessible-autocomplete.min.js

image: aqe.png
related:
  - title: "Air quality"
    url: "data-explorer/air-quality/"
  - title: "NYC Community Air Survey Annual Report"
    url: "data-features/nyccas/"
  - title: "Reducing air pollution should focus on neighborhoods with the worst health impacts"
    url: "data-stories/hia/"
weight: 2
blurb: Two major air pollutant measurements and some factors that influence them across NYC neighborhoods.
aboutTheData: 'Data for PM2.5 and NO2 are from 2023. Data for industrial areas are from 2022. Data on commercial cooking, traffic, and buildings are from 2019. For details on data sources and measurements, see [NYCCAS Annual Report]({{< relURL >}}data-features/nyccas/). <a href="aqe-nta.csv"><i class="fas fa-download mr-1" aria-hidden="true"></i>Download data<i class="fas fa-file-csv ml-1" aria-hidden="true"></i></a>.'
---

We combine data from our air quality monitoring network, NYCCAS, with other data to understand what makes air quality in one neighborhood different from air quality in another. We found that building emissions, building density, industrial areas, and traffic density are associated with differences in air quality.

If we don't have an air quality monitor in one neighborhood, but we know its building density, its industrial area, and its traffic, then we can model (estimate or predict) its air quality - based on monitored air quality in similar neighborhoods.
