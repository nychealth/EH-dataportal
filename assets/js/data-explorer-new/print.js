// ======================================================================= //
// print.js
// ======================================================================= //

// Save-modal rendering for the new explorer.
// Charts still use Vega's built-in export actions, while maps are exported
// by compositing the current Leaflet DOM into a PNG preview.

// console.log(" >> print.js");

const printVis = document.getElementById('printVis');
const printModalInstructions = document.getElementById('printModalInstructions');
const printModalDownload = document.getElementById('printModalDownload');
const modalFootnotes = document.getElementById('modalFootnotes');

const MAP_EXPORT_BASEMAP_ATTRIBUTION = 'Basemap: CARTO, OpenStreetMap';
const EXPORT_MAP_PADDING = 24;
const EXPORT_MAP_MAX_ZOOM = 11;


// ----------------------------------------------------------------------- //
// modal helpers
// ----------------------------------------------------------------------- //

// Keeps modal copy and controls in one place so map and chart exports can
// share the same shell without duplicating DOM mutations.
const setPrintModalState = ({
    instructions = '',
    contentHTML = '',
    footnotesHTML = '',
    showDownload = false,
    downloadHref = '',
    downloadName = '',
    downloadLabel = 'Download PNG'
}) => {

    if (printModalInstructions) {
        printModalInstructions.textContent = instructions;
    }

    if (printVis) {
        printVis.innerHTML = contentHTML;
    }

    if (modalFootnotes) {
        modalFootnotes.innerHTML = footnotesHTML;
        modalFootnotes.classList.toggle('hide', !modalFootnotes.textContent.trim());
    }

    if (printModalDownload) {
        printModalDownload.textContent = downloadLabel;
        printModalDownload.href = downloadHref || '#';

        if (downloadName) {
            printModalDownload.setAttribute('download', downloadName);
        } else {
            printModalDownload.removeAttribute('download');
        }

        printModalDownload.classList.toggle('d-none', !showDownload);
    }

};


const openPrintModal = () => {
    $('#printModal').modal('show');
};


const showPrintLoadingState = (message) => {

    setPrintModalState({
        instructions: message,
        contentHTML: '<div class="d-flex align-items-center justify-content-center h-100 text-muted">Preparing visualization preview...</div>',
        footnotesHTML: '',
        showDownload: false
    });

};


const showPrintErrorState = (message) => {

    setPrintModalState({
        instructions: 'The current visualization could not be prepared for download.',
        contentHTML: `<div class="alert alert-warning mb-0" role="alert">${message}</div>`,
        footnotesHTML: '',
        showDownload: false
    });

};


// ----------------------------------------------------------------------- //
// shared formatting helpers
// ----------------------------------------------------------------------- //

const clonePrintSpec = (spec) => {

    if (!spec) {
        return null;
    }

    return JSON.parse(JSON.stringify(spec));

};


const sanitizeFilename = (value) => {
    return (value || 'visualization')
        .replace(/[<>:"/\\|?*]+/g, '')
        .replace(/\s+/g, ' ')
        .trim();
};


const splitTextIntoPrintLines = (value, maxLength = 88) => {

    const sourceText = Array.isArray(value)
        ? value.filter(Boolean).join(' ')
        : String(value || '').trim();

    if (!sourceText) {
        return [];
    }

    const words = sourceText.split(/\s+/);
    const lines = [];
    let currentLine = '';

    words.forEach(word => {

        const nextLine = currentLine ? `${currentLine} ${word}` : word;

        if (nextLine.length > maxLength && currentLine) {
            lines.push(currentLine);
            currentLine = word;
            return;
        }

        currentLine = nextLine;

    });

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines;

};


const buildSourceHTML = (values = [], warning = '') => {

    const sourceValues = values.filter(Boolean);
    const sourceLines = sourceValues.length
        ? [`Sources: ${sourceValues.join(' ')}`]
        : [];

    const htmlLines = [...sourceLines, warning].filter(Boolean);

    if (!htmlLines.length) {
        return '';
    }

    return htmlLines.map(line => `<div>${line}</div>`).join('');

};


const buildWarningHTML = (warning = '') => {
    return warning ? `<div>${warning}</div>` : '';
};


// ----------------------------------------------------------------------- //
// chart export
// ----------------------------------------------------------------------- //

const getChartFootnotesHTML = () => {

    switch (chartType) {
        case 'trend':
            return document.getElementById('trend-unreliability')?.innerHTML || '';

        case 'links':
        case 'disparities':
            return document.getElementById('links-unreliability')?.innerHTML || '';

        default:
            return '';
    }

};


const renderChartPreview = () => {

    const spec = clonePrintSpec(printSpec);

    if (!spec) {
        showPrintErrorState('Nothing is available to save for this view yet.');
        return;
    }

    setPrintModalState({
        instructions: 'Use the chart menu in the upper-right corner to save as PNG or SVG.',
        contentHTML: '',
        footnotesHTML: getChartFootnotesHTML(),
        showDownload: false
    });

    vegaEmbed('#printVis', spec, {
        actions: {
            export: { png: true, svg: true },
            source: false,
            compiled: false,
            editor: true
        }
    }).catch(() => {
        showPrintErrorState('This chart preview could not be rendered.');
    });

    setTimeout(updateChartPlotSize(),1000);

};


// ----------------------------------------------------------------------- //
// map export helpers
// ----------------------------------------------------------------------- //

const buildMapExportFilename = () => {

    const nameParts = [
        'NYC EH Data Portal',
        indicatorName || document.querySelector('.indicator-name')?.textContent,
        selectedMapMetadata?.MeasurementType,
        vizGeography,
        vizYear,
        'map'
    ].filter(Boolean);

    return `${sanitizeFilename(nameParts.join(' - '))}.png`;

};


const getMapExportTitle = () => {
    return indicatorName || document.querySelector('.indicator-name')?.textContent || 'Environment and Health Data Portal';
};


const getMapExportSubtitle = () => {

    return [
        selectedMapMetadata?.MeasurementType,
        vizYear,
        vizGeography
    ].filter(Boolean).join(' | ');

};


const getMapExportSources = () => {

    const sourceValues = [];

    if (Array.isArray(vizSource)) {
        sourceValues.push(...vizSource.filter(Boolean));
    } else if (typeof vizSource === 'string' && vizSource.trim()) {
        sourceValues.push(vizSource.trim());
    }

    sourceValues.push(MAP_EXPORT_BASEMAP_ATTRIBUTION);

    return [...new Set(sourceValues)];

};


const isBubbleMapExport = () => {

    const measurementType = selectedMapMetadata?.MeasurementType || '';

    return measurementType.includes('number') ||
        measurementType.includes('Number') ||
        measurementType.includes('Total');

};


const createHiddenExportMapContainer = (width, height) => {

    const container = document.createElement('div');

    container.style.position = 'absolute';
    container.style.left = '-20000px';
    container.style.top = '0';
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    container.style.pointerEvents = 'none';
    container.style.zIndex = '-1';
    container.setAttribute('aria-hidden', 'true');

    document.body.appendChild(container);

    return container;

};


const waitForLeafletIdle = (mapInstance) => {

    return new Promise(resolve => {

        let isResolved = false;

        const finalize = () => {

            if (isResolved) {
                return;
            }

            isResolved = true;
            window.clearTimeout(fallbackTimer);

            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(resolve);
            });

        };

        const fallbackTimer = window.setTimeout(finalize, 3000);

        mapInstance.once('idle', finalize);

    });

};


const buildTemporaryLeafletExport = async (width, height) => {

    if (!currentGeojsonLayer) {
        throw new Error('The map geometry is not ready to export yet.');
    }

    const exportContainer = createHiddenExportMapContainer(width, height);
    const exportMap = L.map(exportContainer, {
        zoomControl: false,
        attributionControl: false,
        fadeAnimation: false,
        zoomAnimation: false,
        markerZoomAnimation: false,
        preferCanvas: true
    });
    const exportRenderer = L.canvas({ padding: 0 });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}' + (L.Browser.retina ? '@2x.png' : '.png'), {
        crossOrigin: true,
        subdomains: 'abcd',
        maxZoom: 11,
        minZoom: 7
    }).addTo(exportMap);

    const exportGeojson = currentGeojsonLayer.toGeoJSON();
    const { minValue, maxValue } = getMapStats(filteredMapData || []);
    const colorScale = createColorScale(minValue, maxValue);
    const pendingLayers = [];
    let exportBounds = null;

    if (isBubbleMapExport()) {

        const exportGeojsonLayer = L.geoJson(exportGeojson, {
            renderer: exportRenderer,
            style: () => ({
                fillColor: '#eee',
                weight: 1,
                color: '#999',
                fillOpacity: 0.3
            })
        });

        pendingLayers.push(exportGeojsonLayer);

        const geojsonBounds = exportGeojsonLayer.getBounds();

        if (geojsonBounds.isValid()) {
            exportBounds = geojsonBounds;
        }

        const radiusScale = d3.scaleSqrt()
            .domain(minValue === maxValue ? [0, maxValue || 1] : [minValue, maxValue])
            .range([4, 20]);

        filteredMapData.forEach(item => {

            if (item.Lat == null || item.Long == null || item.Value == null) {
                return;
            }

            const latLng = L.latLng(item.Lat, item.Long);

            const bubbleMarker = L.circleMarker(latLng, {
                renderer: exportRenderer,
                radius: radiusScale(item.Value),
                fillColor: colorScale(item.Value),
                color: '#333',
                weight: 1,
                opacity: 1,
                fillOpacity: 0.9
            });

            pendingLayers.push(bubbleMarker);

            if (exportBounds) {
                exportBounds.extend(latLng);
            } else {
                exportBounds = L.latLngBounds(latLng, latLng);
            }

        });

    } else {

        const exportGeojsonLayer = L.geoJson(exportGeojson, {
            renderer: exportRenderer,
            style: feature => {

                const value = feature.properties.Value;

                return {
                    fillColor: value != null ? colorScale(value) : '#ccc',
                    weight: 0.35,
                    color: 'black',
                    fillOpacity: 0.65
                };

            }
        });

        pendingLayers.push(exportGeojsonLayer);

        const geojsonBounds = exportGeojsonLayer.getBounds();

        if (geojsonBounds.isValid()) {
            exportBounds = geojsonBounds;
        }

    }

    if (exportBounds && exportBounds.isValid()) {
        exportMap.fitBounds(exportBounds.pad(0.04), {
            animate: false,
            padding: [EXPORT_MAP_PADDING, EXPORT_MAP_PADDING],
            maxZoom: EXPORT_MAP_MAX_ZOOM
        });
    } else {
        exportMap.setView([40.700142, -73.921546], EXPORT_MAP_MAX_ZOOM);
    }

    exportMap.invalidateSize(false);

    pendingLayers.forEach(layer => {
        layer.addTo(exportMap);
    });

    const idlePromise = waitForLeafletIdle(exportMap);

    await idlePromise;

    return {
        exportMap,
        exportContainer,
        minLabel: document.getElementById('minVal')?.textContent || 'Min',
        maxLabel: document.getElementById('maxVal')?.textContent || 'Max'
    };

};


const waitForLoadedImages = (images) => {

    return Promise.all(images.map(image => new Promise(resolve => {

        if (image.complete && image.naturalWidth > 0) {
            resolve();
            return;
        }

        const finalize = () => {
            image.removeEventListener('load', finalize);
            image.removeEventListener('error', finalize);
            resolve();
        };

        image.addEventListener('load', finalize, { once: true });
        image.addEventListener('error', finalize, { once: true });

    })));

};


const parseLeafletTransform = (transformValue = '') => {

    const match = transformValue.match(/translate3d\(([-\d.]+)px,\s*([-\d.]+)px,\s*[-\d.]+px\)/);

    if (!match) {
        return null;
    }

    return {
        x: Number(match[1]),
        y: Number(match[2])
    };

};


const getLeafletLayerDrawBox = (layerElement, mapRect) => {

    const transformedPosition = parseLeafletTransform(layerElement.style.transform || '');

    if (transformedPosition) {
        return {
            x: transformedPosition.x,
            y: transformedPosition.y,
            width: parseFloat(layerElement.style.width) || layerElement.clientWidth,
            height: parseFloat(layerElement.style.height) || layerElement.clientHeight
        };
    }

    const layerRect = layerElement.getBoundingClientRect();

    return {
        x: layerRect.left - mapRect.left,
        y: layerRect.top - mapRect.top,
        width: layerRect.width,
        height: layerRect.height
    };

};


const drawLeafletTiles = async (ctx, mapElement, mapRect, offsetY) => {

    const tileImages = Array.from(mapElement.querySelectorAll('.leaflet-tile-pane img.leaflet-tile'));
    let skippedTiles = false;

    await waitForLoadedImages(tileImages);

    tileImages.forEach(tileImage => {

        if (!tileImage.complete || tileImage.naturalWidth === 0) {
            return;
        }

        const tileBox = getLeafletLayerDrawBox(tileImage, mapRect);
        const x = tileBox.x;
        const y = tileBox.y + offsetY;

        try {
            ctx.drawImage(tileImage, x, y, tileBox.width, tileBox.height);
        } catch (error) {
            skippedTiles = true;
        }

    });

    return { skippedTiles };

};


const loadImage = (src) => {

    return new Promise((resolve, reject) => {

        const image = new Image();

        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = src;

    });

};


const drawLeafletSvgLayers = async (ctx, mapElement, mapRect, offsetY) => {

    const svgLayers = Array.from(mapElement.querySelectorAll('.leaflet-overlay-pane svg'));

    for (const svgLayer of svgLayers) {

        const svgClone = svgLayer.cloneNode(true);
        const svgRect = svgLayer.getBoundingClientRect();
        const svgViewBox = svgLayer.getAttribute('viewBox');
        const svgStyle = svgLayer.getAttribute('style') || '';
        const hasLeafletPaneOffset = Boolean(svgViewBox) && svgStyle.includes('translate3d(');

        // Leaflet root SVG overlays already encode the pane offset via viewBox.
        // Removing the CSS translate avoids applying that offset a second time.
        if (hasLeafletPaneOffset) {
            svgClone.removeAttribute('style');
        }

        const svgMarkup = new XMLSerializer().serializeToString(svgClone);
        const normalizedSvgMarkup = svgMarkup.includes('xmlns=')
            ? svgMarkup
            : svgMarkup.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');

        const svgBlob = new Blob([normalizedSvgMarkup], { type: 'image/svg+xml;charset=utf-8' });
        const objectURL = URL.createObjectURL(svgBlob);

        try {
            const svgImage = await loadImage(objectURL);
            const x = hasLeafletPaneOffset ? 0 : svgRect.left - mapRect.left;
            const y = hasLeafletPaneOffset ? offsetY : svgRect.top - mapRect.top + offsetY;

            ctx.drawImage(svgImage, x, y, svgRect.width, svgRect.height);
        } finally {
            URL.revokeObjectURL(objectURL);
        }

    }

};


const drawLeafletCanvasLayers = (ctx, mapElement, mapRect, offsetY) => {

    const canvasLayers = Array.from(mapElement.querySelectorAll('.leaflet-overlay-pane canvas'));

    canvasLayers.forEach(canvasLayer => {

        const canvasBox = getLeafletLayerDrawBox(canvasLayer, mapRect);
        const x = canvasBox.x;
        const y = canvasBox.y + offsetY;

        ctx.drawImage(canvasLayer, x, y, canvasBox.width, canvasBox.height);

    });

    return canvasLayers.length > 0;

};


const drawMapLegend = (ctx, startX, startY, width, minLabel, maxLabel) => {

    const gradientHeight = 14;
    const legendPadding = 12;
    const legendBoxHeight = 54;
    const gradient = ctx.createLinearGradient(startX, startY, startX + width, startY);

    for (let stop = 0; stop <= 1; stop += 0.05) {
        gradient.addColorStop(stop, d3.interpolateViridis(stop));
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(startX - legendPadding, startY - 24, width + (legendPadding * 2), legendBoxHeight + 28);
    ctx.strokeStyle = '#d0d7de';
    ctx.strokeRect(startX - legendPadding + 0.5, startY - 23.5, width + (legendPadding * 2) - 1, legendBoxHeight + 27);

    ctx.fillStyle = '#1f2933';
    ctx.font = '600 14px Arial';
    ctx.fillText('Legend', startX, startY - 8);

    ctx.fillStyle = gradient;
    ctx.fillRect(startX, startY, width, gradientHeight);

    ctx.strokeStyle = '#d0d7de';
    ctx.strokeRect(startX, startY, width, gradientHeight);

    ctx.fillStyle = '#1f2933';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(minLabel || 'Min', startX, startY + gradientHeight + 16);

    ctx.textAlign = 'right';
    ctx.fillText(maxLabel || 'Max', startX + width, startY + gradientHeight + 16);
    ctx.textAlign = 'left';

};


const exportLeafletMap = async () => {

    if (!currentMap || !currentGeojsonLayer) {
        throw new Error('The map has not finished loading yet.');
    }

    const mapElement = document.getElementById('map');

    if (!mapElement) {
        throw new Error('The map container could not be found.');
    }

    const mapRect = mapElement.getBoundingClientRect();
    const exportWidth = Math.max(1, Math.round(mapRect.width));
    const exportHeight = Math.max(1, Math.round(mapRect.height));

    const title = getMapExportTitle();
    const subtitle = getMapExportSubtitle();
    const sourceLines = splitTextIntoPrintLines(`Sources: ${getMapExportSources().join(' ')}`, 96);

    const headerHeight = subtitle ? 74 : 56;
    const legendBlockHeight = 88;
    const footerHeight = sourceLines.length ? (sourceLines.length * 16) + 24 : 0;
    const paddingX = 20;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = exportWidth;
    canvas.height = headerHeight + exportHeight + legendBlockHeight + footerHeight;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#0f172a';
    ctx.font = '700 24px Arial';
    ctx.fillText(title, paddingX, 30);

    if (subtitle) {
        ctx.fillStyle = '#475569';
        ctx.font = '14px Arial';
        ctx.fillText(subtitle, paddingX, 52);
    }

    ctx.strokeStyle = '#d0d7de';
    ctx.strokeRect(0.5, headerHeight + 0.5, exportWidth - 1, exportHeight - 1);

    const {
        exportMap,
        exportContainer,
        minLabel,
        maxLabel
    } = await buildTemporaryLeafletExport(exportWidth, exportHeight);

    let skippedTiles = false;

    try {

        const exportRect = exportContainer.getBoundingClientRect();
        const tileResult = await drawLeafletTiles(ctx, exportContainer, exportRect, headerHeight);

        skippedTiles = tileResult.skippedTiles;

        const drewCanvasLayers = drawLeafletCanvasLayers(ctx, exportContainer, exportRect, headerHeight);

        if (!drewCanvasLayers) {
            await drawLeafletSvgLayers(ctx, exportContainer, exportRect, headerHeight);
        }

    } finally {

        exportMap.remove();
        exportContainer.remove();

    }

    const legendWidth = Math.min(280, Math.max(190, Math.round(exportWidth * 0.28)));

    drawMapLegend(ctx, paddingX, headerHeight + exportHeight + 30, legendWidth, minLabel, maxLabel);

    if (sourceLines.length) {
        ctx.fillStyle = '#4b5563';
        ctx.font = '12px Arial';

        sourceLines.forEach((line, index) => {
            ctx.fillText(line, paddingX, headerHeight + exportHeight + legendBlockHeight + 8 + (index * 16));
        });
    }

    return {
        dataURL: canvas.toDataURL('image/png'),
        tileWarning: skippedTiles
            ? 'Some basemap tiles could not be copied into the PNG. If this happens consistently, the tile server may be blocking canvas export.'
            : ''
    };

};


const renderMapPreview = async () => {

    showPrintLoadingState('Preparing a PNG preview of the current map.');

    try {
        const { dataURL, tileWarning } = await exportLeafletMap();

        setPrintModalState({
            instructions: 'Use Download PNG below to save the current map.',
            contentHTML: `<img src="${dataURL}" alt="Map export preview" class="img-fluid border" />`,
            footnotesHTML: buildWarningHTML(tileWarning),
            showDownload: true,
            downloadHref: dataURL,
            downloadName: buildMapExportFilename(),
            downloadLabel: 'Download PNG'
        });
    } catch (error) {
        showPrintErrorState(error.message || 'The map could not be exported.');
    }

};


// ----------------------------------------------------------------------- //
// public modal entrypoint
// ----------------------------------------------------------------------- //

const openChartSaveModal = () => {

    openPrintModal();
    renderChartPreview();

};

const openMapSaveModal = () => {

    openPrintModal();
    renderMapPreview();

};


const bindPrintControls = () => {

    const mapSaveButton = document.getElementById('deSaveMapButton');

    if (mapSaveButton) {
        mapSaveButton.addEventListener('click', event => {
            event.preventDefault();
            openMapSaveModal();
        });
    }

    const chartSaveButtons = document.querySelectorAll('.de-save-chart-button[data-print-target="chart"]');

    chartSaveButtons.forEach(button => {
        button.addEventListener('click', event => {
            event.preventDefault();
            openChartSaveModal();
        });
    });

};


bindPrintControls();