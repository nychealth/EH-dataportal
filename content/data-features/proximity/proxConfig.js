console.log('Config ingested')

var config = [
    {
        "text": `First, we mapped NYC's accessible subway stations. These are the station entrances that have elevators or other accessible features.`,
        "geoFile": `geojson/ADA_subway_stations.geojson`,
        "choropleth": false,
        "labelName": "Station",
        "valueField": "",
        "geonameField": "Stop Name"
    },
    {
        "text": `Next, we showed the range of a 10-15 minute walk from each station (roughly half a mile or 800 meters).`,
        "geoFile": `geojson/800m_isochrones_ADA_subway.geojson`,
        "choropleth": false,
        "labelName": "Station",
        "valueField": "",
        "geonameField": "station"
    },
    {
        "text": `Then we combined all these walkable areas into one map, making it easier to see all citywide coverage. The population within these green shapes live within a half-mile of an ADA-compliant, accessible subway station. `,
        "geoFile": `geojson/isochrones_union_ADA.geojson`,
        "choropleth": false,
        "labelName": "",
        "valueField": "",
        "geonameField": ""
    },
        // add in zoomed-in image instead of loading geojson file //
    {
        "text": `Now that we understand where the walkable areas are, we need to calculate how many people live in them. To do this, we looked at the residential buildings in each Census block group (one way of <a href="../../data-stories/geographies/">drawing boundaries across NYC</a>) and estimated how many people live inside the walkable area. This let us calculate the number of people in each Census block group that lives within walking distance of an accessible station.</p>`,
        "geoFile": `geojson/800m_BG_pct_walkable_ADA_subway.geojson`,
        "choropleth": true,
        "valueField": "pct_pop_walk"
    },
    {
        "text": `<p>It can be helpful to understand proximity indicators as applied to larger neighborhood boundary schemes too. Since block groups nest into Census tracts, we added them up and calculated the percent of each population in each Census Tract that lives within walking distance of an accessible station.`,
        "geoFile": `geojson/800m_CT_pct_walkable_ADA_subway.geojson`,
        "choropleth": true,
        "labelName": "Census tract",
        "valueField": "pct_pop_walk",
        "geonameField": "CT2020"
    },
    {
        "text": `Census tracts combine to make Neighborhood Tabulation Areas (NTAs). Summing up tracts, we find the percent of each NTA's population within walking distance.`,
        "geoFile": `geojson/800m_NTA2020_pct_walkable_ADA_subway.geojson`, 
        "choropleth": true,
        "labelName": "NTA",
        "valueField": "pct_pop_walk",
        "geonameField": "GEONAME"
    },
    {
        "text": `NTAs then roll up into Community District Tabulation Areas (CDTAs). Here we see the percent of each CDTA's population within walking distance.`,
        "geoFile": `geojson/800m_CDTA2020_pct_walkable_ADA_subway.geojson`,
        "choropleth": true,
        "labelName": "Community District",
        "valueField": "pct_pop_walk",
        "geonameField": "GEONAME"
    },
    {
        "text": `We also calculated these data for UHF42 neighborhoods. But the boundaries of UHF42 neighborhoods don't line up cleanly with Census block groups. Instead of using block groups, we determined if the PLUTO residential building units were inside the walkable area. Then we found the total residential units in each UHF area. This allowed us to deduce the percent of each UHF population within walking distance of an accessible subway station.`,
        "geoFile": `geojson/800m_UHF42_pct_walkable_ADA_subway.geojson`,
        "choropleth": true,
        "labelName": "Neighborhood",
        "valueField": "pct_units_walk",
        "geonameField": "GEONAME"
    }
]