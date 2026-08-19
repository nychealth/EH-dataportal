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

// Destination URL set by renderIndicatorList; used by selectIndicator on pages
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
        debugLog("* fetch metadata.json");
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

    if (typeof loadAndRenderIndicator !== 'function') {
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
// When a topic is selected, show indicator menu modal, and render its indicator list
// ----------------------------------------------------------------------- //

// Opens the indicator modal for the selected topic and remembers its state.
const getIndicatorsForTopic = (title, indicatorsJSON, dest) => {

    debugLog("* getIndicatorsForTopic");
    debugLog("Title:", title);

    document.getElementById('selectedTopicName').textContent = title.toLowerCase();

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

    renderIndicatorList(indicators, dest);

}


// Wires topic/indicator modal prompts, topic-link clicks, relaunch, and indicator selection once on load.
const bindTopicSelectorControls = () => {

    // ----- resolve modal DOM elements ----- //

    const topicSelectorModal = document.getElementById('topicSelector');
    const indicatorSelectorModal = document.getElementById('indicatorSelector');

    // ----- wire topic-selector modal show/hidden handlers ----- //

    if (topicSelectorModal) {
        $('#topicSelector').on('show.bs.modal', () => {
            clearTopicSelectorPrompt();
        });

        $('#topicSelector').on('hidden.bs.modal', () => {

            // - - - skip prompt: this hide followed a real topic pick - - - //

            if (topicSelectionConfirmed) {
                topicSelectionConfirmed = false;
                return;
            }

            // - - - skip prompt: the SPA isn't loaded on this page - - - //

            if (typeof loadAndRenderIndicator === 'function') {
                return;
            }

            // - - - otherwise nudge the user back toward the topic trigger - - - //

            showTopicSelectorPrompt();
        });
    }

    // ----- wire indicator-selector modal show/hidden handlers ----- //

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

    // ----- bind topic-link clicks ----- //

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

    // ----- bind relaunch-button clicks ----- //

    const relaunchButtons = document.querySelectorAll('.indicator-modal-topic-trigger[data-topic-selector-action="relaunch"]');

    relaunchButtons.forEach(button => {
        button.addEventListener('click', () => {
            relaunchTopicSelector();
        });
    });

    // ----- bind delegated indicator-selection click handler ----- //

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
// Render chosen topic's indicators into the indicator selection modal
// ----------------------------------------------------------------------- //

// Rebuilds the indicator-selector modal's HTML for a topic, badging recently-updated indicators.
const renderIndicatorList = async (indList, destination) => {

    debugLog("* renderIndicatorList");

    // ----- resolve destination + DOM target, guard ----- //

    // Store destination so selectIndicator can use it for navigation
    // (needed on section.html where app.js is not loaded)
    indicatorSelectDestination = destination;

    const indicatorDestination = document.getElementById("indicatorDestination");

    // Stop early if the section template is missing the modal content target.
    if (!indicatorDestination) {
        console.error("Error: No element with id 'indicatorDestination' found.");
        return;
    }

    // ----- load metadata, resolve recently-updated IDs ----- //

    const data = await ensureIndicatorsLoaded('indicator selection modal');
    // console.log("Indicators ready to print to indicator selection modal!", data);

    // Hugo exposes the curated updated-ID list on the shared indicator shell.
    // Reuse it here so modal decorations match the main indicator header.
    const indicatorInfoRoot = document.querySelector('.de-main-details');
    const recentlyUpdatedIndicatorIds = JSON.parse(
        indicatorInfoRoot?.dataset.recentlyUpdatedIds ?? '[]'
    ).map(Number);

    // ----- clear existing content ----- //

    indicatorDestination.innerHTML = '';

    // ----- render each topic section (Hugo front-matter order) ----- //

    indList.forEach(section => {

        // - - - guard: skip empty sections - - - //

        if (!section.indicators || section.indicators.length === 0) return;

        // - - - build header (optional) - - - //

        const headerHtml = section.header ? `<h5 class="font-weight-bold mt-3 mb-1">${section.header}</h5>` : '';

        // - - - build each indicator card, with recently-updated badge - - - //

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
        
        // - - - wrap section HTML and append to destination - - - //

        const sectionHtml = `
            ${headerHtml}
            <div class="indicator-grid">
                ${indicatorsHtml}
            </div>
        `;

        indicatorDestination.innerHTML += sectionHtml;

    });

}


// ----------------------------------------------------------------------- //
// Dismiss the indicator selector modal (works before or after Bootstrap loads)
// ----------------------------------------------------------------------- //

// Hides the indicator-selector Bootstrap modal.
const dismissIndicatorModal = () => {

    // By the time a user can interact with the modal, Bootstrap is loaded
    $('#indicatorSelector').modal('hide');

};


// ----------------------------------------------------------------------- //
// Return from indicator selection to the topic chooser
// ----------------------------------------------------------------------- //

// Closes the indicator modal and reopens the topic chooser, falling back to browser history when the SPA isn't loaded.
const relaunchTopicSelector = (event) => {

    if (event) {
        event.preventDefault();
    }

    // Section pages use hash-based modal history, so go back there instead
    // of forcing a second manual modal transition.
    if (typeof loadAndRenderIndicator !== 'function' && window.location.hash === '#indicators') {
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
// Render basic indicator info from metadata onto the page
// ----------------------------------------------------------------------- //

// Fills all on-page indicator name/description/methodology/source placeholders from metadata.
const renderIndicatorInfo = async (IndicatorID) => {

    debugLog("* renderIndicatorInfo");

    // ----- resolve indicator record ----- //

    // URL params and data-* attributes reach this path as strings.
    // Normalize once so metadata lookups stay in sync with the load pipeline.
    const normalizedIndicatorId = Number(IndicatorID);

    const data = await ensureIndicatorsLoaded('rendering indicator info');
    // console.log("Indicators ready to print to page!");

    const indicator = data.find(d => Number(d.IndicatorID) === normalizedIndicatorId);

    // ----- resolve recently-updated flag ----- //

    // Hugo writes the curated "recently updated" indicator IDs into the shell.
    // Read them here so the indicator title can reflect updated datasets.
    const indicatorInfoRoot = document.querySelector('.de-main-details');
    const recentlyUpdatedIndicatorIds = JSON.parse(
        indicatorInfoRoot?.dataset.recentlyUpdatedIds ?? '[]'
    ).map(Number);
    const showRecentlyUpdatedIcon = recentlyUpdatedIndicatorIds.includes(normalizedIndicatorId);

    debugLog('This indicator:');
    debugLog(indicator)

    // ----- guard: reopen chooser if not found ----- //

    if (!indicator) {

        console.warn("No indicator found for ID:", IndicatorID);
        $('#indicatorSelector').modal('show'); // fire Indicator Selection Modal
        return;

    }

    // ----- fill name field(s) ----- //

    const nameHolders = document.querySelectorAll('.indicator-name');
    const descriptionHolders = document.querySelectorAll('.indicator-description');

    // Updated indicators get the clock icon inline with the title instead of a separate badge.
    nameHolders.forEach(el => {
        el.replaceChildren(document.createTextNode(indicator.IndicatorName ?? ""));

        // - - - append recently-updated icon - - - //

        if (showRecentlyUpdatedIcon) {
            const icon = document.createElement('i');
            icon.className = 'fa-regular fa-clock ml-1 fs-sm';
            icon.setAttribute('aria-hidden', 'true');
            icon.setAttribute('aria-label', 'Recently updated');
            icon.setAttribute('title', 'Recently updated');
            el.appendChild(icon);
        }
    });

    // ----- fill description field(s) ----- //

    // Keep all description placeholders aligned with the chosen indicator.
    descriptionHolders.forEach(el => {
        el.textContent = indicator.IndicatorDescription ?? "";
    });

    // ----- rebuild "how calculated" paragraphs, collect unique sources ----- //

    const howCalculatedEl = document.getElementById('howCalculated');
    const dataSourcesEl = document.getElementById('dataSources');

    howCalculatedEl.innerHTML = '';
    dataSourcesEl.innerHTML = '';

    const uniqueSources = new Set();

    // Collect one About paragraph and one unique source entry per measure.
    indicator.Measures.forEach(measure => {

        const p = document.createElement('p');
        p.innerHTML = DOMPurify.sanitize(`<strong>${measure.MeasurementType}:</strong> ${measure.how_calculated}`);
        howCalculatedEl.appendChild(p);

        if (measure.Sources) {
            uniqueSources.add(measure.Sources);
        }

    });

    // ----- render collected sources ----- //

    uniqueSources.forEach(source => {

        const p = document.createElement('p');
        p.textContent = source;
        dataSourcesEl.appendChild(p);

    });
    
    
}


// ----------------------------------------------------------------------- //
// Select an indicator from the modal
// ----------------------------------------------------------------------- //

// Loads the chosen indicator either via SPA flow or full-page navigation.
const selectIndicator = async (id) => {

    debugLog("* selectIndicator:", id);

    // ----- track selection event ----- //

    // Record the selection (mirrors the old explorer's click_indicator event).
    // Guarded because the topic-chooser page loads this file without global.js,
    // so the wrapper may not exist in every context that calls selectIndicator.
    if (typeof trackDataExplorerEvent === 'function') {
        trackDataExplorerEvent('click_indicator', { IndicatorID: Number(id) });
    }

    // ----- bail to plain navigation if not on the SPA app ----- //

    // On pages without the full app (e.g. section.html), navigate directly.
    // Skip dismissing the modal so the back-to-topics handler doesn't fire.
    if (typeof loadAndRenderIndicator !== 'function') {
        window.location.href = indicatorSelectDestination + '?id=' + Number(id);
        return;
    }

    // ----- bail to plain navigation if the topic changed ----- //

    // Check if we're switching to a different topic (pathname changed).
    // If so, navigate to the new topic with the indicator ID instead of SPA flow.
    const currentPathname = new URL(window.location).pathname;
    const destinationPathname = new URL(indicatorSelectDestination, window.location).pathname;

    if (currentPathname !== destinationPathname) {
        window.location.href = indicatorSelectDestination + '?id=' + Number(id);
        return;
    }

    // ----- confirm selection, dismiss modal, reset per-indicator UI state ----- //

    indicatorSelectionConfirmed = true;
    clearIndicatorSelectorPrompt();

    dismissIndicatorModal();

    // ----- run the full load pipeline ----- //

    // No selection: a freshly picked indicator starts from its own defaults.
    // 'push' so the indicator being left behind stays on the history stack.
    await loadAndRenderIndicator(id, { selection: null, history: 'push' });

};


// ----------------------------------------------------------------------- //
// Check for URL parameter (?id=XXXX)
// ----------------------------------------------------------------------- //

// Boots the explorer from URL params or opens the chooser when none are present.
const checkURL = async () => {

    debugLog("* checkURL");

    // ----- read the canonical selection from the URL ----- //

    // URL Format: .../TOPIC/?id=2133&MeasureID=239&GeoType=CDTA&TimePeriodID=123
    // Legacy forms (the GeoTypeID alias, overlay=map, #display=… hashes) were already
    // rewritten by normalizeLegacyURL() when app.js parsed, so only canonical params
    // reach here.

    const selection = parseSelectionFromURL();

    debugLog('URL selection:');
    debugLog(selection);

    const chosenIndicator = selection.id;

    // ----- guard: open chooser if URL has no valid indicator ID ----- //

    // Wait for the window load event so Bootstrap has initialized before showing the modal.
    if (chosenIndicator === null || Number.isNaN(chosenIndicator)) {
        debugLog("No indicator ID in URL, opening indicator selector.");
        window.addEventListener('load', () => $('#indicatorSelector').modal('show'), { once: true });
        return;
    }

    // ----- run the full load pipeline ----- //

    // 'replace': the browser already created this history entry when it navigated
    // here. Overwrite it with the resolved defaults rather than pushing a second
    // entry for the same view, which would trap Back on the page.
    await loadAndRenderIndicator(chosenIndicator, { selection, history: 'replace' });

}

