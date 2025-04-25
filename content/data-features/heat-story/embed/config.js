/*
 * This is the configuration used to setup the entire mapping application.
 * The configuration is split into three sections: initialMapState, layers and stories
 *
 * initialMapState
 *     lat: starting map latitude
 *     lng: starting map longitude
 *     zoom: starting map zoom
 *     layers: list of layers to show when starting the map
 * 
 * layers: 
 *     property: 
 *         id: unique id for the layer
 *         name: human readable name of the layer
 *         type: layer type for rendering. can be raster, geojson, redlined, or measureData
 *         measureInfo: this is used if you are using another data explorer data setting
 *         displayName: name to use to display the measure in the legend
 *         indicatorID: ID of the indicator from the explorer data
 *         measureID: ID of the measure from the explorer data
 *         geoType: the geotype of the data set in the explorer. usually UHF42 or borough
 *         time: the time for the data set. the datasets usually have a time field.
 *         dataFormat: data format type. Can be percent|float|int
 *         url: file location for the layer
 *         buttonSection: section to add the button. Options are studyArea | base | additional. Default is additional
 *         exclusive: if true, then this is an exclusive layer. only one exclusive layer can be shown at a time
 *         args: 
 *             colorFeatureProperty: data property to use for setting the layer color
 *             minColor / maxColor: color is linearly interpolated. These are the starting and ending colors
 *             null: some datasets have a special null value, which can be set here.
 *             fillColor: if the minColor / maxColor is not set, then the fill color can be used for a constant color
 *             color: border color for the polygons
 *             fillOpacity: opacity of the layer. between 0 and 1
 *             legendColor: can be used to set the legend color
 *             legendDescription: the description to use in the legend when expanding the more info button
 *         displayProperties: properties for hover
 *             missingDisplay: string to use for missing properties
 *             displayPropertyArgs: list of arguments
 *                 id: id of the property to display
 *                 displayName: name to use for the tooltip
 *                 format: can be used to show special types. optional. can be float, percentage or currency
 *
 * stories: list of user stories
 *     id: unique id of the story
 *     title: title to use to display the story
 *     content: html blob for the story
 *     mapState: map state to use for showing the story
 *         lat: latitude for the story
 *         lng: longitude for the story
 *         zoom: zoom level for the story
 *         layers: layers to use to display the story
 */

config = {
    "initialMapState": {
       "lat": 40.763862,
       "lng": -74.05,
       "zoom": 12,
       "layers": [
          "nycAfternoon"
       ]
    },
    "layers": [
        {
            "property": {
                "id": "nycHiMorning",
                "name": "Morning heat index",
                "type": "raster",
                "url": window.BaseURL + "tiff/nyc-hi-morning.tiff",
                "buttonSection": "studyArea",
                "exclusive": true,
                "args": {
                    "legendDescription": "This hyperlocal temperature data was collected from 6-7am by residents living in Northern Manhattan and the Bronx. On Saturday July 24, 2021, these community scientists traversed along 10 different one-hour long routes with heat sensors on their cars or bicycles to capture block-by-block differences."
                },
            }
        },
        {
            "property": {
                "id": "nycAfternoon",
                "name": "Afternoon heat index",
                "type": "raster",
                "url": window.BaseURL + "tiff/nyc-hi-afternoon.tiff",
                "buttonSection": "studyArea",
                "exclusive": true,
                "args": {
                    "legendDescription": "This hyperlocal temperature data was collected from 3-4pm by residents living in Northern Manhattan and the Bronx. On Saturday July 24, 2021, these community scientists traversed along 10 different one-hour long routes with heat sensors on their cars or bicycles to capture block-by-block differences."
                },
            }
        },
        {
            "property": {
                "id": "nycHiEvening",
                "name": "Evening heat index",
                "type": "raster",
                "url": window.BaseURL + "tiff/nyc-hi-evening.tiff",
                "buttonSection": "studyArea",
                "exclusive": true,
                "args": {
                    "legendDescription": "This hyperlocal temperature data was collected from 7-8pm by residents living in Northern Manhattan and the Bronx. On Saturday July 24, 2021, these community scientists traversed along 10 different one-hour long routes with heat sensors on their cars or bicycles to capture block-by-block differences."
                },
            }
        },

       /*
       {
          "property": {
             "id": "heatAndDemographics",
             "name": "Heat and Demographics",
             "type": "geojson",
             "url": window.BaseURL + "geojson/heat_and_demographics.geojson",
             "exclusive": true,
             "args": {
                "colorFeatureProperty": "afternoonMaxHeatIndex",
                "minColor": "white",
                "maxColor": "red",
                "null": -9999,
                "fillColor": "black",
                "legendDescription": "This is a sample of a legend description. It can be long, it can be short, it can include <a href=\"#\">links</a>. It can do things like <b>bold</b>."
             },
             "displayProperties": {
                "displayPropertyArgs": [
                   {
                      "id": "TRACTCE",
                      "displayName": "Census Tract:"
                   },
                   {
                      "id": "blackPercentage",
                      "format": "percentage",
                      "displayName": "Black Population:"
                   },
                   {
                      "id": "medianHouseholdIncome",
                      "format": "currency",
                      "displayName": "Median Household Income:"
                   },
                   /*
                   {
                      "id": "morningMaxHeatIndex",
                      "displayName": "Morning Max Heat Index:"
                   },
                   */
                  /*
                   {
                      "id": "afternoonMaxHeatIndex",
                      "displayName": "Afternoon Max Heat Index:"
                   },
                   {
                      "id": "eveningMaxHeatIndex",
                      "displayName": "Evening Max Heat Index:"
                   }
                ]
             }
          }
       }, 
       */

        {
            "property": {
                "id": "redline",
                "name": "Redlined areas",
                "type": "redlined",
                "urls": {
                    "Class A": window.BaseURL + "maps/HOLC_map/data/HOLCClassA_3.json",
                    "Class B": window.BaseURL + "maps/HOLC_map/data/HOLCClassB_2.json",
                    "Class C": window.BaseURL + "maps/HOLC_map/data/HOLCClassC_1.json",
                    "Class D": window.BaseURL + "maps/HOLC_map/data/HOLCClassD_0.json"
                },
                "buttonSection": "additional",
                "exclusive": false,
                "args": {
                    "colorFeatureProperty": "holc_grade",
                    "defaultColor": "grey",
                    "colorMap": {
                        "A": "green",
                        "B": "blue",
                        "C": "yellow",
                        "D": "red"
                    },
                    "opacity": 0.6,
                    "legendDescription": "This 1930s-era Home Owners' Loan Corporation (HOLC) redlining map shows the four grades that were assigned to neighborhoods based on race, and helps us understand the nature of racism, poverty, and health in our society. On these maps, HOLC gave each neighborhood a classification where A=Best, B=Still desirable, C=Definitely declining, and D=Hazardous. <a href='https://a816-dohbesp.nyc.gov/IndicatorPublic/data-stories/redlining/'>Read more about redlining here.</a>"
                },
                "displayProperties": {
                    "displayPropertyArgs": [
                        {
                            "id": "holc_grade",
                            "displayName": "Redline Grade:"
                        }
                    ]
                }
            }
        },
       
       /*
       {    
         "property": {
           "id": "greenspaceNdvi",
           "name": "Greenspace NDVI",
           "type": "raster",
           "url": "https://raw.githubusercontent.com/OpenStoryMap/geodata/main/nyc-heat-watch-2021/greenspacesNdvi.tiff",
           "args": {
               "colorStart": "black",
               "colorStop": "red",
               "resolution": 256
           }
         }
       },
       */

/* Commenting out greenspace
       {
          "property": {
             "id": "greenspace",
             "name": "Greenspace",
             "type": "geojson",
             "url": window.BaseURL + "geojson/greenspace.geojson",
             "buttonSection": "studyArea",
             "args": {
                "color": "green",
                "fillColor": "green",
                "fillOpacity": 0,
                "legendColor": "green"
             },
             "displayProperties": {
                "missingDisplay": "No name found",
                "displayPropertyArgs": [
                   {
                      "id": "park_name",
                      "displayName": "Park Name:"
                   },
                   {
                      "id": "name",
                      "displayName": "Park Name:"
                   },
                   {
                      "id": "NAME",
                      "displayName": "Park Name:"
                   },
                   {
                      "id": "park",
                      "displayName": "Park Name:"
                   }
                ]
             }
          }
       },
*/
       /*
       {
          "property": {
             "id": "bronx-grayspace",
             "name": "Bronx Grayspace",
             "type": "geojson",
             "url": "https://raw.githubusercontent.com/OpenStoryMap/geodata/main/nyc-heat-watch-2021/stories/bronx-greenspace/bronx-grayspace.geojson",
             "ignoreOpacity": true,
             "displayProperties": {
                "displayPropertyArgs": [
                   {
                      "id": "name",
                      "displayName": "Park Name:"
                   }
                ]
             }
          }
       },
       */
      /*
       {
          "property": {
             "id": "heatProstration",
             "name": "Heat Prostration",
             "type": "geojson",
             "url": window.BaseURL + "geojson/heat-prostration.geojson",
             "ignoreOpacity": true,
             "displayProperties": {
                "displayPropertyArgs": [
                   {
                      "id": "Casualty",
                      "displayName": "Name:"
                   },
                   {
                      "id": "Year_",
                      "displayName": "Year:"
                   },
                   {
                      "id": "Death",
                      "displayName": "Death:"
                   },
                   {
                      "id": "Age",
                      "displayName": "Age:"
                   }
                ]
             }
          }
       },
       /*
       */

       /*
       {
          "property": {
             "id": "bruckner",
             "name": "Bruckner Boulevard",
             "type": "geojson",
             "url": window.BaseURL + "geojson/bruckner.geojson",
             "buttonSection": "additional",
             "ignoreOpacity": true,
             "displayProperties": {
                "displayPropertyArgs": [
                   {
                      "id": "name",
                      "displayName": "Intersection"
                   }
                ]
             }
          }
       },
       */
       {
            "property": {
                "id": "air_quality",
                "name": "Air quality - PM2.5",
                "type": "measureData",
                "buttonSection": "base",
                "measureInfo": {
                    "indicatorID": 2023,
                    "measureID": 1426,
                    "geoType": "CD",
                    "time": "2023",
                },
                "exclusive": true,
                "args": {
                    "colorFeatureProperty": "PM2.5",
                    "minColor": "#fff2cc",
                    "maxColor": "#6a329f",
                    "color": "black",
                    "opacity": 0.75,
                    "legendDescription": "<strong> PM2.5 </strong> are fine particles emitted by vehicles, building boilers, and other combustion - and are a major form of air pollution that harms health. <a href='../../data-explorer/air-quality/?id=2023#display=summary'>Get full data</a>."
                },
                "displayProperties": {
                    "missingDisplay": "N/A",
                    "displayPropertyArgs": [
                        {
                            "displayName": "PM2.5",
                            "units": "μg/m3",
                            "format": "float"
                        }
                    ]
                }
            }
        },
        {
            "property": {
                "id": "Heat_vulnerability_index",
                "name": "Heat vulnerability index",
                "type": "measureData",
                "buttonSection": "base",
                "measureInfo": {
                    "indicatorID": 2191,
                    "measureID": 822,
                    "geoType": "CDTA2020",
                    "time": "2023",
                },
                "exclusive": true,
                "args": {
                    "colorFeatureProperty": "HVI",
                    "defaultColor": "grey",
                    "color": "black",
                    "colorMap": {
                        1: "#efc22f",
                        2: "#ed9223",
                        3: "#e75d1e",
                        4: "#bd3f37",
                        5: "darkred"
                    },
                    "opacity": 0.8,
                    "legendDescription": "The HVI shows the risk of community-level heat impacts, like deaths, due to extreme heat events. It is made up of data on surface temperature, green space, air conditioning access, median income, and Black population (the population most excluded from heat resources due to structural racism). <a href='../../data-explorer/climate/?id=2191#display=summary'>Get full data here</a>.",
                },
                "displayProperties": {
                    "missingDisplay": "N/A",
                    "displayPropertyArgs": [
                        {
                            "id": "Heat vulnerability index",
                            "displayName": "HVI"
                        }
                    ]
                }
            }
        },
        {
            "property": {
                "id": "Daytime_summer_surface_temperature",
                "name": "Daytime summer surface temperature",
                "type": "measureData",
                "buttonSection": "base",
                "measureInfo": {
                    "indicatorID": 2141,
                    "measureID": 688,
                    "geoType": "CD",
                    "time": "2018",
                },
                "exclusive": true,
                "args": {
                    "colorFeatureProperty": "Degrees, Fahrenheit",
                    "minColor": "#fff2cc",
                    "maxColor": "#6a329f",
                    "color": "black",
                    "opacity": 0.75,
                    "legendDescription": "<strong>Surface temperatures</strong> vary based on vegetative cover (which promotes cooling), as well as by materials that retain heat (like paved roads, sidewalks, and buildings). Hotter neighborhoods tend to have more heat-exacerbated deaths associated with extreme heat events. <a href='../../data-explorer/climate/?id=2141#display=summary'>Get full data</a>."
                },
                "displayProperties": {
                    "missingDisplay": "N/A",
                    "displayPropertyArgs": [
                        {
                            "displayName": "Daytime summer surface temperature",
                            "units": "°F",
                            "format": "float"
                        }
                    ]
                }
            }
        },
        {
            "property": {
                "id": "Asthma_ED_visits",
                "name": "Asthma emergency department visits - Adults",
                "type": "measureData",
                "buttonSection": "base",
                "measureInfo": {
                    "indicatorID": 2380,
                    "measureID": 1199,
                    "geoType": "CD",
                    "time": "2022",
                },
                "exclusive": true,
                "args": {
                    "colorFeatureProperty": "Adults with asthma, percent",
                    "minColor": "white",
                    "maxColor": "purple",
                    "color": "black",
                    "opacity": 0.75,
                    "legendDescription": "Asthma is a common disease characterized by breathing difficulty. Poor air quality and housing issues increase risk of developing and triggering asthma. <a href='../../data-explorer/asthma/?id=2380#display=summary'>Get full data</a>."
                },
                "displayProperties": {
                    "missingDisplay": "N/A",
                    "displayPropertyArgs": [
                        {
                            "id": "Asthma emergency department visits (adults), age-adjusted rate",
                            "displayName": "Asthma emergency department visits (adults), age-adjusted rate",
                            "format": "float",
                            "units" : "per 10,000"
                        }
                    ]
                }
            }
        },
        {
            "property": {
                "id": "Vegetative_cover",
                "name": "Vegetative cover",
                "type": "measureData",
                "buttonSection": "base",
                "measureInfo": {
                    "indicatorID": 2143,
                    "measureID": 690,
                    "geoType": "CD",
                    "time": "2017",
                },
                "exclusive": true,
                "args": {
                    "colorFeatureProperty": "Grass and tree cover, Percent",
                    "minColor": "white",
                    "maxColor": "green",
                    "color": "black",
                    "opacity": 0.8,
                    "legendDescription": "Vegetative cover is land covered by trees, grass, or other plants instead of a hard surface like roads, sidewalks, or buildings. It tends to reduce temperatures in the immediate area and may increase air quality. <a href='../../data-explorer/climate/?id=2143#display=summary'>Get full data</a>."
                },
                "displayProperties": {
                    "missingDisplay": "N/A",
                    "displayPropertyArgs": [
                        {
                            "id": "Grass and tree cover, Percent",
                            "displayName": "Grass and tree cover, Percent",
                            "format": "float",
                            "units" : "%"
                        }
                    ]
                }
            }
        },
        {
            "property": {
                "id": "Heat_stress_hospitalizations",
                "name": "Heat stress hospitalizations",
                "type": "measureData",
                "buttonSection": "base",
                "measureInfo" : {
                    "indicatorID": 2410,
                    "measureID": 1283,
                    "geoType": "CD",
                    "time": "2013-22",
                },
                "exclusive": true,
                "args": {
                    "colorFeatureProperty": "Heat hospitalizations, Average annual age-adjusted rate",
                    "minColor": "#fff2cc",
                    "maxColor": "#6a329f",
                    "color": "black",
                    "opacity": 0.75,
                    "legendDescription": "Heat stress hospitalizations due to heat-related illnesses, such as heat stroke and heat exhaustion, represent part of the public health burden of hot weather. <a href='../../data-explorer/weather-related-illness/?id=2076#display=summary'>Get full data</a>."
                },
                "displayProperties": {
                    "missingDisplay": "N/A",
                    "displayPropertyArgs": [
                        {
                            "id": "Heat hospitalizations, Average annual age-adjusted rate",
                            "displayName": "Heat hospitalizations, Average annual age-adjusted rate",
                            "format": "float",
                            "units": "per 100,000"
                        },
                    ]
                }
            }
        },
        {
            "property": {
                "id": "Neighborhood_poverty",
                "name": "Neighborhood poverty",
                "type": "measureData",
                "buttonSection": "base",
                "measureInfo": {
                    "indicatorID": 103,
                    "measureID": 221,
                    "geoType": "CDTA2020",
                    "time": "2017-21",
                },
                "exclusive": true,
                "args": {
                    "colorFeatureProperty": "Neighborhood poverty %",
                    "minColor": "white",
                    "maxColor": "purple",
                    "color": "black",
                    "opacity": 0.9,
                    "legendDescription": "The percent of households with incomes below the federal poverty level. Households without sufficient resources are often deprived of access to items such as health care and good quality housing that are needed to maintain good health.<a href='../../data-explorer/economic-conditions/?id=103#display=summary'>Get full data</a>."
                },
                "displayProperties": {
                    "missingDisplay": "N/A",
                    "displayPropertyArgs": [
                        {
                            "id": "Neighborhood poverty, percent",
                            "displayName": "Neighborhood poverty, percent",
                            "format": "float",
                            "units": "%"
                        }
                    ]
                }
            }
        },
        {
            "property": {
                "id": "Household_air_conditioning",
                "name": "Households with AC",
                "type": "measureData",
                "measureInfo": {
                    "indicatorID": 2185,
                    "measureID": 781,
                    "geoType": "Subboro",
                    "time": "2017",
                },
                "buttonSection": "base",
                "exclusive": true,
                "args": {
                    "colorFeatureProperty": "Household air conditioning %",
                    "minColor": "red",
                    "maxColor": "lightblue",
                    "color": "black",
                    "opacity": 0.7,
                    "legendDescription": "Estimated number of households in an area reporting having functioning air conditioning, divided by the number of households in the area; expressed as percent.<a href='../../data-explorer/climate/?id=2185#display=summary'> Get full data<a>"
                },
                "displayProperties": {
                    "missingDisplay": "N/A",
                    "displayPropertyArgs": [
                        {
                            "id": "Households with AC, Percent",
                            "displayName": "Households with AC, Percent",
                            "format": "float",
                            "units" : "%"
                        }
                    ]
                }
            }
        },
        // {
        //     "property": {
        //         "id": "social_economic",
        //         "name": "Social and Economic",
        //         "type": "geojson",
        //         "url": window.BaseURL + "geojson/social-economic.geojson",
        //         "args": {
        //             "colorFeatureProperty": "Poverty - Percent",
        //             "minColor": "black",
        //             "maxColor": "green",
        //             "color": "darkgrey",
        //             "opacity": 0.6
        //         },
        //         "displayProperties": {
        //             "missingDisplay": "N/A",
        //             "displayPropertyArgs": [
        //                 {
        //                     "id": "Poverty - Number",
        //                     "displayName": "Poverty"
        //                 },
        //                 {
        //                     "id": "Older Adults Living Alone - Number",
        //                     "displayName": "Older Adults Living Alone - Number"
        //                 },
        //                 {
        //                     "id": "Older Adults Living Alone - Percent",
        //                     "displayName": "Older Adults Living Alone",
        //                     "format": "percent"
        //                 },
        //                 {
        //                     "id": "Unemployment - Number",
        //                     "displayName": "Unemployment - Number"
        //                 },
        //                 {
        //                     "id": "Unemployment - Percent",
        //                     "displayName": "Unemployment - Percent"
        //                 }
        //             ]
        //         }
        //     }
        // }

/* unused layers 

 /* commenting out geojson
        "url": window.BaseURL + "geojson/heat-stress.geojson",
        "args": {
            "colorFeatureProperty": "Heat hospitalizations, Average annual age-adjusted rate",
            "minColor": "#054fb9",
            "maxColor": "#c44601",
            "color": "black",
            "opacity": 0.6,
            "legendDescription": "Heat stress hospitalizations due to heat-related illnesses, such as heat stroke and heat exhaustion, represent part of the public health burden of hot weather. <a href='../../data-explorer/weather-related-illness/?id=2076#display=summary'>Get full data</a>."
        },
            "exclusive": true,
            "displayProperties": {
            "missingDisplay": "N/A",
            "displayPropertyArgs": [
                {
                    "id": "Heat hospitalizations, Average annual age-adjusted rate",
                    "displayName": "Heat hospitalizations, Average annual age-adjusted rate",
                    "format": "float",
                    "units": "per 100,000"
                },
            ]
        }
    }
},

        {
            "property": {
                "id": "heat_stress",
                "name": "Heat stress hospitalizations",
                "type": "geojson",
                "buttonSection": "base",
                "url": window.BaseURL + "geojson/heat-stress.geojson",
                "args": {
                    "colorFeatureProperty": "Heat hospitalizations, Average annual age-adjusted rate",
                    "minColor": "#054fb9",
                    "maxColor": "#c44601",
                    "color": "black",
                    "opacity": 0.6,
                    "legendDescription": "Heat stress hospitalizations due to heat-related illnesses, such as heat stroke and heat exhaustion, represent part of the public health burden of hot weather. <a href='../../data-explorer/weather-related-illness/?id=2076#display=summary'>Get full data</a>."
                },
                "exclusive": true,
                "displayProperties": {
                    "missingDisplay": "N/A",
                    "displayPropertyArgs": [
                        {
                            "id": "Heat hospitalizations, Average annual age-adjusted rate",
                            "displayName": "Heat hospitalizations, Average annual age-adjusted rate",
                            "format": "float",
                            "units": "per 100,000"
                        },
                        
                        {
                            
    //                           "id": "5-Year Heat Stress Hospitalizations - 5-Year Avg. Annual Rate",
    //                            "displayName": "5-Year Heat Stress Hospitalizations - 5-Year Avg. Annual Rate",
    //                            "format": "float",
    //                            "units": "per 100,000"
    //                        },
    //                        
    //                        {
    //                            "id": "5-Year Heat Stress Hospitalizations - 5-Year Total Number",
    //                            "displayName": "5-Year Heat Stress Hospitalizations - 5-Year Total Number"
    //                        },
    //                        {
    //                            "id": "Heat Stress Emergency Department Visits - Age-Adjusted Rate",
    //                            "displayName": "Heat Stress Emergency Department Visits - Age-Adjusted Rate",
    //                            "format": "float",
    //                            "units": "per 100,000"
    //                        },
    //                        {
    //                            "id": "Heat Stress Emergency Department Visits - Estimated Annual Rate",
    //                            "displayName": "Heat Stress Emergency Department Visits - Estimated Annual Rate",
    //                            "format": "float",
    //                            "units": "per 100,000"
    //                        },
    //                        {
    //                            "id": "Heat Stress Hospitalizations - Estimated Annual Rate",
    //                            "displayName": "Heat Stress Hospitalizations - Estimated Annual Rate",
    //                            "format": "float",
    //                           "units": "per 100,000"
                        }
                        
                    ]
                }
            }
        },

        // {
        //     "property": {
        //         "id": "health_impacts_of_air_pollution",
        //         "name": "Health Impacts Of Air Pollution",
        //         "type": "geojson",
        //         "url": window.BaseURL + "geojson/health-impacts-of-air-pollution.geojson",
        //         "args": {
        //             "colorFeatureProperty": "PM2.5-Attributable Respiratory Hospitalizations (Adults 20 Yrs and Older) - Estimated Annual Rate",
        //             "minColor": "white",
        //             "maxColor": "black",
        //             "color": "darkgrey",
        //             "opacity": 0.6
        //         },
        //         "displayProperties": {
        //             "missingDisplay": "N/A",
        //             "displayPropertyArgs": [
        //                 {
        //                     "id": "PM2.5-Attributable Asthma Emergency Department Visits - Estimated Annual Number - 18 Yrs and Older",
        //                     "displayName": "PM2.5-Attributable Asthma Emergency Department Visits - Estimated Annual Number - 18 Yrs and Older"
        //                 },
        //                 {
        //                     "id": "PM2.5-Attributable Asthma Emergency Department Visits - Estimated Annual Number - Children 0 to 17 Yrs Old",
        //                     "displayName": "PM2.5-Attributable Asthma Emergency Department Visits - Estimated Annual Number - Children 0 to 17 Yrs Old"
        //                 },
        //                 {
        //                     "id": "PM2.5-Attributable Asthma Emergency Department Visits - Estimated Annual Rate- 18 Yrs and Older",
        //                     "displayName": "PM2.5-Attributable Asthma Emergency Department Visits - Estimated Annual Rate- 18 Yrs and Older"
        //                 },
        //                 {
        //                     "id": "PM2.5-Attributable Asthma Emergency Department Visits - Estimated Annual Rate- Children 0 to 17 Yrs Old",
        //                     "displayName": "PM2.5-Attributable Asthma Emergency Department Visits - Estimated Annual Rate- Children 0 to 17 Yrs Old"
        //                 },
        //                 {
        //                     "id": "PM2.5-Attributable Cardiovascular Hospitalizations (Adults 40 Yrs and Older) - Estimated Annual Number",
        //                     "displayName": "PM2.5-Attributable Cardiovascular Hospitalizations (Adults 40 Yrs and Older) - Estimated Annual Number"
        //                 },
        //                 {
        //                     "id": "PM2.5-Attributable Cardiovascular Hospitalizations (Adults 40 Yrs and Older) - Estimated Annual Rate",
        //                     "displayName": "PM2.5-Attributable Cardiovascular Hospitalizations (Adults 40 Yrs and Older) - Estimated Annual Rate"
        //                 },
        //                 {
        //                     "id": "PM2.5-Attributable Deaths - Estimated Annual Number - Adults 30 Yrs and Older",
        //                     "displayName": "PM2.5-Attributable Deaths - Estimated Annual Number - Adults 30 Yrs and Older"
        //                 },
        //                 {
        //                     "id": "PM2.5-Attributable Deaths - Estimated Annual Rate - Adults 30 Yrs and Older",
        //                     "displayName": "PM2.5-Attributable Deaths - Estimated Annual Rate - Adults 30 Yrs and Older"
        //                 },
        //                 {
        //                     "id": "PM2.5-Attributable Respiratory Hospitalizations (Adults 20 Yrs and Older) - Estimated Annual Number",
        //                     "displayName": "PM2.5-Attributable Respiratory Hospitalizations (Adults 20 Yrs and Older) - Estimated Annual Number"
        //                 },
        //                 {
        //                     "id": "PM2.5-Attributable Respiratory Hospitalizations (Adults 20 Yrs and Older) - Estimated Annual Rate",
        //                     "displayName": "PM2.5-Attributable Respiratory Hospitalizations (Adults 20 Yrs and Older) - Estimated Annual Rate"
        //                 }
        //             ]
        //         }
        //     }
        //    },
*/




        // Stories start here // 
    ],
    "stories": [
        
        {
            "id": "getting-started",
            "title": "Get started",
            "content": "<p style=\"text-align: left;\">Select a story to learn about how heat is affecting New Yorkers. Browse data sets that show disparities in temperature, heat stress, neighborhood poverty, and AC access, and then add a layer to look at these data next to redlining and green cover maps. <br><strong></strong></p>",
            "mapState": {
                "lat": 40.715554,
                "lng": -74.0026642,
                "zoom": 11,
                "layers": [ ]
            }
        },

        {
            "id": "heat-traffic-pollution",
            "title": "Heat, traffic and odors are exhausting",
            "content": "I live on Bruckner Boulevard, between Alexander and Willis Avenues, directly adjacent to the Willis Avenue Bridge. Heat during the summer months is completely exhausting because it not only brings the smell of hot trash from the waste transfer station, exacerbates the smog of the heavy highway traffic that usually starts about 5 am and reminds me of the ensuing high electric bill from the use of fans and air conditioners, there is very little tree coverage or shade to block the sun's rays or cool even the outside temperatures. From the moment Lilah and I leave the building, heat hits us and follows us throughout the entire neighborhood. <br>-<strong>Dr. Melissa Barber </strong><div><img src=\"https://raw.githubusercontent.com/OpenStoryMap/geodata/main/nyc-heat-watch-2021/stories/melissa-barber/road3.jpeg\"></div>",
            "marker": {
                "lat": 40.805985,
                "lng": -73.925476,},
            "mapState": {
                "lat": 40.805985,
                "lng": -73.925476,
                "zoom": 15,
                "layers": [
                    "nycHiEvening"
                ]
            }
        },

          {
            "id": "high-ac-bills",
            "title": "It's hard to sleep and AC costs too much",
            "content": "Heat has caused much discomfort such as not being able to sleep because it’s too hot in my home.      There are days where we open all the windows and fans just to avoid having to turn the central air conditioning on and running up the bill. <br><strong>-Anonymous</strong>",
            "marker": {
                "lat": 40.668111,
                "lng": -73.827444,},
            "mapState": {
                "lat": 40.668111,
                "lng": -73.827444,
                "zoom": 13,
                "layers": [
                    "Household_air_conditioning"
                ]
            }
        },
        {
            "id": "fainting",
            "title": "I'm worried about fainting",
            "content": "Normally our windows and doors are open for the cool breeze to enter our home. When it becomes too hot, we will close the windows and doors and put the AC on. We are careful not to run the AC for too long given the energy bill, but we run the risk of getting sick. It is difficult to concentrate and study when it is too hot. It is also difficult to sleep. My family gets cranky. We try to avoid being outside and reduce our outdoor activities. We go outside with an umbrella. We pack cold water to bring us and paper towels so we can soak them with the water and refresh ourselves with it. We don’t have a cooling centers within a 10 minute walk from my home.<br><strong>-Queens resident</strong>",
            "marker": {
                "lat": 40.70698,  
                "lng": -73.79797,},
            "mapState": {
                "lat": 40.70698,
                "lng": -73.79797,
                "zoom": 14,
                "layers": [
                    "Heat_stress_hospitalizations"
                ]
            }
        },
        {
            "id": "brutal-heat",
            "title": "Brutal even for the young and healthy",
            "content": "I endured two hot summers in Washington Heights before installing an air conditioner. I was young and healthy, but it was still brutal. Cooking made the heat worse, and I worked at a bakery where no amount of air conditioning could keep up with the oven.",
            "marker": {
                "lat": 40.844771,
                "lng": -73.937088,},
            "mapState": {
                "lat": 40.844771,
                "lng": -73.937088,
                "zoom": 14,
                "layers": [ 
                    "nycAfternoon",
                    "Heat_vulnerability_index"
                ]
            }
        },
        {
            "id": "hotter-inside",
            "title": "It's hotter in our home than outside",
            "content": "Our home tends to be very hot indoors with it being cooler outside than inside. We tend to slow down our movement during the heat because we feel a bit unwell. I usually sleep later and wake up earlier because I am unable to sleep, turning and twisting all night even with a fan. <br>I worry about the cost of my energy bill, power outages, the overheating of my cat, my health being impacted, and my friends’ health being impacted.<br><strong>-Anonymous</strong>",
            "marker": {
                "lat": 40.667484,
                "lng": -73.788095,},
            "mapState": {
                "lat": 40.667484,
                "lng": -73.788095,
                "zoom": 13,
                "layers": [
                    "Heat_vulnerability_index"
                ]
            }
        },
        {
            "id": "grocery-store-ac",
            "title": "We went to the library to stay cool",
            "content": "We didn’t have AC until I was 7. Going to the grocery stores and local library. We took a little longer in the grocery store than we needed to. We took cold showers. We put the water in the fridge to be cool. We had a fan in every bedroom. Sometimes we took a rag and soaked in cold water before putting it on my skin. I upped my salt intake with electrolyte water.<br><strong>-Kitty</strong>",
            "marker": {
                "lat": 40.676652,
                "lng": -73.823220,},
            "mapState": {
                "lat": 40.676652,
                "lng": -73.823220,
                "zoom": 13,
                "layers": [
                    "Household_air_conditioning"
                ]
            }
        },
        /*
        {
            "id": "heat-and-harlem",
            "title": "Heat Deaths in Harlem, 1880-1940",
            "content": "Kemuning A. Adiputri's <a href=\"https://storymaps.arcgis.com/stories/4bda4f7fd7954640853f7ab76ef95403\" target=\"_blank\">story map</a> on heat prostration shows historic heat victims across the study area between 1880-1940, using point addresses gained through historical newspapers in a randomized arrangement. This map aims to understand a pattern of reported heat victims (not to incorporate all victim data throughout history) to give a better understanding of the possible underlying factors.",
            "mapState": {
                "lat": 40.813573,
                "lng": -73.933917,
                "zoom": 13,
                "layers": [
                    "heat_stress",
                    "nycHiEvening"
                ]
            }
        },
        */
        /* NJ story -- comment out
        {
            "id": "life-without-shade-trees",
            "title": "Life without shade trees",
            "content": "Shade trees are typically overlooked for their ability to cool urban areas. Shade trees are mature street trees that are able to shade surfaces underneath as well as cool the air around them. When urban areas exist without trees, people must get creative to escape extreme heat. Here skateboarders use the shade of the NJ Turnpike Extension to shade themselves.<div><img src=\"https://raw.githubusercontent.com/OpenStoryMap/geodata/main/nyc-heat-watch-2021/stories/no-shade-trees/1.jpg\"></div>Here a man sits in the shade of a building <div><img src=\"https://raw.githubusercontent.com/OpenStoryMap/geodata/main/nyc-heat-watch-2021/stories/no-shade-trees/2_v2.jpg\"></div>Businesses on the side of the street with no shade get less foot traffic <div><img src=\"https://raw.githubusercontent.com/OpenStoryMap/geodata/main/nyc-heat-watch-2021/stories/no-shade-trees/3.jpg\"></div>",
            "mapState": {
                "lat": 40.731967,
                "lng": -74.046526,
                "zoom": 14,
                "layers": [ "nycAfternoon" ]
            }
        },
        */
        {
            "id": "no-green-in-green-space",
            "title": 'No green in our "green space"',
            "content": "How good is a green space when there is little to no green to be found? That's the situation we face in the South Bronx. So-called parks and playgrounds designated as green space by the City are often concrete slabs with very little tree canopy. See below for examples of what some of these spaces look like.<strong>Carlos Lozada</strong><div><img src=\"https://raw.githubusercontent.com/OpenStoryMap/geodata/main/nyc-heat-watch-2021/stories/bronx-greenspace/carlos-lozada.jpg\"></div>",
            "marker": {
                "lat": 40.8124376119,
                "lng": -73.9186380,
            },
            "mapState": {
                "lat": 40.8124376119,
                "lng": -73.9186380,
                "zoom": 15,
                "layers": [
                    "Vegetative_cover",
                ]
            }
        },
        /* NJ story - comment out
        {
            "id": "walking-to-corner-store",
            "title": "Walking to the corner store in the heat",
            "content": "Summers in extreme heat, very little green space to cool down under. Walking to the corner store was enough for my asthma to act up and to feel exhausted and worn down by the sun.",
            "marker": {
                "lat": 40.7256087,
                "lng": -74.1529999,
            },
            "mapState": {
                "lat": 40.7256087,
                "lng": -74.1529999,
                "zoom": 13,
                "layers": [ "nycAfternoon" ],
            }
        },*/

        {
            "id": "open-hydrants",
            "title": "Open hydrants have repercussions",
            "content": "Mid-80s open hydrants meant top floor apartment dwellers lost water pressure. My neighbors had to walk down five flights and carry buckets back upstairs.<br><br><a href=\"https://www1.nyc.gov/html/dep/html/press_releases/14-062pr.shtml#.Yvw7t3bMK73\" target=\"_blank\">You can get a spray cap from your local fire station and access an outreach program that can teach you how to use it</a>.",
            "marker": {
                "lat": 40.8082044,
                "lng": -73.9232586,
            },
            "mapState": {
                "lat": 40.8082044,
                "lng": -73.9232586,
                "zoom": 14,
                "layers": [ 
                    "nycAfternoon", 
                    "heat_stress" 
                ]
            }
        },
/*QDA stories to add after they have reviewed
        {
            "id": '"heat-sensitivity"',
            "title": '"Heat sensitivity"',
            "content": "My landlord is not often responsive to complaints about heat, even when it's 60 degrees outside and there's no need for it. I have heat sensitivity that is a struggle to find the source of with my doctor. I become nauseous, dizzy and cannot sleep or eat when affected. I do not sweat much, so heat stroke or heat exhaustion is always a fear of mine. I do not really have help, I just buy fans, limit activity or take cool showers when affected.<br><br><strong>-Ren(he/him)</strong>",
            "marker": {
                "lat": 40.60744008899693,
                "lng": -74.00263401036987,
            },
            "mapState": {
                "lat": 40.60744008899693,
                "lng": -74.00263401036987,
                "zoom": 14,
                "layers": [ 
                    "nycAfternoon", 
                    "heat_stress" 
                ]
            }
        },
        {
            "id": "debilitating-heat",
            "title": "Debilitating heat",
            "content": "I am very physically disabled and movement takes a lot of effort, which in such debilitating heat, means I am an exhausted, sweaty mess even from trying to walk across the street. I can't afford to use AC often, so I'm still hot and miserable at home. I live in a third floor walk up, which is already a struggle, with no hallway AC. Subway stations near me are inaccessible and I have to go up many flights of stairs—nearly impossible in heat. This impedes my ability to leave my stuffy apartment to find accessible AC. I miss a lot of doctor's appointments, which takes a further toll on my health. Sleep is also very difficult, leaving me even more drained than normal from my physical disabilities. <br><strong>-Anonymous(they/them)</strong>",
            "marker": {
                "lat": 40.76202190298572,
                "lng": -73.92537488952408,
            },
            "mapState": {
                "lat": 40.76202190298572,
                "lng": -73.92537488952408,
                "zoom": 14,
                "layers": [ 
                    "Household_air_conditioning", 
                    "heat_stress" 
                ]
            }
        },
        {
            "id": "Unbearable-heat",
            "title": "Unbearable without AC",
            "content": "My building runs colder than other buildings I've lived in and visited in Washington Heights, but during the summer, it is STILL unbearable without AC. After my unit broke last August and with no budget to repair it, I had to avoid my kitchen and living room due to intense heat and humidity. I suffer from PCOS and other chronic medical conditions. The medications I take for these effect my hormones, and make me very heat-sensitive. My summer activities are often impaired by nausea, fatigue, muscle cramps and intense headaches. My apartment building, management and neighborhood, to my knowledge, have no resources to change the situation.<br><strong>-Washington Heights resident</strong>",
            "marker": {
                "lat": 40.83448753023138,
                "lng": -73.94179291976536,
            },
            "mapState": {
                "lat": 40.83448753023138,
                "lng": -73.94179291976536,
                "zoom": 14,
                "layers": [ 
                    "nycAfternoon", 
                    "heat_stress" 
                ]
            }
        },*/
/* SQWM stories */
        {
            "id": "Psychosocial-wellbeing",
            "title": "Can't focus on school",
            "content": "It affects my psychosocial well-being. I worry about the cost of my energy bill, power outages, and my stress levels. When my home is too hot, I can't sleep and I can't focus on work or school. I use a fan, take cold showers, drink water, and eat watermelon to stay cool. <br><strong>-Struggling grad student</strong>",
            "marker": {
                "lat": 40.701724612663796,
                "lng": -73.82345161918002,
            },
            "mapState": {
                "lat": 40.701724612663796,
                "lng": -73.82345161918002,
                "zoom": 14,
                "layers": [ 
                    "Heat_stress_hospitalizations" 
                ]
            }
        },
        {
            "id": "Getting-air",
            "title": "I have to leave the subway",
            "content": "I worry about overheating and not having enough water to hydrate. There have been times when I'm in the train station or on a train and it's gotten so hot that I have to exit the car or station just to get air. My neighborhood helps with the icy carts and ice cream trucks.<br><strong>-Diana, Queens resident, 2024</strong>",
            "marker": {
                "lat": 40.692141693784144,
                "lng": -73.8270469316841,
            },
            "mapState": {
                "lat": 40.692141693784144,
                "lng": -73.8270469316841,
                "zoom": 14,
                "layers": [  
                    "Daytime_summer_surface_temperature"
                ]
            }
        }, 
        {
            "id": "Avoid-leaving",
            "title": "I try to avoid going out in the heat",
            "content": "Our home is an old brick house, which is like an oven. I worry about my cat — I hope he isn't too hot even with the windows open and the electric bill being high. To stay cool, we have to have AC or fans on all the time and take cool showers or wear less layers. We had to take another AC from my in-laws to help with the heat. <br><strong>-Debs C., 2024</strong>",
            "marker": {
                "lat": 40.69218684458226,
                "lng": -73.73291440003689,
            },
            "mapState": {
                "lat": 40.69218684458226,
                "lng": -73.73291440003689,
                "zoom": 14,
                "layers": [ 
                    "Heat_vulnerability_index" 
                ]
            }
        },
        {
            "id": "Overworked",
            "title": "I get overworked when it's hot",
            "content": "I get overworked when it's too hot because people would call 911 just to go to the hospital for AC and I have to intake them; not to mention they don't hydrate properly so I have to give them saline. There's an increase in call volume for EMS. I check the weather on my phone and dress appropriately to stay cool. <br><strong>-Queens resident, 2024</strong>",
            "marker": {
                "lat": 40.70202957919236,
                "lng": -73.74123146150714,
            },
            "mapState": {
                "lat": 40.70202957919236,
                "lng": -73.74123146150714,
                "zoom": 14,
                "layers": [ 
                    "Daytime_summer_surface_temperature",  
                ]
            }
        }, 
        {
            "id": "Trouble-sleeping",
            "title": "I have trouble sleeping when it's warm",
            "content": "I worry about money and shelter. My sleep is affected by the heat; I have trouble sleeping when it's warm. I use AC and take cold showers to stay cool. <br><strong>-Johnmoses, 2024</strong>",
            "marker": {
                "lat": 40.68088025334419,
                "lng": -73.84507398130488,
            },
            "mapState": {
                "lat": 40.68088025334419,
                "lng": -73.84507398130488,
                "zoom": 14,
                "layers": [ 
                    "Heat_vulnerability_index" 
                ]
            }
        }, 
        {
            "id": "Peak-hours",
            "title": "I don't go outside during peak hours",
            "content": "I dress in light clothing. I don't go outside during peak hours. The cooling centers are not close to me so I travel to them. I pay $250 per month in the winter for energy, but in the summer it also costly for AC and fan. Sometimes it costs more than in the winter. I stay indoors and I buy food so I don't have to cook. <br><strong>-Mohini, 2024</strong>",
            "marker": {
                "lat": 40.680441975958985,
                "lng": -73.79396252866313,
            },
            "mapState": {
                "lat": 40.680441975958985,
                "lng": -73.79396252866313,
                "zoom": 14,
                "layers": [ 
                    "Daytime_summer_surface_temperature" 
                ]
            }
        }, 
        {
            "id": "power-bill",
            "title": "I worry about the cost of my power bill",
            "content": "I go to the coffee shop or library to get cool. My home is too hot. <br><strong>-Queens resident, 2024</strong>",
            "marker": {
                "lat": 40.68011652370219,
                "lng": -73.78022961806579,
            },
            "mapState": {
                "lat": 40.68011652370219,
                "lng": -73.78022961806579,
                "zoom": 14,
                "layers": [ 
                    "Vegetative_cover" 
                ]
            }
        },
        {
            "id": "90s-bill",
            "title": "We only use AC when it's almost 90°",
            "content": "We wait until it's extremely hot to turn on the AC. I worry about the children being hot. To try and save on costs, we wait until it's almost into the 90s to put the air on.  <br><strong>-Anonymous, 2024</strong>",
            "marker": {
                "lat": 40.85046293824912,
                "lng": -73.85227787206723,
            },
            "mapState": {
                "lat": 40.85046293824912,
                "lng": -73.85227787206723,
                "zoom": 14,
                "layers": [ 
                    "Household_air_conditioning"  
                ]
            }
        },
        {
            "id": "Asthma-worsens",
            "title": "I get asthma attacks when it's too hot",
            "content": "My sleep and daily life is affected when it's too hot because I get asthma attacks, which force me to go to the ER and I'm heavily out of breath. I worry about my pets and health. I go to public events/places, take cold showers, and keep a bucket of ice water to cool down. <br><strong>-Theresa D., 2024</strong>",
            "marker": {
                "lat": 40.85046293824912,
                "lng": -73.85227787206723,
            },
            "mapState": {
                "lat": 40.85046293824912,
                "lng": -73.85227787206723,
                "zoom": 14,
                "layers": [ 
                    "Asthma_ED_visits"
                ]
            }
        },
        {
            "id": "Dysregulated",
            "title": "My body doesn't know how to regulate",
            "content": "I turn my AC on and have two extra fans 'if its over 70 degrees. I take long walks outside because my apartment gets very hot and it's cooler outside. We have to be careful when we cook during heat waves. We go outside at night to cool off and order take out. I worry about my health; my body does not know how to regulate during high temperature. I have been getting sick a lot. Whenever I walk my dog, I am conscious of how long the walk is. I worry about him getting heat stroke. I get emails from my doctor's office and vet's office to tell me what to look out for. <br><strong>-Queens resident, 2024</strong>",
            "marker": {
                "lat": 40.739596484892296,
                "lng": -73.87787224451348,
            },
            "mapState": {
                "lat": 40.739596484892296,
                "lng": -73.87787224451348,
                "zoom": 14,
                "layers": [ 
                    "Daytime_summer_surface_temperature"
                ]
            }
        }
    ]
}
