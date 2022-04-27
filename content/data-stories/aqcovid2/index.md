---
title: "An update on air quality during COVID-19"
date: 2022-04-20T08:33:22-04:00
draft: false
seo_title: "How COVID-19 affected air quality."
seo_description: "How the shutdown affected air in NYC."
tags: 
categories: ["transportation","airquality","foodanddrink"]
keywords: ["air quality","traffic","transportation","covid","covid-19","coronavirus","air pollution", "lungs","breathing","restaurants"]
image: ds-aqcovid.jpeg
menu:
    main:
        identifier: '02'
photocredit: "Ed Reed/Mayoral Photography Office"
---

## Big improvements in outdoor air quality during COVID-19 reveal impacts of traffic and commercial cooking
On March 20, 2020, New York State announced the COVID-19 shutdown, officially known as NY Pause. In NYC, it lasted until June 8, 2020.

With stay-at-home orders in NY and other states, New York City's air quality changed significantly. Earlier, [we looked at data collected from real-time air pollution monitors to see how day-to-day pollution changed when people started to stay home]({{< ref "data-stories/aqcovid" >}}).

More recently, we used data from our network of air quality monitors to examine air pollution changes over time and across neighborhoods.

During NY Pause, there was [less traffic at bridges and tunnels](https://new.mta.info/coronavirus/ridership), [shorter travel times on major roadways](https://dev.socrata.com/foundry/data.cityofnewyork.us/i4gi-tjb9), and [fewer open small businesses](https://github.com/OpportunityInsights/EconomicTracker), especially in leisure and hospitality.

As a result, outdoor air quality improved: we recorded large decreases in concentrations of pollutants. Some of this decrease was expected since air quality is seasonal. For example, boilers that heat buildings in the winter emit pollutants, so we usually see air quality improve when winter ends.

But the improvements in pollution from winter to spring were much greater in 2020 than they had been in 2019. Reductions in activity during NY Pause resulted in a **29% decline in NO2** and a **25% decline in PM2.5**.

{{< rawhtml>}}
</div>
<div class="medium my-4 py-2">
    <H3 class="fs-lg">Both NO2 and PM2.5 fell during NY Pause - more than in 2019. </H3>
    <div class="row">
        <div class="col-6">
            <iframe title="NO2 fell during NY Pause in 2020..." aria-label="Interactive line chart" id="datawrapper-chart-9jeJb" src="https://datawrapper.dwcdn.net/9jeJb/1/" scrolling="no" frameborder="0" style="width: 0; min-width: 100% !important; border: none;" height="398"></iframe><script type="text/javascript">!function(){"use strict";window.addEventListener("message",(function(e){if(void 0!==e.data["datawrapper-height"]){var t=document.querySelectorAll("iframe");for(var a in e.data["datawrapper-height"])for(var r=0;r<t.length;r++){if(t[r].contentWindow===e.source)t[r].style.height=e.data["datawrapper-height"][a]+"px"}}}))}();
            </script>
            <div style="background-color:blanchedalmond; padding: 10px; border-radius: 5px"><p class="fs-sm">Nitrogen dioxide (NO2) is part of a group of pollutants called “oxides of nitrogen” (NOX). Exposures to NOX are linked to increased emergency department visits and hospitalizations for respiratory conditions, particularly asthma.  </p></div>
        </div>
        <div class="col-6">
            <iframe title="So did PM2.5 - more than in 2019." aria-label="Interactive line chart" id="datawrapper-chart-WHK8J" src="https://datawrapper.dwcdn.net/WHK8J/1/" scrolling="no" frameborder="0" style="width: 0; min-width: 100% !important; border: none;" height="398"></iframe><script type="text/javascript">!function(){"use strict";window.addEventListener("message",(function(e){if(void 0!==e.data["datawrapper-height"]){var t=document.querySelectorAll("iframe");for(var a in e.data["datawrapper-height"])for(var r=0;r<t.length;r++){if(t[r].contentWindow===e.source)t[r].style.height=e.data["datawrapper-height"][a]+"px"}}}))}();
            </script>
            <div style="background-color:blanchedalmond; padding: 10px; border-radius: 5px"><p class="fs-sm">Fine particles (PM2.5) are tiny airborne solid and liquid particles less than 2.5 microns in diameter. PM2.5 is the most harmful urban air pollutant. It is small enough to penetrate the lungs and enter the bloodstream, which can worsen lung and heart disease.  </p></div>
        </div>
    </div>
</div>
<div class="narrow">
{{< /rawhtml>}}

### The biggest air quality changes were in Manhattan's central business district.
With many New Yorkers staying home, activity in the CBD fell drastically. Explore the changes in the maps below.

{{< rawhtml>}}
<div style="background-color:blanchedalmond; margin: 10px 50px; padding: 10px; border-radius: 5px"><p class="fs-sm">Our land-use regression models incorporate data from nearly 100 air quality monitoring sites. <a href="https://nyccas.cityofnewyork.us/nyccas2021v9/report/2">For more information, visit NYCCAS</a>. </p></div>

</div>
<div class="medium my-4">
    <div class="row">
        <div class="col-6">
            <img src="PM-animated-map.gif">
        </div>
        <div class="col-6">
            <img src="NO2-animated-map.gif">
        </div>
    </div>
</div>
<div class="narrow">
<!-- Button trigger modal -->
<button type="button" class="btn btn-block btn-outline-primary mb-4" data-toggle="modal" data-target="#exampleModalCenter">
    View these data in an interactive map
</button>
{{< /rawhtml>}}

### Comparing Midtown Manhattan to an “urban background” location
Since PM2.5 levels normally vary by season, we used the difference in PM2.5 between a site in midtown Manhattan and an “urban background” site in Queens to see if there were any unusual changes during NY Pause. This Queens site usually has lower levels of air pollutants than Midtown, but during NY Pause, the difference fell to nearly nothing. Pollution in Midtown matched the Queens site.

{{< datawrapper title="PM2.5 difference between Midtown and Queens" src="ZSG5m/1/" height="150" >}}

Our land-use regression models suggest that there are three major sources of PM2.5 and NO2 in NYC — traffic, commercial cooking, and building boiler emissions.

### Traffic resumed after NY Pause...
During NY Pause, the Lincoln Tunnel's morning rush travel time to NYC plummeted, indicating reduced traffic volume. It increased again during the summer:

{{< datawrapper title="Traffic after NY Pause" src="3dH2R/1/" height="150" >}}

### ...but many small businesses, including restaurants, stayed closed.
There were about 50% fewer small leisure and hospitality businesses operating during NY Pause than in January 2020—but many of the small businesses that closed had still not reopened by January 2021.

{{< datawrapper title="Traffic after NY Pause" src="tRi2z/1/" height="150" >}}

The other major source of air pollution in NYC, [building boilers, showed little evidence of change during the shutdown](https://www.sciencedirect.com/science/article/pii/S2666765722000072?via%3Dihub).

### While traffic picked up again, businesses were slow to reopen and Midtown PM2.5 levels stayed low.
Even after traffic picked up again, PM2.5 levels in Midtown remained similar to the site in Queens. This suggests that the changes in PM2.5 weren't driven entirely by traffic levels in the CBD.

Instead, decreases in PM2.5 were probably because small businesses—in particular, restaurants—remained closed. That meant ongoing decreases in commercial cooking. Because of restrictions on gatherings and indoor dining, and fewer tourists and office workers, restaurant emissions stayed lower than normal even after the city started reopening.

These data show us how the early stage of the COVID-19 pandemic affected our air quality. Different factors drove the changes: the shutdown impacted both traffic emissions and restaurant emissions. When people stay home, air pollution decreases.

### Lessons learned for the future
Understanding the air pollution impacts from NY Pause can help us anticipate impacts from policies such as congestion pricing.

Congestion pricing is a proposed tolling system that would charge drivers for entering Manhattan below 60th street.

Because congestion pricing specifically targets traffic going into the CBD, we can expect effects on air pollution to be more narrowly focused around that area. And congestion pricing will probably have more of an effect on NO2 (which mostly comes from traffic) than on PM2.5 (which comes from many sources including buildings and commercial cooking).


{{< rawhtml>}}
<!-- Modal -->
<div class="modal fade" id="exampleModalCenter" tabindex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
    <div class="modal-content">
        <div class="modal-header">
        <h5 class="modal-title" id="exampleModalLongTitle">Air quality changes from Spring 2019 to Spring 2020</h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
        </div>
        <div class="modal-body">
            <button id="btn1" type="button" class="btn btn-sm btn-outline-primary float-right" onclick="mapPM()">
                PM2.5
            </button>
            <button id="btn2" type="button" class="btn btn-sm btn-primary float-right mr-1" onclick="mapNO()">
                NO2
            </button>
        <iframe id="dest" src="no2_differences_leaflet.html" frameborder="no" style="width: 100%; height: 75vh"></iframe>
        </div>
        <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
        </div>
    </div>
    </div>
</div>

<script>
    function mapPM() {
        console.log('map PM')
        var iframe = document.getElementById('dest')
        iframe.src = "pm25_differences_leaflet.html"
        document.getElementById('btn1').classList.remove('btn-outline-primary')
        document.getElementById('btn1').classList.add('btn-primary')
        document.getElementById('btn2').classList.add('btn-outline-primary')
        document.getElementById('btn2').classList.remove('btn-primary')
    }

    function mapNO() {
        console.log('map NO')
        var iframe = document.getElementById('dest')
        iframe.src = "no2_differences_leaflet.html"
        document.getElementById('btn2').classList.remove('btn-outline-primary')
        document.getElementById('btn2').classList.add('btn-primary')
        document.getElementById('btn1').classList.add('btn-outline-primary')
        document.getElementById('btn1').classList.remove('btn-primary')
    }
</script>
{{< /rawhtml>}}