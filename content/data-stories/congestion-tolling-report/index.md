---
title: "Initial data from Congestion Relief Tolling"
date: 2025-04-30T13:11:44-04:00
draft: false
seo_title: "Initial data from Congestion Relief Tolling"
seo_description: "A review of data from 3 months of Congestion Relief Tolling"
tags:
categories: ["publicspace", "climatehealth", "airquality"]
keywords:
  [
    "air quality",
    "pollution",
    "fine particles",
    "transportation",
    "built environment",
    "streets",
    "traffic",
    "transit",
    "public transportation",
    "mass transit",
    "safety"
  ]
image: gridlock-midtown.jpg
photocredit: "Department of Transportation"
related:
  - title: "Public transit creates health"
    url: "data-stories/public-transit-creates-health"
  - title: "The public health impacts of PM2.5 from traffic air pollution"
    url: "data-stories/traffic-and-air-pollution/"
  - title: "New York City Community Air Survey"
    url: "data-features/nyccas/"
---

In January 2025, New York City started Congestion Relief Tolling: charging vehicles to enter the Central Business District to reduce traffic, improve safety, and raise money for public transportation.  

But Congestion Relief Tolling won’t only change the Central Business District (CBD) – it may also cause changes in traffic patterns outside the CBD. So, the Health Department is collaborating with the Metropolitan Transportation Authority, the New York State Department of Transportation, and the New York City Department of Transportation to study how the tolling changes traffic and air quality across New York City neighborhoods.   

Here, we take a preliminary look at traffic and air pollution data. From this initial look at the data:  
- Traffic levels inside the tolling zone appear to be lower than previous months.  
- Traffic levels outside the tolling zone appear to be consistent with previous months.   
- PM2.5 levels outside the tolling zone follow familiar seasonal patterns (as the weather gets colder, building boilers emit more pollutants).   
- PM2.5 levels inside the tolling zone show drops, though we typically see increases in PM2.5 levels during the winter.  

But these data don’t let us draw strong conclusions about the toll’s effect. A comprehensive study will require 12 months of data before the tolling start date, and 12 months of data after the start date. For that evaluation, we will use scientific methods that will separate the effects of the toll from other factors that can affect traffic and air quality: the season, weather patterns, activity patterns, and others. We expect to publish that evaluation in 2026.   

## Changes in traffic patterns
Traffic levels appear to be lower in the relief zone and largely unchanged outside of it. Data on traffic volume come from “short counts,” periodic sample counts at certain locations, and from tolling sites and river crossings. Traffic counts are presented as the monthly average of midweek (Tuesday, Wednesday, and Thursday) traffic counts, excluding holidays. <a href="#" class="" data-toggle="modal" data-target=".bd-example-modal-lg">See locations of traffic counts and air quality monitors</a>.

**Short count sites** are compared against counts at the Van Wyck Expressway, which is used as a control site, since Congestion Relief Tolling is not expected to cause traffic changes there. Sites outside of the tolling zone do not appear to show a meaningful increase in truck traffic or overall traffic counts.  

</div>
<div class="wide border-top border-bottom my-4 py-2">
<button class="btn btn-sm btn-outline-primary active scbtn" onclick="changeShortcount(1)" id="shortcountButton1">Manhattan/Bronx</button>
<button class="btn btn-sm btn-outline-primary scbtn" onclick="changeShortcount(2)" id="shortcountButton2">FDR locations</button>
<button class="btn btn-sm btn-outline-primary scbtn"  onclick="changeShortcount(3)" id="shortcountButton3">Brooklyn/Queens/SI</button>

<div class="shortcountCharts mt-2" id="shortcount1">
  <div style="min-height:608px" id="datawrapper-vis-0mNlZ"><script type="text/javascript" defer src="https://datawrapper.dwcdn.net/0mNlZ/embed.js" charset="utf-8" data-target="#datawrapper-vis-0mNlZ"></script><noscript><img src="https://datawrapper.dwcdn.net/0mNlZ/full.png" alt="" /></noscript></div>
</div>
<div class="hide shortcountCharts mt-2"  id="shortcount2">
  <div style="min-height:589px" id="datawrapper-vis-chwE5"><script type="text/javascript" defer src="https://datawrapper.dwcdn.net/chwE5/embed.js" charset="utf-8" data-target="#datawrapper-vis-chwE5"></script><noscript><img src="https://datawrapper.dwcdn.net/chwE5/full.png" alt="" /></noscript></div>
</div>
<div class="hide shortcountCharts mt-2" id="shortcount3">
  <div style="min-height:764px" id="datawrapper-vis-1BiTR"><script type="text/javascript" defer src="https://datawrapper.dwcdn.net/1BiTR/embed.js" charset="utf-8" data-target="#datawrapper-vis-1BiTR"></script><noscript><img src="https://datawrapper.dwcdn.net/1BiTR/full.png" alt="" /></noscript></div>
</div>
</div>
<div class="narrow">

**CBD tolling sites and river crossings** data show decreases in total traffic volume and truck traffic volume.  

</div>
<div class="wide border-top border-bottom my-4 py-2">
<button class="btn btn-sm btn-outline-primary active tollingbtn" onclick="changeTolling(1)" id="tollingButton1">FDR locations</button>
<button class="btn btn-sm btn-outline-primary tollingbtn" onclick="changeTolling(2)"  id="tollingButton2">River crossings</button>

<div class="tollingCharts mt-2" id="tolling1">
  <div style="min-height:800px" id="datawrapper-vis-sGNgG"><script type="text/javascript" defer src="https://datawrapper.dwcdn.net/sGNgG/embed.js" charset="utf-8" data-target="#datawrapper-vis-sGNgG"></script><noscript><img src="https://datawrapper.dwcdn.net/sGNgG/full.png" alt="" /></noscript></div>
</div>
<div class="tollingCharts hide mt-2" id="tolling2">
  <div style="min-height:958px" id="datawrapper-vis-vJeqB"><script type="text/javascript" defer src="https://datawrapper.dwcdn.net/vJeqB/embed.js" charset="utf-8" data-target="#datawrapper-vis-vJeqB"></script><noscript><img src="https://datawrapper.dwcdn.net/vJeqB/full.png" alt="" /></noscript></div>
</div>
</div>

<script>
function changeShortcount(x) {
  const charts = document.querySelectorAll('.shortcountCharts');
  charts.forEach(chart => chart.classList.add('hide'));

  const buttons = document.querySelectorAll('.scbtn');
  buttons.forEach(btn => btn.classList.remove('active'));

  const selectedChart = document.getElementById(`shortcount${x}`);
  if (selectedChart) selectedChart.classList.remove('hide');

  const selectedButton = document.getElementById(`shortcountButton${x}`);
  if (selectedButton) selectedButton.classList.add('active');
}

function changeTolling(x) {
  const charts = document.querySelectorAll('.tollingCharts');
  charts.forEach(chart => chart.classList.add('hide'));

  const buttons = document.querySelectorAll('.tollingbtn');
  buttons.forEach(btn => btn.classList.remove('active'));

  const selectedChart = document.getElementById(`tolling${x}`);
  if (selectedChart) selectedChart.classList.remove('hide');

  const selectedButton = document.getElementById(`tollingButton${x}`);
  if (selectedButton) selectedButton.classList.add('active');
}
</script>

<div class="narrow">

## Changes in PM2.5 air pollution
PM2.5, or fine particles, are a major form of air pollution that can harm health. PM2.5 is emitted by fuel combustion – from vehicles, building boilers, restaurants, and other sources. [About 14% of the city’s PM2.5 comes from traffic](../data-stories/traffic-and-air-pollution).  

Inside the tolling zone, PM2.5 levels drop at several sites. Typically, we see PM2.5 levels rise in colder weather, as building boilers heat buildings and emit pollution.  

</div>
<div class="wide border-top border-bottom my-4 py-2">
<div style="min-height:430px" id="datawrapper-vis-poCeg"><script type="text/javascript" defer src="https://datawrapper.dwcdn.net/poCeg/embed.js" charset="utf-8" data-target="#datawrapper-vis-poCeg"></script><noscript><img src="https://datawrapper.dwcdn.net/poCeg/full.png" alt="" /></noscript></div>
</div>
<div class="narrow">

Outside the tolling zone, we compare monthly average PM2.5 levels to a control site on the Van Wyck Expressway. This site is used as a control because it’s not expected to be affected by the toll. Most locations show steady or decreasing concentrations of PM2.5.   

</div>
<div class="wide border-top border-bottom my-4 py-2">
<div style="min-height:683px" id="datawrapper-vis-QnCs4"><script type="text/javascript" defer src="https://datawrapper.dwcdn.net/QnCs4/embed.js" charset="utf-8" data-target="#datawrapper-vis-QnCs4"></script><noscript><img src="https://datawrapper.dwcdn.net/QnCs4/full.png" alt="" /></noscript></div>
</div>
<div class="narrow">

One location, Hamilton Bridge, shows an increase that is consistent with typical seasonal variation – the area has a greater concentration of buildings with boilers that emit more PM2.5, so this area sees more PM2.5 pollution in cold weather.  

## What it means  

This initial, 3-month report on traffic and air quality changes shows that traffic appears to be lower in the relief zone and unchanged outside of it. PM2.5 levels inside the tolling zone dropped slightly, and outside the zone, follow typical seasonal patterns.   

However, this is not enough to draw conclusions about the effects of Congestion Relief Tolling on traffic and air quality. For reliable findings, we need to analyze data from 12 months before the start of tolling, and 12 months after the start of tolling. We will use analytical methods that will separate out the effects of the toll from other effects, like year-to-year changes in the city, seasonal variations, and other things that can affect traffic volume and air quality. And, that study will examine the effect of Congestion Relief Tolling on the 6 different pollutants typically examined by the [New York City Community Air Survey](../data-features/nyccas).  

A future report, in 2026, will provide a reliable, comprehensive look at the tolling program’s changes to traffic volume and air quality.    

<div class="modal fade bd-example-modal-lg" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-body">
              <ul class="nav nav-tabs" id="myTab" role="tablist">
        <li class="nav-item">
          <a class="nav-link active" id="home-tab" data-toggle="tab" href="#inside" role="tab" aria-controls="inside" aria-selected="true">In Congestion Relief Zone</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" id="profile-tab" data-toggle="tab" href="#outside" role="tab" aria-controls="outside" aria-selected="false">Outside Congestion Relief Zone</a>
        </li>
      </ul>
      <div class="tab-content" id="myTabContent">
        <div class="tab-pane fade show active" id="inside" role="tabpanel" aria-labelledby="inside-tab">
          <div style="min-height:1009px" id="datawrapper-vis-m0FqH"><script type="text/javascript" defer src="https://datawrapper.dwcdn.net/m0FqH/embed.js" charset="utf-8" data-target="#datawrapper-vis-m0FqH"></script><noscript><img src="https://datawrapper.dwcdn.net/m0FqH/full.png" alt="" /></noscript></div>
        </div>
        <div class="tab-pane fade" id="outside" role="tabpanel" aria-labelledby="outside-tab">
          <div style="min-height:1009px" id="datawrapper-vis-hORMf"><script type="text/javascript" defer src="https://datawrapper.dwcdn.net/hORMf/embed.js" charset="utf-8" data-target="#datawrapper-vis-hORMf"></script><noscript><img src="https://datawrapper.dwcdn.net/hORMf/full.png" alt="" /></noscript></div>
        </div>
      </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
      </div>
    </div>
  </div>
</div>  