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

People's ability to reach services with limited mobility is one practical way to describe accessibility. In this case, we focus on a proximity indicator for Accessible subway stations: the share of residents who live within a typical walking distance of an ADA-compliant subway station.

"Proximity" indicators - the percent of a population living within walking distance to XXX.
- Link to indicators
- Link
- Link

**So how do we calculate that?**

## 1) Identify ADA-accessible subway stations

We start with the MTA Subway Stations dataset and keep only stations flagged as **ADA-accessible**. These stations are the points where people with mobility needs can actually get into the subway system.

<div class="border my-2" style="width:100%; height: 350px">
Map of ADA subway stations
</div>

## 2) Define walking distance from each station

Instead of drawing circles, we use the walking-network from OpenStreetMap. With Dijkstra's shortest-path algorithm, we find all places reachable within 800 meters of walking distance from each station entrance.  

<div class="border my-2" style="width:100%; height: 350px">
Map of 800 m isochrones
</div>

## 3) Combine all station walkable areas

To keep things simple and avoid double-counting, we merge all the individual walkable polygons into a single unioned map of “all areas within 800 m of any ADA station.”  

<div class="border my-2" style="width:100%; height: 350px">
Unioned isochrone map
</div>

## 4) Estimate the population in the walkable area

Next we ask: *who actually lives inside this area?*  

- We start with **Census Block Groups (BGs)** for population totals.  
- Because block groups are large and might cross the walkable area, we use **PLUTO residential units** to figure out how many people are likely inside that  area.  
- If a quarter of the residential units in a block group are inside the walkable area, we assume about a quarter of the population is too.  

This gives us a percent of the population within walking distance for every block group.

<div class="border my-2" style="width:100%; height: 350px">
Map of block groups by % population within walking distance
</div>

## 5) Roll up to larger geographies

Since block groups nest into larger areas, we can add up the results step by step:

- **Census Tracts:** Block groups form tracts. By summing BG estimates, we get the percent of each tract population within walking distance.  
  *Output:* `800m_CT_pct_walkable_ADA_subway.geojson`  

- **Neighborhood Tabulation Areas (NTAs):** Census tracts form NTAs. Aggregating tract results gives us the percent of each NTA population within walking distance.  
  *Output:* `800m_NTA2020_pct_walkable_ADA_subway.geojson`  

- **Community District Tabulation Areas (CDTAs):** NTAs form CDTAs. By summing NTA results, we can show the percent of each CDTA population within walking distance.  
  *Output:* `800m_CDTA2020_pct_walkable_ADA_subway.geojson`  

<div class="border my-2" style="width:100%; height: 350px">
Map of aggregated tract, NTA, and CDTA results
</div>

## 6) Handle UHF42 neighborhoods

UHF42 neighborhoods are different: they don't line up neatly with Census geography. To estimate population here, we had to split block groups across UHF42 boundaries:  

- First, we identify the share of each block group's residential units that fall inside a given UHF42 area and inside the walkable area.  
- Then, we allocate both the block group's total population and its “walkable” population across those shares.  
- Finally, we sum across block groups to get the percent of each UHF42 population within walking distance.  

This ensures people are only counted once, in the right place, even when geographies overlap.  

*Output:* `800m_UHF42_pct_walkable_ADA_subway.geojson`  

<div class="border my-2" style="width:100%; height: 350px">
Map of UHF42 results
</div>

# What this yields

An interpretable **proximity indicator**:  
Percent of residents within a 800 meters walk of an ADA-accessible subway station, reported for Block Groups and aggregated to Tracts, NTAs, CDTAs, and UHF42.  

The same method can be reused with different distance cutoffs or with different resources (e.g., audio bus stops, libraries, clinics).
