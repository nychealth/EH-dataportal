console.log('Config ingested')

var config = [
    {
        "text": `First, we identified the points we needed. These points are ADA-compliant subway stops.`,
        "geoFile": `geojson/ADA_subway_stations.geojson`,
    },
    {
        "text": `Next, we calculated the area around each point that constitutes walking distance. We used Dijkstra's algorithm and assumed a walking distance of [800] meters.`,
        "geoFile": `geojson/800m_isochrones_ADA_subway.geojson`,
    },
    {
        "text": `After that, we combined all the walkable areas into one map file for simplicity and readability purposes.`,
        "geoFile": `geojson/isochrones_union_ADA.geojson`,
    },
    {
        "text": `We then found the population by looking at every residential-unit-lot in each Census block group. By examining the number of people in each block group that live within the walkable area (previous map), we found the percent of people in each block group within walking distance of an Accessible Subway Station.`,
        "geoFile": `geojson/800m_BG_pct_walkable_ADA_subway.geojson`,
    },
    {
        "text": `Since Census block groups form Census Tracts, we were able to aggregate the data into Census Tracts (a larger geography scheme). Now we know the percent of each Census Tract population within walking distance of an Accessible Subway Station.`,
        "geoFile": `geojson/800m_CT_pct_walkable_ADA_subway.geojson`,
    },
    {
        "text": `Similar to how Block Groups form Census Tracts, Census Tracts form Neighborhood Tabulation Areas (NTAs). We once again aggregated the data from Census Tracts to NTAs. Now we know the percent of each NTA population within walking distance of an Accessible Subway Station.`,
        "geoFile": `geojson/800m_NTA2020_pct_walkable_ADA_subway.geojson`, 
    },
    {
        "text": `Continuing this nesting structure, NTAs form Community District Tabulation Areas (CDTAs). Now we know the percent of each CDTA population within walking distance of an Accessible Subway Station.`,
        "geoFile": `800m_CDTA2020_pct_walkable_ADA_subway.geojson`,
    },
    {
        "text": `Finally, we found the percent of each UHF42 population within walking distance of an accesible subway station. This process wasn't as simple because Census block groups do not neatly fit in the UHF42 boundary scheme. For that reason, we essentially created a venn diagram for which the population can only be considered if it is 1. in the walkable area 2. in the UHF42 area, and 3. within the block group we're referecing. ((Fix phrasing))`,
        "geoFile": `800m_UHF42_pct_walkable_ADA_subway.geojson`,
    }
]