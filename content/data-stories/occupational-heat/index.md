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
    /* Keep Vega tooltips compact, and let long keys (Figure 1's group names) and long values (Figure 4's
       sector descriptions) wrap in full. min-width stops a long value squeezing the short keys onto several lines.
       max-content makes the size independent of where the tooltip last sat, so the vega0 shortcode can place it reliably.
       pointer-events stops a tooltip that overlaps the pointer from stealing it and hiding itself.
       vega-embed injects its own tooltip CSS at runtime with a more specific selector, hence !important. */
    #vg-tooltip-element { width: max-content; max-width: min(340px, calc(100vw - 16px)); pointer-events: none; }
    #vg-tooltip-element td.key,
    #vg-tooltip-element td.value { font-size: 12px !important; vertical-align: top; }
    #vg-tooltip-element td.key { min-width: 120px; white-space: normal; }
    #vg-tooltip-element td.value { max-height: none !important; white-space: normal; text-align: left; }

    /* Let charts extend past the 640px text column into the white space on either side, up to 860px.
       #primary-content has overflow: hidden, so the width stays inside it: it's the full window width
       below Bootstrap's xl breakpoint and two-thirds of it from there up. The 48px leaves room for its padding and a scrollbar. */
    .chart-wide {
        --chart-width: max(100%, min(860px, calc(100vw - 48px)));
        width: var(--chart-width);
        margin-left: calc((100% - var(--chart-width)) / 2);
    }

    @media (min-width: 1200px) {
        .chart-wide { --chart-width: max(100%, min(860px, calc(66.667vw - 48px))); }
    }
</style>

## Heat is a workplace health and safety hazard in New York City

## What workers' compensation claims can tell us about heat and work

## Workplace injury and illness risk rises as temperatures rise

### Risk increases with temperature

<div class="chart-wide">
{{< vega0 id="fig1" spec="fig1.vl.json" >}}
</div>

<p class="small text-muted mt-1">
<strong>Industries with common heat exposure</strong> (outdoor or indoor; 184,618 claims): construction, transportation and warehousing, administrative and waste services, public administration, accommodation and food services, manufacturing.<br>
<strong>All other industries</strong> (187,716 claims): health care, retail, education, information, real estate, arts and entertainment, other services.<br>
Results are based on 372,334 workers' compensation claims in New York City from May–September, 2016–2025. <a href="fig1-dose-response.csv" download>Download the data on risk by temperature (CSV)</a>.
</p>

## Most heat-related injuries occur before temperatures become extreme

<!-- Figure 2 (Datawrapper) -->

## Heat affects workers in many different ways

<!-- Figure 3 (Datawrapper) -->

## Heat risk extends across the NYC workforce

### Industry view

<div class="chart-wide">
{{< vega0 id="fig4" spec="fig4.vl.json" >}}
</div>

<p class="small text-muted mt-1">Hover over a cell for the sector's description and number of claims. Results are based on 372,334 workers' compensation claims in New York City from May–September, 2016–2025. <a href="fig4-industry.csv" download>Download the data by industry (CSV)</a>.</p>

### Occupation view

<!-- Figure 5's direct labels need ~555px, so narrow screens scroll it sideways rather than crush the plot -->
<div class="chart-wide" style="overflow-x: auto;">
<div style="min-width: 555px;">
{{< vega0 id="fig5" spec="fig5.vl.json" >}}
</div>
</div>

<p class="small text-muted mt-1">Percentages beside each occupation are the estimated change on a 95°F day. Hover over a line or its label to see that occupation's 95% confidence interval. Results are based on 71,774 workers' compensation claims in New York City from May–September, 2016–2025. <a href="fig5-occupations.csv" download>Download the data by occupation (CSV)</a>.</p>

## Some workers may face overlapping sources of heat vulnerability

<!-- Figure 6 (Datawrapper map) and Figure 7 (Datawrapper) -->

## Workers' compensation data show only part of the burden

## What these findings mean for protecting NYC workers
