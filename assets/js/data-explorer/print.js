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
const EXPORT_MAP_PADDING = 0;
const EXPORT_MAP_MAX_ZOOM = 15;
const EXPORT_CHOROPLETH_BOUNDS_PAD_RATIO = 0.01;
const EXPORT_BUBBLE_BOUNDS_PAD_RATIO = 0.03;
const EXPORT_CHOROPLETH_ZOOM_BONUS = 0;
const EXPORT_BUBBLE_ZOOM_BONUS = 0;
const EXPORT_FEATURE_EDGE_BUFFER_PX = 8;
const EXPORT_TILE_COVERAGE_BUFFER_PX = 6;
const EXPORT_TILE_COVERAGE_MAX_ATTEMPTS = 8;
const EXPORT_TILE_COVERAGE_WAIT_MS = 250;
const EXPORT_MAP_WIDTH = 1920;
const EXPORT_MAP_HEIGHT = 1080;


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
        printVis.scrollTop = 0;
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


// Keep line-wrapping helpers aligned so titles, subtitles, and footnotes all
// normalize arrays and plain strings the same way before wrapping.
const normalizePrintTextInput = (value) => {
    return Array.isArray(value)
        ? value.filter(Boolean).join(' ')
        : String(value || '').trim();
};


const buildWrappedPrintLines = (value, shouldStartNewLine) => {

    const sourceText = normalizePrintTextInput(value);

    if (!sourceText) {
        return [];
    }

    const words = sourceText.split(/\s+/);
    const lines = [];
    let currentLine = '';

    words.forEach(word => {

        const nextLine = currentLine ? `${currentLine} ${word}` : word;

        if (shouldStartNewLine(nextLine, currentLine)) {
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


const splitTextIntoPrintLines = (value, maxLength = 88) => {

    return buildWrappedPrintLines(
        value,
        (nextLine, currentLine) => nextLine.length > maxLength && Boolean(currentLine)
    );

};


const splitCanvasTextIntoLines = (ctx, value, maxWidth) => {

    return buildWrappedPrintLines(
        value,
        (nextLine, currentLine) => Boolean(currentLine) && ctx.measureText(nextLine).width > maxWidth
    );

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


const getFixedMapExportSize = () => {
    return {
        width: EXPORT_MAP_WIDTH,
        height: EXPORT_MAP_HEIGHT
    };
};


const getMapExportHeaderLayout = (ctx, width, paddingX, title, subtitle) => {

    const headerTextWidth = Math.max(320, width - (paddingX * 2));

    // Measure against the actual export width so long indicator names wrap
    // before they can clip off the right edge of the PNG.
    ctx.save();
    ctx.font = '700 30px Arial';
    const titleLines = splitCanvasTextIntoLines(ctx, title, headerTextWidth);
    ctx.font = '16px Arial';
    const subtitleLines = subtitle
        ? splitCanvasTextIntoLines(ctx, subtitle, headerTextWidth)
        : [];
    ctx.restore();

    const titleLineHeight = 36;
    const subtitleLineHeight = 22;
    const topPadding = 24;
    const gapAfterTitle = subtitleLines.length ? 6 : 0;
    const bottomPadding = 18;
    const height = topPadding + (titleLines.length * titleLineHeight) + gapAfterTitle + (subtitleLines.length * subtitleLineHeight) + bottomPadding;

    return {
        titleLines,
        subtitleLines,
        titleLineHeight,
        subtitleLineHeight,
        topPadding,
        gapAfterTitle,
        height
    };

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

    setTimeout(updateChartPlotSize, 1000);

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


// Several export safeguards need to answer the same question: where do the
// current feature bounds land inside the off-screen map viewport?
const getBoundsViewportBox = (mapInstance, bounds) => {

    const northWest = mapInstance.latLngToContainerPoint(bounds.getNorthWest());
    const southEast = mapInstance.latLngToContainerPoint(bounds.getSouthEast());

    return {
        left: northWest.x,
        top: northWest.y,
        right: southEast.x,
        bottom: southEast.y,
        width: southEast.x - northWest.x,
        height: southEast.y - northWest.y
    };

};


const isViewportBoxInsideFrame = (viewportBox, width, height, edgeBuffer) => {
    return viewportBox.left >= edgeBuffer &&
        viewportBox.top >= edgeBuffer &&
        viewportBox.right <= (width - edgeBuffer) &&
        viewportBox.bottom <= (height - edgeBuffer);
};


// Keep map-type-specific framing rules together so buildTemporaryLeafletExport
// can read like a single flow instead of a series of paired ternaries.
const getExportBoundsTuning = (bubbleMapExport) => {
    return bubbleMapExport
        ? {
            padRatio: EXPORT_BUBBLE_BOUNDS_PAD_RATIO,
            zoomBonus: EXPORT_BUBBLE_ZOOM_BONUS
        }
        : {
            padRatio: EXPORT_CHOROPLETH_BOUNDS_PAD_RATIO,
            zoomBonus: EXPORT_CHOROPLETH_ZOOM_BONUS
        };
};


const ensureBoundsWithinExportViewport = (mapInstance, bounds, width, height) => {

    if (!bounds || !bounds.isValid()) {
        return;
    }

    const maxAdjustments = 8;
    const visibleEdgeTolerance = EXPORT_FEATURE_EDGE_BUFFER_PX;
    const mapMinZoom = typeof mapInstance.getMinZoom === 'function'
        ? mapInstance.getMinZoom()
        : 0;

    for (let adjustment = 0; adjustment < maxAdjustments; adjustment += 1) {

        const viewportBox = getBoundsViewportBox(mapInstance, bounds);
        const boundsAreVisible = isViewportBoxInsideFrame(
            viewportBox,
            width,
            height,
            visibleEdgeTolerance
        );

        if (boundsAreVisible) {
            return;
        }

        const currentZoom = mapInstance.getZoom();
        const zoomedOutLevel = Math.max(mapMinZoom, currentZoom - 0.25);

        if (zoomedOutLevel === currentZoom) {
            return;
        }

        mapInstance.setView(bounds.getCenter(), zoomedOutLevel, { animate: false });

    }

};


const getTileImages = (mapElement) => {
    return Array.from(mapElement.querySelectorAll('.leaflet-tile-pane img.leaflet-tile'));
};


const getLoadedTileImages = (mapElement) => {
    return getTileImages(mapElement).filter(tileImage => tileImage.complete && tileImage.naturalWidth > 0);
};


const getLoadedTileCoverageBounds = (mapElement, mapRect) => {

    const tileImages = getTileImages(mapElement);
    const loadedTiles = getLoadedTileImages(mapElement);

    if (!loadedTiles.length) {
        return {
            hasCoverage: false,
            totalTileCount: tileImages.length,
            loadedTileCount: 0,
            minX: 0,
            maxX: 0,
            minY: 0,
            maxY: 0
        };
    }

    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    loadedTiles.forEach(tileImage => {

        const tileBox = getLeafletLayerDrawBox(tileImage, mapRect, { useRenderedBounds: true });

        minX = Math.min(minX, tileBox.x);
        maxX = Math.max(maxX, tileBox.x + tileBox.width);
        minY = Math.min(minY, tileBox.y);
        maxY = Math.max(maxY, tileBox.y + tileBox.height);

    });

    return {
        hasCoverage: true,
        totalTileCount: tileImages.length,
        loadedTileCount: loadedTiles.length,
        minX,
        maxX,
        minY,
        maxY
    };

};


const areExportBoundsCoveredByTiles = (mapInstance, bounds, mapElement, mapRect) => {

    if (!bounds || !bounds.isValid()) {
        return true;
    }

    const tileCoverage = getLoadedTileCoverageBounds(mapElement, mapRect);

    if (!tileCoverage.hasCoverage) {
        return false;
    }

    const viewportBox = getBoundsViewportBox(mapInstance, bounds);
    const coverageBuffer = EXPORT_TILE_COVERAGE_BUFFER_PX;

    return viewportBox.left >= (tileCoverage.minX + coverageBuffer) &&
        viewportBox.top >= (tileCoverage.minY + coverageBuffer) &&
        viewportBox.right <= (tileCoverage.maxX - coverageBuffer) &&
        viewportBox.bottom <= (tileCoverage.maxY - coverageBuffer);

};


const ensureTileCoverageForExport = async (mapInstance, mapElement, mapRect, bounds, width, height) => {

    if (!bounds || !bounds.isValid()) {
        return true;
    }

    const retryThresholdBeforeZoomOut = Math.floor(EXPORT_TILE_COVERAGE_MAX_ATTEMPTS / 2);
    const mapMinZoom = typeof mapInstance.getMinZoom === 'function'
        ? mapInstance.getMinZoom()
        : 0;

    for (let attempt = 0; attempt < EXPORT_TILE_COVERAGE_MAX_ATTEMPTS; attempt += 1) {

        const tileImages = getTileImages(mapElement);

        await waitForLoadedImages(tileImages);

        if (areExportBoundsCoveredByTiles(mapInstance, bounds, mapElement, mapRect)) {
            return true;
        }

        if (attempt < retryThresholdBeforeZoomOut) {
            await new Promise(resolve => window.setTimeout(resolve, EXPORT_TILE_COVERAGE_WAIT_MS));
            continue;
        }

        const currentZoom = mapInstance.getZoom();
        const zoomedOutLevel = Math.max(mapMinZoom, currentZoom - 0.25);

        if (zoomedOutLevel === currentZoom) {
            break;
        }

        mapInstance.setView(bounds.getCenter(), zoomedOutLevel, { animate: false });
        ensureBoundsWithinExportViewport(mapInstance, bounds, width, height);

        await waitForLeafletIdle(mapInstance);

    }

    return areExportBoundsCoveredByTiles(mapInstance, bounds, mapElement, mapRect);

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
        zoomSnap: 0,
        zoomDelta: 0.25,
        preferCanvas: true
    });
    const exportRenderer = L.canvas({ padding: 0 });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}' + (L.Browser.retina ? '@2x.png' : '.png'), {
        crossOrigin: true,
        subdomains: 'abcd',
        maxNativeZoom: 11,
        maxZoom: EXPORT_MAP_MAX_ZOOM,
        minZoom: 7
    }).addTo(exportMap);

    const exportGeojson = currentGeojsonLayer.toGeoJSON();
    const { minValue, maxValue } = getMapStats(filteredMapData || []);
    const colorScale = createColorScale(minValue, maxValue);
    const pendingLayers = [];
    let exportBounds = null;
    const bubbleMapExport = isBubbleMapExport();

    // Rebuild the live map state inside a stable, off-screen Leaflet instance.
    // That gives export logic full control over size, zoom, and tile loading.

    if (bubbleMapExport) {

        // Number layers need both the geography shell and the point markers in
        // the export bounds calculation so the fitted view leaves room for both.

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

        // Choropleths only need the filled geometry, so the feature bounds come
        // directly from the export GeoJSON layer.

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
        const {
            padRatio: exportBoundsPadRatio,
            zoomBonus: exportZoomBonus
        } = getExportBoundsTuning(bubbleMapExport);

        exportMap.fitBounds(exportBounds.pad(exportBoundsPadRatio), {
            animate: false,
            padding: [EXPORT_MAP_PADDING, EXPORT_MAP_PADDING],
            maxZoom: EXPORT_MAP_MAX_ZOOM
        });

        // The fixed 16:9 frame is wider than many NYC map bounds. A small
        // post-fit zoom uses more of the canvas without changing the export
        // ratio or relying on the live viewport size.
        if (exportZoomBonus > 0) {
            exportMap.setView(
                exportBounds.getCenter(),
                Math.min(exportMap.getZoom() + exportZoomBonus, EXPORT_MAP_MAX_ZOOM),
                { animate: false }
            );
        }

        // Keep every feature inside the export viewport so polygon edges are
        // never clipped and each visible feature has basemap tiles underneath.
        ensureBoundsWithinExportViewport(exportMap, exportBounds, width, height);
    } else {
        exportMap.setView([40.700142, -73.921546], EXPORT_MAP_MAX_ZOOM);
    }

    exportMap.invalidateSize(false);

    // Lock the export viewport before adding vector layers. Adding them first
    // can change renderer timing and produce unstable export bounds.
    pendingLayers.forEach(layer => {
        layer.addTo(exportMap);
    });

    const idlePromise = waitForLeafletIdle(exportMap);

    await idlePromise;

    const exportRect = exportContainer.getBoundingClientRect();

    // Give tiles a final chance to catch up after the fitted export view has
    // settled, and only zoom out if the current tile coverage is still short.
    const tileCoverageIsComplete = await ensureTileCoverageForExport(
        exportMap,
        exportContainer,
        exportRect,
        exportBounds,
        width,
        height
    );

    return {
        exportMap,
        exportContainer,
        minLabel: document.getElementById('minVal')?.textContent || 'Min',
        maxLabel: document.getElementById('maxVal')?.textContent || 'Max',
        tileCoverageIsComplete
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


const getLeafletLayerDrawBox = (layerElement, mapRect, options = {}) => {

    const { useRenderedBounds = false } = options;

    if (useRenderedBounds) {
        // Tile images inherit scale from their parent tile container, so their
        // rendered box is the only reliable source of export coordinates.
        const layerRect = layerElement.getBoundingClientRect();

        return {
            x: layerRect.left - mapRect.left,
            y: layerRect.top - mapRect.top,
            width: layerRect.width,
            height: layerRect.height
        };
    }

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

        // Leaflet can scale the parent tile container at fractional zoom.
        // Use rendered bounds so export math includes that parent scaling.
        const tileBox = getLeafletLayerDrawBox(tileImage, mapRect, { useRenderedBounds: true });
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

    // Keep exports stable even when devtools or viewport changes resize the
    // live map. The off-screen export map is responsible for fitting bounds.
    const { width: exportWidth, height: exportHeight } = getFixedMapExportSize();

    const title = getMapExportTitle();
    const subtitle = getMapExportSubtitle();
    const sourceLines = splitTextIntoPrintLines(`Sources: ${getMapExportSources().join(' ')}`, 120);
    const legendBlockHeight = 88;
    const footerHeight = sourceLines.length ? (sourceLines.length * 16) + 24 : 0;
    const paddingX = 24;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('The map export canvas could not be prepared.');
    }

    const headerLayout = getMapExportHeaderLayout(ctx, exportWidth, paddingX, title, subtitle);
    const headerHeight = headerLayout.height;

    canvas.width = exportWidth;
    canvas.height = headerHeight + exportHeight + legendBlockHeight + footerHeight;

    // Build the final PNG in bands: header first, then the clipped map view,
    // then legend and sources. That keeps export layout deterministic.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#0f172a';
    ctx.font = '700 30px Arial';
    let textBaselineY = headerLayout.topPadding;

    headerLayout.titleLines.forEach(line => {
        ctx.fillText(line, paddingX, textBaselineY);
        textBaselineY += headerLayout.titleLineHeight;
    });

    if (headerLayout.subtitleLines.length) {
        textBaselineY += headerLayout.gapAfterTitle;
        ctx.fillStyle = '#475569';
        ctx.font = '16px Arial';

        headerLayout.subtitleLines.forEach(line => {
            ctx.fillText(line, paddingX, textBaselineY);
            textBaselineY += headerLayout.subtitleLineHeight;
        });
    }

    ctx.restore();

    const {
        exportMap,
        exportContainer,
        minLabel,
        maxLabel,
        tileCoverageIsComplete
    } = await buildTemporaryLeafletExport(exportWidth, exportHeight);

    let skippedTiles = false;

    try {

        const exportRect = exportContainer.getBoundingClientRect();

        // Leaflet keeps extra tiles and overlays just outside the visible map
        // viewport. Clip them so they cannot paint over the export header.
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, headerHeight, exportWidth, exportHeight);
        ctx.clip();

        const tileResult = await drawLeafletTiles(ctx, exportContainer, exportRect, headerHeight);

        skippedTiles = tileResult.skippedTiles;

        const drewCanvasLayers = drawLeafletCanvasLayers(ctx, exportContainer, exportRect, headerHeight);

        if (!drewCanvasLayers) {
            await drawLeafletSvgLayers(ctx, exportContainer, exportRect, headerHeight);
        }

        ctx.restore();

    } finally {

        exportMap.remove();
        exportContainer.remove();

    }

    ctx.strokeStyle = '#d0d7de';
    ctx.strokeRect(0.5, headerHeight + 0.5, exportWidth - 1, exportHeight - 1);

    const legendWidth = Math.min(280, Math.max(190, Math.round(exportWidth * 0.28)));

    // Keep the legend and sources outside the map frame so export framing work
    // only has to reason about the actual map viewport.
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
        tileWarning: (skippedTiles || !tileCoverageIsComplete)
            ? 'Some basemap tiles were unavailable in part of the export area. The exporter attempted to zoom out to recover coverage; if this persists, retry in a moment.'
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

    trackDataExplorerPrintView(chartType || overlay || 'chart');
    openPrintModal();
    renderChartPreview();

};

const openMapSaveModal = () => {

    trackDataExplorerPrintView('map');
    openPrintModal();
    renderMapPreview();

};


const bindPrintControls = () => {

    // These triggers live in server-rendered partials, so keep the modal
    // entrypoints private here instead of exporting window-level helpers.
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

    if (printModalDownload) {
        printModalDownload.addEventListener('click', () => {

            const fileName = printModalDownload.getAttribute('download');

            if (!fileName) {
                return;
            }

            trackDataExplorerFileDownload({
                fileName,
                fileExtension: '.png',
                linkText: printModalDownload.textContent.trim() || 'Download PNG'
            });

        });
    }

};


bindPrintControls();