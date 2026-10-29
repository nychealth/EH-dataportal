---
title: "Heat and workplace injuries and illnesses in NYC"
shortTitle: "Heat and work"
date: 2026-10-27T09:00:00-04:00
draft: false
vega: true
seo_title: "Heat and workplace injuries and illnesses in NYC"
seo_description: "A data story on how heat affects workplace injury and illness risk for NYC workers."
tags:
# Placeholder hero image, copied from the extreme heat story; replace before publishing.
image: ds-heat.jpg
photocredit: "Michael Appleton/Mayoral Photography Office, City of New York"
categories: ["climatehealth", "healthoutcomes"]
keywords:
  [
    "heat",
    "occupational health",
    "workplace injury",
    "workers' compensation",
    "climate",
  ]
---

<!-- Story text is in progress. Figures 1, 4 and 5 are Vega-Lite specs in this bundle
     (fig1.vl.json, fig4.vl.json, fig5.vl.json), each reading the CSV beside it. -->

<style>
    /* Keep Vega tooltips compact, and let long values (Figure 4's sector descriptions) wrap in full.
       vega-embed injects its own tooltip CSS at runtime with a more specific selector, hence !important. */
    #vg-tooltip-element { max-width: 340px; }
    #vg-tooltip-element td.key,
    #vg-tooltip-element td.value { font-size: 12px !important; }
    #vg-tooltip-element td.key { white-space: nowrap; }
    #vg-tooltip-element td.value { max-height: none !important; white-space: normal; text-align: left; }
</style>

## Heat is a workplace health and safety hazard in New York City

## What workers' compensation claims can tell us about heat and work

## Workplace injury and illness risk rises as temperatures rise

### Risk increases with temperature

{{< vega0 id="fig1" spec="fig1.vl.json" >}}

<p class="small text-muted">
<strong>Industries with common heat exposure</strong> (outdoor or indoor; 184,618 claims): construction, transportation and warehousing, administrative and waste services, public administration, accommodation and food services, manufacturing.<br>
<strong>All other industries</strong> (187,716 claims): health care, retail, education, information, real estate, arts and entertainment, other services.<br>
Results are based on 372,334 workers' compensation claims in New York City from May–September, 2016–2025.
</p>

## Most heat-related injuries occur before temperatures become extreme

<!-- Figure 2 (Datawrapper) -->

## Heat affects workers in many different ways

<!-- Figure 3 (Datawrapper) -->

## Heat risk extends across the NYC workforce

### Industry view

{{< vega0 id="fig4" spec="fig4.vl.json" >}}

<p class="small text-muted">Hover over a cell for the sector's description and number of claims. Results are based on 372,334 workers' compensation claims in New York City from May–September, 2016–2025.</p>

### Occupation view

<!-- Figure 5's direct labels need ~520px, so narrow screens scroll it sideways rather than crush the plot -->
<div style="overflow-x: auto;">
<div style="min-width: 520px;">
{{< vega0 id="fig5" spec="fig5.vl.json" >}}
</div>
</div>

<p class="small text-muted">Hover over a line or its label to see that occupation's 95% confidence interval. Results are based on 71,774 workers' compensation claims in New York City from May–September, 2016–2025.</p>

## Some workers may face overlapping sources of heat vulnerability

<!-- Figure 6 (Datawrapper map) and Figure 7 (Datawrapper) -->

## Workers' compensation data show only part of the burden

## What these findings mean for protecting NYC workers
