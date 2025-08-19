---
title: Proximity indicators
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
seo_title: Proximity indicators
seo_description: "Proximity indicators."
description: "Proximity indicators."
---

Introduction - explaining rationale behind Accessibility data.

"Proximity" indicators - the percent of a population living within walking distance to XXX.
- Link to indicators
- Link
- Link

**So how do we calculate that?**

First, we get data. In this case, we're looking at subway stations that are compliant with the Americans with Disabilities Act (ADA). We got a dataset on subway stations from SOURCE, and filtered it for ADA compliant stations. 

<div class="border my-2" style="width:100%; height: 350px">
Map of points
</div>

Next, we calculated an area around each point that constitutes "walking distance." 
- Assumption for walking distance
- Algorithm for walking distance using streets

<div class="border my-2" style="width:100%; height: 350px">
Map of walking distance area
</div>

Now that we have the area, we can estimate the population inside the area. To do this, we overlaid census blocks onto our map. 
- Brief description of census blocks
- Brief description of how we estimate population when a census block is partially in

<div class="border my-2" style="width:100%; height: 350px">
  Map of walking distance area with census blocks overlaid
</div>

Lastly, we can overlay useful geographies onto this map: Community Districts, Neighborhood Tabulation Areas, and UHF42 neighborhoods. 

<div class="border my-2" style="width:100%; height: 350px">
  Final map
</div>

This lets us come up with an estimate for the percent of population in different neighborhoods that live within walking distance to different resources that are important for accessibility and health. 