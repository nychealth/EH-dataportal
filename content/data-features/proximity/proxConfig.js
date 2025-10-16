console.log('Config ingested')

var config = [
    {
        "text": `First, we mapped NYC's accessible subway stations. These are the station entrances that have elevators or other accessible features.`,
        "geoFile": `geojson/ADA_subway_stations.geojson`,
        "choropleth": false,
        "labelName": "Station",
        "valueField": "",
        "geonameField": "Stop Name",
        "example": ""
    },
    {
        "text": `<p>Next, we used Dijkstra's algorithm to calculate walkable areas based on a walking-network. This network considers obstacles like highways and rivers impassable for pedestrians. Each green shape represents the area that can be reached within a 10-15 minute walk (about a half mile or 800 meters) from an accessible subway station.</p> <p>Dijkstra's algorithm is a common method for finding the shortest path between points on a network, such as streets in a city. It works by exploring all possible paths from a starting point and selecting the shortest one to reach each destination.</p>`,
        "geoFile": `geojson/800m_isochrones_ADA_subway.geojson`,
        "choropleth": false,
        "labelName": "Station",
        "valueField": "",
        "geonameField": "station",
        "example": ""
    },
    {
        "text": `Then we combined all these walkable areas into one map, making it easier to see all citywide coverage. The population within these green shapes live within a half-mile of an ADA-compliant, accessible subway station. `,
        "geoFile": `geojson/isochrones_union_ADA.geojson`,
        "choropleth": false,
        "labelName": "",
        "valueField": "",
        "geonameField": "",
        "example": ""
    },
        // add in zoomed-in image instead of loading geojson file //
    {
        "text": `<p>Now that we understand where the walkable areas are, we need to calculate how many people live in them. To do this, we looked at the residential buildings in each Census block group (one way of <a href="../../data-stories/geographies/">drawing boundaries across NYC</a>) and estimated how many people live inside the walkable area. This let us calculate the number of people in each Census block group that lives within walking distance of an accessible station.</p> <p>We used NYC's PLUTO building file—a city dataset that lists every building and its number of residential units—to estimate how many people live inside the walkable area. For every Census block group, we compared the housing units located within the green walk zones to the total housing units in that block group. For example, if a quarter of the housing units in a block group fall inside the walk zone, we estimate that about a quarter of the block group population live within walking distance of an accessible station.</p>`,
        "geoFile": `geojson/800m_BG_pct_walkable_ADA_subway.geojson`,
        "choropleth": true,
        "labelName": "Block Group",
        "valueField": "pct_pop_walk",
        "geonameField": "GEOID",
        "example" : ""
    },
    {
        "text": `<p>It can be helpful to understand proximity indicators as applied to larger neighborhood boundary schemes too. Since block groups nest into Census tracts, we added them up and calculated the percent of each population in each Census Tract that lives within walking distance of an accessible station.`,
        "geoFile": `geojson/800m_CT_pct_walkable_ADA_subway.geojson`,
        "choropleth": true,
        "labelName": "Census tract",
        "valueField": "pct_pop_walk",
        "geonameField": "CT2020",
        "example": ""
    },
    {
        "text": `Census tracts combine to make Neighborhood Tabulation Areas (NTAs). Summing up tracts, we find the percent of each NTA's population within walking distance.`,
        "geoFile": `geojson/800m_NTA2020_pct_walkable_ADA_subway.geojson`, 
        "choropleth": true,
        "labelName": "NTA",
        "valueField": "pct_pop_walk",
        "geonameField": "GEONAME",
        "example": ""
    },
    {
        "text": `NTAs then roll up into Community District Tabulation Areas (CDTAs). Here we see the percent of each CDTA's population within walking distance.`,
        "geoFile": `geojson/800m_CDTA2020_pct_walkable_ADA_subway.geojson`,
        "choropleth": true,
        "labelName": "Community District",
        "valueField": "pct_pop_walk",
        "geonameField": "GEONAME",
        "example": ""
    },
    {
        "text": `<p>We also calculated these data for UHF42 neighborhoods. Because the boundaries of UHF42 neighborhoods don't line up neatly with Census block groups, we applied the same PLUTO-based method directly to the building data. We identified which residential buildings fell inside the walkable areas and then compared those to all residential units within each UHF42 neighborhood.</p> <p>This allowed us to estimate the percentage of the population for each UHF42 neighborhood living within walking distance of an accessible subway station.`,
        "geoFile": `geojson/800m_UHF42_pct_walkable_ADA_subway.geojson`,
        "choropleth": true,
        "labelName": "Neighborhood",
        "valueField": "pct_units_walk",
        "geonameField": "GEONAME",
        "example": ""
    }
]