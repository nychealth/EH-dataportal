// ======================================================================= //
// de-tab-content.js
// ======================================================================= //

// UI behavior for the data-explorer tab panes (de-tab-content.html): tab
// toggle-off, close buttons, Escape-to-close, mobile accordion, and the
// has-open-panel state class. NOT part of the synchronous SPA bundle
// (global.js … print.js); it's loaded on its own from de-tab-content.html and
// only touches SPA globals (updateChartPlotSize, pushSelectionToURL, DE.state.overlay)
// from inside deferred handlers, guarded so load order never matters.

// ----------------------------------------------------------------------- //
// tab toggle-off
// ----------------------------------------------------------------------- //

// Clicking an already-active tab closes its pane and records the closed state.

document.addEventListener('DOMContentLoaded', function() {

    const tabLinks = document.querySelectorAll('.nav-link[data-toggle="pill"]');

    tabLinks.forEach(link => {

        link.addEventListener('click', function(e) {

            const targetId = this.getAttribute('href');
            const targetPane = document.querySelector(targetId);

            if (typeof updateChartPlotSize === 'function') {
                updateChartPlotSize();
            }

            // Check if this tab is already active

            if (this.classList.contains('active') && targetPane.classList.contains('show')) {

                e.preventDefault();
                e.stopImmediatePropagation();

                // Remove active state from this tab

                this.classList.remove('active');
                this.setAttribute('aria-selected', 'false');

                // Hide the tab pane

                targetPane.classList.remove('show', 'active');

                // Hide the tab content container

                const tabContent = document.querySelector('#v-pills-tabContent');
                if (tabContent) tabContent.style.display = 'none';

                // Persist the closed state in the URL

                DE.state.overlay = 'none';
                if (typeof pushSelectionToURL === 'function') {
                    pushSelectionToURL();
                }
            }
        });
    });

    // Add a separate listener to ensure container is visible when clicking any tab

    // Not for a disabled tab: Bootstrap won't open its pane, so this would reveal an empty container.

    document.addEventListener('click', function(e) {

        const tab = e.target.closest('.nav-link[data-toggle="pill"]');
        if (tab && !tab.classList.contains('disabled')) {

            const tabContent = document.querySelector('#v-pills-tabContent');
            if (tabContent && tabContent.style.display === 'none') {
                tabContent.style.display = 'block';
            }

            // Smooth scroll to top of viewport

            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    });
});


// ----------------------------------------------------------------------- //
// close buttons and Escape-to-close
// ----------------------------------------------------------------------- //

const closeExplorerTabPane = (paneId) => {

    const targetPane = document.querySelector('#' + paneId);
    const targetTab = document.querySelector('[href="#' + paneId + '"]');

    if (targetPane && targetTab) {

        // Remove active state from the tab

        targetTab.classList.remove('active');
        targetTab.setAttribute('aria-selected', 'false');

        // Hide the tab pane

        targetPane.classList.remove('show', 'active');

        // Hide the tab content container

        const tabContent = document.querySelector('#v-pills-tabContent');
        if (tabContent) tabContent.style.display = 'none';

        // Persist the closed state in the URL

        DE.state.overlay = 'none';
        if (typeof pushSelectionToURL === 'function') {
            pushSelectionToURL();
        }
    }
};

document.addEventListener('DOMContentLoaded', function() {

    // One shared button (outside every .tab-pane.fade, see de-tab-content.html)
    // closes whichever pane is currently active — same lookup the Escape
    // handler below uses.

    const closeTabPaneButton = document.querySelector('.de-close-tab-button');

    if (closeTabPaneButton) {

        closeTabPaneButton.addEventListener('click', function() {

            const openPane = document.querySelector('#v-pills-tabContent .tab-pane.show.active');

            if (openPane?.id) closeExplorerTabPane(openPane.id);

        });
    }

    // close tab pane with Escape key

    document.addEventListener('keydown', function(event) {

        if (event.key !== 'Escape') return;

        // Bootstrap's modal and open-dropdown handlers call preventDefault on the Escape they
        // use to close themselves, and both run before this listener, so that Escape is theirs.

        if (event.defaultPrevented) return;

        // A selected geography (map.js, "persistent selection") goes first: the bar view is the
        // default view, so with this last in line the first Escape would close the chart the
        // selection is drawn on, and Escape is the keyboard's only way to clear a selection.

        if (clearMapSelection()) return;

        const openPane = document.querySelector('#v-pills-tabContent .tab-pane.show.active');

        if (openPane?.id) {
            closeExplorerTabPane(openPane.id);
            return;
        }

        const detailsContent = document.querySelector('#detailsContent.show');

        if (detailsContent) $('#detailsContent').collapse('hide');

    });
});


// ----------------------------------------------------------------------- //
// details accordions (mobile and desktop)
// ----------------------------------------------------------------------- //

// Keeps a details toggle's plus/minus icon and aria-expanded in step with its collapse. Phones and
// desktop each have their own copy of the details box (de-indicator-info.html), so each has a toggle.

const syncDetailsToggleIcon = (toggle, content) => {

    const toggleIcon = toggle.querySelector('.toggle-icon');

    const updateIconState = isOpen => {
        toggleIcon.classList.toggle('fa-minus', isOpen);
        toggleIcon.classList.toggle('fa-plus', !isOpen);
        toggle.setAttribute('aria-expanded', String(isOpen));
    };

    // Bootstrap 4 triggers collapse events through jQuery, so a native addEventListener never
    // receives them; $().on() does.

    $(content).on('show.bs.collapse', () => updateIconState(true));
    $(content).on('hide.bs.collapse', () => updateIconState(false));

    updateIconState(content.classList.contains('show'));
};

// Phones: the details start closed, and a tap anywhere on the header bar toggles them, as the bar
// did when it was the collapse trigger itself. Desktop: open at every load, toggled by its button only.

document.addEventListener('DOMContentLoaded', function() {

    const desktopDetailsToggle = document.querySelector('.desktop-details-toggle');
    const desktopDetailsContent = document.querySelector('#detailsContentDesktop');

    if (desktopDetailsToggle && desktopDetailsContent) {
        syncDetailsToggleIcon(desktopDetailsToggle, desktopDetailsContent);
    }

    const mobileAccordionHeader = document.querySelector('.mobile-details-header');
    const mobileDetailsToggle = document.querySelector('.mobile-details-toggle');
    const detailsContent = document.querySelector('#detailsContent');

    if (mobileAccordionHeader && mobileDetailsToggle && detailsContent) {

        syncDetailsToggleIcon(mobileDetailsToggle, detailsContent);

        // A tap on the bar goes through the toggle button. Clicks on a button are left alone: the
        // toggle handles its own, and "Change dataset" opens its modal without also opening the
        // details, which it did while the whole bar was the collapse trigger.

        mobileAccordionHeader.addEventListener('click', function(e) {
            if (e.target.closest('button')) return;
            mobileDetailsToggle.click();
        });
    }
});


// ----------------------------------------------------------------------- //
// has-open-panel state class
// ----------------------------------------------------------------------- //

// Toggles .has-open-panel on .de-tabs whenever any pane opens or closes.

document.addEventListener('DOMContentLoaded', function() {

    const deTabsElement = document.querySelector('.de-tabs');
    const panelIds = ['v-pills-bar', 'v-pills-table', 'v-pills-trends', 'v-pills-correlate', 'v-pills-ds'];

    function updateHasOpenPanelClass() {

        let hasOpenPanel = false;

        // Check if any panel is currently open

        panelIds.forEach(panelId => {

            const panel = document.querySelector('#' + panelId);
            if (panel && panel.classList.contains('show') && panel.classList.contains('active')) {
                hasOpenPanel = true;
            }
        });

        // Also check if tab content container is visible. The renderers set its display to 'block'
        // or 'none'; an empty value means none has run yet (the first call, at DOMContentLoaded),
        // so go by what the URL asks for. An overlay opens a view only with an indicator: without
        // an id the chooser opens and no renderer runs. app.js has already rewritten legacy
        // #display= hashes into the overlay param by then (normalizeLegacyURL, at parse time).

        const tabContent = document.querySelector('#v-pills-tabContent');
        if (tabContent && tabContent.style.display === '') {
            const params = new URLSearchParams(window.location.search);
            const overlay = params.get('overlay');
            if (params.get('id') && overlay && overlay !== 'none') hasOpenPanel = true;
        } else if (tabContent && tabContent.style.display !== 'none') {
            hasOpenPanel = true;
        }

        // Toggle the class based on panel state

        if (hasOpenPanel) {

            deTabsElement.classList.add('has-open-panel');

        } else {

            deTabsElement.classList.remove('has-open-panel');

        }

        // On phones and tablets an open view overlaps the map, so the map re-fits (map.js).

        if (typeof layoutStackedMap === 'function') layoutStackedMap();
    }

    // Monitor all tab panes for show/hide events

    panelIds.forEach(panelId => {

        const panel = document.querySelector('#' + panelId);
        if (panel) {

            // Listen for Bootstrap show/hide events

            panel.addEventListener('show.bs.tab', updateHasOpenPanelClass);
            panel.addEventListener('hide.bs.tab', updateHasOpenPanelClass);
            panel.addEventListener('shown.bs.tab', updateHasOpenPanelClass);
            panel.addEventListener('hidden.bs.tab', updateHasOpenPanelClass);

        }
    });

    // Monitor tab content container visibility

    const tabContent = document.querySelector('#v-pills-tabContent');
    if (tabContent) {

        // Use MutationObserver to watch for style changes

        const observer = new MutationObserver(function(mutations) {

            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    updateHasOpenPanelClass();
                }
            });
        });
        observer.observe(tabContent, { attributes: true, attributeFilter: ['style'] });

    }

    // Monitor tab link clicks for immediate response

    const tabLinks = document.querySelectorAll('.nav-link[data-toggle="pill"]');
    tabLinks.forEach(link => {

        link.addEventListener('click', function() {

            // Small delay to ensure Bootstrap has processed the click

            setTimeout(updateHasOpenPanelClass, 50);

        });
    });

    // Apply the initial expanded state on first load.
    // This keeps the right overlay pane fully open when the page first renders.

    updateHasOpenPanelClass();

});


// ----------------------------------------------------------------------- //
// ready hook
// ----------------------------------------------------------------------- //

$(document).ready(function() {

    // Tab display is now managed via the `overlay` URL search param in app.js.
    // No hash fragment logic needed here.
});
