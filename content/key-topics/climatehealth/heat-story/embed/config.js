config = {
    "initialMapState":{
       "lat":40.763862,
       "lng":-74.05,
       "zoom":12,
       "layers":[
          "njNycHiAfternoon"
       ]
    },
    "layers":[
       {
          "property":{
             "id":"njNycHiMorning",
             "name":"Morning Heat Index",
             "type":"raster",
             "url":"https://raw.githubusercontent.com/OpenStoryMap/geodata/main/nyc-heat-watch-2021/nj-nyc-hi-morning.tiff"
          }
       },
       {
          "property":{
             "id":"njNycHiAfternoon",
             "name":"Afternoon Heat Index",
             "type":"raster",
             "url":"https://raw.githubusercontent.com/OpenStoryMap/geodata/main/nyc-heat-watch-2021/nj-nyc-hi-afternoon.tiff"
          }
       },
       {
          "property":{
             "id":"njNycHiEvening",
             "name":"Evening Heat Index",
             "type":"raster",
             "url":"https://raw.githubusercontent.com/OpenStoryMap/geodata/main/nyc-heat-watch-2021/nj-nyc-hi-evening.tiff"
          }
       },
       {
          "property":{
             "id":"heatAndDemographics",
             "name":"Heat and Demographics",
             "type":"geojson",
             "url":"https://raw.githubusercontent.com/OpenStoryMap/geodata/main/nyc-heat-watch-2021/heatAndDemographics.geojson",
             "args":{
                "colorFeatureProperty":"afternoonMaxHeatIndex",
                "minColor":"white",
                "maxColor":"red",
                "null":-9999,
                "fillColor":"black"
             },
             "displayProperties":{
                "displayPropertyArgs":[
                   {
                      "id":"TRACTCE",
                      "displayName":"Census Tract:"
                   },
                   {
                      "id":"blackPercentage",
                      "type":"percentage",
                      "displayName":"Black Population:"
                   },
                   {
                      "id":"medianHouseholdIncome",
                      "type":"currency",
                      "displayName":"Median Household Income:"
                   },
                   {
                      "id":"morningMaxHeatIndex",
                      "displayName":"Morning Max Heat Index:"
                   },
                   {
                      "id":"afternoonMaxHeatIndex",
                      "displayName":"Afternoon Max Heat Index:"
                   },
                   {
                      "id":"eveningMaxHeatIndex",
                      "displayName":"Evening Max Heat Index:"
                   }
                ]
             }
          }
       },
       {
          "property":{
             "id":"redline",
             "name":"Redlined Areas",
             "type":"geojson",
             "url":"https://raw.githubusercontent.com/OpenStoryMap/geodata/main/nyc-heat-watch-2021/overlappedRedline.geojson",
             "args":{
                "colorFeatureProperty":"grade",
                "minColor":"darkred",
                "maxColor":"indianred",
                "color": "maroon",
                "opacity": 0.7
             },
             "displayProperties":{
                "displayPropertyArgs":[
                   {
                      "id":"holc_grade",
                      "displayName":"Redline Grade:"
                   }
                ]
             }
          }
       },
       {    
         "property": {
           "id": "greenspaceNdvi",
           "name": "Greenspace NDVI",
           "type": "raster",
           "url":"https://raw.githubusercontent.com/OpenStoryMap/geodata/main/nyc-heat-watch-2021/greenspacesNdvi.tiff",
           "args": {
               "colorStart": "black",
               "colorStop": "lightgreen",
               "resolution": 256
           }
         }
       },
       {
          "property":{
             "id":"greenspace",
             "name": "Greenspace",
             "type": "geojson",
             "url": "https://raw.githubusercontent.com/OpenStoryMap/geodata/main/nyc-heat-watch-2021/greenspacesNdvi.geojson",
             "args":{
                "color":"green",
                "fillOpacity": 0
             },
             "displayProperties":{
                "missingDisplay":"No name found",
                "displayPropertyArgs":[
                   {
                      "id":"park_name",
                      "displayName":"Park Name:"
                   },
                   {
                      "id":"name",
                      "displayName":"Park Name:"
                   },
                   {
                      "id":"NAME",
                      "displayName":"Park Name:"
                   },
                   {
                      "id":"park",
                      "displayName":"Park Name:"
                   }
                ]
             }
          }
       },
       {
          "property":{
             "id":"bronx-grayspace",
             "name":"Bronx Grayspace",
             "type":"geojson",
             "url":"https://raw.githubusercontent.com/OpenStoryMap/geodata/main/nyc-heat-watch-2021/stories/bronx-greenspace/bronx-grayspace.geojson",
             "ignoreOpacity":true,
             "displayProperties":{
                "displayPropertyArgs":[
                   {
                      "id":"name",
                      "displayName":"Park Name:"
                   }
                ]
             }
          }
       },
       {
          "property":{
             "id":"heatProstration",
             "name":"Heat Prostration",
             "type":"geojson",
             "url":"https://raw.githubusercontent.com/OpenStoryMap/geodata/main/nyc-heat-watch-2021/heat-prostration.geojson",
             "ignoreOpacity":true,
             "displayProperties":{
                "displayPropertyArgs":[
                   {
                      "id":"Casualty",
                      "displayName":"Name:"
                   },
                   {
                      "id":"Year_",
                      "displayName":"Year:"
                   },
                   {
                      "id":"Death",
                      "displayName":"Death:"
                   },
                   {
                      "id":"Age",
                      "displayName":"Age:"
                   }
                ]
             }
          }
       },
       {
          "property":{
             "id":"bruckner",
             "name":"Bruckner Boulevard",
             "type":"geojson",
             "url":"https://raw.githubusercontent.com/OpenStoryMap/geodata/main/nyc-heat-watch-2021/stories/melissa-barber/bruckner.geojson",
             "ignoreOpacity":true,
             "displayProperties":{
                "displayPropertyArgs":[
                   {
                      "id":"name",
                      "displayName":"Intersection"
                   }
                ]
             }
          }
       },
       {
          "property": {
             "id":"air_quality",
             "name": "Air Quality",
             "type": "geojson",
             "url":"https://raw.githubusercontent.com/OpenStoryMap/geodata/main/nyc-heat-watch-2021/air-quality.geojson",
             "args":{
                "minColor":"darkgrey",
                "maxColor":"white",
                "color": "darkgrey",
                "fillOpacity": 0.7
             },
             "displayProperties":{
                "missingDisplay":"N/A",
                "displayPropertyArgs":[
                   {
                      "id":"Fine Particulate Matter (PM2.5) - 90th Percentile",
                      "displayName":"Fine Particulate Matter (PM2.5) - 90th Percentile"
                   },
                   {
                      "id":"Fine Particulate Matter (PM2.5) - Mean",
                      "displayName":"Fine Particulate Matter (PM2.5) - Mean"
                   },
                   {
                      "id":"Black Carbon - 90th Percentile",
                      "displayName":"Black Carbon - 90th Percentile"
                   },
                   {
                      "id":"Black Carbon - Mean",
                      "displayName":"Black Carbon - Mean"
                   }
                ]
             }
          }
      },
      {
        "property": {
            "id":"heat_stress",
            "name": "Heat Stress",
            "type": "geojson",
            "url":"https://raw.githubusercontent.com/OpenStoryMap/geodata/main/nyc-heat-watch-2021/heat-stress.geojson",
            "args":{
                "minColor":"grey",
                "maxColor":"red",
                "color": "darkgrey",
                "fillOpacity": 0.7

            },
            "displayProperties":{
                "missingDisplay":"N/A",
            "displayPropertyArgs":[
                {
                    "id":"5-Year Heat Stress Hospitalizations - 5-Year Avg. Annual Age-Adjusted  Rate",
                    "displayName":"5-Year Heat Stress Hospitalizations - 5-Year Avg. Annual Age-Adjusted  Rate"
                },
                {
                    "id":"5-Year Heat Stress Hospitalizations - 5-Year Avg. Annual Rate",
                    "displayName":"5-Year Heat Stress Hospitalizations - 5-Year Avg. Annual Rate"
                },
                {
                    "id":"5-Year Heat Stress Hospitalizations - 5-Year Total Number",
                    "displayName":"5-Year Heat Stress Hospitalizations - 5-Year Total Number"
                },
                {
                    "id":"Heat Stress Emergency Department Visits - Age-Adjusted Rate",
                    "displayName":"Heat Stress Emergency Department Visits - Age-Adjusted Rate"
                },
                {
                    "id":"Heat Stress Emergency Department Visits - Estimated Annual Rate",
                    "displayName":"Heat Stress Emergency Department Visits - Estimated Annual Rate"
                },
                {
                    "id":"Heat Stress Hospitalizations - Estimated Annual Rate",
                    "displayName":"Heat Stress Hospitalizations - Estimated Annual Rate"
                }
            ]
            }
        }
    },
    {
        "property": {
            "id":"health_impacts_of_air_pollution",
            "name": "Health Impacts Of Air Pollution",
            "type": "geojson",
            "url":"https://raw.githubusercontent.com/OpenStoryMap/geodata/main/nyc-heat-watch-2021/health-impacts-of-air-pollution.geojson",
            "args":{
                "minColor":"green",
                "maxColor":"yellow",
                "color": "darkgrey",
                "fillOpacity": 0.7
            },
            "displayProperties":{
            "missingDisplay":"N/A",
            "displayPropertyArgs":[
                {
                    "id":"PM2.5-Attributable Asthma Emergency Department Visits - Estimated Annual Number - 18 Yrs and Older",
                    "displayName":"PM2.5-Attributable Asthma Emergency Department Visits - Estimated Annual Number - 18 Yrs and Older"
                },
                {
                    "id":"PM2.5-Attributable Asthma Emergency Department Visits - Estimated Annual Number - Children 0 to 17 Yrs Old",
                    "displayName":"PM2.5-Attributable Asthma Emergency Department Visits - Estimated Annual Number - Children 0 to 17 Yrs Old"
                },
                {
                    "id":"PM2.5-Attributable Asthma Emergency Department Visits - Estimated Annual Rate- 18 Yrs and Older",
                    "displayName":"PM2.5-Attributable Asthma Emergency Department Visits - Estimated Annual Rate- 18 Yrs and Older"
                },
                {
                    "id":"PM2.5-Attributable Asthma Emergency Department Visits - Estimated Annual Rate- Children 0 to 17 Yrs Old",
                    "displayName":"PM2.5-Attributable Asthma Emergency Department Visits - Estimated Annual Rate- Children 0 to 17 Yrs Old"
                },
                {
                    "id":"PM2.5-Attributable Cardiovascular Hospitalizations (Adults 40 Yrs and Older) - Estimated Annual Number",
                    "displayName":"PM2.5-Attributable Cardiovascular Hospitalizations (Adults 40 Yrs and Older) - Estimated Annual Number"
                },
                {
                    "id":"PM2.5-Attributable Cardiovascular Hospitalizations (Adults 40 Yrs and Older) - Estimated Annual Rate",
                    "displayName":"PM2.5-Attributable Cardiovascular Hospitalizations (Adults 40 Yrs and Older) - Estimated Annual Rate"
                },
                {
                    "id":"PM2.5-Attributable Deaths - Estimated Annual Number - Adults 30 Yrs and Older",
                    "displayName":"PM2.5-Attributable Deaths - Estimated Annual Number - Adults 30 Yrs and Older"
                },
                {
                    "id":"PM2.5-Attributable Deaths - Estimated Annual Rate - Adults 30 Yrs and Older",
                    "displayName":"PM2.5-Attributable Deaths - Estimated Annual Rate - Adults 30 Yrs and Older"
                },
                {
                    "id":"PM2.5-Attributable Respiratory Hospitalizations (Adults 20 Yrs and Older) - Estimated Annual Number",
                    "displayName":"PM2.5-Attributable Respiratory Hospitalizations (Adults 20 Yrs and Older) - Estimated Annual Number"
                },
                {
                    "id":"PM2.5-Attributable Respiratory Hospitalizations (Adults 20 Yrs and Older) - Estimated Annual Rate",
                    "displayName":"PM2.5-Attributable Respiratory Hospitalizations (Adults 20 Yrs and Older) - Estimated Annual Rate"
                }
            ]
            }
        }
    },
    {
        "property": {
            "id":"social_economic",
            "name": "Social and Economic",
            "type": "geojson",
            "url":"https://raw.githubusercontent.com/OpenStoryMap/geodata/main/nyc-heat-watch-2021/social-economic.geojson",
            "args":{
                "minColor":"black",
                "maxColor":"green",
                "color": "darkgrey",
                "fillOpacity": 0.7

            },
            "displayProperties":{
            "missingDisplay":"N/A",
            "displayPropertyArgs":[
                {
                    "id":"Poverty - Number",
                    "displayName":"Poverty - Number"
                },
                {
                    "id":"Older Adults Living Alone - Number",
                    "displayName":"Older Adults Living Alone - Number"
                },
                {
                    "id":"Older Adults Living Alone - Percent",
                    "displayName":"Older Adults Living Alone - Percent"
                },
                {
                    "id":"Unemployment - Number",
                    "displayName":"Unemployment - Number"
                },
                {
                    "id":"Unemployment - Percent",
                    "displayName":"Unemployment - Percent"
                }
            ]
            }
        }
    }
    ],
    "stories":[
       {
          "id": "getting-started",
          "title":"Getting Started",
          "content":"<span style=\"text-align: center;\">This story map can be used to visualize the results of NYC and northeastern NJ's 2021 urban heat island mapping campaign combined with personal experience stories about extreme heat, as well as historical and demographic information that <strong><a href=\"unequal.html\">show how heat connects to social inequities and health disparities</a></strong>.</span><p style=\"text-align: center;\">To see different data visualizations, first select layers (see top right on the map) and then adjust your options from the 'CONTROLS' panel.</p><p style=\"text-align: center;\">Do you live within the study area (Northern Manhattan, South Bronx, Jersey City, Newark, and Elizabeth) and would like to tell your story about extreme heat here?<br><strong><a href=\"submit.html\">Please submit your story here for a chance to win a $50 gift card.</a></strong></p>"
       },
       {
          "id": "heat-traffic-pollution",
          "title":"Heat + traffic + pollution + odors",
          "content":"From Dr. Melissa Barber: I live on Bruckner Boulevard, between Alexander and Willis Avenues, directly adjacent to the Willis Avenue Bridge. Heat during the summer months is completely exhausting because it not only brings the smell of hot trash from the waste transfer station, exacerbates the smog of the heavy highway traffic that usually starts about 5 am and reminds me of the ensuing high electric bill from the use of fans and air conditioners, there is very little tree coverage or shade to block the sun's rays or cool even the outside temperatures. From the moment Lilah and I leave the building, heat hits us and follows us throughout the entire neighborhood<div><img src=\"https://raw.githubusercontent.com/OpenStoryMap/geodata/main/nyc-heat-watch-2021/stories/melissa-barber/road1.jpeg\"></div><div><img src=\"https://raw.githubusercontent.com/OpenStoryMap/geodata/main/nyc-heat-watch-2021/stories/melissa-barber/road2.jpeg\"></div><div><img src=\"https://raw.githubusercontent.com/OpenStoryMap/geodata/main/nyc-heat-watch-2021/stories/melissa-barber/road3.jpeg\"></div>",
          "mapState":{
             "lat":40.805985,
             "lng":-73.925476,
             "zoom":16,
             "layers":[
                "njNycHiEvening",
                "bruckner"
             ]
          }
       },
       {
          "id": "brutal-heat",
          "title":"Brutal even for the young and healthy",
          "content":"I endured two hot summers in Washington Heights before installing an air conditioner. I was young and healthy, but it was still brutal. Cooking made the heat worse, and I worked at a bakery where no amount of air conditioning could keep up with the oven.",
          "mapState":{
             "lat":40.844771,
             "lng":-73.937088,
             "zoom":15,
             "layers":[ "njNycHiAfternoon" ]
          }
       },
       {
          "id": "heat-and-harlem",
          "title":"Heat Deaths in Harlem, 1880-1940",
          "content":"Kemuning A. Adiputri's <a href=\"https://storymaps.arcgis.com/stories/4bda4f7fd7954640853f7ab76ef95403\" target=\"_blank\">story map</a> on heat prostration shows historic heat victims across the study area between 1880-1940, utilizing point addresses gained through historical newspapers in a randomized arrangement. This map aims to understand a pattern of reported heat victims (not to incorporate all victim data throughout history) to give a better understanding of what possible factors are behind those samplings.",
          "mapState":{
             "lat":40.813573,
             "lng":-73.933917,
             "zoom":13,
             "layers":[
                "heatProstration",
                "njNycHiEvening"
             ]
          }
       },
       {
          "id": "life-without-shade-trees",
          "title":"Life without shade trees",
          "content":"Shade trees are typically overlooked for their ability to cool urban areas. Shade trees are mature street trees that are able to shade surfaces underneath as well as cool the air around them. When urban areas exist without trees, people must get creative to escape extreme heat. Here skateboarders use the shade of the NJ Turnpike Extension to shade themselves.<div><img src=\"https://raw.githubusercontent.com/OpenStoryMap/geodata/main/nyc-heat-watch-2021/stories/no-shade-trees/1.jpg\"></div>Here a man sits in the shade of a building <div><img src=\"https://raw.githubusercontent.com/OpenStoryMap/geodata/main/nyc-heat-watch-2021/stories/no-shade-trees/2_v2.jpg\"></div>Businesses on the side of the street with no shade get less foot traffic <div><img src=\"https://raw.githubusercontent.com/OpenStoryMap/geodata/main/nyc-heat-watch-2021/stories/no-shade-trees/3.jpg\"></div>",
          "mapState":{
             "lat":40.731967,
             "lng":-74.046526,
             "zoom":14,
             "layers":[ "njNycHiAfternoon" ]
          }
       },
       {
          "id": "no-green-in-green-space",
          "title":"No green in our 'green space'",
          "content":"How good is a 'green' space when there is little to no green to be found? That's the situation we face in the South Bronx. So-called 'parks' and 'playgrounds' designated as 'green space' by the City are often concrete slabs with very little tree canopy. See below for examples of what some of these spaces look like.<h4>Carlos Lozada</h4><div><img src=\"https://raw.githubusercontent.com/OpenStoryMap/geodata/main/nyc-heat-watch-2021/stories/bronx-greenspace/carlos-lozada.jpg\"></div><h4>Clark Playground</h4><div><img src=\"https://raw.githubusercontent.com/OpenStoryMap/geodata/main/nyc-heat-watch-2021/stories/bronx-greenspace/clark-playground.jpg\"></div><h4>Graham Triangle 138th St side</h4><div><img src=\"https://raw.githubusercontent.com/OpenStoryMap/geodata/main/nyc-heat-watch-2021/stories/bronx-greenspace/graham-triangle.jpg\"></div><h4>Pulaski</h4><div><img src=\"https://raw.githubusercontent.com/OpenStoryMap/geodata/main/nyc-heat-watch-2021/stories/bronx-greenspace/pulaski.jpg\"></div><h4>Ranaqua</h4><div><img src=\"https://raw.githubusercontent.com/OpenStoryMap/geodata/main/nyc-heat-watch-2021/stories/bronx-greenspace/ranaqua.jpg\"></div><h4>Willis Playground 140 extension</h4><div><img src=\"https://raw.githubusercontent.com/OpenStoryMap/geodata/main/nyc-heat-watch-2021/stories/bronx-greenspace/willis-playground.jpg\"></div>",
          "mapState":{
             "lat":40.8124376119,
             "lng":-73.9186380,
             "zoom":16,
             "layers":[
                "bronx-grayspace",
                "greenspace",
                "greenspaceNdvi"
             ]
          }
       },
       {
        "id": "walking-to-corner-store",
         "title":"Walking to the corner store in the heat",
         "content":"Summers in extreme heat, very little green space to cool down under. Walking to the corner store was enough for my asthma to act up and to feel exhausted and worn down by the sun.",
         "mapState":{
            "lat": 40.7256087,
            "lng": -74.1529999,
            "zoom":14,
            "layers":[ "njNycHiAfternoon" ]
         }
      },
      {
        "id": "open-hydrants",
        "title":"Open Hydrants Have Repercussions",
        "content":"Mid-80s open hydrants meant top floor apt. dwellers lost water pressure. My neighbors had to walk down 5 flights and carry buckets back upstairs.<br><br>*Additions from the storymap team:<br>Are you struggling from similar issues with fire hydrants in your area? You can get a spray cap from your local fire station and access an outreach program that can teach you how to use it - <a href=\"https://www1.nyc.gov/html/dep/html/press_releases/14-062pr.shtml#.Yvw7t3bMK73\" target=\"_blank\">more info here</a>. For a long-standing issue, you can file a complaint <a href=\"https://portal.311.nyc.gov/article/?kanumber=KA-01034\" target=\"_blank\">here</a>.<br>In case of interest: <a href=\"https://www.atlasobscura.com/articles/new-yorkers-have-been-illicitly-cracking-open-fire-hydrants-for-centuries\" target=\"_blank\">A historical dive into fire hydrant cracking in NYC</a>.",
        "mapState":{
           "lat": 40.8082044,
           "lng": -73.9232586,
           "zoom": 15,
           "layers":[ "njNycHiAfternoon", "greenspace", "heat_stress" ]
        }
      }
    ]
}
