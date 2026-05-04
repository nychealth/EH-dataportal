// ======================================================================= //
// topic-indicator-selector.js
// ======================================================================= //

// console.log(">> topic-indicator-selector.js");

// ----------------------------------------------------------------------- //
// all indicator metadata as global variable
// ----------------------------------------------------------------------- //

let indicators = null;

// Destination URL set by printIndicators; used by selectIndicator on pages
// that don't load app.js (e.g. section.html) to navigate instead of SPA-load.
let indicatorSelectDestination = null;

// Last topic selection data (indicator list + destination URL). Section.html
// stores this in history.state so back/forward can replay the indicator modal.
let lastTopicData = null;

// ----------------------------------------------------------------------- //
// Immediately start loading metadata.json
// ----------------------------------------------------------------------- //

const indicatorsPromise = fetch(`${data_repo}${data_branch}/indicators/metadata/metadata.json`)
    .then(response => response.json())
    .then(data => {
        console.log("* fetch metadata.json");
        indicators = data; 
        // console.log(">> indicators [fetch]", indicators);
        return data; // resolve promise
    })
    .catch(error => console.error("# Error loading metadata.json:", error));

// Waits for metadata.json to finish loading before any indicator UI reads it.
const ensureIndicatorsLoaded = async (topic) => {

    // console.log("* ensureIndicatorsLoaded (", topic, ")");

    // Reuse the already-loaded metadata instead of awaiting the fetch again.
    if (indicators) {

        return indicators; 

    } else {

        // Reuse the in-flight metadata request instead of starting a second fetch.
        // console.log("# Waiting for indicators to load for " + topic);
        
        return await indicatorsPromise; 

    }

}


// ----------------------------------------------------------------------- //
// When a topic is selected, show indicator menu modal, and print indicators
// ----------------------------------------------------------------------- //

// Opens the indicator modal for the selected topic and remembers its state.
const getIndicatorsForTopic = (title, indicatorsJSON, dest) => {

    console.log("* getIndicatorsForTopic");
    console.log("Title:", title);

    document.getElementById('printTopic').textContent = title.toLowerCase();

    const indicators = JSON.parse(indicatorsJSON);

    // Stash for section.html's history state
    lastTopicData = { indicators, destination: dest };

    // Wait for topic modal to fully hide before showing indicator modal.
    // Sequencing avoids double-backdrop issues with Bootstrap 4.

    $('#topicSelector').one('hidden.bs.modal', () => {
        $('#indicatorSelector').modal('show');
    });

    $('#topicSelector').modal('hide');

    printIndicators(indicators, dest);

}


// ----------------------------------------------------------------------- //
// Print chosen topic's indicators to indicator selection modal 
// ----------------------------------------------------------------------- //

const printIndicators = async (indList, destination) => {

    console.log("* printIndicators");

    // Store destination so selectIndicator can use it for navigation
    // (needed on section.html where app.js is not loaded)
    indicatorSelectDestination = destination;
    
    // Destination
    const indicatorDestination = document.getElementById("indicatorDestination");

    // Stop early if the section template is missing the modal content target.
    if (!indicatorDestination) {
        console.error("Error: No element with id 'indicatorDestination' found.");
        return;
    }
    
    // Ensure metadata are loaded
    const data = await ensureIndicatorsLoaded('indicator selection modal');
    // console.log("Indicators ready to print to indicator selection modal!", data);
    
    // Clear existing content
    indicatorDestination.innerHTML = '';
    
    // Render each indicator section block in the order defined by Hugo front matter.
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
                // Skip broken front-matter references without breaking the rest of the modal.
                console.warn(`Indicator with ID ${id} not found.`);
                return ''; // skip if not found
            }
            
            // inline onclick: buttons are injected via innerHTML, so addEventListener would not survive DOM replacement
            return `
                <div class="indicator-card border-bottom border-gray-300 pb-1 mb-1">
                    <button class='h6 font-weight-bold border-0 text-primary bg-transparent hover-underline p-0 text-left' onclick='selectIndicator(${indicator.IndicatorID})'>${indicator.IndicatorName}</button>
                    <p class="mb-0" style="font-size: 14px;">${indicator.IndicatorDescription}</p>
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


// ----------------------------------------------------------------------- //
// Dismiss the indicator selector modal (works before or after Bootstrap loads)
// ----------------------------------------------------------------------- //

const dismissIndicatorModal = () => {

    // By the time a user can interact with the modal, Bootstrap is loaded
    $('#indicatorSelector').modal('hide');

};


// ----------------------------------------------------------------------- //
// Return from indicator selection to the topic chooser
// ----------------------------------------------------------------------- //

const relaunchTopicSelector = (event) => {

    if (event) {
        event.preventDefault();
    }

    // Section pages use hash-based modal history, so go back there instead
    // of forcing a second manual modal transition.
    if (typeof resetSelectionForNewIndicator !== 'function' && window.location.hash === '#indicators') {
        window.history.back();
        return false;
    }

    $('#indicatorSelector').one('hidden.bs.modal', () => {
        $('#topicSelector').modal('show');
    });

    $('#indicatorSelector').modal('hide');

    return false;

};

window.relaunchTopicSelector = relaunchTopicSelector;


// ----------------------------------------------------------------------- //
// Print basic indicator info from metadata to page 
// ----------------------------------------------------------------------- //

const printIndicatorInfo = async (IndicatorID) => {

    console.log("* printIndicatorInfo");
    
    // Ensure metadata are loaded
    const data = await ensureIndicatorsLoaded('printing to page');
    // console.log("Indicators ready to print to page!");
    
    // Find the indicator object where IndicatorID matches IndicatorID
    const indicator = data.find(d => d.IndicatorID === IndicatorID);
    
    console.log('This indicator:');
    console.log(indicator)
    
    // Reopen the chooser if the requested indicator is missing from metadata.
    if (!indicator) {

        console.warn("No indicator found for ID:", IndicatorID);
        $('#indicatorSelector').modal('show'); // fire Indicator Selection Modal
        return;

    }
    
    // Query holders
    const nameHolders = document.querySelectorAll('.indicator-name');
    const descriptionHolders = document.querySelectorAll('.indicator-description');
    
    // Fill name fields
    // Keep desktop and mobile indicator titles in sync.
    nameHolders.forEach(el => {
        el.textContent = indicator.IndicatorName ?? "";
    });
    
    // Fill description fields
    // Keep all description placeholders aligned with the chosen indicator.
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
    // Collect one About paragraph and one unique source entry per measure.
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


// ----------------------------------------------------------------------- //
// Select an indicator from the modal (SPA-style, no page reload)
// ----------------------------------------------------------------------- //

// Loads the chosen indicator either via SPA flow or full-page navigation.
const selectIndicator = async (id) => {

    console.log("* selectIndicator:", id);

    // On pages without the full app (e.g. section.html), navigate directly.
    // Skip dismissing the modal so the back-to-topics handler doesn't fire.

    // Fall back to plain navigation on pages that do not load the SPA app.js helpers.
    if (typeof resetSelectionForNewIndicator !== 'function') {
        window.location.href = indicatorSelectDestination + '?id=' + Number(id);
        return;
    }

    // Check if we're switching to a different topic (pathname changed).
    // If so, navigate to the new topic with the indicator ID instead of SPA flow.
    const currentPathname = new URL(window.location).pathname;
    const destinationPathname = new URL(indicatorSelectDestination, window.location).pathname;

    if (currentPathname !== destinationPathname) {
        // Topic changed — full page navigation to the new topic
        window.location.href = indicatorSelectDestination + '?id=' + Number(id);
        return;
    }

    // SPA path — same topic, dismiss modal and reload in place

    dismissIndicatorModal();

    resetSelectionForNewIndicator(id);

    // Run the full load pipeline

    printIndicatorInfo(id);
    draw311Buttons(id);

    await ensureIndicatorsLoaded('selectIndicator');
    await loadIndicator(id);
    await printMenus(id);
    await renderMeasures();

    pushSelectionToURL();
    renderCurrentView(true);

};


// ----------------------------------------------------------------------- //
// Check for URL parameter (?id=XXXX) and load indicator metadata 
// ----------------------------------------------------------------------- //

// Boots the explorer from URL params or opens the chooser when none are present.
const checkURL = async () => {

    console.log("* checkURL");

    const urlParams = new URLSearchParams(window.location.search);
    
    // URL Format: .../TOPIC/?id=2133&MeasureID=239&GeoType=CDTA&TimePeriodID=123
    // Compatibility/confusion alias: GeoTypeID also accepted on read
    
    const paramsObj = Object.fromEntries(urlParams.entries());
    
    console.log('URL Parameters:');
    console.log(paramsObj);

    if (paramsObj.GeoTypeID && !paramsObj.GeoType) {
        // Normalize the URL before menus read it so every downstream branch sees one GeoType key.
        normalizeLegacyGeoTypeURL();
        paramsObj.GeoType = paramsObj.GeoTypeID;
    }
    
    const chosenIndicator = Number(paramsObj.id);

    // No indicator in URL — wait for Bootstrap to finish loading, then open the modal

    // Open the chooser modal when the URL does not point to a valid indicator.
    if (!paramsObj.id || isNaN(chosenIndicator)) {
        console.log("No indicator ID in URL, opening indicator selector.");
        window.addEventListener('load', () => $('#indicatorSelector').modal('show'), { once: true });
        return;
    }

    // seed globals from URL params (if present) before menus build

    if (paramsObj.MeasureID)    MeasureID    = parseFloat(paramsObj.MeasureID);
    if (paramsObj.GeoType || paramsObj.GeoTypeID) {

        // Seed the pretty geography label before menus build their available options.
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

    // render active overlay pane and update the Leaflet map

    renderCurrentView(true);

}

