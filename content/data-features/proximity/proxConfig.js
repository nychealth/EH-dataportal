console.log('Config ingested')

var config = [
    {
        "id": "accessibleStations",
        "text": `First, we got a list of <a href='https://catalog.data.gov/dataset/mta-subway-stations'>all subway stations from the Metropolitan Transportation Authority (MTA)</a>. We filtered the list of subway stations to only ones accessible, i.e. having an elevator, ramp, or are at ground level. We considered a station accessible if at least one direction of travel complies with ADA guidelines, so a few stations on this map are only accessible for trains heading one way.</p><p>This map includes 127 subway stations out of 496 - that's <strong>about 25% of subway stations</strong> (as of September, 2025). `,
        "geoFile": `geojson/ADA_subway_stations.geojson`,
        "choropleth": false,
        "labelName": "Stop Name",
        "valueField": "",
        "geonameField": "Stop Name",
        "zoom": false,
        "pin": false
    },
    {
        "id": "isochrones",
        "text": `Next, we needed to figure out an area around each station that's within walking distance. We defined “walking distance” as being a half mile (or 800 meters). This is about a 10- to 15-minute walk for many people.  </p><p>We used <strong>Dijkstra's algorithm</strong> to calculate walkable areas. Dijkstra's algorithm is a common method for finding the shortest path between points on a network, such as streets in a city. It works by exploring all possible paths from a starting point and selecting the shortest one to reach each destination. For our purposes, we used a walking network, which excludes terrain like highways and rivers.  </p><p>For each station, this gives us every street corner you can reach within a half-mile walk. We then wrap the smallest possible shape around all of those reachable corners - a shape called a <strong>convex hull</strong> - to represent the station's walkable area. Because this shape smooths over gaps that have no walkway - like a park or rail yard - it can slightly overestimate the true walking range. Each green shape is this approximate area within a 10- to 15-minute walk from an accessible subway station.`,
        "geoFile": `geojson/800m_isochrones_ADA_subway.geojson`,
        "choropleth": false,
        "labelName": "",
        "valueField": "",
        "geonameField": "",
        "zoom": false,
        "pin": false
    },
    {
        "id": "combinedAreas",
        "text": `Obviously, these overlap. So,  we combined all the overlapping walkable areas into one area.</p><p>Now, we can   see the parts of the city that are within a half mile of an accessible subway station. And, of course, the people who live inside these green shapes live within walking distance of an accessible subway station.`,
        "geoFile": `geojson/isochrones_union_ADA.geojson`,
        "choropleth": false,
        "labelName": "",
        "valueField": "",
        "geonameField": "",
        "zoom": false,
        "pin": false
    },
    {
        "id": "areaBG",
        "text": `So, how many people live in these areas? To calculate this, we used Census data. First we overlaid Census block groups on top of our walkable areas. Some of them are completely inside, but some of them are split by the walkable area. </p><p>For the block groups that are split, we used <a href="https://www.nyc.gov/content/planning/pages/resources/datasets/mappluto-pluto-change">NYC's PLUTO building file - a city dataset that lists every building</a> and its number of residential units - to estimate how many people live inside and outside the walkable area, based on the proportion of residential units are inside or outside the area.  </p><p>In this block group, <strong>32.07% of the housing units are inside the green area</strong> - so we estimate that 32.07% of the block group's population lives within walking distance of that subway station.  `,
        "geoFile": `geojson/bg_plus_isochrone_station_188.geojson`,
        "choropleth": true,
        "labelName": "Block Group",
        "valueField": "pct_pop_walk",
        "geonameField": "GEOID",
        "zoom" : true,
        "pin": true,
        "suppressTooltip": true
    },
    {
        "id": "tractZoom",
        "text": `Once we have the number of people in each block group who live inside the walkable area, we start adding things up. Block groups combine to form Census Tracts. With a simple calculation (the number of people inside the Tract's walkable area divided by the Tract's total population), we calculated the percent of each population in each Census Tract that lives within walking distance of an accessible station.`,
        "geoFile": `geojson/800m_CT_pct_walkable_ADA_subway.geojson`,
        "choropleth": true,
        "labelName": "Census tract",
        "valueField": "pct_pop_walk",
        "geonameField": "CT2020",
        "zoom": true,
        "pin": false
    },
    {
        "id": "NTAZoom",
        "text": `Every Neighborhood Tabulation Area (NTA) is made up of a group of Census Tracts. So, summing up tracts, we can find the percent of a NTA's population within walking distance of an accessible subway station.`,
        "geoFile": `geojson/800m_NTA2020_pct_walkable_ADA_subway.geojson`, 
        "choropleth": true,
        "labelName": "NTA",
        "valueField": "pct_pop_walk",
        "geonameField": "GEONAME",
        "zoom": true,
        "pin": false
    },
    {
        "id": "allNTAs",
        "text": `Zooming out again, we can see data for the whole city, by NTA. We can see that in some neighborhoods - like many in Manhattan, and some parts of Brooklyn and the Bronx - almost everybody lives within walking distance of an accessible subway station.</p><p>But in some neighborhoods - like some in Queens and Staten Island - nobody lives within walking distance of an accessible subway station.`,
        "geoFile": `geojson/800m_NTA2020_pct_walkable_ADA_subway.geojson`, 
        "choropleth": true,
        "labelName": "NTA",
        "valueField": "pct_pop_walk",
        "geonameField": "GEONAME",
        "zoom": false,
        "pin": false
    },
    {
        "id": "CDTA",
        "text": `NTAs then combine to form  Community District Tabulation Areas (CDTAs). CDTAs are a Census-compatible geography that is very similar to NYC's Community Districts. Here we see the percent of each CDTA's population within walking distance. `,
        "geoFile": `geojson/800m_CDTA2020_pct_walkable_ADA_subway.geojson`,
        "choropleth": true,
        "labelName": "Community District",
        "valueField": "pct_pop_walk",
        "geonameField": "GEONAME",
        "zoom": false,
        "pin": false
    },
    {
        "id": "UHF42",
        "text": `In NYC, health data are often calculated at a geography called UHF42. But unlike CDTAs and NTAs, the boundaries of UHF42 neighborhoods don't line up neatly with Census block groups. </p><p>So, to calculate the percentage of each UHF42 neighborhood's population that lives within walking distance of an accessible subway station, we applied the same PLUTO-based method directly to the building data. We identified which residential buildings fell inside the walkable areas and then compared those to all residential units within each UHF42 neighborhood.</p>  <p>This allowed us to estimate the percentage of the population for each UHF42 neighborhood living within walking distance of an accessible subway station.`,
        "geoFile": `geojson/800m_UHF42_pct_walkable_ADA_subway.geojson`,
        "choropleth": true,
        "labelName": "Neighborhood",
        "valueField": "pct_units_walk",
        "geonameField": "GEONAME",
        "zoom": false,
        "pin": false
    },
    {
        "id": "wrapUp",
        "text": `While we used this method to calculate the percent of population that lives within walking distance of an accessible subway stop - but it can be used for a wide variety of other data. This can help shed light on population-level proximity to things that can support or threaten health. `,
        "geoFile": `geojson/800m_isochrones_ADA_subway.geojson`,
        "choropleth": false,
        "labelName": "Station",
        "valueField": "",
        "geonameField": "Stop Name",
        "zoom": false,
        "pin": false
    }
    /*
    {
        "text": `This is a sample config element. Text is what appears in the text box.`,
        "choropleth": "Should be true or false; this determines whether to render the geojson as a choropleth",
        "labelName": "Determines how the geographies are labelled in the tooltip",
        "valueField": "The field in the geojson file that includes the values to display",
        "geonameField": "The field in the geojson that includes the geography name to display",
        "zoom": "Should be true or false; determines whether to zoom to an example area.",
        "pin": "True or false; determines whether to show the exampel pins."
    },
    */
]