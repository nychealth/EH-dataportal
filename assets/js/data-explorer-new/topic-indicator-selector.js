// ======================================================================= //
// topic-indicator-selector.js
// ======================================================================= //

// console.log(">> topic-indicator-selector.js");

// --------------------------------------------------------
// all indicator metadata as global variable
// --------------------------------------------------------

let indicators = null; 

// --------------------------------------------------------
// Immediately start loading metadata.json
// --------------------------------------------------------

const indicatorsPromise = fetch(`${data_repo}${data_branch}/indicators/metadata/metadata.json`)
    .then(response => response.json())
    .then(data => {
        console.log("* fetch metadata.json");
        indicators = data; 
        // console.log(">> indicators [fetch]", indicators);
        return data; // resolve promise
    })
    .catch(error => console.error("# Error loading metadata.json:", error));

// Waits for indicators to be ready

const ensureIndicatorsLoaded = async (topic) => {

    // console.log("* ensureIndicatorsLoaded (", topic, ")");

    if (indicators) {

        return indicators; 

    } else {

        // console.log("# Waiting for indicators to load for " + topic);
        
        return await indicatorsPromise; 

    }

}


// --------------------------------------------------------
// When a topic is selected, show indicator menu modal, and print indicators
// --------------------------------------------------------

const getIndicatorsForTopic = (title, indicatorsJSON, dest) => {

    console.log("* getIndicatorsForTopic");
    
    const indicators = JSON.parse(indicatorsJSON);
    
    // Close topic selector modal
    $('#topicSelector').modal('hide');
    
    // Open Indicator Selector modal
    $('#indicatorSelector').modal('show');
    
    // set destination
    // console.log('destination:', dest)
    
    // pass indicator json to print function
    printIndicators(indicators, dest)
    
}


// --------------------------------------------------------
// Print chosen topic's indicators to indicator selection modal 
// --------------------------------------------------------

const printIndicators = async (indList, destination) => {

    console.log("* printIndicators");
    
    // Destination
    const indicatorDestination = document.getElementById("indicatorDestination");
    if (!indicatorDestination) {
        console.error("Error: No element with id 'indicatorDestination' found.");
        return;
    }
    
    // Ensure metadata are loaded
    const data = await ensureIndicatorsLoaded('indicator selection modal');
    // console.log("Indicators ready to print to indicator selection modal!", data);
    
    // Clear existing content
    indicatorDestination.innerHTML = '';
    
    indList.forEach(section => {
        // Only proceed if there are indicators
        if (!section.indicators || section.indicators.length === 0) return;
        
        // Header (optional)
        const headerHtml = section.header ? `<h5 class="font-weight-bold mt-3 mb-1">${section.header}</h5>` : '';
        
        // Generate HTML for each indicator
        const indicatorsHtml = section.indicators.map(id => {
            // Look up the indicator object in the global indicators array
            const indicator = indicators.find(ind => ind.IndicatorID === id);
            
            if (!indicator) {
                console.warn(`Indicator with ID ${id} not found.`);
                return ''; // skip if not found
            }
            
            return `
                <div class="indicator-card mb-1">
                    <div class="border p-2 border-gray-300 rounded">
                        <div class="d-flex justify-content-between align-items-start">
                            <button class='h6 btn btn-link text-left p-0' onclick='selectIndicator(${indicator.IndicatorID})'>${indicator.IndicatorName}</button>
                        </div>
                        <p class="mb-0" style="font-size: 14px;">${indicator.IndicatorDescription}</p>
                    </div>
                </div>
            `;
        }).join('');
        
        // Wrap in indicator-grid
        const sectionHtml = `
            ${headerHtml}
            <div class="indicator-grid">
                ${indicatorsHtml}
            </div>
        `;
        
        // Append to destination
        indicatorDestination.innerHTML += sectionHtml;

    });

}


// --------------------------------------------------------
// Dismiss the indicator selector modal (works before or after Bootstrap loads)
// --------------------------------------------------------

const dismissIndicatorModal = () => {

    // By the time a user can interact with the modal, Bootstrap is loaded
    $('#indicatorSelector').modal('hide');

};


// --------------------------------------------------------
// Select an indicator from the modal (SPA-style, no page reload)
// --------------------------------------------------------

const selectIndicator = async (id) => {

    console.log("* selectIndicator:", id);

    // Dismiss the modal

    dismissIndicatorModal();

    // Clear stale sub-selection params so the new indicator starts clean.

    resetSelectionForNewIndicator(id);

    // Run the full load pipeline

    printIndicatorInfo(id);
    draw311Buttons(id);

    await ensureIndicatorsLoaded('selectIndicator');
    await loadIndicator(id);
    await printMenus(id);
    await renderMeasures();

    pushSelectionToURL();
    renderCurrentView();

};


// --------------------------------------------------------
// Check for URL parameter (?id=XXXX) and load indicator metadata 
// --------------------------------------------------------

const checkURL = async () => {

    console.log("* checkURL");

    const urlParams = new URLSearchParams(window.location.search);
    
    // URL Format: .../TOPIC/?id=2133&MeasureID=239&GeoType=CDTA&TimePeriodID=123
    // Compatibility/confusion alias: GeoTypeID also accepted on read
    
    const paramsObj = Object.fromEntries(urlParams.entries());
    
    console.log('URL Parameters:');
    console.log(paramsObj);

    if (paramsObj.GeoTypeID && !paramsObj.GeoType) {
        normalizeLegacyGeoTypeURL();
        paramsObj.GeoType = paramsObj.GeoTypeID;
    }
    
    const chosenIndicator = Number(paramsObj.id);

    // No indicator in URL — wait for Bootstrap to finish loading, then open the modal

    if (!paramsObj.id || isNaN(chosenIndicator)) {
        console.log("No indicator ID in URL, opening indicator selector.");
        window.addEventListener('load', () => $('#indicatorSelector').modal('show'), { once: true });
        return;
    }

    // seed globals from URL params (if present) before menus build

    if (paramsObj.MeasureID)    MeasureID    = parseFloat(paramsObj.MeasureID);
    if (paramsObj.GeoType || paramsObj.GeoTypeID) {
        GeoType = paramsObj.GeoType || paramsObj.GeoTypeID;
    }
    if (paramsObj.TimePeriodID) TimePeriodID = parseFloat(paramsObj.TimePeriodID);
    if (paramsObj.overlay)      overlay      = paramsObj.overlay;

    // fire indicator info and 311 buttons

    printIndicatorInfo(chosenIndicator);
    draw311Buttons(chosenIndicator);

    // load data first so timeLookup is populated before menus build

    const _indicators = await ensureIndicatorsLoaded('printing measure menu');

    await loadIndicator(chosenIndicator);

    await printMenus(chosenIndicator);

    await renderMeasures();

    // sync full state to URL (fills in defaults the user didn't specify)

    pushSelectionToURL();

    // show the active tab (or default to map)

    renderCurrentView();

}


// --------------------------------------------------------
// Print basic indicator info from metadata to page 
// --------------------------------------------------------

const printIndicatorInfo = async (IndicatorID) => {

    console.log("* printIndicatorInfo");
    
    // Ensure metadata are loaded
    const data = await ensureIndicatorsLoaded('printing to page');
    // console.log("Indicators ready to print to page!");
    
    // Find the indicator object where IndicatorID matches IndicatorID
    const indicator = data.find(d => d.IndicatorID === IndicatorID);
    
    console.log('This indicator:');
    console.log(indicator)
    
    if (!indicator) {

        console.warn("No indicator found for ID:", IndicatorID);
        $('#indicatorSelector').modal('show'); // fire Indicator Selection Modal
        return;

    }
    
    // Query holders
    const nameHolders = document.querySelectorAll('.indicator-name');
    const descriptionHolders = document.querySelectorAll('.indicator-description');
    
    // Fill name fields
    nameHolders.forEach(el => {
        el.textContent = indicator.IndicatorName ?? "";
    });
    
    // Fill description fields
    descriptionHolders.forEach(el => {
        el.textContent = indicator.IndicatorDescription ?? "";
    });
    
    // Handle Data Source and How Calculated
    const howCalculatedEl = document.getElementById('howCalculated');
    const dataSourcesEl = document.getElementById('dataSources');
    
    // Clear previous content
    howCalculatedEl.innerHTML = '';
    dataSourcesEl.innerHTML = '';
    
    // To store unique sources
    const uniqueSources = new Set();
    
    // Loop through Measures
    indicator.Measures.forEach(measure => {

        // Append MeasurementType and how_calculated

        const p = document.createElement('p');
        p.innerHTML = `<strong>${measure.MeasurementType}:</strong> ${measure.how_calculated}`;
        howCalculatedEl.appendChild(p);
        
        // Collect sources

        if (measure.Sources) {
            uniqueSources.add(measure.Sources);
        }

    });
    
    // Display unique sources

    uniqueSources.forEach(source => {

        const p = document.createElement('p');
        p.textContent = source;
        dataSourcesEl.appendChild(p);

    });
    
    
}

