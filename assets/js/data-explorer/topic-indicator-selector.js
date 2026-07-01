// ======================================================================= //
// topic-indicator-selector.js
// ======================================================================= //

// Topic and indicator chooser modals: metadata loading, modal wiring, and
// the URL-param boot path that loads an indicator on page load.

// console.log(">> topic-indicator-selector.js");

// ----------------------------------------------------------------------- //
// all indicator metadata as global variable
// ----------------------------------------------------------------------- //

// Holds the parsed metadata.json response once indicatorsPromise resolves;
// null until then, so callers must go through ensureIndicatorsLoaded.
let indicators = null;

// Destination URL set by printIndicators; used by selectIndicator on pages
// that don't load app.js (e.g. section.html) to navigate instead of SPA-load.
let indicatorSelectDestination = null;

// Last topic selection data (indicator list + destination URL). Section.html
// stores this in history.state so back/forward can replay the indicator modal.
let lastTopicData = null;

// Track whether the topic modal was dismissed after a real selection.
// If not, section landing pages can show a clear nudge beside the trigger.
let topicSelectionConfirmed = false;

// Track whether the indicator modal closed after a real dataset selection.
let indicatorSelectionConfirmed = false;

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


// Clears the temporary required-selection hint around the topic trigger.
const clearTopicSelectorPrompt = () => {

    const topicSelectorButton = document.getElementById('topicSelectorButton');
    const topicSelectorPrompt = document.getElementById('topicSelectorPrompt');
    const topicSelectorWrap = topicSelectorButton?.closest('.topic-selector-trigger-wrap');

    if (topicSelectorWrap) {
        topicSelectorWrap.classList.remove('topic-selector-required');
    }

    if (topicSelectorButton) {
        topicSelectorButton.removeAttribute('aria-describedby');
    }

    if (topicSelectorPrompt) {
        topicSelectorPrompt.classList.add('d-none');
        topicSelectorPrompt.setAttribute('aria-hidden', 'true');
    }

};


// Single-topic pages without ?id= should nudge users back to dataset selection.
const isTopicLandingPageWithoutIndicator = () => {

    if (typeof resetSelectionForNewIndicator !== 'function') {
        return false;
    }

    const indicatorParam = new URLSearchParams(window.location.search).get('id');

    return !indicatorParam || Number.isNaN(Number(indicatorParam));

};


// Clears the temporary required-selection hint around Change dataset links.
const clearIndicatorSelectorPrompt = () => {

    document.querySelectorAll('.indicator-selector-trigger-wrap').forEach(wrapper => {
        wrapper.classList.remove('indicator-selector-required');
    });

    document.querySelectorAll('.indicator-selector-trigger').forEach(button => {
        button.removeAttribute('aria-describedby');
    });

    document.querySelectorAll('.indicator-selector-prompt').forEach(prompt => {
        prompt.classList.add('d-none');
        prompt.setAttribute('aria-hidden', 'true');
    });

};


// Highlights Change dataset links when the chooser closes with no dataset picked.
const showIndicatorSelectorPrompt = () => {

    document.querySelectorAll('.indicator-selector-trigger-wrap').forEach(wrapper => {
        const button = wrapper.querySelector('.indicator-selector-trigger');
        const prompt = wrapper.querySelector('.indicator-selector-prompt');

        wrapper.classList.add('indicator-selector-required');

        if (button && prompt?.id) {
            button.setAttribute('aria-describedby', prompt.id);
        }

        if (prompt) {
            prompt.classList.remove('d-none');
            prompt.setAttribute('aria-hidden', 'false');
        }
    });

};


// Highlights the topic trigger when the chooser closes with no selection.
const showTopicSelectorPrompt = () => {

    const topicSelectorButton = document.getElementById('topicSelectorButton');
    const topicSelectorPrompt = document.getElementById('topicSelectorPrompt');
    const topicSelectorWrap = topicSelectorButton?.closest('.topic-selector-trigger-wrap');

    if (topicSelectorWrap) {
        topicSelectorWrap.classList.add('topic-selector-required');
    }

    if (topicSelectorButton) {
        topicSelectorButton.setAttribute('aria-describedby', 'topicSelectorPrompt');
    }

    if (topicSelectorPrompt) {
        topicSelectorPrompt.classList.remove('d-none');
        topicSelectorPrompt.setAttribute('aria-hidden', 'false');
    }

};


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

    // Mark this hide transition as a successful topic pick so the section
    // header does not show the required-selection prompt.
    topicSelectionConfirmed = true;
    clearTopicSelectorPrompt();

    // Wait for topic modal to fully hide before showing indicator modal.
    // Sequencing avoids double-backdrop issues with Bootstrap 4.

    $('#topicSelector').one('hidden.bs.modal', () => {
        $('#indicatorSelector').modal('show');
    });

    $('#topicSelector').modal('hide');

    printIndicators(indicators, dest);

}


const bindTopicSelectorControls = () => {

    const topicSelectorModal = document.getElementById('topicSelector');
    const indicatorSelectorModal = document.getElementById('indicatorSelector');

    if (topicSelectorModal) {
        $('#topicSelector').on('show.bs.modal', () => {
            clearTopicSelectorPrompt();
        });

        $('#topicSelector').on('hidden.bs.modal', () => {
            if (topicSelectionConfirmed) {
                topicSelectionConfirmed = false;
                return;
            }

            if (typeof resetSelectionForNewIndicator === 'function') {
                return;
            }

            showTopicSelectorPrompt();
        });
    }

    if (indicatorSelectorModal) {
        $('#indicatorSelector').on('show.bs.modal', () => {
            clearIndicatorSelectorPrompt();
        });

        $('#indicatorSelector').on('hidden.bs.modal', () => {
            if (indicatorSelectionConfirmed) {
                indicatorSelectionConfirmed = false;
                return;
            }

            if (!isTopicLandingPageWithoutIndicator()) {
                return;
            }

            showIndicatorSelectorPrompt();
        });
    }

    // Topic links and the relaunch control are rendered once in Hugo, so
    // bind them directly to their explicit data hooks instead of inline HTML.
    const topicLinks = document.querySelectorAll('.de-topic-indicator-link[data-indicators][data-topic-title][data-topic-destination]');

    topicLinks.forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            getIndicatorsForTopic(
                link.dataset.topicTitle,
                link.dataset.indicators,
                link.dataset.topicDestination
            );
        });
    });

    const relaunchButtons = document.querySelectorAll('.indicator-modal-topic-trigger[data-topic-selector-action="relaunch"]');

    relaunchButtons.forEach(button => {
        button.addEventListener('click', () => {
            relaunchTopicSelector();
        });
    });

    const indicatorDestination = document.getElementById('indicatorDestination');

    if (indicatorDestination) {
        // The indicator list is rebuilt with innerHTML on every topic change,
        // so delegate from the stable modal container.
        indicatorDestination.addEventListener('click', event => {
            const indicatorButton = event.target.closest('.de-select-indicator-button[data-indicator-id]');

            if (!indicatorButton) {
                return;
            }

            selectIndicator(indicatorButton.dataset.indicatorId);
        });
    }

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

    // Hugo exposes the curated updated-ID list on the shared indicator shell.
    // Reuse it here so modal decorations match the main indicator header.
    const indicatorInfoRoot = document.querySelector('.de-main-details');
    const recentlyUpdatedIndicatorIds = JSON.parse(
        indicatorInfoRoot?.dataset.recentlyUpdatedIds ?? '[]'
    ).map(Number);
    
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

            const isRecentlyUpdated = recentlyUpdatedIndicatorIds.includes(Number(indicator.IndicatorID));
            const recentlyUpdatedBadge = isRecentlyUpdated
                ? '<span class="ml-1 text-nowrap font-weight-bold fs-xs text-info align-bottom">Recently updated &nbsp;<i class="fa-regular fa-clock fs-xs"></i></span>'
                : '';
            
            // Use event delegation on #indicatorDestination so rerendered buttons
            // keep working without inline handlers.
            return `
                <div class="indicator-card border-bottom border-gray-300 pb-1 mb-1">
                    <div class="d-flex flex-wrap align-items-start">
                        <button type="button" class="h6 font-weight-bold border-0 text-primary bg-transparent hover-underline p-0 text-left de-select-indicator-button" data-indicator-id="${indicator.IndicatorID}">${indicator.IndicatorName}</button>
                        ${recentlyUpdatedBadge}
                    </div>
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


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindTopicSelectorControls);
} else {
    bindTopicSelectorControls();
}


// ----------------------------------------------------------------------- //
// Print basic indicator info from metadata to page 
// ----------------------------------------------------------------------- //

const printIndicatorInfo = async (IndicatorID) => {

    console.log("* printIndicatorInfo");

    // URL params and data-* attributes reach this path as strings.
    // Normalize once so metadata lookups stay in sync with the load pipeline.
    const normalizedIndicatorId = Number(IndicatorID);
    
    // Ensure metadata are loaded
    const data = await ensureIndicatorsLoaded('printing to page');
    // console.log("Indicators ready to print to page!");
    
    // Find the indicator object where IndicatorID matches IndicatorID
    const indicator = data.find(d => Number(d.IndicatorID) === normalizedIndicatorId);

    // Hugo writes the curated "recently updated" indicator IDs into the shell.
    // Read them here so the indicator title can reflect updated datasets.
    const indicatorInfoRoot = document.querySelector('.de-main-details');
    const recentlyUpdatedIndicatorIds = JSON.parse(
        indicatorInfoRoot?.dataset.recentlyUpdatedIds ?? '[]'
    ).map(Number);
    const showRecentlyUpdatedIcon = recentlyUpdatedIndicatorIds.includes(normalizedIndicatorId);
    
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
    
    // Fill name fields.
    // Updated indicators get the clock icon inline with the title instead of a separate badge.
    nameHolders.forEach(el => {
        el.replaceChildren(document.createTextNode(indicator.IndicatorName ?? ""));

        if (showRecentlyUpdatedIcon) {
            const icon = document.createElement('i');
            icon.className = 'fa-regular fa-clock ml-1 fs-sm';
            icon.setAttribute('aria-hidden', 'true');
            icon.setAttribute('aria-label', 'Recently updated');
            icon.setAttribute('title', 'Recently updated');
            el.appendChild(icon);
        }
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

    // Record the selection (mirrors the old explorer's click_indicator event).
    // Guarded because the topic-chooser page loads this file without global.js,
    // so the wrapper may not exist in every context that calls selectIndicator.
    if (typeof trackDataExplorerEvent === 'function') {
        trackDataExplorerEvent('click_indicator', { IndicatorID: Number(id) });
    }

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

    indicatorSelectionConfirmed = true;
    clearIndicatorSelectorPrompt();

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

