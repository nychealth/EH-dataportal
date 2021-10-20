---
title: "Tracking changes in New York City's sources of air pollution"
date: 2021-04-12T12:02:09-04:00
draft: false
tags: 
categories: ["foodanddrink","airquality","neighborhoods"]
keywords: ["air quality","PM2.5","fine particles","cooking","restaurants","buildings","density","emissions","pollution","air pollution", "lungs","breathing"]
image: ds-aq-cooking.jpeg
menu:
    main:
        identifier: '02'
---
As city life changes, so does its air quality, as sources of emissions that affect the city's outdoor air quality, like truck traffic, building boilers and restaurants, also change. For more than a decade, we have been tracking air quality through the {{< rawhtml>}}  <a href="#NYCCAS" data-toggle="collapse" class="badge badge-pill badge-primary">NYC Community Air Survey (NYCCAS)</a>{{< /rawhtml>}} and exploring the factors that drive neighborhood differences. We have found some interesting changes in the sources of air pollution across NYC neighborhoods.

{{< rawhtml>}}
<div id="NYCCAS" class="collapse mb-2 drawerbg px-2 py-2 mx-2 fs-sm">
NYCCAS is the largest urban air monitoring program in the country. We measure air
pollution at nearly 100 locations
around the city, and use land-use and other emissions data in a statistical model to
identify the
factors most closely associated with
different pollutants.
</div>
{{< /rawhtml>}}

Let's look at PM2.5, or {{< rawhtml>}}  <a href="#pm25" data-toggle="collapse" class="badge badge-pill badge-primary">fine particles</a>{{< /rawhtml>}}. PM2.5 is the most harmful urban pollutant. It can cause cancer, worsen heart and lung disease and lead to premature death. PM2.5 levels vary across the city and the pollutant comes from a lot of different sources - the most important of which had been building boilers. We have been able to accurately estimate (or model) PM2.5 concentrations by looking at data on building boilers, which burn fossil fuels to generate heat and hot water and release PM2.5.
{{< rawhtml>}}
<div class="collapse mb-2 drawerbg px-2 py-2 mx-2 fs-sm" id="pm25">
PM2.5 is either emitted by combustion or form in the atmosphere out of other
pollutants. It’s the most harmful air
pollutant – it gets into our lungs and bloodstream and worsens heart and lung
disease.
</div>

{{< /rawhtml>}}
You can see in the chart below that neighborhoods with high building density have reliably higher wintertime concentrations of PM2.5 than medium or low-density neighborhoods. (Since there’s seasonal variation in PM2.5 concentration, it’s easier to look at one season at a time.)

{{< datawrapper "Winter PM2.5 levels (in µg/m³) by neighborhood building density" "XPYgD/2/" "400">}}

You can also see that the wintertime PM2.5 concentrations have gone down dramatically over time, largely because the city has required buildings to {{< rawhtml>}}<a href="#laws" data-toggle="collapse" class="badge badge-pill badge-primary">reduce emissions</a>.</p>

<div id="laws" class="collapse mb-2 drawerbg px-2 py-2 mx-2 fs-sm">
<a href="https://www1.nyc.gov/assets/dep/downloads/pdf/air/local-law-43-biodiesel-fuel-requirement.pdf">Local Law 43 of 2010</a> outlawed the burning of heavy fuel oil (Number 6) in New York
City buildings, requiring buildings to switch to cleaner fuels. In 2012, New York State lowered the allowed sulfur content of Number 2 fuel oil, which further cleaned up building emissions.
</div>{{< /rawhtml>}}

Meanwhile, emissions from another source - commercial cooking - has gone up, according to {{< rawhtml>}}<a href="#epa" data-toggle="collapse"class="badge badge-pill badge-primary">emissions estimates</a>{{< /rawhtml>}}. Commercial cooking refers to cooking in restaurants, especially meat cooked on grills or charbroilers. The smoke this creates is vented out of the building and contributes to PM2.5 measured by NYCCAS.

{{< rawhtml>}}
<div id="epa" class="collapse mb-2 drawerbg px-2 py-2 mx-2 fs-sm">
The National Emissions Inventory (NEI) is a detailed estimate of air pollution
emissions from all the sources of
pollution including vehicles, building heating, commercial cooking, construction,
factories and power plants, among
other man-made and natural sources. The inventories include criteria pollutants
(like PM2.5, NO2 and ozone) and
hazardous air pollutants (like mercury, benzene and asbestos). <a
href="https://www.epa.gov/air-emissions-inventories/national-emissions-inventory-nei">Learn
more about the NEI</a>.
</div>
{{< /rawhtml>}}

{{< datawrapper "Tons of PM2.5 emitted per year, NYC" "3bOXl/3/" "400">}}

We can see these trends in our PM2.5 land-use regression model, which links neighborhood factors to measured pollution, and allows us to estimate pollution levels in places where we don't measure it. Our model tells us which emissions sources explain the {{< rawhtml>}}<a href="#var" data-toggle="collapse" class="badge badge-pill badge-primary">differences across neighborhoods</a>.
</p>

<div id="var" class="collapse mb-2 drawerbg px-2 py-2 mx-2 fs-sm"> Pollutant levels
can vary significantly from one neighborhood to another. For example, in 2018, the
seasonal average PM2.5 concentration across NYCCAS monitoring sites ranged from 3.4
to 16.5 micrograms per cubic meter. <a
href="https://nyccas.cityofnewyork.us/nyccas2020/web/report">Get more air
quality data at the NYCCAS Annual Report</a>.
</div>
{{< /rawhtml>}}

With the increase in commercial cooking emissions, our model shows that the number of restaurants with permits for grills or charbroilers in a neighborhood is now a better predictor of PM2.5 concentrations than building density and explains most of the variation across the city.

{{< datawrapper "Percent of variation explained" "AEQXF/2/" "400">}}

What can we do about this?

In 2015, New York City took a step forward in addressing this pollutant source when City Council passed Local Law 38, which updated the NYC Air Code to include commercial cooking emissions. Following input from an advisory committee made up of representatives from health and environmental organizations, as well as the restaurant industry, the New York City Department of Environmental Protection created regulations requiring the registration of commercial charbroilers and the installation of emissions control devices on new grills and charbroilers in restaurants that cook significant amounts of meat. Like with building boiler emissions, knowing where charbroilers are located will help us better understand the impact on neighborhood air quality. With this information, government and industry must think creatively about how to support all impacted restaurants - large and small - in reducing emissions from commercial cooking. Together NYC can continue to clean up its air – and protect the lungs of New Yorkers.
