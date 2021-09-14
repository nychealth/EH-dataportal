---
title: "Air quality in car-free areas"
date: 2019-11-25T13:24:52-04:00
draft: false
tags: 
categories: ["transportation","airquality"]
keywords: ["air quality","traffic","transportation","cars","traffic","car-free","carfree","pedestrians","cycling","bikes","biking","pollution","air pollution", "lungs","breathing"]
image: ds-aqts.jpeg
menu:
    main:
        identifier: '02'
---

Does the air improve in car-free zones? People often ask us this, and it's a great question. To answer, we turn to the NYC Community Air Survey, or NYCCAS. NYCCAS is our network of air quality monitors around the city.

 ### NYCCAS monitors air with nearly 100 sensors across the city
 {{< rawhtml >}}
    <iframe  width="100%" height="400" frameborder="0" scrolling="no" marginheight="0"
    marginwidth="0" title="NYCCAS Sites"
    src="//nycdohmh.maps.arcgis.com/apps/Embed/index.html?webmap=414f6c00466e456a9b8b994017cfc728&extent=-74.4827,40.5223,-73.5962,40.9116&home=true&zoom=true&previewImage=false&scale=true&disable_scroll=false&theme=light"></iframe>
    <div class="mb-4">NYCCAS air quality monitor sites: <span style="font-weight:bold;color:#0F5DE2">Routine
    site</span>, <span style="font-weight:bold;color:#FDA928;">environmental justice
    site</span>, <span style="font-weight:bold;color:#B4C8FD;">retired site</span>.</div>

{{< /rawhtml >}}

We use these monitors to measure levels of six different pollutants: fine particles (PM2.5), nitrogen dioxide (NO2), nitric oxide (NO), sulfur dioxide (SO2), ozone (O3), and black carbon (BC). Then, we combine these data with information about sources of emissions, traffic volume, wind patterns, and more to model the air quality all across the city – including in places where there are no air quality monitors. This tells us how air pollution differs between neighborhoods - and why. For example, it can tell us whether air quality is better or worse in neighborhoods that have parks compared to neighborhoods without parks.

### What happens to air quality when an area goes car-free?
We can look at changes to Times Square to understand what happens to local air quality when a street is relieved of car traffic. Starting in the summer of 2009, five blocks of Broadway through Times Square (and some adjacent space) were closed to cars, increasing the amount of plaza space available for pedestrians.

{{< datawrapper "Times Square: more space for pedestrians, less for cars" "Rnsgj/4/" "543" >}}


NYCCAS' nearby air quality monitor measured the air pollutants before and after the change. With this monitor, we could see whether redirecting traffic led to any changes in air quality.

First, let’s look at NO, a pollutant that primarily comes from car emissions. In early 2009, Times Square’s NO concentration was higher than the average concentration in Midtown. But when Times Square went car-free, the NO concentration fell to below the Midtown average.

{{< datawrapper "Nitric Oxide in a car-free Times Square" "Un0yG/1/" "450" >}}


### NO went down. Did other pollutants?
Next, let’s look at PM2.5. This pollutant comes from traffic emissions, but it also comes from other sources like buildings (which, like vehicles, burn fuel), power plants, and construction.

In winter 2008, Times Square’s PM2.5 was a little bit higher than the Midtown average.

{{< datawrapper "PM2.5 in a car-free Times Square" "xBWEn/1/" "450" >}}


Unlike NO, the PM2.5 concentration in Times Square didn’t change much. That’s because there are a lot more sources of PM2.5 in the area – like buildings.

On the other hand, most of the NO in the air comes from vehicle emissions. That means that when you remove traffic, you’ll remove a lot of the NO in the air.

### What does this mean for other car-free areas?
The Times Square monitor shows us that a local change in traffic can result in a measurable change in local air quality - for some pollutants.

Other parts of the city have reduced traffic - like on 14th Street in Manhattan, with 14th Street Busway. We don't have an air monitor there, but we don't need one - we can use the data that goes into the NYCCAS model (which includes building density, building emissions, industrial areas, and traffic density) and other localized findings - like about what happened in Times Square - to understand how the air quality changes based on reductions in traffic volume.

So while we don't have a monitor in every place that has gone car-free - like the 14th Street Busway or Prospect Park - we can use what we learned from Times Square to safely conclude that removing traffic from an area can improve the air quality - particularly for pollutants that mostly come from vehicle emissions.

We continue to explore the data collected through NYCCAS in [Part 2]({{< ref "/data_stories/aq2" >}}).