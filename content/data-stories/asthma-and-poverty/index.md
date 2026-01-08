---
title: "Why asthma is a social justice issue"
aliases:
  - /data-stories/povasthma/
date: 2019-10-24T08:18:56-04:00
draft: false
seo_title: "Why asthma is a social justice issue"
seo_description: "A data story on asthma and justice in NYC."
tags:
categories:
  ["housing", "inequality", "childhealth", "healthoutcomes", "neighborhoods"]
keywords:
  [
    "poverty",
    "asthma",
    "injustice",
    "housing",
    "children",
    "emergency department visits",
    "ed visits",
    "emergency room",
    "social determinants",
    "kids",
  ]
image: ds-povasthma.jpg
photocredit: "Benjamin Kanter/Mayoral Photography Office, City of New York"
related:
  - title: "Economic stability creates health"
    url: "data-stories/economic-stability/"
  - title: "What our air quality monitors tell us about NYC's neighborhoods"
    url: "data-stories/air-quality-by-neighborhood/"
  - title: "Reducing air pollution in neighborhoods with the worst health impacts"
    url: "data-stories/hia/"
---

{{< updateflag data=`[
  {"src": "../../data-explorer/economic-conditions/?id=103", "text": "Neighborhood poverty"},
  {"src": "../../data-explorer/asthma/?id=2379", "text": "Asthma ED visits (age 5 to 17)"}
]` >}}

data-explorer/economic-conditions/?id=103#display=summary

Poverty affects health in many ways. In New York City, the story of asthma clearly illustrates this connection.

To understand the connection between poverty and asthma, take a look at this map of poverty rates in New York City, below. The darker the color, the more residents living in poverty.

<div aria-hidden="true">
{{< datawrapper title="Poverty in New York City" src="s32oq/3/" height="600" >}}
</div>
<div class="sr-only">
<div style="min-height:930px" id="datawrapper-vis-ecp3d"><script type="text/javascript" defer src="https://datawrapper.dwcdn.net/ecp3d/embed.js" charset="utf-8" data-target="#datawrapper-vis-ecp3d"></script><noscript><img src="https://datawrapper.dwcdn.net/ecp3d/full.png" alt="" /></noscript></div>
</div>

Now, compare that to a map of emergency department visits for asthma in children age 5 to 17, below. The darker the color, the higher the rate of children visiting the emergency department with asthma.

<div aria-hidden="true">
{{< datawrapper title="Child asthma in NYC" src="xHdgu/1/" height="600" >}}
</div>

<div class="sr-only">
<div style="min-height:907px" id="datawrapper-vis-KvyVJ"><script type="text/javascript" defer src="https://datawrapper.dwcdn.net/KvyVJ/embed.js" charset="utf-8" data-target="#datawrapper-vis-KvyVJ"></script><noscript><img src="https://datawrapper.dwcdn.net/KvyVJ/full.png" alt="" /></noscript></div>
</div>

The similarities are clear. Throughout the city, neighborhoods with higher rates of poverty also experience higher rates of childhood asthma, which we can see from the rates of emergency department visits.

### They look connected. Are they?

We can look at the connections between these two maps, of poverty and asthma, with a scatter plot.

On the scatter plot below, each dot represents one neighborhood. Its horizontal position represents the neighborhood's poverty rate, and its vertical position represents its asthma rate. The pattern of dots, roughly grouped around an ascending line, shows a connection between poverty and asthma: the higher the poverty rate, the higher the asthma rate.

<div aria-hidden="true">
{{< datawrapper title="The correlation between poverty and asthma" src="YiBqa/2/" height="409" >}}
</div>
<div class="sr-only">
<div style="min-height:8325px" id="datawrapper-vis-pxkwE"><script type="text/javascript" defer src="https://datawrapper.dwcdn.net/pxkwE/embed.js" charset="utf-8" data-target="#datawrapper-vis-pxkwE"></script><noscript><img src="https://datawrapper.dwcdn.net/pxkwE/full.png" alt="Higher poverty areas overlap with higher child ED visits for asthma. In Mott Haven-Port Morris, where there is a 45.1% poverty rate, there are	683 ED visits by children per 10,000 residents. In Park Slope-Gowanus, there is a 7.3% poverty rate, and fewer child ED visits at 68 per 10,000 residents. " /></noscript></div>
</div>

### Why does this connection exist?

The connection between poverty and asthma is due to a variety of factors, including:

- **A shortage of healthy housing** in poor neighborhoods means that people experience a range of housing conditions like mold, pests, and leaks that trigger asthma and make it worse.
- **A lack of access to high-quality health care** means that people with asthma may not be on the right medicine to prevent attacks.

[This Epi Data Brief](https://www1.nyc.gov/assets/doh/downloads/pdf/epi/databrief90.pdf) highlights how asthma disproportionately affects children of color and those in low-income neighborhoods. Reducing children’s emergency department visits for asthma and other inequities associated with poverty is a central component of [Take Care New York](https://www1.nyc.gov/assets/doh/downloads/pdf/tcny/tcny-2020.pdf), the city’s plan to create healthier, more equitable neighborhoods.

### So what does this connection mean?

Some studies have concluded that the place you’re born largely determines your economic future. Other studies have concluded that where you’re born is determined by income, race and ethnicity.

This means that in our society, too many outcomes of health and well-being are determined before we’re born. To improve public health, we need to address poverty and racial inequities.
