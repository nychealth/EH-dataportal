---
title: "Neighborhood boundaries on the EH Data Portal"
date: 2021-07-19T08:33:22-04:00
draft: false
tags: ["geography","maps","neighborhoods","health data","methods","geographic"]
categories: []
keywords: []
image: ../../images/ds-geographies.jpg
---

## Mapping health data onto NYC's neighborhoods

New York City has hundreds of neighborhoods and nearly as many ways of drawing neighborhood boundaries. When you [visit the Environment & Health Data Portal](https://a816-dohbesp.nyc.gov/IndicatorPublic/Subtopic.aspx), you might notice that data is available in several different neighborhood schemes.

For example, dig around in the asthma data pages and you'll find [Adults with Asthma](https://a816-dohbesp.nyc.gov/IndicatorPublic/VisualizationData.aspx?id=18,4466a0,11,Summarize) presented by UHF34 neighborhoods, [Public School Children with Asthma](https://a816-dohbesp.nyc.gov/IndicatorPublic/VisualizationData.aspx?id=2147,4466a0,11,Summarize) presented by UHF42 neighborhoods, and [Asthma emergency department visits](https://a816-dohbesp.nyc.gov/IndicatorPublic/VisualizationData.aspx?id=2383,4466a0,11,Summarize) are offered by NTAs. Other data on the portal are offered by CD, ZIP code, PUMA, and occasionally even police precinct. **What are all these neighborhood schemes, why do we use one and not the other, and why isn’t the whole system consistent?**

The most common neighborhood boundaries on the EH Data Portal are Community Districts, Public Use Microdata Areas, and United Hospital Fund neighborhoods. These three common neighborhood schemes have different building blocks. Let's explore these.

### Nesting: how neighborhood schemes have different root units

{{< rawhtml >}}
<div style="border: 1px solid blue; height: 500px; width: 100%"></div>

{{< /rawhtml >}}

#### Community districts
There are 59 Community Districts (CDs) in NYC, each overseen by a Community Board that advises on land use, zoning, city budgets, and more. As a political boundary, CDs are useful geographic units for breaking down city operations. [Learn more about Community Boards](https://www1.nyc.gov/site/cau/community-boards/about-commmunity-boards.page).

#### Public Use Microdata Areas
Public Use Microdata Areas (PUMAs) have boundaries defined by the US Census. They are made up of groups of census tracts.

There are 55 PUMAs in NYC. PUMAs have similar boundaries to Community Districts, which means that often, one can be used as a proxy for the other. In the map below, notice how Brooklyn CD 1, in Greenpoint/Williamsburg, is almost identical to the PUMA.

There are four PUMAs that are made up of two CDs combined into one. Notice how two CDs in the South Bronx combine to form one PUMA.

Each PUMA breaks down into Neighborhood Tabulation Areas (NTAs), and each NTA breaks down even further into census tracts.

{{< rawhtml >}}
<div style="border: 1px solid blue; height: 500px; width: 100%"></div>

{{< /rawhtml >}}

#### United Hospital Fund neighborhoods
United Hospital Fund neighborhoods (UHFs) have boundaries based on ZIP codes. This geography was created by the Health Department, the United Hospital Fund, and other city agencies in the 1980s. They were designed for health research, and to be similar to NYC’s Community Districts.

Health data - like somebody’s hospitalization record, for example, or a response to a survey - often includes a person’s ZIP code. It’s the most readily available piece of geographic information in administrative data. It’s also the neighborhood designation that most people know and can provide when responding to a survey.

To protect privacy, we often bundle (or aggregate) data from a larger area, so we need a scheme of neighborhoods that are made up of a collection of ZIP codes: UHFs. Collecting data by ZIP code and then "rolling up" into UHF neighborhoods has been used in health research for decades. The methods for our surveys (like the Community Health Survey) are designed to include enough people from each UHF neighborhood so that there’s a “representative sample” of all New Yorkers, and so that we can compare neighborhoods with high statistical confidence. Usually, we use UHF42 neighborhoods, which breaks the city down into 42 neighborhoods. Sometimes, though, we use UHF34 neighborhoods - by grouping together some of the neighborhoods, we can increase the statistical power of a survey.

In the map below, notice how three UHF42 neighborhoods in the South Bronx are combined into one UHF34 neigborhood - and how the UHF neighborhoods have ZIP codes (or, more precisely, ZIP code tabulation areas) as their root unit.

{{< rawhtml >}}
<div style="border: 1px solid blue; height: 500px; width: 100%"></div>

{{< /rawhtml >}}


### How do you choose when boundaries overlap?
These different neighborhood boundaries can make things confusing. For example, say you live in Ditmas Park and you want to take some health data to a meeting of your Community Board. Ditmas Park is part of Community District 14, Flatbush/Midwood. But CD14 straddles two different UHF neighborhoods.

[We have a tool that helps you view the overlap and the differences](https://a816-dohbesp.nyc.gov/IndicatorPublic/CommunityDistrict.aspx) so that you can choose what Neighborhood Report to use, but it still raises a difficult question: what neighborhood's data would you bring to your Community Board meeting?

{{< rawhtml >}}
<div style="border: 1px solid blue; height: 500px; width: 100%"></div>

{{< /rawhtml >}}

On the EH Data Portal, we aggregate data from lots of different sources. They might not line up exactly the way we want them to: when data are collected in different ways for different purposes, there will be differences in the underlying geography available. The fact that there’s no one consistent root unit does complicate things.

But any way of drawing boundaries or aggregating data will smooth over some variation within groups. Despite limitations in the data, we can still see health patterns by geography, and learn valuable information about how neighborhoods differ and why. Neighborhood health data have a lot to tell us, even when their boundaries are imperfect representations of New York City's communities.

---
If you're mapping health data, you can [download and use shapefiles, geojson, and topojson files at our Github repository](https://github.com/nycehs/NYC_geography).