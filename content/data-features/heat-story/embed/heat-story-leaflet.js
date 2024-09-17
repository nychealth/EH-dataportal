// ======================================================================= //
// setting up
// ======================================================================= //

// ----------------------------------------------------------------------- //
// define init function
// ----------------------------------------------------------------------- //

// let mouse_count = 0;

function init() {

    console.log("* init");

    addLayerButtons();

    drawStoryCardDropdown();

    drawStoryCard("getting-started");
    $("#btn-getting-started").addClass("active");
    $("#btn-getting-started").attr('aria-selected', true);

    setupMap();
    addListeners();
    loadMetadata().catch(console.log);
}


// ----------------------------------------------------------------------- //
// initial map state
// ----------------------------------------------------------------------- //

// set based on "getting-started" card

const getting_started = config.stories.find(s => s.id == "getting-started");
let lastMapState = JSON.parse(JSON.stringify(getting_started.mapState));


// var map = L.map('map').setView([40.715554, -74.0026642], 11); // [Lat, Long], Zoom
var map = L.map('map').setView([getting_started.mapState.lat, getting_started.mapState.lng], getting_started.mapState.zoom); // [Lat, Long], Zoom



// ----------------------------------------------------------------------- //
// create global vars
// ----------------------------------------------------------------------- //

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// set the popup content separately to handle intersecting layers
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

var popup = null;
var popupContent = "";


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// set up layers
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

var tileLayerGroup = L.layerGroup();
var layerGroup = L.layerGroup();
var storyMarkerLayerGroup = L.layerGroup();

var layerMouseOver = null;
var featureMouseOver = null;

var legendControl = null;
var legendPropertiesByLayer = {};

var layersExclusive = new Set();

var indicators = [];
var mapElement = document.getElementById("wholeMap")

let timeTable;


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// add this field to the layer options to keep a custom id
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

// we'll use the custom ID to keep track of our custom layers by their ID from the config

const CUSTOM_ID_FIELD = '_custom_id';

// to adjust the weights by the zoom, we use a scale factor. the larger it is, the thinner the lines
const ZOOM_WEIGHT_SCALE_FACTOR = 8;


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// function to prettify geo types
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

const prettifyGeoType = (GeoType) => {
    
    switch (GeoType) {
        
        case 'NYCKIDS2017':
        return 'NYCKIDS';
        
        case 'NYCKIDS2019':
        return 'NYCKIDS';
        
        case 'NYCKIDS2021':
        return 'NYCKIDS';
        
        case 'CDTA2020':
        return 'CDTA';
        
        case 'NTA2010':
        return 'NTA';
        
        case 'NTA2020':
        return 'NTA';
        
        default:
        return GeoType;
        
    }
}


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// array of (pretty) geotypes in georank order
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

const geoTypes = [
    "Citywide",
    "Borough",
    "NYCKIDS",
    "UHF34",
    "UHF42",
    "Subboro",
    "CD",
    "CDTA",
    "NTA"
]


// ----------------------------------------------------------------------- //
// create topojson layer type
// ----------------------------------------------------------------------- //

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// extend geojson
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

L.TopoJSON = L.GeoJSON.extend({
    addData: function (data) {
        var geojson, key;
        if (data.type === "Topology") {
            for (key in data.objects) {
                if (data.objects.hasOwnProperty(key)) {
                    geojson = topojson.feature(data, data.objects[key]);
                    L.GeoJSON.prototype.addData.call(this, geojson);
                }
            }
            return this;
        }
        L.GeoJSON.prototype.addData.call(this, data);
        return this;
    }
});


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// layer function
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

L.topoJson = function (data, options) {
    return new L.TopoJSON(data, options);
};


// ----------------------------------------------------------------------- //
// function to get config by layer
// ----------------------------------------------------------------------- //

function getLayerConfigById(layerId) {

    // console.log("** getLayerConfigById");

    const layersFromConfig = config.layers;
    const layerMatch = layersFromConfig.find((layer) => layer.property?.id == layerId)

    // console.log("layerMatch [getLayerConfigById]", layerMatch);

    return layerMatch;

}


// ----------------------------------------------------------------------- //
// Setup the map with the base map and the neighborhoods
// ----------------------------------------------------------------------- //

function setupMap() {

    console.log("* setupMap");

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // map tiles
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    L.tileLayer(
        'https://api.maptiler.com/maps/basic-v2/{z}/{x}/{y}.png?key=dwIJ8hO2KsTMegUfEpYE',{
        attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank" rel="noopener noreferrer">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
    }).addTo(map);

    // add tile layer group to map
    
    tileLayerGroup.addTo(map);

    // add data layer group to map (though nothing to show yet)

    layerGroup.addTo(map);

  map.on("zoomend", () => {
    zoom = map.getZoom();
    // scale the weight based on the zoom layer so it looks good zooming in and out
    layerGroup.eachLayer((layer) => layer.setStyle && layer.setStyle({ weight: zoom / ZOOM_WEIGHT_SCALE_FACTOR }))
  });

}


// ----------------------------------------------------------------------- //
// create layer buttons
// ----------------------------------------------------------------------- //

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// get the elements to append
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

var buttonHolderStudyArea = document.getElementById('buttonHolderStudyArea')
var buttonHolderBase = document.getElementById('buttonHolderBase')
var buttonHolderAdditional = document.getElementById('buttonHolderAdditional')

var buttonHolders = {
    studyArea: buttonHolderStudyArea,
    base: buttonHolderBase,
    additional: buttonHolderAdditional
};

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// define function to create buttons
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

function addLayerButtons() {

    console.log("* addLayerButtons");
    
    const layers = config.layers;
    for (let i = 0; i < layers.length; i++) {

        const layer = layers[i];
        const color = layer.property?.args?.color ?? "grey";
        const button = `
            <button type="button" id="${layer.property.id}" class="mb-1 mr-1 layer-button btn btn-sm btn-outline-secondary no-underline">
                <span style="color: ${color};">
                    <i class="fas fa-square mr-1"></i>
                </span>
                ${layer.property.name}
            </button>`

        const buttonHolder = buttonHolders[layer.property?.buttonSection ?? "additional"];
        buttonHolder.innerHTML += button;
        if (layer.property?.exclusive === true) {
            layersExclusive.add(layer.property.id);
        }
    };
}


// ======================================================================= //
// functions to display content
// ======================================================================= //

// ----------------------------------------------------------------------- //
// create story dropdown and card
// ----------------------------------------------------------------------- //

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// create dropdown for story buttons
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

function drawStoryCardDropdown() {

    console.log("* drawStoryCardDropdown");

    const storyTitleDropdown = document.getElementById('storyTitleDropdown');
    
    const stories = config.stories;

    // loop through stories

    for (let i = 0; i < stories.length; i++) {

        const story = stories[i];

        // construct story button with title
        
        const storyButton = `
            <button id="btn-${story.id}" class="dropdown-item story-dropdown-item" type="button" data-story-id=${story.id}>
                ${story.title}
            </button>
        `;

        // add titles to dropdown

        storyTitleDropdown.innerHTML += storyButton;

    }

    const storyButtons = document.querySelectorAll('#storyTitleDropdown');

    // add event listeners for story button clicks

    storyButtons.forEach(btn => {
        btn.addEventListener('click', handleStoryClick);
    })

}


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// get story ID from click event
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

// custom map pin marker

// map_pin = fa-map-pin

let size = 50;
let half = size/2;

var map_pin = L.icon({
    // iconUrl: 'map_pin.png',
    iconUrl: 'map-pin.svg',
    iconSize: [size, size],
    iconAnchor: [half, size] // [x, y] from top left
});


// story click

const handleStoryClick = (e) => {

    console.log("** handleStoryClick");

    // get story IDn then pass to card drawing function

    const id = e.target.dataset.storyId;
    
    drawStoryCard(id)

    // remove active class from every list element

    $('.story-dropdown-item').removeClass("active");
    $('.story-dropdown-item').attr('aria-selected', false);

    // set this element as active & selected

    $(e.target).addClass("active");
    $(e.target).attr('aria-selected', true);

    // add story marker if it exists

    const story = config.stories.find(s => s.id == id);

    // clear story layers

    storyMarkerLayerGroup.clearLayers();

    if (story.marker) {

        const marker = L.marker([story.marker.lat, story.marker.lng], {icon: map_pin});

        storyMarkerLayerGroup.addLayer(marker);

        storyMarkerLayerGroup.addTo(map);

    }

}


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// show story content
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

function drawStoryCard(id) {

    console.log("* drawStoryCard");

    console.log(">> story ID", id);

    // get story content by ID
    
    const story = config.stories.find(s => s.id == id);

    // we can put an image in the story definition

    const storyCard = `
        <div class="story-card" id="story-card-${id}">
            <div class="card content-card ">
                <div class="card-content content-card-height">
                    <div class="card-body story-card-content">
                        <span class="fs-md font-weight-bold">${story.title}</span>
                        <blockquote class="blockquote mb-0 fs-md">
                            <p class="card-text"><em>${story.content}</em></p>
                        </blockquote>
                    </div>
                </div>
            </div>
        </div>
    `;

    // replace storyCardHolder inner HTML with story content

    const storyCardHolder = document.getElementById('story-card-general-holder')

    storyCardHolder.innerHTML = storyCard;

}


// ----------------------------------------------------------------------- //
// create redlining layer
// ----------------------------------------------------------------------- //
/*
 * The redlined layer comes from a series of JS files. See the red lined HOLC map for details
 * This function pulls those files and creates a custom layer. It is a categorical layer, so
 * colors are based on category, not a continuous line.
 */


async function createRedlinedLayer({ id, name, urls, args, displayProperties }) {

    console.log("* createRedlinedLayer");

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // get data
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    
    const data = {}

    for (const [name, url] of Object.entries(urls)) {

        const response = await fetch(url);

        if (!response.ok) {
            return null;
        }

        let responseText = await response.text(); 

        data[name] = JSON.parse(responseText);

    }


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // style map
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    
    const onStyle = (feature) => {

        // console.log("** onStyle [createRedlinedLayer]");
    
        const fillColor = args?.colorMap != null
            ? args.colorMap[feature.properties[args.colorFeatureProperty]]
            : args?.defaultColor;

        const colors = ({
            ...(fillColor != null && { fillColor: fillColor }),
            ...(args?.color != null && { color: args.color }),
            ...(args?.opacity != null && { opacity: args.opacity }),
            ...(args?.opacity != null && fillColor != null && { fillOpacity: args.opacity * args.opacity }),
        });
        return {
            ...colors,
        };
    }


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // create geojson layer
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    
    const layer = L.geoJSON(
        Object.values(data),
        {
            style: onStyle,
            onEachFeature: function(feature, layer) {
                layer.on('mouseover', function(event) {

                    // console.log("mouseover [createRedlinedLayer]");

                    layerMouseOver = layer;
                    featureMouseOver = feature;
                    layerMouseOver[layer.options[CUSTOM_ID_FIELD]] = true;
                    updatePopup(event.latlng);
                });
                layer.on('mouseout', function() {
                    if (layer.options[CUSTOM_ID_FIELD] == layerMouseOver.options._custom_id) {
                        layerMouseOver = null;
                        featureMouseOver = null;
                    }
                });
            },
            _custom_id: id,
            displayProperties: displayProperties,
            name: name,
        });


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // create legend
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    layer.options.legendFunc = legendFuncForLayer(id, name, args, layer);

    // console.log("layer [createRedlinedLayer]", layer);

    return layer;
}


// ----------------------------------------------------------------------- //
// Create a layer based on the measures data from DoH
// ----------------------------------------------------------------------- //

async function createMeasuresLayer({ id, name, measureInfo, args, displayProperties }) {

    console.log("* createMeasuresLayer");
    
    console.log("measureInfo [createMeasuresLayer]", measureInfo);

    const { indicatorID, measureID, geoType, time } = measureInfo;
    const data = await loadIndicator(indicatorID, measureID, geoType, time);

    const values = data.features.map(f => f.properties.Value)
        .filter(x => x != null && !isNaN(x));

    const colorChroma = chroma.scale([args?.minColor ?? '#fff', args?.maxColor ?? '#000'])
        .domain([Math.min(...values), Math.max(...values)]);
    

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // style map
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    
    const onStyle = (feature) => {

        const fillColor = args?.colorMap != null
            ? args.colorMap[feature.properties.Value]
            : colorChroma(feature.properties.Value);

        const colors = ({
            ...(fillColor != null && { fillColor: fillColor }),
            ...(args?.color != null && { color: args.color }),
            ...(args?.opacity != null && { opacity: args.opacity }),
            ...(args?.opacity != null && fillColor != null && { fillOpacity: args.opacity * args.opacity }),
        });

        return { ...colors };
    }

    // All metrics have an Id of value. Add that to 
    const updatedDisplayProperties = {...displayProperties, 
        displayPropertyArgs: displayProperties.displayPropertyArgs
            ? displayProperties.displayPropertyArgs.map(x => { return {...x, id: "Value"}})
            : [{ "id": "Value", }]
    };


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // create geojson layer
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    
    const layer = L.geoJSON(
        data,
        {
            style: onStyle,
            onEachFeature: function(feature, layer) {
                //layer.bindPopup("Hello popup", {});
                layer.on('mouseover', function(event) {

                    // console.log("mouseover [createMeasuresLayer]");

                    layerMouseOver = layer;
                    featureMouseOver = feature;
                    layerMouseOver[layer.options[CUSTOM_ID_FIELD]] = true;
                    updatePopup(event.latlng);
                });
                layer.on('mouseout', function() {
                    if (layer.options[CUSTOM_ID_FIELD] == layerMouseOver.options._custom_id) {
                        layerMouseOver = null;
                        featureMouseOver = null;
                    }
                });
            },
            _custom_id: id,
            displayProperties: updatedDisplayProperties,
            name: name,
        });


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // create legend
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    layer.options.legendFunc = legendFuncForLayer(id, name, args, layer);

    // console.log("layer [createMeasuresLayer]", layer);

    return layer;
}


// ----------------------------------------------------------------------- //
// Create a geojson layer using a url with proper geojson data
// ----------------------------------------------------------------------- //

async function createGeoJsonLayer({ id, name, url, args, displayProperties }) {

    console.log("* createGeoJsonLayer");

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // fetch data
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    
    const response = await fetch(url);

    // if bad response, return

    if (!response.ok) {
        return null;
    }

    let data = null;

    try {
        data = await response.json();
    } catch (error) {
        console.log(error);
    }

    // console.log("data [createGeoJsonLayer]", data);


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // format colors
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    let colorChroma = null;

    if (args?.colorFeatureProperty != null) {

      const values = data.features.map(f => f.properties[args.colorFeatureProperty])
          .filter(x => x != null && !isNaN(x));

      colorChroma = chroma.scale([args?.minColor ?? '#fff', args?.maxColor ?? '#000'])
        .domain([Math.min(...values), Math.max(...values)]);

    }


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // style map
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    
    const onStyle = (feature) => {
        
        // console.log("** onStyle [createGeoJsonLayer]");
        
        const fillColor = args?.colorFeatureProperty != null
            ? colorChroma(feature.properties[args.colorFeatureProperty])
            : args?.fillColor;

        const colors = ({
            ...(fillColor != null && { fillColor: fillColor }),
            ...(args?.color != null && { color: args.color }),
            ...(args?.opacity != null && { opacity: args.opacity }),
            ...(args?.opacity != null && fillColor != null && { fillOpacity: args.opacity * args.opacity }),
        });

        return { ...colors };
    }


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // create geojson layer
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // figure out which pane to put it on

    let isPoint = /Point/i.test(data.features[0].geometry.type)

    const layer = L.geoJSON(
        data,
        {
            // if we wanted to customize the marker we'd use 'pointToLayer', but we'd have to get clever about passing the options, because "inherit" doesn't seem to work with a custom function 
            style: onStyle,
            onEachFeature: function(feature, layer) {

                layer.on('mouseover', function(event) {

                    layerMouseOver = layer;
                    featureMouseOver = feature;
                    layerMouseOver[layer.options[CUSTOM_ID_FIELD]] = true;
                    updatePopup(event.latlng);

                });

                layer.on('mouseout', function() {

                    if (layer.options[CUSTOM_ID_FIELD] == layerMouseOver.options._custom_id) {
                        layerMouseOver = null;
                        featureMouseOver = null;
                    }

                });

            },
            markersInheritOptions: true,
            // geoJSON by default is on overlay pane, which is behind marker shadows, so put it on the marker pane if it's a point geometry
            pane: isPoint ? "markerPane" : "overlayPane",
            _custom_id: id,
            displayProperties: displayProperties,
            name: name
        });


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // create legend
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    layer.options.legendFunc = legendFuncForLayer(id, name, args, layer);

    // console.log("layer [createGeoJsonLayer]", layer);

    return layer;

}


// ----------------------------------------------------------------------- //
// Create a layer from geotiff file using a 3rd party library.
// ----------------------------------------------------------------------- //

//  Geotiff files are images. This is good for heatmap and continuous data.

async function createGeotiffLayer({ id, url, args, name }) {

    console.log("* createGeotiffLayer");
    

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // fetch data
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    
    const response = await fetch(url);

    // if bad response, return

    if (!response.ok) {
        return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    
    // data is a georaster

    let data = await parseGeoraster(arrayBuffer);

    console.log("data [georaster]", data);

    // console.log("mins [createGeotiffLayer]", data.mins[0]);
    // console.log("maxs [createGeotiffLayer]", data.maxs[0]);

    const colorStart = args?.colorStart || '#0f0';
    const colorStop = args?.colorStop || '#f00';
    const colorChroma = chroma.scale([colorStart, colorStop]).domain([data.mins[0], data.maxs[0]]);
    
    
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // create legend
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    
    const legendFunc = () => {

        // console.log("mins [legendFunc (createGeotiffLayer)]", data.mins[0]);
        // console.log("maxs [legendFunc (createGeotiffLayer)]", data.maxs[0]);

        const colorStart = args?.colorStart || '#0f0';
        const colorStop = args?.colorStop || '#f00';
        const legend = name + '<span style="'
            + ` background-image: linear-gradient(to right, ${colorStart}, ${colorStop});`
            + ' height: 20px;     width: 100%;'
            + ' display: block; background-repeat: no-repeat;'
            + ' "></span>'
            + ' <div style="display: block; width: 100%;">'
            + ((data.mins && data.mins[0]) ? `<div style="float: left">${data.mins[0].toFixed(1)}</div>` : '')
            + ((data.maxs && data.maxs[0]) ? `<div style="float: right">${data.maxs[0].toFixed(1)}</div>` : '')
            + '</div>';

        return legend;

    }


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // create geo raster layer
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    
    const layer = new GeoRasterLayer({

        georaster: data,
        opacity: 0.6,
        resolution: args?.resolution || 64,
        pixelValuesToColorFn: values => {
            return values[0] > 0.0001 ? colorChroma(values[0]) : null;
        },
        legendFunc: legendFunc,
        _custom_id: id,

    });


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // add mouseover to geo raster layer
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // map.on("click", async (event) => {

    //     let lng = event.latlng.lng
    //     let lat = event.latlng.lat

    //     console.log("lng", lng, "lat", lat);
        
    //     let value = 
    //         await geoblaze.identify(
    //             data, 
    //             [lng, lat]
    //         );

    //     console.log(`georaster (${lat.toFixed(5)}, ${lng.toFixed(5)}): ${value}`);
        
    //     // updatePopup(event.latlng);
            
    // });
    
    // console.log("layer [createGeotiffLayer]", layer);

    return layer;

}


// ----------------------------------------------------------------------- //
// Create layers by calling layer funs
// ----------------------------------------------------------------------- //
/*
 * Create a layer using the layer configs.
 * The layers are created by type using all their arguments.
 */

let layers = {};

async function createLayer(layerId) {

    // console.log("* createLayer:", layerId);
    
    const layerConfig = config.layers.find(l => l.property.id == layerId);
    if (layerConfig == null) {
        console.log(`Could not find layer ${layerId} in config`);
        return;
    }

    const properties = layerConfig.property;

    let layer = null;
    switch (properties.type) {
        case 'geojson':
            layer = await createGeoJsonLayer(properties);
            break;
        case 'measureData':
            layer = await createMeasuresLayer(properties);
            break;
        case 'raster':
            layer = await createGeotiffLayer(properties);
            break;
        case 'redlined':
            layer = await createRedlinedLayer(properties);
            break;
        default:
            console.log(`Could not create layer of type ${properties.type}`);
    }

    if (layer == null) {
        return null;
    }

    layers[layerId] = layer;

    return layer;
}


// ----------------------------------------------------------------------- //
// layer manipulation functions
// ----------------------------------------------------------------------- //

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// Get a layer from the layer cache. If it does not exist, create it.
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

async function getOrCreateLayer(layerId) {

    console.log("* getOrCreateLayer:", layerId);
    
    let layer;

    if (!(layerId in layers)) {
        layer = await createLayer(layerId);
    } else {
        layer = layers[layerId];
    }

    return layer;
}


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// Add a layer to the map
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
/*
 * If it does not exist in the cache, create it.
 * If the layer is already on the map, ignore it.
 */

async function addLayerToMap(layerId) {

    console.log("* addLayerToMap:", layerId);
    
    const layer = await getOrCreateLayer(layerId);

    // console.log("layer [addLayerToMap]", layer);

    if (layer != null && !map.hasLayer(layer)) {

        layerGroup.addLayer(layer);
        const zoom = map.getZoom();
        layer.setStyle && layer.setStyle({ weight: zoom / ZOOM_WEIGHT_SCALE_FACTOR });

        // only one active one at a time
        if ( layersExclusive.has(layerId) ) {

            for (_layerId in layersVisible) {

                // this only applies to exclusive layers
                if (!layersExclusive.has(_layerId)) {
                    continue;
                }

                const isVisible = layersVisible[_layerId];
                
                if ( isVisible === true && _layerId !== layerId ) {
                    removeLayerFromMap(_layerId);
                }
            }
        }

        layersVisible[layerId] = true;
        const button = document.querySelector(`#${layerId}`)

        if (button != null) {
            button.classList.add("active");
        }

        createLegend("addLayerToMap")
    }

    // show reset button

    $("#refreshButton").css("visibility", "visible");
    
}


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// Remove layer from the map & Update the layer button
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

function removeLayerFromMap(layerId) {

    console.log("* removeLayerFromMap:", layerId);
    
    if (layerId in layers) {

        const layer = layers[layerId];
        layerGroup.removeLayer(layer);
        delete layersVisible[layerId];
        const button = document.querySelector(`#${layerId}`)

        if (button != null) {
            button.classList.remove("active");
        }
    }

    createLegend("removeLayerFromMap")

}


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// toggle layers
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
/*
 * If a layer is on the map, take it off. If it is not on the map, add it.
 */

let layersVisible = {};

async function toggleLayerOnMap(layerId, button) {

    console.log("* toggleLayerOnMap:", layerId);
    
    // FIXME disable while waiting
    try {
        button.disabled = true;
        if (!(layerId in layersVisible)) {
            // FIXME make this a set
            await addLayerToMap(layerId);
        } else {
            removeLayerFromMap(layerId);
        }
    } catch (error) {
    } finally {
        button.disabled = false;
    }
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// track map state
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
/*
 * Keep track of the current map state.
 * Stores the lat, lng, zoom and visible layers
 */

function saveCurrentMapState() {

    console.log("* saveCurrentMapState");
    
    const { lat, lng } = map.getCenter();
    const zoom = map.getZoom();
    lastMapState.lat = lat;
    lastMapState.lng = lng;
    lastMapState.zoom = zoom;

    var layersVisible = []
    layerGroup.eachLayer(l => layersVisible.push(l.options[CUSTOM_ID_FIELD]));
    lastMapState.layers = layersVisible.filter(x => x);
}


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// update map state
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
/**
 * Update the map state to show a story.
 * @param {*} storyId 
 * @returns 
 */

async function updateMapStateForStory(storyId) {

    console.log("* updateMapStateForStory");

    const storyConfig = config.stories.find(s => s.id == storyId);

    if (storyConfig == null) {
        console.log(`Could not find story ${storyId} in config`);
        return;
    }

    const mapState = storyConfig.mapState;
    const { lat, lng, zoom } = mapState;

    if ( lat != null && lng != null && zoom != null ) {
        saveCurrentMapState();
        map.flyTo([lat, lng], zoom);
    }

    const layers = mapState.layers;

    var layersVisible = []
    layerGroup.eachLayer(l => layersVisible.push(l.options[CUSTOM_ID_FIELD]));

    // add the layers that are not in the visible layer
    layers.filter(l => !(l in layersVisible)).forEach(async l => {
        await addLayerToMap(l);
    });

    // remove
    layersVisible.filter(l => !(l in layers)).forEach(async l => {
        removeLayerFromMap(l)
    });

    // clear out the layer markers
    // map.removeLayer(storyMarkerLayerGroup);
    // $("#refreshButton").css("visibility", "visible");
}


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// reset map state
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
/*
 * Reset the map config based on the last known map state.
 */

async function resetMapState() {

    console.log("* resetMapState");

    // reset map state var to "getting-started" state

    lastMapState = JSON.parse(JSON.stringify(getting_started.mapState));

    // reset map view

    console.log("getting_started.mapState", getting_started.mapState);

    map.setView([getting_started.mapState.lat, getting_started.mapState.lng], getting_started.mapState.zoom); // [Lat, Long], Zoom

    // clear data layers

    Object.keys(layersVisible).forEach(layerId => removeLayerFromMap(layerId));
    
    // clear story layers

    storyMarkerLayerGroup.clearLayers();

    // hide the reset button
    
    $("#refreshButton").css("visibility", "hidden");
    
    // reset the story card and dropdown

    $('.story-dropdown-item').removeClass("active");
    $('.story-dropdown-item').attr('aria-selected', false);

    $("#btn-getting-started").addClass("active");
    $("#btn-getting-started").attr('aria-selected', true);

    drawStoryCard("getting-started");

    // reset the layer buttons

    $('.layer-button').removeClass("active");
    $('.layer-button').attr('aria-selected', false);

}


// ----------------------------------------------------------------------- //
// popup functions
// ----------------------------------------------------------------------- //

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// format data value
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
/*
 * Format the value based on a type.
 * Types can be
 *    float       - float with two decimal places
 *    percentage  - two decimal places with a percentage sign
 *    currency    - only USD, includes $xxx.xx
 */

function formatValue(value, type) {

    // console.log("* formatValue");
    // console.log(">> value [formatValue]", value);
    // console.log(">> type [formatValue]", type);
    
    // FIXME handle NaN
    if (type == null || value == null) return value;

    switch(type) {

    case 'float':
        return `${value.toFixed(1)}`;
    case 'percentage':
        return `${(value * 100).toFixed(1)}%`;
    case 'currency':
        // code block
        return value.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
        });

    default:
        return value;

    }
}


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// create popup HTML
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
/*
 * The html is based on displayProperties and displayPropertyArgs
 * from the config that then get put into the layer.
 */

//  NEED A WAY TO CREATE THE POPUP THAT IS AWARE OF ALL LAYERS, WITHOUT FIRING AN EVENT ON LITERALLY EVERY MOUSEMOVE

function featureInfoToHtmlForPopup(feature, layer) {

    // console.log("* featureInfoToHtmlForPopup");

    // console.log("feature [featureInfoToHtmlForPopup]", feature);
    // console.log("layer [featureInfoToHtmlForPopup]", layer);
    
    const displayProperties = layer.options.displayProperties;

    if (displayProperties == null || displayProperties?.displayPropertyArgs == null) {
        return '';
    }

    // convert our list of arguments in the format of { id, value } to { id: { id, value } }
    const displayPropertyArgs = displayProperties?.displayPropertyArgs?.reduce((m, x) => {
        m[x.id] = x;
        return m;
    }, {});

    const missingDisplay = displayProperties.missingDisplay || '';

    // create a map of unique keys to values
    const featureMap = Object.entries(feature.properties)
        .filter(x => x[0] in displayPropertyArgs)
        .map(x => {

            let displayName = displayPropertyArgs[x[0]]?.displayName ?? x[0];
            let units = displayPropertyArgs[x[0]]?.units ?? "";
            let display_units = `${displayName}${units && ` (${units})`}`

            // console.log("disp", [displayName, units, display_units]);

            let ret = [
                `${display_units}`, 
                formatValue(x[1], displayPropertyArgs[x[0]]?.format)
            ]
            
            return ret;

        })
        .reduce((m, [k, v]) => {m[k] = v ?? m[k]; return m;}, {});


    // EITHER NEED TO EDIT THE GEOJSON ETC. SOURCES TO CONTAIN STANDARDIZED FIELD NAMES, OR USE CONDITIONALS

    const geoName = feature.properties.GEONAME;

    const geoTypePretty = prettifyGeoType(feature.properties.GeoType);

    // console.log("GEOTypePretty", geoTypePretty);

    // then create that into an html table
    const featureTable = Object.entries(featureMap)
        .map(x => `<tr class="fs-sm"><td>${x[0]}</td><td style="text-align: left;">${x[1] ?? missingDisplay}</td></tr>`);

    // console.log("featureTable [featureInfoToHtmlForPopup]", featureTable);

    // debugger;

    if (!featureTable.length || !featureTable.length) {
        return missingDisplay != null
            ? `<h3 class="h6">${layer.options.name}</h3>${missingDisplay}`
            : '';
    }

    // return `<h5>${layer.options.name}</h5><table class="table popup-table table-bordered" style="width:100%">${featureTable.join('')}</table>`;

    let popup_html = 
        `<h3 class="h6">${layer.options.name}</h3>` +
        // `<table class="table popup-table" rules="all" style="width:100%">` + 
        `<table class="table popup-table" style="width:100%">` + 
        // `<tr><th>${layer.options.name}</th></tr>` + 
        `<tr class="fs-sm"><td>Neighborhood (${geoTypePretty})</td><td>${geoName}</td></tr>` +
        `${featureTable.join('')}</table>`

    return popup_html;
}


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// Format the popup (tooltip)
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

// Iterate over each feature in the popup and turn it into html

function formatPopup(features) {

    // console.log("* formatPopup");

    // console.log("features [formatPopup]", features);
    
    const updates = features
        .sort((a, b) => (a?.layer?.options?.sortOrder ?? 999) - (b?.layer?.options?.sortOrder ?? 999))
        .map(({ feature, layer }) => featureInfoToHtmlForPopup(feature, layer))
        .filter(x => x != "")
        .join("<br />");

    // console.log("updates [formatPopup]", updates);

    return updates == "" ? null : updates;
}


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// update the popup (tooltip)
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
/*
 * This function looks at the visible layers in the layer group,
 * grabs the data for each layer, formats the data, then displays it.
 *
 * The point-in-polygon algorithm is used to find overlapping layers.
 * This functionality is not native to leaflet, so we used a third party library.
 */

function updatePopup({ lat, lng }) {

    // console.log("* updatePopup");
    
    const visibleLayers = Object.keys(layerGroup._layers);

    // console.log("visibleLayers [updatePopup]", visibleLayers);

    // if there are no layers, then we don't need a popup
    if (Object.keys(layerGroup._layers).length == 0 || featureMouseOver == null) {
    // if (Object.keys(layerGroup._layers).length == 0) {

        // console.log("no layers [updatePopup]");

        if (popup != null) {
            popup.removeFrom(map);
            popup = null;
        }

        popupContent = null;
        return;
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // handle multiple layers
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    let features = [{ feature: featureMouseOver, layer: layerMouseOver }];

    if (visibleLayers.length > 1) {

        // check intersections

        layerGroup.eachLayer(_layer => {

            // only check intersections if we are going to display something

            if (_layer.options.displayProperties == null) {
                return;
            }

            // this is our main layer. we know we overlap here because we are in this function, so ignore it.

            // console.log("CUSTOM_ID_FIELD [updatePopup]", layerMouseOver.options[CUSTOM_ID_FIELD]);
            // console.log("_custom_id [updatePopup]", _layer.options._custom_id);

            if (layerMouseOver.options[CUSTOM_ID_FIELD] == _layer.options._custom_id) {
                return;
            }

            // check for more than 1 layer at mouse location

            let intersection = [];

            try {
                intersection = leafletPip.pointInLayer({ lat, lng }, _layer);
            } catch(err) {
                console.log(err);
            }

            // keep track of the intersections

            if (intersection.length > 0) {
                features.push({feature: intersection[0].feature, layer: _layer});
            }

        });
    }

    const content = formatPopup(features);

    // console.log("popup [updatePopup]", popup);
    // console.log("content [updatePopup]", content);

    if (popup == null && content != null) {

        // new popup

        // console.log("> new popup");

        popup = L.popup({autoPan: false, maxWidth: 560}).setLatLng({ lat, lng }).setContent(content).openOn(map);
        popupContent = content;

    } else if ( popup != null && content != null) {

        // change the content of an existing popup

        // console.log("> change popup");

        popup.setLatLng({ lat, lng });

        if (content != popupContent) {
            popupContent = content;
            popup.setContent(content);
        }

    } else if (popup != null && content == null) {

        // popup should be removed

        // console.log("> remove popup");

        popup.removeFrom(map);
        popup = null;

    }
}


// ----------------------------------------------------------------------- //
// legend functions
// ----------------------------------------------------------------------- //

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// extend legend
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
/*
 * Create a custom legend control for leaflet.
 * This example can be found in the docs.
 */

L.Control.Legend = L.Control.extend({
    options: {
        collapsed: false,
        position: 'bottomright',
        label: null,
    },
    initialize: function (layerGroup, options) {
        L.Util.setOptions(this, options);
    },
    onAdd: function (map) {
        // console.log("onAdd [L.Control.Legend]");
        const htmls = [];
        layerGroup.eachLayer(layer => {
            const layerEventHash = this.options?.properties?.layerEventHash;
            // the layer may exist on the map if we remove it (async code, in the process of removing)
            // check the last layer hash to see if this layer shouldn't be in the legend
            if (layerEventHash?.type == 'layerremove' && layerEventHash?.id == layer.options[CUSTOM_ID_FIELD]) {
                return;
            }

            if (layer.options?.legendFunc == null) {
                return;
            }
            const html = layer.options.legendFunc();
            if (html === '') {
                return;
            }
            htmls.push(html);
        });

        if (!htmls.length) {
            return L.DomUtil.create('div', '');
        }

        var div = L.DomUtil.create('div', 'info legend mb-2');
        L.DomUtil.addClass(div, 'leaflet-control-layers-expanded');
        const innerHtml = '<fieldset><h6></h6><table>' + htmls.join('<br />') + '</table></fieldset>';
        // console.log("innerHtml [onAdd]", innerHtml);
        div.innerHTML = innerHtml;
        return div;
    }
});


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// legend layer function
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

L.control.legend = function (overlays, options) {
    return new L.Control.Legend(overlays, options);
};

// layer events happen waaay too often.
// keep track of the last one to skip if a duplicate.
// the duplicate happens because each layer has multiple little sub layers

let lastLayerEventHash = {id: null, type: null};


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// legend adding function
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
/*
 * Create the legend. The legend comes from the legendDescription
 * and gets added below the map in a separate div
 */

function createLegend(fun) {

    console.log("* createLegend [", fun, "]");
    
    let legendDescriptions = [];

    layerGroup.eachLayer(_layer => {

        const config = getLayerConfigById(_layer.options[CUSTOM_ID_FIELD]);

        if (config == null || config?.property?.args?.legendDescription == null) {
            return;
        }

        legendDescriptions.push(config?.property?.args?.legendDescription);

    });

    // combine descriptions and add to the div

    // const legendDescriptionsDiv = document.getElementById("legendDescriptions");
    // legendDescriptionsDiv.innerHTML = legendDescriptions.join('<br />');

    if (legendControl != null) {
        map.removeControl(legendControl);
    }

    legendControl = L.control.legend(layerGroup, { label: 'Legend' });
    legendControl.addTo(map);


}


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// create legend for color maps
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
/*
 * Create the legend for a layer that uses a color map
 */
const legendFuncForColorMap = (name, args) => {

    // console.log("** legendFunc [createRedlinedLayer]");

    if (!args?.colorMap) {
        return '';
    }

    const colorMapEntries = Object.entries(args.colorMap).sort();
    let gradients = [];
    let labels = [];
    // split into even parts
    // see an example https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_images/Using_CSS_gradients#creating_color_bands_stripes
    const percent = 100 / colorMapEntries.length;

    for (let i = 0; i < colorMapEntries.length; i++) {

        const [value, color] = colorMapEntries[i];

        if (i > 0) {
            gradients.push(`${color} ${i * percent}%`);
        }

        gradients.push(`${color} ${(i + 1) * percent}%`);
        labels.push(`<div style="float: left; width: ${percent}%; text-align: center;">${value}</div>`);

    }

    const backgroundCss = `background: linear-gradient(to right, ${gradients.join(', ')});`

    var legend = name + '<span style="'
        + backgroundCss
        + ' height: 20px; width: 100%;'
        + ' display: block; background-repeat: no-repeat;'
        + ' "></span>'
        + " <style> .redlined-row:after { content: \"\"; display: table; clear: both; } </style>"
        + ' <div class="redlined-row">'
        + labels.join('')
        + '</div>';

    return legend;
}


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// create legend function
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
/*
 * Generic function to create legend for layers. Calls the colorMap function if a colorMap is found.
 * Doesn't work for geotiffs
 */
const legendFuncForLayer = (id, name, args, layer) => {

    return () => {
        // console.log("** legendFunc [createMeasuresLayer]");
        if (args?.colorMap) {
            return legendFuncForColorMap(name, args);
        }

        if (!args?.fillColor && !args?.color && !args?.minColor && !args?.maxColor) {
            return '';
        }

        const background = args?.fillColor
            ? `background: ${args.fillColor};`
            : args?.legendColor
            ? `background: ${args.legendColor};`
            : '';

        // const borderColor = args?.color ? `border-width: 0px; border-color: ${args?.color}; border-style: solid;` : '';
        const borderColor = '';

        const backgroundCss = (args.colorFeatureProperty != null
                && args?.minColor != null && args?.maxColor != null)
            ? `background-image: linear-gradient(to right, ${args.minColor}, ${args?.maxColor});`
            : ('' + background + borderColor);

        var legend = name + '<span style="'
            + backgroundCss
            + ' height: 20px;  width: 100%;'
            + ' display: block; background-repeat: no-repeat; '
            + ' "></span>'

        if (args.colorFeatureProperty) {
            const values = layer.getLayers()
                .map(x => x.feature.properties.Value)
                .filter(x => x != null && !isNaN(x));
            legend += '<div style="display: block; width: 100%;">'
                + `<div style="float: left;">${Math.min(...values).toFixed(2)}</div>`
                + `<div style="float: right;">${Math.max(...values).toFixed(2)}</div></div>`;
        }

        if (args.legendDescription) {
            const collapseId = `${id}LegendCollapse`;
            legend += `<br /><div style="display: block; width: 100%; max-width: 275px; font-size: 90%"><a data-toggle="collapse" href="#${collapseId}" role="button" aria-expanded="false" aria-controls="${collapseId}">More info about ${name}</a>`
                + `<div class="collapse" id="${collapseId}">${args.legendDescription}</div></div>`;
        }

        return legend;
    }
}


// ======================================================================= //
// loading EHDP data
// ======================================================================= //

// ----------------------------------------------------------------------- //
// fetch metadata
// ----------------------------------------------------------------------- //

async function loadMetadata() {

    console.log("* loadMetadata");
    
    const response = await fetch(data_repo + data_branch + '/indicators/metadata/metadata.json');
    indicators = await response.json();
    // console.log("metadata.json: ", indicators);

}


// ----------------------------------------------------------------------- //
// load and format indicator data
// ----------------------------------------------------------------------- //

async function loadIndicator(indicatorID, measureID, geoType, time) {

    console.log("* loadIndicator");

    // indicators have measures. we want to search both
    /*
    const sampleIndicatorID = 2024; // Black carbon
    const sampleMeasureID = 370; // Black carbon, Mean
    const geoType = 'UHF42';
    const time = 'Summer 2021';
    */

    const indicator = indicators.filter(x => x.IndicatorID == indicatorID)[0];

    if (indicator == null) {
        console.log(`ERROR: No indicator found with indicatorID ${indicatorID}`);
    }

    const measure = indicator.Measures.filter(x => x.MeasureID == measureID)[0]; 

    if (measure == null) {
        console.log(`ERROR: No data found with indicatorID ${indicatorID}, measureID ${measureID}. Missing measure.`);
    }

    // actually load the data
    
    const data = await loadData(indicatorID);

    // console.log("data [loadIndicator]", data);

    const filteredData = data.filter(d => d.MeasureID == measure.MeasureID && d.GeoType == geoType && d.TimePeriod == time);

    // console.log("filteredData [loadIndicator]", filteredData);

    if (filteredData == null) {
        console.log(`ERROR: No data found with indicator ${indicatorID}, measureID ${indicatorID}, GeoType ${geoType}, time ${time}`);
    }
    
    // the below is taken from other parts of the code.
    // this grabs all the data and joins the geodata to the features to create geojson

    const filteredDataMap = filteredData.reduce((x, y) => {x[y.GeoID] = y; return x}, {})

    const renderedMap = renderMap(filteredData, measure);
    // console.log("renderedMap [loadIndicator]", renderedMap);

    const responseTopo = await fetch(renderedMap.url);
    // console.log("responseTopo [loadIndicator]", responseTopo);

    const topoData = await responseTopo.json();
    // console.log("topoData [loadIndicator]", topoData);

    const geoJsonData = topojson.feature(topoData, topoData.objects.collection)
    // console.log("geoJsonData 1 [loadIndicator]", geoJsonData);
    
    geoJsonData.features = geoJsonData.features.map(feature => {
        const properties = {...feature.properties, ...(filteredDataMap[feature.properties.GEOCODE] ?? {})};
        return {...feature, properties};
    });
    
    // console.log("geoJsonData 2 [loadIndicator]", geoJsonData);

    return geoJsonData;

}


// ----------------------------------------------------------------------- //
// fetch indicator data
// ----------------------------------------------------------------------- //

const loadData = async (indicatorID) => {

    console.log("* loadData");

    // console.log("indicatorID [loadData]", indicatorID);

    let data_url = data_repo + data_branch + `/indicators/data/${indicatorID}.json`;
    let indicator_data;

    // wait for data and time periods to load

    await Promise.all([

        aq.loadJSON(data_url, {autoType: false})
            .then(async (d) => {

                indicator_data = await d;

                // console.log("indicator_data [loadData]");
                // indicator_data.print()

            }),

        loadTime()

    ])

    data = indicator_data

        // join the additional time period info
        .join(timeTable, "TimePeriodID")
        .select(aq.not("TimePeriodID", "TimeType", "start_period", "end_period"))
        .reify()
    
    // console.log("data.objects() [loadData]", data.objects());

    return data.objects();

}


// ----------------------------------------------------------------------- //
// fetch time period metadata
// ----------------------------------------------------------------------- //

const loadTime = async () => {

    console.log("* loadTime");

    const timeUrl = `${data_repo}${data_branch}/indicators/metadata/TimePeriods.json`;

    await aq.loadJSON(timeUrl, {autoType: false})
        .then(async (data) => {

            timeTable = await data;

            // console.log("timeTable [loadTime]");
            // timeTable.print()

    });
}


// ----------------------------------------------------------------------- //
// fetch geo info
// ----------------------------------------------------------------------- //

const renderMap = ( data, metadata ) => {

    console.log("* renderMap");
    
    let mapGeoType = data[0].GeoType

    // console.log("mapGeoType [renderMap]", mapGeoType);

    let topoFile = '';

    // set geo file based on geo type

    if (mapGeoType === "NTA2010") {
        topoFile = 'NTA_2010.topo.json';
    } else if (mapGeoType === "NTA2020") {
        topoFile = 'NTA_2020.topo.json';
    } else if (mapGeoType === "NYHarbor") {
        topoFile = 'ny_harbor.topo.json';
    } else if (mapGeoType === "CD") {
        topoFile = 'CD.topo.json';
    } else if (mapGeoType === "CDTA2020") {
        topoFile = 'CDTA_2020.topo.json';
    } else if (mapGeoType === "PUMA") {
        topoFile = 'PUMA_or_Subborough.topo.json';
    } else if (mapGeoType === "Subboro") {
        topoFile = 'PUMA_or_Subborough.topo.json';
    } else if (mapGeoType === "UHF42") {
        topoFile = 'UHF42.topo.json';
    } else if (mapGeoType === "UHF34") {
        topoFile = 'UHF34.topo.json';
    } else if (mapGeoType === "NYCKIDS2017") {
        topoFile = 'NYCKids_2017.topo.json';
    } else if (mapGeoType === "NYCKIDS2019") {
        topoFile = 'NYCKids_2019.topo.json';
    } else if (mapGeoType === "NYCKIDS2021") {
        topoFile = 'NYCKids_2021.topo.json';
    } else if (mapGeoType === "Borough") {
        topoFile = 'borough.topo.json';
    }

    return {url: `${data_repo}${data_branch}/geography/${topoFile}`}
}


// ======================================================================= //
// add listeners
// ======================================================================= //
/*
 * Add listeners to all our various buttons.
 * The listeners add / remove layers.
 * This function also adds the layeradd hooks for creating the legend.
 */

function addListeners() {

    console.log("* addListeners");

    // ----------------------------------------------------------------------- //
    // layer buttons
    // ----------------------------------------------------------------------- //
    
    const layerButtons = document.querySelectorAll('.layer-button')

    layerButtons.forEach(button => {

        button.addEventListener('click', async () => {

            await toggleLayerOnMap(button.id, button)

        });

    });


    // ----------------------------------------------------------------------- //
    // story card buttons
    // ----------------------------------------------------------------------- //
    
    // this is where we'd add behavior to update the main card with each story's card content.

    const storyButtons = document.querySelectorAll('.story-dropdown-item')

    storyButtons.forEach(s => {

        s.addEventListener('click', async () => {

            await updateMapStateForStory(s.dataset.storyId);

        });

    });


    // ----------------------------------------------------------------------- //
    // the whole map
    // ----------------------------------------------------------------------- //

    //  NEED A WAY TO CREATE THE POPUP THAT IS AWARE OF ALL LAYERS, WITHOUT FIRING AN EVENT ON LITERALLY EVERY MOUSEMOVE
    
    map.addEventListener('mousemove', (event) => {

        updatePopup(event.latlng);

    });

    
    // ----------------------------------------------------------------------- //
    // when the popup is closed, reset the popup variable
    // ----------------------------------------------------------------------- //

    map.addEventListener('popupclose', () => {

        popup = null;

    });

    
    // ----------------------------------------------------------------------- //
    // map refresh button
    // ----------------------------------------------------------------------- //

    document.querySelector('#refreshButton').addEventListener('click', async () => {
        await resetMapState();
    });


}


// ======================================================================= //
// initialize page
// ======================================================================= //

init();
