console.log('Config ingested')

var config = [
    {
        "text": `First, we mapped the accessible subway stations. These are the station entrances that have elevators or other accessible features.`,
        "geoFile": `geojson/ADA_subway_stations.geojson`,
        "choropleth": false,
        "valueField": "",
        "geonameField": "Stop Name"
    },
    {
        "text": `Next, we showed the range of a 10-15 minute walk from each station. Using the walking network and Dijkstra's algorithm, we marked all areas within about 800 meters.`,
        "geoFile": `geojson/800m_isochrones_ADA_subway.geojson`,
        "choropleth": false,
        "valueField": "",
        "geonameField": "station"
    },
    {
        "text": `Then we combined all those walk areas into one map. This way, the whole citywide coverage is easier to see at once. Everybody who lives in these green areas lives within a half-mile of an ADA-compliant, accessible subway station.`,
        "geoFile": `geojson/isochrones_union_ADA.geojson`,
        "choropleth": false,
        "valueField": "",
        "geonameField": ""
    },
    /*
    {
        "text": `We then added people. For each Census block group, we looked at residential buildings and estimated how many people live inside the walkable area. This gives the percent of each block group population that is within walking distance of an accessible station.`,
        "geoFile": `geojson/800m_BG_pct_walkable_ADA_subway.geojson`,
        "choropleth": true,
        "valueField": "total"
    },
    */
    {
        "text": `We then added people. For each Census block group, we looked at residential buildings and estimated how many people live inside the walkable area. This let us calculate the number of people in each Census block group that lives within walking distance of an accessible station.</p>
        <p>Since block groups nest into Census tracts, we added them up and calculated the percent of each population in each Census Tract that lives within walking distance of an accessible station.`,
        "geoFile": `geojson/800m_CT_pct_walkable_ADA_subway.geojson`,
        "choropleth": true,
        "valueField": "pop_within_walk",
        "geonameField": "CT2020"
    },
    {
        "text": `Census tracts combine to make Neighborhood Tabulation Areas (NTAs). Summing up tracts, we find the percent of each NTA's population within walking distance.`,
        "geoFile": `geojson/800m_NTA2020_pct_walkable_ADA_subway.geojson`, 
        "choropleth": true,
        "valueField": "pop_within_walk",
        "geonameField": "GEONAME"
    },
    {
        "text": `NTAs then roll up into Community District Tabulation Areas (CDTAs). Here we see the percent of each CDTA's population within walking distance.`,
        "geoFile": `geojson/800m_CDTA2020_pct_walkable_ADA_subway.geojson`,
        "choropleth": true,
        "valueField": "pop_within_walk",
        "geonameField": "GEONAME"
    },
    {
        "text": `We also calculated these data for UHF42 neighborhoods. But the boundaries of UHF42 neighborhoods don't line up cleanly with Census block groups. So we split block group populations across UHF42 areas based on where residential buildings fall. This way, we can estimate the percent of each UHF42 population within walking distance of an accessible subway station.`,
        "geoFile": `geojson/800m_UHF42_pct_walkable_ADA_subway.geojson`,
        "choropleth": true,
        "valueField": "pct_walk_accessible",
        "geonameField": "GEONAME"
    }
]