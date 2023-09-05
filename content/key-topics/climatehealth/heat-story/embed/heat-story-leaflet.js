var map = L.map('map').setView([40.715554,-74.0026642],10); // [Lat,Long],Zoom
var lastMapState = {
    lat: null,
    lng: null,
    zoom: null,
    layers: [ ]
};

// set the popup content separately to handle intersecting layers
var popup = null;
var popupContent = "";
var layerGroup = L.layerGroup();
var layerMouseOver = null;
var featureMouseOver = null;
var legendControl = null;
var legendPropertiesByLayer = {};
var layersExclusive = new Set();

function init() {
    addLayerButtons();
    drawAccordion();
    setupMap();
    addListeners();
    createLegend();
    //$('[data-toggle="tooltip"]').tooltip();
}

function setupMap() {
    L.tileLayer(
        'https://api.maptiler.com/maps/basic-v2/{z}/{x}/{y}.png?key=dwIJ8hO2KsTMegUfEpYE',{
        attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank" rel="noopener noreferrer">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
    }).addTo(map);

    layerGroup.addTo(map);

    const url = window.BaseURL + "geojson/neighborhoods.geojson";
    fetch(url).then(response => {
      if (!response.ok) {
          return null;
      }
      return response.json();
    }).then(data => {
      const neighborhoodsLayer = L.geoJSON(data, { style: { color: 'black', fillOpacity: 0, weight: 1 }});
      neighborhoodsLayer.addTo(map);
    });
    /*
     *
     * Sample code for pulling from mapbox
    L.vectorGrid.protobuf('https://api.mapbox.com/v4/{tilesetId}/{z}/{x}/{y}.vector.pbf?access_token={accessToken}', {
        vectorTileLayerStyles: {  },
        tilesetId: 'tzinckgraf.7im6noz1',
        accessToken: mapboxAccessToken,
        maxNativeZoom: 14
    }).addTo(map);
    */
}

var buttonHolderBase = document.getElementById('buttonHolderBase')
var buttonHolderAdditional = document.getElementById('buttonHolderAdditional')
function addLayerButtons() {
    const layers = config.layers;
    for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        const color = layer.property?.args?.color ?? "grey";
        const button = `
            <button type="button" id="${layer.property.id}" class="mb-1 ml-1 layer-button btn btn-sm btn-outline-secondary no-underline">
                <span style="color: ${color};">
                    <i class="fas fa-square mr-1"></i>
                </span>
                ${layer.property.name}
            </button>`
        if (layer.property?.exclusive === true) {
            buttonHolderBase.innerHTML += button;
            layersExclusive.add(layer.property.id);
        } else {
            buttonHolderAdditional.innerHTML += button;
        }
    };
}

function drawAccordion() {
    const holderAccordian = document.getElementById('story-accordion')
    const stories = config.stories;
    for (let i = 0; i < stories.length; i++) {
        const story = stories[i];
        const storyCard = `
          <div class="card">
              <a class="card-header collapse collapsed font-weight-bold accordion-button" id="${story.id}"
                  data-toggle="collapse" href="#panel-acc-button-${i}" role="tab"
                  aria-expanded="false" aria-controls="panel-acc-button-${i}">
                  <span class="title" role="heading" aria-level="3">${story.title}</span>
              </a>
              <div class="collapse" id="panel-acc-button-${i}" role="tabpanel"
                  aria-labelledby="acc-button-01" data-parent="#accordion-01">
                  <div class="card-body">
                      <p>${story.content}</p>
                  </div>
              </div>
          </div>`
      holderAccordian.innerHTML += storyCard;
    }
}

async function createGeoJsonLayer({ id, name, url, args, displayProperties }) {
    const response = await fetch(url);
    if (!response.ok) {
        return null;
    }
    const data = await response.json();
    const values = data.features.map(f => f.properties[args.colorFeatureProperty])
        .filter(x => x != null && !isNaN(x));
    const colorChroma = chroma.scale([args?.minColor ?? '#fff', args?.maxColor ?? '#000'])
        .domain([Math.min(...values), Math.max(...values)]);;
    const onStyle = (feature) => {
        const fillColor = args.colorFeatureProperty != null
            ? colorChroma(feature.properties[args.colorFeatureProperty])
            : args?.fillColor;

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
    const layer = L.geoJSON(
        data,
        {
            style: onStyle,
            onEachFeature: function(feature, layer) {
                //layer.bindPopup("Hello popup", {});
                layer.on('mouseover', function(event) {
                    layerMouseOver = layer;
                    featureMouseOver = feature;
                    layerMouseOver[layer.options._custom_id] = true;
                    updatePopup(event.latlng);
                });
                layer.on('mouseout', function() {
                    if (layer.options._custom_id == layerMouseOver.options._custom_id) {
                        layerMouseOver = null;
                        featureMouseOver = null;
                    }
                });
            },
            _custom_id: id,
            displayProperties,
            name,
        });

    const legendFunc = () => {
        if (!args?.fillColor && !args?.color && !args?.minColor && !args?.maxColor) {
            return '';
        }

        const background = args?.fillColor
            ? `background: ${args.fillColor};`
            : args?.legendColor
            ? `background: ${args.legendColor};`
            : '';
        const borderColor = args?.color ? `border-width: 2px; border-color: ${args?.color}; border-style: solid;` : '';
        const backgroundCss = (args.colorFeatureProperty != null
                && args?.minColor != null && args?.maxColor != null)
            ? `background-image: linear-gradient(to right, ${args.minColor}, ${args?.maxColor});`
            : ('' + background + borderColor);
        var legend = name + '<span style="'
            + backgroundCss
            + 'height: 20px; width: 100%;'
            + 'display: block; background-repeat: no-repeat;'
            + '"></span>'
        if (args.colorFeatureProperty) {
            const values = layer.getLayers()
                .map(x => x.feature.properties[args.colorFeatureProperty])
                .filter(x => x != null && !isNaN(x));
            legend += '<div style="display: block; width: 100%;">'
                + `<div style="float: left;">${Math.min(...values)}</div>`
                + `<div style="float: right;">${Math.max(...values)}</div></div>`;
        }
        if (args.legendDescription) {
            const collapseId = `${id}LegendCollapse`;
          legend += `<br /><div style="display: block; width: 100%; max-width: 250px;"><a data-toggle="collapse" href="#${collapseId}" role="button" aria-expanded="false" aria-controls="${collapseId}">More Info About ${name}</a>`
            + `<div class="collapse" id="${collapseId}">${args.legendDescription}</div></div>`;
        }
        return legend;
    }

    layer.options.legendFunc = legendFunc;
    return layer;
}

async function createGeotiffLayer({ url, args, name }) {
    const response = await fetch(url);
    if (!response.ok) {
        return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    data = await parseGeoraster(arrayBuffer);

    const colorStart = args?.colorStart || '#0f0';
    const colorStop = args?.colorStop || '#f00';
    const colorChroma = chroma.scale([colorStart, colorStop]).domain([data.mins[0], data.maxs[0]]);
    const legendFunc = () => {
        const colorStart = args?.colorStart || '#0f0';
        const colorStop = args?.colorStop || '#f00';
        const legend = name + '<span style="'
            + `background-image: linear-gradient(to right, ${colorStart}, ${colorStop});`
            + 'height: 20px; width: 100%;'
            + 'display: block; background-repeat: no-repeat;'
            + '"></span>'
            + '<span style="position: absolute, left: 0, font-size: 11px, bottom: 3px">0</span>'
            + '<span style="position: absolute, right: 0, font-size: 11px, bottom: 3px">5</span>';
        return legend;
    }
    const layer = new GeoRasterLayer({
          georaster: data,
          opacity: 0.7,
          resolution: args?.resolution || 64,
          pixelValuesToColorFn: values => {
              return values[0] > 0.0001 ? colorChroma(values[0]) : null;
          },
          legendFunc,
      });
    return layer;
}

let layers = {};
async function createLayer(layerId) {
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
        case 'raster':
            layer = await createGeotiffLayer(properties);
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

async function getOrCreateLayer(layerId) {
    if (!(layerId in layers)) {
        layer = await createLayer(layerId);
    } else {
        layer = layers[layerId];
    }
    return layer;
}

async function addLayerToMap(layerId) {
    const layer = await getOrCreateLayer(layerId);
    if (layer != null && !map.hasLayer(layer)) {
        layerGroup.addLayer(layer);

        // only one active one at a time
        if ( layersExclusive.has(layerId) ) {
            for (_layerId in layersVisible) {
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
    }
}

function removeLayerFromMap(layerId) {
    if (layerId in layers) {
        const layer = layers[layerId];
        layerGroup.removeLayer(layer);
        delete layersVisible[layerId];
        const button = document.querySelector(`#${layerId}`)
        if (button != null) {
            button.classList.remove("active");
        }
    }
}

let layersVisible = {};
async function toggleLayerOnMap(layerId, button) {
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
    createLegend();
}

function saveCurrentMapState() {
    const { lat, lng } = map.getCenter();
    const zoom = map.getZoom();
    lastMapState.lat = lat;
    lastMapState.lng = lng;
    lastMapState.zoom = zoom;
}

async function updateMapState(storyId) {
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

    // FIXME use layergroup
    var layersVisible = []
    layerGroup.eachLayer(l => layersVisible.push(l.options._custom_id));
    lastMapState.layers = layersVisible;

    const layers = mapState.layers;
    // add the layers that are not in the visible layer
    layers.filter(l => !(l in layersVisible)).forEach(async l => {
        await addLayerToMap(l);
    });

    // remove
    layersVisible.filter(l => !(l in layers)).forEach(async l => {
        removeLayerFromMap(l)
    });
}

function formatValue(value, type) {
    // FIXME handle NaN
    if (type == null || value == null) return value;

    switch(type) {
    case 'percentage':
        return `${(value * 100).toFixed(2)}%`;
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

function featureInfoToHtml(feature, layer) {
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
        .map(x => [displayPropertyArgs[x[0]]?.displayName ?? x[0], formatValue(x[1], displayPropertyArgs[x[0]]?.type)])
        .reduce((m, [k, v]) => {m[k] = v ?? m[k]; return m;}, {});

    // then create that into a table
    const featureTable = Object.entries(featureMap)
        .map(x => `<tr><td>${x[0]}</td><td>${x[1] ?? missingDisplay}</td></tr>`);

    if (!featureTable.length || !featureTable.length) {
        return missingDisplay != null
            ? `<h3>${value['name']}</h3>${missingDisplay}`
            : '';
    }
    return `<h3>${layer.options.name}</h3><table>${featureTable.join('')}</table>`;
}

function formatPopup(features) {
    const updates = features
        .map(({ feature, layer }) => featureInfoToHtml(feature, layer))
        .filter(x => x != "")
        .join("<br />");
    return updates == "" ? null : updates;
}

function updatePopup({ lat, lng }) {
    const visibleLayers = Object.keys(layerGroup._layers).length;
    if (Object.keys(layerGroup._layers).length == 0
        || featureMouseOver == null) {
        if (popup != null) {
            popup.removeFrom(map);
            popup = null;
        }
        popupContent = null;
        return;
    }

    var features = [{ feature: featureMouseOver, layer: layerMouseOver }];
    if (visibleLayers > 1) {
      // check intersections
      layerGroup.eachLayer(_layer => {
          // only check intersections if we are going to display something
          if (_layer.options.displayProperties == null) {
              return;
          }

          // this is our main layer, so we are good
          if (layerMouseOver.options._custom_id == _layer.options._custom_id) {
              return;
          }

          let intersection = [];
          try {
            intersection = leafletPip.pointInLayer({ lat, lng }, _layer);
          } catch(err) {
            console.log(err);
            //intersections 
          }
          if (intersection.length > 0) {
              features.push({feature: intersection[0].feature, layer: _layer});
          }
      });
    }

    const content = formatPopup(features);
    if (popup == null && content != null) {
        popup = L.popup({autoPan: false}).setLatLng({ lat, lng }).setContent(content).openOn(map);
        popupContent = content;
    } else if ( popup != null && content != null) {
        popup.setLatLng({ lat, lng });
        if (content != popupContent) {
            popupContent = content;
            popup.setContent(content);
        }
    } else if (content == null && popup != null) {
        popup.removeFrom(map);
        popup = null;
    }
}

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
        const htmls = [];
        layerGroup.eachLayer(layer => {
            if (layer.options?.legendFunc == null) {
                return;
            }
            const html = layer.options.legendFunc();
            if (html === '') {
                return;
            }
            htmls.push(html);
        })

        if (!htmls.length) {
            return L.DomUtil.create('div', '');
        }

        var div = L.DomUtil.create('div', 'info legend');
        L.DomUtil.addClass(div, 'leaflet-control-layers-expanded');
        const innerHtml = '<fieldset><h4>Legend</h4><table>' + htmls.join('<br />') + '</table></fieldset>';
        div.innerHTML = innerHtml;
        return div;
    }
});

L.control.legend = function (overlays, options) {
    return new L.Control.Legend(overlays, options);
};

function createLegend() {
  // .legend(layerGroup, { label: 'Legend', properties: layers.map(l => l.layerConfig.property) })
  if (legendControl != null) {
      map.removeControl(legendControl);
  }
  legendControl = L.control
      .legend(layerGroup, { label: 'Legend', properties: {} });
  legendControl.addTo(map);
}

async function resetMapState() {
    const { lat, lng, zoom, layers } = lastMapState;
    if ( lat != null && lng != null && zoom != null ) {
        map.flyTo([lat, lng], zoom);
    }

    var layersVisible = []
    layerGroup.eachLayer(l => layersVisible.push(l.options._custom_id));

    layers.filter(l => !(l in layersVisible)).forEach(async l => {
        await addLayerToMap(l);
    });
    // remove
    layersVisible.filter(l => !(l in layers)).forEach(async l => {
        removeLayerFromMap(l)
    });

    lastMapState = {
        lat: null,
        lng: null,
        zoom: null,
        layers: [ ]
    };
}

function addListeners() {
    const layerButtons = document.querySelectorAll('.layer-button')
    layerButtons.forEach(button => {
        button.addEventListener('click', async () => {
          await toggleLayerOnMap(button.id, button)
        });
    });

    const accordions = document.querySelectorAll('.accordion-button')
    accordions.forEach(a => {
        a.addEventListener('click', async () => {
          if (a.classList.contains("collapsed")) {
              await updateMapState(a.id);
          } else {
              await resetMapState();
          }
        })
    });

    map.addEventListener('mousemove', (event) => {
        updatePopup(event.latlng);
    });
}

init();
