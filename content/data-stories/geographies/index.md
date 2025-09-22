---
title: "Neighborhood boundaries on the EH Data Portal"
shortTitle: "Neighborhood boundaries"
date: 2020-08-01T08:33:22-04:00
draft: false
seo_title: "Neighborhood boundaries in health data"
seo_description: "A data story on different ways to map health data."
tags:
categories: ["internal", "neighborhoods"]
keywords:
  [
    "geography",
    "maps",
    "neighborhoods",
    "health data",
    "methods",
    "geographic",
    "how we work",
  ]
image: ds-geographies.jpg
layout: single
vega: true
photocredit: "Edwin J. Torres/Mayoral Photography Office, City of New York"
related:
  - title: "Our roadmap: An open path forward"
    url: "data-stories/roadmap/"
  - title: "Why we're working with you to redesign the data portal"
    url: "data-stories/codesign/"
  - title: "Neighborhood Reports: Asthma"
    url: "neighborhood-reports/#Asthmareport"
---

New York City has hundreds of neighborhoods and nearly as many ways of drawing neighborhood boundaries. When you visit the Environment & Health Data Portal, you might notice that data is available in several different neighborhood schemes.

For example, dig around in the asthma data pages and you'll find [Adults with Asthma]({{< baseurl >}}data-explorer/asthma/?id=18) presented by UHF34 neighborhoods, [Public School Children with Asthma]({{< baseurl >}}data-explorer/asthma/?id=2147) presented by UHF42 neighborhoods, and [Asthma emergency department visits]({{< baseurl >}}data-explorer/asthma/?id=2384) are offered by NTAs. Other data on the portal are offered by CD, ZIP code, PUMA, and occasionally even police precinct.
<br>

**What are all these neighborhood schemes, why do we use one and not the other, and why isn’t the whole system consistent?**

### Most common neighborhood boundaries

The most common neighborhood boundary schemes on the EH Data Portal are United Hospital Fund neighborhoods, Community Districts, and Public Use Microdata Areas.

<div class="my-2 ml-3">

**United Hospital Fund neighborhoods**

United Hospital Fund neighborhoods (UHFs) are a neighborhood scheme created by the Health Department, the United Hospital Fund, and other city agencies in the 1980s. They were designed for health research, and to be roughly similar to NYC’s Community Districts. There are two versions of this scheme: UHF42 (with 42 neighborhoods), and UHF34, with 34 neighborhoods (where several neighborhoods from UHF42 are combined into one). But since there are 59 community districts, UHF42 isn’t that close to CDs.</p>

**Community districts**

There are 59 Community Districts (CDs) in NYC, each overseen by a Community Board that advises on land use, zoning, city budgets, and more. As a political boundary, CDs are useful geographic units for breaking down city operations. Learn more about Community Boards.

**Public Use Microdata Areas**

There are 55 PUMAs in NYC. PUMAs have similar boundaries to Community Districts, but there are four PUMAs that are made up of two CDs combined into one PUMA. Because they are so similar, PUMAS and CDs can be used as a proxy for each other. PUMAs are also called “Subboro.”

</div>

</div>
<div class="wide">
    <div class="row no-gutters border-top border-bottom py-2">
        <div class="col-6">
        <div aria-hidden="true">
        <input type="radio" name="mainRadioGroup" value="cd" id="ucd" checked> <label for="ucd">Community Districts</label> &nbsp;&nbsp;
        <input type="radio" name="mainRadioGroup" value="puma" id="upuma"/> <label for="upuma">PUMAs</label> &nbsp;&nbsp;
        <!--<input type="radio" name="mainRadioGroup" value="nta" id="unta"><label for="unta">NTAs</label>-->
        <!-- create map div -->
        <div id = 'map1' style = "width:100%; height: 450px"></div>
            <script>
                var repo_branch = "{{< param data_repo >}}{{< param data_branch >}}"
                var path = "data-stories/geographies" // hard-coded for now, but could Hugo paramaterize
                var trans = "mapspec-en"
                let cd_spec   = repo_branch + "/" + path + "/" + trans + "/" + "mapcd.vl.json";
                let puma_spec = repo_branch + "/" + path + "/" + trans + "/" + "mappuma.vl.json";
                let nta_spec  = repo_branch + "/" + path + "/" + trans + "/" + "mapnta.vl.json";
                let cd_csv   = repo_branch + "/" + path + "/" + "CD_DATA.csv"
                let puma_csv = repo_branch + "/" + path + "/" + "PUMA_DATA.csv"
                let nta_csv  = repo_branch + "/" + path + "/" + "NTA_DATA.csv"
                let cd_topo   = repo_branch + "/" + "geography" + "/" + "CD.topo.json"
                let puma_topo = repo_branch + "/" + "geography" + "/" + "PUMA_or_Subborough.topo.json"
                let nta_topo  = repo_branch + "/" + "geography" + "/" + "NTA_2010.topo.json"
                // this code listens to the form with map chooser; must run after DOM loads
                window.onload = main_radio_listener;
                // listener for radio buttons
                function main_radio_listener() {
                    radios = document.querySelectorAll('input[type=radio][name="mainRadioGroup"]');
                    radios.forEach(radio => radio.addEventListener('change', () => {
                        if (radio.value === 'cd') {
                            buildMap("#map1", cd_spec, cd_csv, cd_topo);
                        }
                        else if (radio.value === 'nta') {
                            buildMap("#map1", nta_spec, nta_csv, nta_topo);
                        }
                        else {
                            buildMap("#map1", puma_spec, puma_csv, puma_topo);
                        };
                    }));
                };
                // function for building the map
                function buildMap(div, spec, csv, topo) {
                    d3.json(spec).then(spec => {
                        spec.layer[0].data.url = topo;
                        spec.layer[1].data.url = topo;
                        d3.csv(csv, d3.autoType).then(csv => {
                            vegaEmbed(div, spec).then((res) => {
                                resview = res.view.insert("csv", csv).run();
                            });
                        });
                    });
                };
                // initialize the map
                buildMap("#map1", cd_spec, cd_csv, cd_topo);
            </script>
        </div>
        </div>
<div class="sr-only">
<p>While these geographies have similar boundaries between neighborhood areas, they are not identical. For example, areas in Mott Haven/Port Morris, Melrose South/Mott Haven-North, Longwood, and Hunts Point are all in separate Neighborhood Tabulation Areas. But in Community Districts, Mott Haven/Melrose is one Community District, and Hunts Point/Longwood is another. And in PUMAs, Mott Haven and Hunts point are both in one PUMA. These divisions don't nest neatly within one another - familiar neighborhoods can be broken up or aggregated into smaller and larger geographic schemes.</p>
</div>
        <div class="col-6 border-left pl-2">
<div aria-hidden="true">
<input type="radio" name="uhfRadioGroup" value="42" id="42" checked> <label for="42">UHF42</label> &nbsp;&nbsp;
<input type="radio" name="uhfRadioGroup" value="34" id="34"/> <label for="34">UHF34</label> &nbsp;&nbsp;
<!--<input type="radio" name="uhfRadioGroup" value="zip" id="zip"><label for="zip">ZIP codes</label>-->

<!-- create map div -->
<div id = 'map2' style = "width:100%; height: 450px"></div>

<script>

    let uhf42_spec = repo_branch + "/" + path + "/" + trans + "/" + "map42.vl.json";
    let uhf34_spec = repo_branch + "/" + path + "/" + trans + "/" + "map34.vl.json";
    let zip_spec   = repo_branch + "/" + path + "/" + trans + "/" + "mapmodzcta.vl.json";

    let uhf42_csv = repo_branch + "/" + path + "/" + "42_DATA.csv"
    let uhf34_csv = repo_branch + "/" + path + "/" + "34_DATA.csv"
    let zip_csv   = repo_branch + "/" + path + "/" + "MODZCTA_DATA.csv"

    let uhf42_topo = repo_branch + "/" + "geography" + "/" + "UHF42.topo.json"
    let uhf34_topo = repo_branch + "/" + "geography" + "/" + "UHF34.topo.json"
    let zip_topo   = repo_branch + "/" + "geography" + "/" + "MODZCTA.topo.json"

    // listener for radio buttons

    function uhf_radio_listener() {

        buttons = document.querySelectorAll('input[type=radio][name="uhfRadioGroup"]');
        buttons.forEach(button => button.addEventListener('change', () => {

            if (button.value === '42') {
                buildMap("#map2", uhf42_spec, uhf42_csv, uhf42_topo);
            }
            else if (button.value === '34') {
                buildMap("#map2", uhf34_spec, uhf34_csv, uhf34_topo);
            }
            else {
                buildMap("#map2", zip_spec, zip_csv, zip_topo);
            };
        }));
    };

    uhf_radio_listener();

    // initialize map

    buildMap("#map2", uhf42_spec, uhf42_csv, uhf42_topo);

</script>
</div>
        </div>
    </div>
</div>
<div class="sr-only">
<p>Continuing from the previous example, United Hospital Fund neighborhoods have similar boundaries, but they are not identical. Most UH42s break UH34s into smaller geographies; note how the South Bronx UH34 combines three UH42 neighborhoods (Highbridge - Morrisania, Crotona - Tremont and Hunts Point - Mott Haven).</p>
</div>

<div class="narrow">

### Nesting: how neighborhood schemes have different root units

These neighborhood schemes have different building blocks. Let’s explore these.

##### United Hospital Fund neighborhoods

<div class="ml-3 mb-1">
United Hospital Fund neighborhoods (UHFs) have boundaries based on ZIP codes. This geography was created by the Health Department, the United Hospital Fund, and other city agencies in the 1980s. They were designed for health research, and to be similar to NYC’s Community Districts.

Health data - like somebody’s hospitalization record, for example, or a response to a survey - often includes a person’s ZIP code. It’s the most readily available piece of geographic information in administrative data. It’s also the neighborhood designation that most people know and can provide when responding to a survey.

To protect privacy, we often bundle (or aggregate) data from a larger area, so we need a scheme of neighborhoods that are made up of a collection of ZIP codes: UHFs. Collecting data by ZIP code and then "rolling up" into UHF neighborhoods has been used in health research for decades. The methods for our surveys (like the Community Health Survey) are designed to include enough people from each UHF neighborhood so that there’s a “representative sample” of all New Yorkers, and so that we can compare neighborhoods with high statistical confidence. Usually, we use UHF42 neighborhoods, which breaks the city down into 42 neighborhoods. Sometimes, though, we use UHF34 neighborhoods—by grouping together some of the neighborhoods, we can increase the statistical power of a survey.

In the map below, notice how three UHF42 neighborhoods in the South Bronx are combined into one UHF34 neighborhood—and how the UHF neighborhoods have ZIP codes (or, more precisely, ZIP code tabulation areas) as their root unit.

</div>

</div>
<div class="narrow border-top border-bottom py-2">
<div aria-hidden="true">
<input type="radio" name="uhfRadioGroup2" value="42" id="2-42" checked> <label for="2-42">UHF42</label> &nbsp;&nbsp;
<input type="radio" name="uhfRadioGroup2" value="34" id="2-34"/> <label for="2-34">UHF34</label> &nbsp;&nbsp;
<input type="radio" name="uhfRadioGroup2" value="zip" id="2-zip"><label for="2-zip">ZIP codes</label>

<!-- create map div -->
<div id = 'map3' style = "width:100%; height: 450px"></div>

<script>
    // listener for radio buttons

    function uhf_radio_listener() {

        buttons = document.querySelectorAll('input[type=radio][name="uhfRadioGroup2"]');
        buttons.forEach(button => button.addEventListener('change', () => {

            if (button.value === '42') {
                buildMap("#map3", uhf42_spec, uhf42_csv, uhf42_topo);
            }
            else if (button.value === '34') {
                buildMap("#map3", uhf34_spec, uhf34_csv, uhf34_topo);
            }
            else {
                buildMap("#map3", zip_spec, zip_csv, zip_topo);
            };
        }));
    };

    uhf_radio_listener();

    // initialize map

    buildMap("#map3", uhf42_spec, uhf42_csv, uhf42_topo);

</script>
</div>
</div>
<div class="narrow mt-2">

<!--start wide-->
<!-- nesting diagram.
<div class="wide my-4 chart-wrapper-ds" aria-hidden="true">
        <h4 class="text-center mb-3">Nesting: how neighborhood schemes have different root units</h4>
        <div class="row" style="font-size: 14px;">
            <div class="col-lg-4 col-sm-8 mx-auto mb-2">
                <p><span style="font-weight: bold; color: #22669e;">Community Districts</span> and <span style="font-weight: bold; color: #474747;">PUMAs</span> have similar boundaries.</p>
                <div style="width: 100%; height: 275px; background-color: #d0dce8; border-radius: 10px; border: 1px solid grey;"></div>
                <div style="height: 275px; border: 3px solid grey; margin-left: -15px; margin-top: -260px; width: 100%; border-radius: 10px;">
                <p class="text-center">PUMA</p></div>
            </div>
            <div class="col-lg-4 col-sm-8 mx-auto mb-2">
                <p><span style="font-weight: bold; color: #474747;">PUMAs</span> are made up of NTAs, which are made up of census tracts.</p>
                <div style="width: 100%; height: 275px; border: 3px solid grey; border-radius: 10px;">
                <div id="ntaparent" style="width:50%; height:100%; float:right; border-radius: 5px;">
                <div style="width: 100%; height: 50%; border-radius: 5px;"></div>
                <div style="width: 100%; height: 50%; border-radius: 5px; background-color: #deb6e6;"><p class="text-center">NTA</p>
                    <div id="ctparent" style="width:50%; height:100%; float:right">
                        <div style="width: 100%; height: 22%;"></div>
                        <div style="width: 100%; height: 50%; border-radius: 5px; background-color: #f9f9f9;"><p class="text-center" style="font-size: 12px;">Census<br>tract</p></div>
                        </div>
                        <div id="emptyct" style="width:50%; height:100%;"></div>
                </div>
                </div>
                <div id="emptyparent" style="width:50%; height:100%; border-radius: 5px;">
                </div>
                </div>
            </div>
            <div class="col-lg-4 col-sm-8 mx-auto mb-2">
                <p><span style="font-weight: bold; color: #104e34;">UHFs</span> are made up of ZIP codes tabulation areas (ZCTAs).</p>
                <div style="width: 100%; height: 275px; background-color: #b4ccc2; border-radius: 10px; border: 1px solid grey;">
                    <div id="uhfparent" style="width:50%; height:100%; float:right">
                        <div style="width: 100%; height: 50%;"></div>
                        <div style="width: 100%; height: 50%; border-radius: 5px; background-color: #e7edf3;"><p class="text-center">ZIP code<br>(or ZCTA)</p></div>
                        </div>
                        <div id="uhfparent" style="width:50%; height:100%;"></div>
                </div>
            </div>
        </div>
    </div>
<!--end wide-->

##### Public Use Microdata Areas

<div class="ml-3 mb-1">
Public Use Microdata Areas (PUMAs) have boundaries defined by the US Census. They are made up of groups of census tracts.

There are 55 PUMAs in NYC. PUMAs have similar boundaries to Community Districts, which means that often, one can be used as a proxy for the other. In the map below, notice how Brooklyn CD 1, in Greenpoint/Williamsburg, is almost identical to the PUMA.

There are four PUMAs that are made up of two CDs combined into one. Notice how two CDs in the South Bronx combine to form one PUMA.

Each PUMA breaks down into Neighborhood Tabulation Areas (NTAs), and each NTA breaks down even further into census tracts.

</div>

##### Community districts

<div class="ml-3 mb-2">
There are 59 Community Districts (CDs) in NYC, each overseen by a Community Board that advises on land use, zoning, city budgets, and more. As a political boundary, CDs are useful geographic units for breaking down city operations. <a href="https://www1.nyc.gov/site/cau/community-boards/about-commmunity-boards.page">Learn more about Community Boards.</a>
</div>

#### Boundary updates in 2020

In 2020, the US Census updated the boundaries of census tracts – which means that schemes based on census tracts (NTAs, PUMAS, and CDTAs) also changed. These changes reflect population and housing changes and were made to more accurately represent the communities that live there. Our recent data generally uses the updated 2020 maps, but you may find older data on our website that uses 2010 map versions. The map changes are generally subtle, but they may affect trends in data for certain neighborhoods.

### What do you do when you're looking for data for one type of neighborhood, but the data is only available at a different scheme?

It can be difficult to work with several datasets when the data are for different types of neighborhoods. For example, it can be a challenge to look up health data for a Community Board or a City Council District when those data are only available at UHF42.

<a href="https://boundaries.beta.nyc/?">Beta NYC has a tool called Boundaries, which allows you to compare how NYC is divided into different districts.</a> This tool may help you decide which neighborhood area to choose when presenting data in research papers or at board meetings.

</div>

<div class="wide my-4">

<iframe src="https://boundaries.beta.nyc/" style="border:none; height: 75vh; width:100%" title="Boundaries.beta"></iframe>

</div>

<div class="narrow">

Using this tool, you can find that sometimes, neighborhoods in different “schemes” overlap pretty well—meaning that data for one “scheme” can be used in another scheme. But more often, different neighborhood schemes have boundaries that conflict and don’t conveniently overlap each other. When this happens, you can use the Boundaries tool to:

- Look up the overlap between your desired area and the available neighborhood scheme.
- Get values and see how much overlap there is. For example, if you are looking up a certain Community District, but it’s only available at a larger neighborhood scheme like UHF42, maybe 70% of the CD is in one UHF42, and only 30% is in another. This can help you use the UHF42 data to estimate values for your CD.

You can also use our new Neighborhood Overlap tool, where you can search by Community District or City Council District, and see what UHF42 neighborhoods overlap it.

### What about when data is available at multiple geographies? How do you choose?

Here are some common scenarios that might help you think about which neighborhood scheme to choose for your needs.

- If you're presenting at a Community Board meeting, you'll likely want to use Community Districts or CDTAs.

- If you're using ZIP code level data, you might need to aggregate up to UHF neighborhoods.

- If you're conducting a research study with Census data, PUMAs or NTAs might be best.

Neighborhood boundaries may sometimes be imperfect representations of New York City’s communities. But even when data are only available at an inconvenient neighborhood scheme, they reveal important insights about health, housing, and the environment—showing differences by neighborhood, allowing us to explore why, and providing meaningful perspectives about inequities and opportunities across New York City.

</div>

<style>
.table--bordered {
  border-top: 2px solid black;
  padding: 0.5em;
}
tr {border-bottom: 1px dashed black;
}
</style>

<div class="wide my-4">
    <div class="card card-left-border shadow-sm mt-2 mb-4 my-4 fs-sm">
        <div class="card-body">
            <h5 class="card-title">Appendix: common uses for each scheme</h5>
<table class="table--bordered">

| Boundaries  | Based on              | Number in NYC | Common use                                                                              |
| ----------- | --------------------- | ------------- | --------------------------------------------------------------------------------------- |
| UHF42       | ZIP codes             | 42            | Health surveillance and public health reporting <br>(like the Community Health Survey)  |
| UHF34       | ZIP codes             | 34            | More statistical power for public health reporting                                      |
| CD          | Political boundaries  | 59            | Local governance through Community Boards                                               |
| CDTA        | Census tracts         | 59            | Approximating CDs, for census-compatible <br>statistical analysis                       |
| PUMA        | Census tracts         | 55            | Research, <br>using statistically meaningful areas of ~100,000 people                   |
| NTA         | Census tracts         | 195           | Neighborhood identity, fine-grained data                                                |

</table>
</div>
</div>

<div class="wide my-4">
<div class="card card-left-border shadow-sm mt-2 mb-4 my-4 fs-sm">
  <div class="card-body">
    <h5 class="card-title">
Matching datasets: a brief overview of GEOIDs
    </h5>
      <p class="card-text">
A GeoID (Geographic Identifier) is a unique code used to label a specific area on a map—like a neighborhood, ZIP code, or census tract—so that data about that area can be organized, matched, and analyzed.
      A GeoID is like a “name tag” for places. Every area, from a small city block to an entire borough, can have a code that identifies it in a dataset.

<table class="table--bordered">

| Boundary scheme  | GeoID Example  | Format        | Determined by                |
| ---------------- | -------------- | ------------- | ---------------------------- |
| State            | 36             | Numeric       | Census FIPS code for NY      |
| County           | 36061          | Numeric       | State + County               |
| Census Tract     | 36061000100    | Numeric       | 11-digit Census tract        |
| Block Group      | 360610001001   | Numeric       | 12-digit Census block group  |
| NTA              | MN0302         | Alphanumeric  | NYC Planning-defined         |
| PUMA             | 03714          | Numeric       | Census-defined               |
| UHF42/UHF34      | 303            | Numeric       | DOHMH-defined                |
| CD               | 203            | Numeric       | BoroCD (Borough + District)  |
| ZCTA (ZIP)       | 10454          | Numeric       | Census ZIP approximation     |

</table>
</div>
</div>

<div class="narrow">

<br>A GeoID (Geographic Identifier) is a unique code used to label a specific area on a map, like a ZIP code or census tract, so that data about that area can be organized, matched, and analyzed.

<p>A GeoID is like a “name tag” for places. Every area, from a small city block to an entire borough, can have a code that identifies it in a dataset. These codes help different datasets talk to each other by matching information. Census GeoIDs are numeric and follow a strict nesting structure – as shown in the previous table. <a href="https://data.cityofnewyork.us/City-Government/2020-Census-Tracts-to-2020-NTAs-and-CDTAs-Equivale/hm78-6dwm/data_preview">Visit NYC OpenData for the full crosswalk of 2020 Census Tracts, to 2020 NTAs, to 2020 CDTAs.</a> If you’d like to see how ZIP Codes (or ZCTA) form UHFs, <a href="https://github.com/nychealth/EHDP-data/blob/production/geography/zcta_to_uhf.csv">visit the geographies folder in our data repository.</a></p>

  </div>
</div>

<!-- text if we don't like the card ### Matching datasets: a brief overview of GEOIDs

A GeoID (Geographic Identifier) is a unique code used to label a specific area on a map -- like a neighborhood, ZIP code, or census tract -- so that data about that area can be organized, matched, and analyzed.

A GeoID is like a “name tag” for places. Every area, from a small city block to an entire borough, can have a code that identifies it in a dataset.

| Boundary scheme  | GeoID Example  | Format        | Determined by                |
| ---------------- | -------------- | ------------- | ---------------------------- |
| State            | 36             | Numeric       | Census FIPS code for NY      |
| County           | 36061          | Numeric       | State + County               |
| Census Tract     | 36061000100    | Numeric       | 11-digit Census tract        |
| Block Group      | 360610001001   | Numeric       | 12-digit Census block group  |
| NTA              | MN0302         | Alphanumeric  | NYC Planning-defined         |
| PUMA             | 03714          | Numeric       | Census-defined               |
| UHF42/UHF34      | 303            | Numeric       | DOHMH-defined                |
| CD               | 203            | Numeric       | BoroCD (Borough + District)  |
| ZCTA (ZIP)       | 10454          | Numeric       | Census ZIP approximation     |


</div>
<div class="narrow">

A GeoID (Geographic Identifier) is a unique code used to label a specific area on a map, like a ZIP code or census tract, so that data about that area can be organized, matched, and analyzed.

A GeoID is like a “name tag” for places. Every area, from a small city block to an entire borough, can have a code that identifies it in a dataset. These codes help different datasets talk to each other by matching information. Census GeoIDs are numeric and follow a strict nesting structure – as shown in the previous table. <a href="https://data.cityofnewyork.us/City-Government/2020-Census-Tracts-to-2020-NTAs-and-CDTAs-Equivale/hm78-6dwm/data_preview">Visit NYC OpenData for the full crosswalk of 2020 Census Tracts, to 2020 NTAs, to 2020 CDTAs.</a> If you’d like to see how ZIP Codes (or ZCTA) form UHFs, <a href="https://github.com/nychealth/EHDP-data/blob/production/geography/zcta_to_uhf.csv">visit the geographies folder in our data repository.</a>
