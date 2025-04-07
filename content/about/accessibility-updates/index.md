---
title: Notes on making data visualizations more accessible for the EHDP
draft: false
date: 2025-01-07T08:49:22-04:00
image: Repo.png
photocredit: EH Data Portal team
categories:
  - internal
keywords:
  - how we work
  - redesign
  - accessibility
  - open source
  - screen readers
  - data visualization
seo_title: Accessibility updates
seo_description: "Accessibility updates on the EH Data Portal"
description: "Accessibility updates on the EH Data Portal."
---

At the Environment and Health Data Portal, our mission is to make data easy to understand, access, and use. These principles extend to how we approach digital accessibility. New York City’s Local Law 26 requires City agencies to make their websites accessible. But this isn’t just a requirement — it’s also the best way we can serve our public. While there is no one-size-fits-all solution to digital accessibility since access needs can be as unique as people, we can take approaches that help our information reach a wider range of users.

**Examples of improving digital accessibility:**

- Adding alt text to images to describe them for visually impaired users

- Adding captions to audio for hearing impaired users

- Checking that contrast is adequate between colors so that distinct areas can be identified in maps and charts for colorblind users

We recently did work to improve the accessibility of data visualizations in key areas to ensure that they are accessible to people who use screen readers. A screen reader is an assistive technology that reads content out loud. They are how many blind people use computers.

A screen reader typically can’t read a data _visualization_ in ways that really explain to the user what the data are. But, a screen reader can read a properly-formatted table. So, complementing data visualizations with properly formatted tables (with descriptive labels for headers and rows) is a great way to increase access for screen reader users.

## Tailoring tables to match data visualizations

There are many different types of data visualizations, from line charts and chloropleth maps, to bar charts and locator maps, and so many more.

We build properly tables to complements these data visualizations to increase accessibility, where appropriate (we’ll go through one example later where this approach doesn’t work).

But creating these tables still requires a strategic approach. For us, it’s not enough to simply provide data for people with different access needs – we want to communicate it meaningfully for the context it’s in.

To best match the message behind the data visualization, tables may need to be organized and labeled in different ways. That’s why the first thing we ask ourselves when creating an accessible table to go with a data visualization is:

1. What are we trying to communicate with this chart?

2. Why did we choose this kind of chart?

By bringing these to the fore, our accessible tables are more likely to match the meaning of our data visualizations. We’ll go through a few examples of how we’ve implemented this approach to translate the intent of data visualizations into a non-visual format.

## Line charts: creating back-up tables

In some cases, creating a table that communicates the meaning behind a trend chart is straightforward.

<div aria-hidden="true" class="my-4">
<iframe title="Lead poisoning in NYC adults" aria-label="Interactive line chart" id="datawrapper-chart-i7Bgo" src="https://datawrapper.dwcdn.net/i7Bgo/4/" scrolling="no" frameborder="0" style="border: none;" width="726" height="515" data-external="1"></iframe>
</div>

<div class="sr-only">
<iframe title="Lead poisoning rates in adult New Yorkers have fallen since 2001" aria-label="Table" id="datawrapper-chart-c7jtG" src="https://datawrapper.dwcdn.net/c7jtG/5/" scrolling="no" frameborder="0" style="width: 0; min-width: 100% !important; border: none;" height="739" data-external="1"></iframe><script type="text/javascript">!function(){"use strict";window.addEventListener("message",(function(a){if(void 0!==a.data["datawrapper-height"]){var e=document.querySelectorAll("iframe");for(var t in a.data["datawrapper-height"])for(var r,i=0;r=e[i];i++)if(r.contentWindow===a.source){var d=a.data["datawrapper-height"][t]+"px";r.style.height=d}}}))}();
</script>
</div>

In the case of this [trend chart comparing falling lead poisoning rates in NYC adults across the five boroughs](../../data-stories/adult-lead/), creating a corresponding table just required duplicating the underlying data and formatting it as a table. Here, the year, blood lead levels, and borough headers guide users through the information.

<div class="my-4">
<iframe title="Lead poisoning rates in adult New Yorkers have fallen since 2001" aria-label="Table" id="datawrapper-chart-c7jtG" src="https://datawrapper.dwcdn.net/c7jtG/5/" scrolling="no" frameborder="0" style="width: 0; min-width: 100% !important; border: none;" height="739" data-external="1"></iframe><script type="text/javascript">!function(){"use strict";window.addEventListener("message",(function(a){if(void 0!==a.data["datawrapper-height"]){var e=document.querySelectorAll("iframe");for(var t in a.data["datawrapper-height"])for(var r,i=0;r=e[i];i++)if(r.contentWindow===a.source){var d=a.data["datawrapper-height"][t]+"px";r.style.height=d}}}))}();
</script>
</div>

## Point maps: revising information in back-up tables

<div aria-hidden="true" class="my-4">
<iframe title="NYCCAS monitor locations" aria-label="Map" id="datawrapper-chart-d7DDS" src="https://datawrapper.dwcdn.net/d7DDS/2/" scrolling="no" frameborder="0" style="width: 0; min-width: 100% !important; border: none;" height="656" data-external="1"></iframe><script type="text/javascript">!function(){"use strict";window.addEventListener("message",(function(a){if(void 0!==a.data["datawrapper-height"]){var e=document.querySelectorAll("iframe");for(var t in a.data["datawrapper-height"])for(var r,i=0;r=e[i];i++)if(r.contentWindow===a.source){var d=a.data["datawrapper-height"][t]+"px";r.style.height=d}}}))}();
</script>
</div>

<div class="sr-only">
<iframe title="NYCCAS monitor locations" aria-label="Table" id="datawrapper-chart-dB6XN" src="https://datawrapper.dwcdn.net/dB6XN/3/" scrolling="no" frameborder="0" style="width: 0; min-width: 100% !important; border: none;" height="892" data-external="1"></iframe><script type="text/javascript">!function(){"use strict";window.addEventListener("message",(function(a){if(void 0!==a.data["datawrapper-height"]){var e=document.querySelectorAll("iframe");for(var t in a.data["datawrapper-height"])for(var r,i=0;r=e[i];i++)if(r.contentWindow===a.source){var d=a.data["datawrapper-height"][t]+"px";r.style.height=d}}}))}();
</script>
</div>

Here the symbol map using point data from our data story [Breathe easy: NYC’s air quality is improving](../../data-stories/breatheeasy/), works well in a visual context, where sighted users can gather information about which air quality monitoring sites are located throughout NYC.

The air quality sites are overlaid onto this point map using latitude and longitude coordinates, and corresponding site IDs. But when we tried to make a table with that same data, we realized we were delivering information that is less meaningful in a non-visual context to our screen-reader users.

The point map is meant to relate to the knowledge users have about NYC neighborhoods, and when coupled with the information about the types of air quality monitoring sites around the city, they can make inferences. But, most people don’t have any meaning associated with latitude and longitude coordinates, or something as niche as site IDs (unless you’re working on those sites).

So, we wanted to provide the same meaning for this table in a non-visual context – a common-sense understanding of where these monitors are located. We added ZIP codes to our table and removing the coordinates. ZIP codes are much more common in daily life and were readily available from our database.

<div class="my-4">
<iframe title="NYCCAS monitor locations" aria-label="Table" id="datawrapper-chart-dB6XN" src="https://datawrapper.dwcdn.net/dB6XN/3/" scrolling="no" frameborder="0" style="width: 0; min-width: 100% !important; border: none;" height="892" data-external="1"></iframe><script type="text/javascript">!function(){"use strict";window.addEventListener("message",(function(a){if(void 0!==a.data["datawrapper-height"]){var e=document.querySelectorAll("iframe");for(var t in a.data["datawrapper-height"])for(var r,i=0;r=e[i];i++)if(r.contentWindow===a.source){var d=a.data["datawrapper-height"][t]+"px";r.style.height=d}}}))}();
</script>
<div class="fs-sm py-1"><em>Screen-reader accessible table with zip codes instead of coordinates</em></div>
</div>

## Raster maps: when there is too much data for a meaningful table, be more descriptive

In some cases, tables wouldn’t add much meaningful context for a screen reader. Raster maps show data on a grid of small pixels – more than 80,000. The pixels allow us to see nuanced gradations in data values by seeing where pixels are denser and deeper colors. In this example, [some users can observe that the concentration of two air pollutants, NO2 and PM2.5, decreased as traffic and commercial cooking decreased](../../data-stories/air-quality-and-covid/) during the first year of the COVID-19 pandemic.

But do these data provide meaningful information in a non-visual context? Takeaways about where air pollutants dropped the most in NYC during stay-at-home orders (close to roadways and the busiest neighborhoods) wouldn’t really translate by reading a table with thousands of values for x-y coordinates.

Similar to translating the locations of air quality monitoring sites, we have lots of information, just not quite the right kind. So, we chose to more thoroughly describe some of our observations looking at these raster maps, the things we think people might find to be major takeaways about how air pollution changed during the COVID-19 pandemic.

![](raster_maps.png)
<br>

There are many interpretations of accessibility, and these examples are just a few strategies we used when thinking through how to improve access to the information we share, to in turn make it easier for more of you to understand and use.
